import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getEdgeFunctionErrorMessage } from "@/lib/getEdgeFunctionErrorMessage";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Crown,
  Shield,
  CheckCircle,
  Star,
  Zap,
  Globe,
  Clock,
  Users,
  Headphones,
  Gift,
  Calendar,
  Wallet,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  FileText,
  Receipt,
  Calculator,
  TrendingUp,
  Smartphone,
  CreditCard,
  Database,
  Percent,
  Lock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { autoConvertAndFormat } from "@/utils/currencyConverter";
import { useTranslation } from "react-i18next";
import { currentLocaleTag } from "@/lib/dateLocale";
import { MOTION } from "@/lib/motion";

// Fonctions utilitaires pour les prix par défaut (en XOF/FCFA pour le marché africain)
const getDefaultPrice = (planId: string): number => {
  // Prix réalistes pour le marché africain en XOF
  const prices: Record<string, number> = {
    'basic': 15000, // 15 000 XOF mensuel
    'premium': 25000, // 25 000 XOF mensuel
    'business': 50000, // 50 000 XOF mensuel
    'corporate': 100000, // 100 000 XOF mensuel
  };
  return prices[planId] || 15000;
};

const getDefaultTrialDays = (planId: string, billingCycle: string): number => {
  // Jours d'essai par défaut selon le type de plan
  const trials: Record<string, Record<string, number>> = {
    'basic': { monthly: 0, yearly: 7 },
    'premium': { monthly: 0, yearly: 14 },
    'business': { monthly: 0, yearly: 30 },
    'corporate': { monthly: 0, yearly: 60 },
  };
  
  return trials[planId]?.[billingCycle] || 0;
};

interface SubscriptionPlan {
  id: string;
  plan_id: string;
  name: string;
  subtitle: string | null;
  icon: string;
  features: string[] | null;
  subscription_type: string;
  assigned_role: string;
  assistance_level: string;
}

interface PricingOption {
  billing_cycle: 'monthly' | 'yearly';
  price: number;
  currency: string;
  discount_percentage?: number;
  trial_days: number;
  setup_fee: number;
}

interface PaymentData {
  plan: SubscriptionPlan;
  pricing: PricingOption;
  billingCycle: 'monthly' | 'yearly';
}

const ModernSubscriptionPayment = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [planData, setPlanData] = useState<PaymentData | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const planId = searchParams.get('planId');

  useEffect(() => {
    const fetchPlanData = async () => {
      console.log("ModernSubscriptionPayment - Début du chargement");
      console.log("planId reçu:", planId);
      
      if (!planId) {
        toast({
          title: 'Erreur',
          description: 'Aucun plan d\'abonnement spécifié',
          variant: 'destructive',
        });
        navigate('/');
        return;
      }

      try {
        console.log("Recherche du plan avec plan_id:", planId);
        
        // Fetch plan details
        const { data: plan, error: planError } = await supabase
          .from('subscription_plans' as any)
          .select('*')
          .eq('plan_id', planId)
          .single();

        console.log("Résultat de la recherche du plan:", { plan, planError });

        if (planError || !plan) {
          console.log("Plan non trouvé, erreur:", planError);
          throw new Error(t("ux.subPayment.notFound"));
        }

        // Fetch pricing options
        const { data: pricing, error: pricingError } = await supabase
          .from('subscription_pricing' as any)
          .select('*')
          .eq('plan_id', planId);

        // Si aucune tarification n'existe, utiliser les valeurs par défaut
        if (pricingError || !pricing || (pricing as any[]).length === 0) {
          console.log('Tarifications non trouvées, utilisation des valeurs par défaut pour:', planId);
          
          // Utiliser la fonction SQL pour obtenir les tarifications par défaut
          const { data: defaultPricing, error: defaultError } = await supabase
            .rpc('get_default_pricing' as any, { 
              p_plan_id: planId, 
              p_billing_cycle: 'monthly' 
            });

          if (defaultError || !defaultPricing || (defaultPricing as any[]).length === 0) {
            // Si même la fonction par défaut échoue, utiliser des valeurs codées en dur
            const defaultMonthlyPricing = {
              id: 'default-monthly',
              plan_id: planId,
              billing_cycle: 'monthly' as 'monthly' | 'yearly',
              price: getDefaultPrice(planId),
              currency: 'XOF',
              discount_percentage: 0,
              trial_days: getDefaultTrialDays(planId, 'monthly'),
              setup_fee: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };

            setPlanData({
              plan: plan as any,
              pricing: defaultMonthlyPricing,
              billingCycle: 'monthly'
            });
          } else {
            // Utiliser les tarifications par défaut de la fonction SQL
            const monthlyPricing = (defaultPricing as any[])[0];
            setPlanData({
              plan: plan as any,
              pricing: {
                plan_id: planId,
                billing_cycle: 'monthly' as 'monthly' | 'yearly',
                price: monthlyPricing.price,
                currency: monthlyPricing.currency,
                discount_percentage: monthlyPricing.discount_percentage,
                trial_days: monthlyPricing.trial_days,
                setup_fee: monthlyPricing.setup_fee,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              },
              billingCycle: 'monthly'
            });
          }
          return;
        }

        // Get default pricing (monthly)
        const defaultPricing = (pricing as any[]).find((p: any) => p.billing_cycle === 'monthly') || (pricing as any[])[0];

        setPlanData({
          plan: plan as any,
          pricing: defaultPricing,
          billingCycle: 'monthly'
        });

      } catch (error: any) {
        console.error('Error fetching plan data:', error);
        toast({
          title: 'Erreur',
          description: error.message || t("ux.subPayment.loadError"),
          variant: 'destructive',
        });
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchPlanData();
  }, [planId, navigate, toast]);

  const handleBillingCycleChange = async (cycle: 'monthly' | 'yearly') => {
    if (!planData) return;

    try {
      const { data: pricing, error } = await supabase
        .from('subscription_pricing' as any)
        .select('*')
        .eq('plan_id', planId)
        .eq('billing_cycle', cycle)
        .single();

      if (error || !pricing) {
        // Si aucun tarif n'existe, calculer le tarif annuel automatiquement
        const yearlyPrice = cycle === 'yearly' 
          ? getDefaultPrice(planId) * 12 * 0.83 // 17% de réduction annuelle
          : getDefaultPrice(planId);
        
        const defaultPricing = {
          id: `default-${cycle}`,
          plan_id: planId,
          billing_cycle: cycle,
          price: yearlyPrice,
          currency: 'XOF',
          discount_percentage: cycle === 'yearly' ? 17 : 0,
          trial_days: getDefaultTrialDays(planId, cycle),
          setup_fee: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        setBillingCycle(cycle);
        setPlanData({
          ...planData,
          pricing: defaultPricing
        });
      } else {
        setBillingCycle(cycle);
        setPlanData({
          ...planData,
          pricing: pricing as any
        });
      }

    } catch (error: any) {
      console.error('Error changing billing cycle:', error);
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handlePayment = async () => {
    if (!planData) return;

    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error(t("ux.subPayment.notSignedIn"));
      }

      // Créer l'abonnement en attente de paiement. Le montant et la devise
      // enregistrés ici font foi côté serveur (process-payment les relit,
      // il ne fait jamais confiance à un montant envoyé depuis le navigateur).
      const { data: subscription, error: subscriptionError } = await supabase
        .from('user_subscriptions' as any)
        .insert({
          user_id: user.id,
          plan_id: planData.plan.plan_id,
          subscription_type: planData.plan.subscription_type,
          billing_cycle: billingCycle,
          status: 'pending',
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + (billingCycle === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString(),
          amount_paid: planData.pricing.price,
          currency: planData.pricing.currency,
          payment_method: 'jeko',
        })
        .select()
        .single();

      if (subscriptionError) throw subscriptionError;

      // Get customer info from user profile
      const { data: profile } = await supabase
        .from('profiles' as any)
        .select('full_name, phone')
        .eq('id', user.id)
        .single();

      const { data, error } = await supabase.functions.invoke('process-payment', {
        body: {
          subscriptionId: (subscription as any).id,
          paymentMethod: 'jeko',
          customerInfo: {
            name: (profile as any)?.full_name || user.email?.split('@')[0] || 'Client',
            email: user.email || '',
            phone: (profile as any)?.phone || '',
          },
        },
      });

      if (error || !data?.success) {
        throw new Error(error
          ? await getEdgeFunctionErrorMessage(error, 'Impossible d\'initier le paiement Jèko.')
          : data?.error || 'Impossible d\'initier le paiement Jèko.');
      }

      toast({
        title: t("ux.subPayment.redirecting"),
        description: t("ux.subPayment.redirectingDesc"),
      });

      setTimeout(() => {
        window.location.href = data.payment_url;
      }, 1000);

    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        title: t("ux.subPayment.error"),
        description: error.message || t("ux.subPayment.errorDesc"),
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/40 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary/40 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl text-foreground font-medium">{t("ux.subPayment.loading")}</p>
        </div>
      </div>
    );
  }

  if (!planData) {
    return (
      <div className="min-h-screen bg-muted/40 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">{t("ux.subPayment.notFound")}</h2>
          <Button 
            onClick={() => navigate('/')}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {t("ux.subPayment.back")}
          </Button>
        </div>
      </div>
    );
  }

  const yearlyPricing = planData.pricing.billing_cycle === 'yearly';
  const monthlyPrice = planData.pricing.price;
  const yearlyPrice = planData.pricing.price;
  const savings = yearlyPricing ? planData.pricing.discount_percentage || 0 : 0;

  // Convertir automatiquement les prix en XOF pour l'affichage
  const displayMonthlyPrice = autoConvertAndFormat(monthlyPrice, planData.pricing.currency);
  const displayYearlyPrice = autoConvertAndFormat(yearlyPrice, planData.pricing.currency);

  return (
    <div className="min-h-screen bg-muted/40 overflow-hidden relative">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{ 
          backgroundImage: 'radial-gradient(circle at 25px 25px, #4f46e5 2px, transparent 0)',
          backgroundSize: '50px 50px'
        }} />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-2xl mb-6 shadow-lg">
            <Crown className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            {t("ux.subPayment.title")}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t("ux.subPayment.subtitle")}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Plan Details - Premium Card */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: MOTION.slow }}
          >
            <Card className="shadow-xl border-0 bg-card">
              <CardHeader className="pb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-gradient-to-br from-primary to-primary/80 shadow-lg">
                    <Crown className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-3xl font-bold text-foreground mb-2">
                      {planData.plan.name}
                    </CardTitle>
                    {planData.plan.subtitle && (
                      <CardDescription className="text-muted-foreground text-lg">
                        {planData.plan.subtitle}
                      </CardDescription>
                    )}
                  </div>
                </div>

              </CardHeader>

              <CardContent className="pt-0">
                {/* Features */}
                <div className="space-y-4 mb-6">
                  {planData.plan.features?.slice(0, 6).map((feature, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                      <div className="w-6 h-6 bg-success/10 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-3 h-3 text-success" />
                      </div>
                      <span className="text-foreground font-medium">{feature}</span>
                    </div>
                  ))}
                </div>

                <Separator className="my-6" />

                {/* Premium Features */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-primary">
                    <Shield className="w-5 h-5" />
                    <span className="text-sm font-medium">{t("ux.subPayment.security")}</span>
                  </div>
                  <div className="flex items-center gap-2 text-primary">
                    <TrendingUp className="w-5 h-5" />
                    <span className="text-sm font-medium">Performance</span>
                  </div>
                  <div className="flex items-center gap-2 text-success">
                    <Clock className="w-5 h-5" />
                    <span className="text-sm font-medium">Support 24/7</span>
                  </div>
                  <div className="flex items-center gap-2 text-warning-foreground">
                    <Globe className="w-5 h-5" />
                    <span className="text-sm font-medium">{t("ux.subPayment.global")}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Payment Form - Premium Design */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: MOTION.slow }}
          >
            <Card className="shadow-xl border-0 bg-card">
              <CardHeader className="pb-6">
                <CardTitle className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-primary" />
                  {t("ux.subPayment.cycle")}
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  {t("ux.subPayment.cycleDesc")}
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-0">
                <RadioGroup 
                  value={billingCycle} 
                  onValueChange={(value: 'monthly' | 'yearly') => setBillingCycle(value)}
                  className="space-y-4"
                >
                  <div className="flex items-center space-x-3 p-4 rounded-lg border border-border border-primary/20 transition-colors">
                    <RadioGroupItem value="monthly" id="monthly" className="border-primary/40 text-primary" />
                    <Label htmlFor="monthly" className="cursor-pointer flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-foreground">Mensuel</div>
                          <div className="text-sm text-muted-foreground">{t("ux.subPayment.monthly")}</div>
                        </div>
                        <span className="text-xl font-bold text-primary">{displayMonthlyPrice}</span>
                      </div>
                    </Label>
                  </div>
                  
                  {yearlyPricing && (
                    <div className="flex items-center space-x-3 p-4 rounded-lg border border-border border-primary/20 transition-colors">
                      <RadioGroupItem value="yearly" id="yearly" className="border-primary/40 text-primary" />
                      <Label htmlFor="yearly" className="cursor-pointer flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-foreground">Annuel</div>
                            <div className="text-sm text-muted-foreground">Économisez {savings}%</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xl font-bold text-primary">{displayYearlyPrice}</span>
                            {savings > 0 && (
                              <Badge className="bg-success/10 text-success text-sm font-medium">
                                <Percent className="w-3 h-3 mr-1" />
                                -{savings}%
                              </Badge>
                            )}
                          </div>
                        </div>
                      </Label>
                    </div>
                  )}
                </RadioGroup>

                {/* Trial Information */}
                {planData.pricing.trial_days > 0 && (
                  <div className="mt-6 p-4 bg-success/10 border border-success/30 rounded-lg">
                    <div className="flex items-center gap-3 text-success">
                      <Gift className="w-5 h-5" />
                      <span className="font-medium">
                        {planData.pricing.trial_days} jours d'essai gratuits
                      </span>
                    </div>
                  </div>
                )}

                {/* Invoice Summary Section */}
                <div className="mt-8">
                  <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                    <FileText className="w-6 h-6 text-primary" />
                    {t("ux.subPayment.orderSummary")}
                  </h3>
                  
                  <Card className="border-2 border-primary/20 shadow-lg">
                    <CardHeader className="bg-primary text-primary-foreground">
                      <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <Receipt className="w-5 h-5" />
                        {t("ux.subPayment.invoice")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      {/* Order Information */}
                      <div className="grid md:grid-cols-2 gap-6 mb-6">
                        <div>
                          <h4 className="font-semibold text-foreground mb-2">{t("ux.subPayment.orderInfo")}</h4>
                          <div className="space-y-2 text-sm">
                            <p><span className="font-medium">{t("ux.subPayment.number")}</span> BOSSIZ_{Math.floor(Date.now() / 1000)}</p>
                            <p><span className="font-medium">Date:</span> {new Date(Date.now()).toLocaleDateString(currentLocaleTag())}</p>
                            <p><span className="font-medium">Statut:</span> 
                              <Badge className="ml-2 bg-warning text-warning-foreground">{t("ux.subPayment.awaiting")}</Badge>
                            </p>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground mb-2">{t("ux.subPayment.method")}</h4>
                          <div className="space-y-2 text-sm">
                            <p><span className="font-medium">Prestataire:</span> Jèko</p>
                            <p><span className="font-medium">Devise:</span> {planData.pricing.currency}</p>
                            <p><span className="font-medium">{t("ux.subPayment.securityLabel")}</span> {t("ux.subPayment.ssl")}</p>
                          </div>
                        </div>
                      </div>

                      {/* Plan Details */}
                      <div className="border rounded-lg p-6 bg-muted mb-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="text-xl font-bold text-foreground">{planData.plan.name}</h4>
                            <p className="text-muted-foreground mt-1">{planData.plan.subtitle || t("ux.subPayment.premium")}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-primary">
                              {autoConvertAndFormat(planData.pricing.price, planData.pricing.currency)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {billingCycle === 'monthly' ? 'Mensuel' : 'Annuel'}
                            </p>
                          </div>
                        </div>
                        
                        {planData.pricing.trial_days > 0 && (
                          <div className="mb-4 p-3 bg-success/10 border border-success/30 rounded-lg">
                            <div className="flex items-center gap-2 text-success">
                              <Clock className="w-4 h-4" />
                              <span className="font-medium">
                                {planData.pricing.trial_days} jours d'essai gratuits
                              </span>
                            </div>
                          </div>
                        )}

                        <div>
                          <h5 className="font-semibold text-foreground mb-3">{t("ux.subPayment.features")}</h5>
                          <div className="grid md:grid-cols-2 gap-3">
                            {planData.plan.features && planData.plan.features.slice(0, 6).map((feature, index) => (
                              <div key={index} className="flex items-center gap-2 text-sm">
                                <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                                <span>{feature}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {planData.pricing.discount_percentage > 0 && (
                          <div className="mt-4 p-3 bg-warning border border-warning-foreground/20 rounded-lg">
                            <p className="text-warning-foreground font-medium">
                              Réduction spéciale de {planData.pricing.discount_percentage}% pour l'abonnement annuel
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Financial Summary */}
                      <div className="border-2 border-success/30 rounded-lg">
                        <div className="p-4 bg-success text-success-foreground">
                          <h4 className="font-bold flex items-center gap-2">
                            <Calculator className="w-5 h-5" />
                            {t("ux.subPayment.financial")}
                          </h4>
                        </div>
                        <div className="p-4">
                          <div className="space-y-3">
                            <div className="flex justify-between text-lg">
                              <span>Sous-total:</span>
                              <span className="font-medium">
                                {autoConvertAndFormat(planData.pricing.price, planData.pricing.currency)}
                              </span>
                            </div>
                            
                            {planData.pricing.discount_percentage > 0 && (
                              <div className="flex justify-between text-lg text-success">
                                <span>{t("ux.subPayment.discount")}</span>
                                <span className="font-medium">
                                  -{autoConvertAndFormat(
                                    (planData.pricing.price / (1 - planData.pricing.discount_percentage/100)) - planData.pricing.price, 
                                    planData.pricing.currency
                                  )}
                                </span>
                              </div>
                            )}
                            
                            <Separator />
                            
                            <div className="flex justify-between text-2xl font-bold text-foreground">
                              <span>{t("ux.subPayment.total")}</span>
                              <span className="text-primary">
                                {autoConvertAndFormat(planData.pricing.price, planData.pricing.currency)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Customer Information */}
                      <div className="mt-6 p-4 bg-info/10 border border-info/30 rounded-lg">
                        <h5 className="font-semibold text-foreground mb-3">{t("ux.subPayment.customer")}</h5>
                        <div className="grid md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <label className="text-xs font-medium text-foreground">{t("ux.subPayment.fullName")}</label>
                            <p className="mt-1 font-semibold">Client Bossiz</p>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-foreground">Email</label>
                            <p className="mt-1">client@bossiz.com</p>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-foreground">{t("ux.subPayment.phone")}</label>
                            <p className="mt-1">+225000000000</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Payment Method */}
                <div className="mt-8">
                  <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                    <Wallet className="w-6 h-6 text-primary" />
                    {t("ux.subPayment.method")}
                  </h3>
                  <div className="p-6 bg-info/10 border border-primary/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-md">
                        <Wallet className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="font-bold text-foreground">{t("ux.subPayment.jeko")}</div>
                        <div className="text-sm text-muted-foreground">{t("ux.subPayment.jekoDesc")}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Summary */}
                <div className="mt-8 p-6 bg-muted rounded-lg">
                  <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                    <Database className="w-5 h-5 text-muted-foreground" />
                    {t("ux.subPayment.orderSummary")}
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-foreground">
                      <span>{planData.plan.name} - {billingCycle === 'monthly' ? 'Mensuel' : 'Annuel'}</span>
                      <span className="font-semibold text-foreground">
                        {billingCycle === 'monthly' ? monthlyPrice : yearlyPrice} EUR
                      </span>
                    </div>
                    
                    {planData.pricing.setup_fee > 0 && (
                      <div className="flex justify-between text-foreground">
                        <span>{t("ux.subPayment.setupFee")}</span>
                        <span className="font-semibold text-foreground">
                          {planData.pricing.setup_fee} EUR
                        </span>
                      </div>
                    )}
                    
                    {yearlyPricing && savings > 0 && (
                      <div className="flex justify-between text-success">
                        <span>{t("ux.subPayment.yearlySavings")}</span>
                        <span className="font-medium">
                          -{Math.round(monthlyPrice * 12 * savings / 100)} EUR
                        </span>
                      </div>
                    )}
                  </div>
                
                  <Separator className="my-4" />
                  
                  <div className="flex justify-between text-xl font-bold text-foreground">
                    <span>Total</span>
                    <span className="text-primary">
                      {(billingCycle === 'monthly' ? monthlyPrice : yearlyPrice) + planData.pricing.setup_fee} EUR
                    </span>
                  </div>
                </div>

                {/* Payment Button */}
                <div className="mt-8">
                  <Button 
                    onClick={handlePayment}
                    disabled={processing}
                    className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg rounded-xl transition-all duration-slow ease-standard shadow-lg"
                  >
                    {processing ? (
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>{t("ux.subPayment.processing")}</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-3">
                        <CreditCard className="w-5 h-5" />
                        <span>{t("ux.subPayment.payNow")}</span>
                        <ArrowRight className="w-5 h-5" />
                      </div>
                    )}
                  </Button>
                </div>

                {/* Security Info */}
                <div className="mt-6 text-center">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm mb-2">
                    <Shield className="w-4 h-4" />
                    <span>{t("ux.subPayment.viaJeko")}</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-muted-foreground text-xs">
                    <Globe className="w-3 h-3" />
                    <span>{t("ux.subPayment.sslBadge")}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-12 text-center">
          <div className="flex items-center justify-center gap-8 text-muted-foreground">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-success" />
              <span className="text-sm font-medium">{t("ux.subPayment.growth")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-info" />
              <span className="text-sm font-medium">{t("ux.subPayment.instant")}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">Satisfaction 100%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernSubscriptionPayment;
