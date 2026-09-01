import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [planData, setPlanData] = useState<PaymentData | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedOperator, setSelectedOperator] = useState<string>('');

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
          throw new Error('Plan non trouvé');
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
          description: error.message || 'Impossible de charger les données du plan',
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
        throw new Error('Utilisateur non connecté');
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
          payment_method: 'cinetpay',
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
          paymentMethod: selectedOperator || 'all',
          customerInfo: {
            name: (profile as any)?.full_name || user.email?.split('@')[0] || 'Client',
            email: user.email || '',
            phone: (profile as any)?.phone || '',
          },
        },
      });

      if (error || !data?.success) {
        throw new Error(data?.error || error?.message || 'Impossible d\'initier le paiement');
      }

      toast({
        title: 'Redirection vers CinetPay',
        description: 'Vous allez être redirigé vers la page de paiement sécurisée.',
      });

      setTimeout(() => {
        window.location.href = data.payment_url;
      }, 1000);

    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        title: 'Erreur de paiement',
        description: error.message || 'Une erreur est survenue lors du traitement du paiement',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl text-gray-700 font-medium">Chargement de votre abonnement...</p>
        </div>
      </div>
    );
  }

  if (!planData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Plan non trouvé</h2>
          <Button 
            onClick={() => navigate('/')}
            className="bg-indigo-500 hover:bg-indigo-600 text-white"
          >
            Retour aux abonnements
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 overflow-hidden relative">
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
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl mb-6 shadow-lg">
            <Crown className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Finaliser Votre Abonnement
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Rejoignez l'excellence avec Bossiz Conciergerie et accédez à des services premium
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Plan Details - Premium Card */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card className="shadow-xl border-0 bg-white">
              <CardHeader className="pb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
                    <Crown className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
                      {planData.plan.name}
                    </CardTitle>
                    {planData.plan.subtitle && (
                      <CardDescription className="text-gray-600 text-lg">
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
                    <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-3 h-3 text-green-600" />
                      </div>
                      <span className="text-gray-700 font-medium">{feature}</span>
                    </div>
                  ))}
                </div>

                <Separator className="my-6" />

                {/* Premium Features */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-indigo-600">
                    <Shield className="w-5 h-5" />
                    <span className="text-sm font-medium">Sécurité Maximale</span>
                  </div>
                  <div className="flex items-center gap-2 text-purple-600">
                    <TrendingUp className="w-5 h-5" />
                    <span className="text-sm font-medium">Performance</span>
                  </div>
                  <div className="flex items-center gap-2 text-green-600">
                    <Clock className="w-5 h-5" />
                    <span className="text-sm font-medium">Support 24/7</span>
                  </div>
                  <div className="flex items-center gap-2 text-orange-600">
                    <Globe className="w-5 h-5" />
                    <span className="text-sm font-medium">Accès Global</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Payment Form - Premium Design */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card className="shadow-xl border-0 bg-white">
              <CardHeader className="pb-6">
                <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-indigo-600" />
                  Cycle de Facturation
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Choisissez la périodicité qui vous convient
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-0">
                <RadioGroup 
                  value={billingCycle} 
                  onValueChange={(value: 'monthly' | 'yearly') => setBillingCycle(value)}
                  className="space-y-4"
                >
                  <div className="flex items-center space-x-3 p-4 rounded-lg border border-gray-200 hover:border-indigo-300 transition-colors">
                    <RadioGroupItem value="monthly" id="monthly" className="border-indigo-500 text-indigo-500" />
                    <Label htmlFor="monthly" className="cursor-pointer flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-gray-900">Mensuel</div>
                          <div className="text-sm text-gray-500">Facturation mensuelle</div>
                        </div>
                        <span className="text-xl font-bold text-indigo-600">{displayMonthlyPrice}</span>
                      </div>
                    </Label>
                  </div>
                  
                  {yearlyPricing && (
                    <div className="flex items-center space-x-3 p-4 rounded-lg border border-gray-200 hover:border-indigo-300 transition-colors">
                      <RadioGroupItem value="yearly" id="yearly" className="border-indigo-500 text-indigo-500" />
                      <Label htmlFor="yearly" className="cursor-pointer flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-gray-900">Annuel</div>
                            <div className="text-sm text-gray-500">Économisez {savings}%</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xl font-bold text-indigo-600">{displayYearlyPrice}</span>
                            {savings > 0 && (
                              <Badge className="bg-green-100 text-green-800 text-sm font-medium">
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
                  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-3 text-green-800">
                      <Gift className="w-5 h-5" />
                      <span className="font-medium">
                        {planData.pricing.trial_days} jours d'essai gratuits
                      </span>
                    </div>
                  </div>
                )}

                {/* Invoice Summary Section */}
                <div className="mt-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <FileText className="w-6 h-6 text-indigo-600" />
                    Récapitulatif de Commande
                  </h3>
                  
                  <Card className="border-2 border-indigo-200 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white">
                      <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <Receipt className="w-5 h-5" />
                        Facture
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      {/* Order Information */}
                      <div className="grid md:grid-cols-2 gap-6 mb-6">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Informations de la commande</h4>
                          <div className="space-y-2 text-sm">
                            <p><span className="font-medium">Numéro:</span> BOSSIZ_{Math.floor(Date.now() / 1000)}</p>
                            <p><span className="font-medium">Date:</span> {new Date(Date.now()).toLocaleDateString('fr-FR')}</p>
                            <p><span className="font-medium">Statut:</span> 
                              <Badge className="ml-2 bg-yellow-100 text-yellow-800">En attente de paiement</Badge>
                            </p>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Méthode de paiement</h4>
                          <div className="space-y-2 text-sm">
                            <p><span className="font-medium">Prestataire:</span> CinetPay</p>
                            <p><span className="font-medium">Devise:</span> {planData.pricing.currency}</p>
                            <p><span className="font-medium">Sécurité:</span> Paiement sécurisé SSL</p>
                          </div>
                        </div>
                      </div>

                      {/* Plan Details */}
                      <div className="border rounded-lg p-6 bg-gray-50 mb-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="text-xl font-bold text-gray-900">{planData.plan.name}</h4>
                            <p className="text-gray-600 mt-1">{planData.plan.subtitle || 'Services premium Bossiz'}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-indigo-600">
                              {autoConvertAndFormat(planData.pricing.price, planData.pricing.currency)}
                            </p>
                            <p className="text-sm text-gray-500">
                              {billingCycle === 'monthly' ? 'Mensuel' : 'Annuel'}
                            </p>
                          </div>
                        </div>
                        
                        {planData.pricing.trial_days > 0 && (
                          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center gap-2 text-green-800">
                              <Clock className="w-4 h-4" />
                              <span className="font-medium">
                                {planData.pricing.trial_days} jours d'essai gratuits
                              </span>
                            </div>
                          </div>
                        )}

                        <div>
                          <h5 className="font-semibold text-gray-900 mb-3">Fonctionnalités incluses:</h5>
                          <div className="grid md:grid-cols-2 gap-3">
                            {planData.plan.features && planData.plan.features.slice(0, 6).map((feature, index) => (
                              <div key={index} className="flex items-center gap-2 text-sm">
                                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                                <span>{feature}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {planData.pricing.discount_percentage > 0 && (
                          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-yellow-800 font-medium">
                              Réduction spéciale de {planData.pricing.discount_percentage}% pour l'abonnement annuel
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Financial Summary */}
                      <div className="border-2 border-green-200 rounded-lg">
                        <div className="p-4 bg-gradient-to-r from-green-600 to-green-700 text-white">
                          <h4 className="font-bold flex items-center gap-2">
                            <Calculator className="w-5 h-5" />
                            Récapitulatif financier
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
                              <div className="flex justify-between text-lg text-green-600">
                                <span>Réduction:</span>
                                <span className="font-medium">
                                  -{autoConvertAndFormat(
                                    (planData.pricing.price / (1 - planData.pricing.discount_percentage/100)) - planData.pricing.price, 
                                    planData.pricing.currency
                                  )}
                                </span>
                              </div>
                            )}
                            
                            <Separator />
                            
                            <div className="flex justify-between text-2xl font-bold text-gray-900">
                              <span>Total à payer:</span>
                              <span className="text-indigo-600">
                                {autoConvertAndFormat(planData.pricing.price, planData.pricing.currency)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Customer Information */}
                      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h5 className="font-semibold text-gray-900 mb-3">Informations du client</h5>
                        <div className="grid md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <label className="text-xs font-medium text-gray-700">Nom complet</label>
                            <p className="mt-1 font-semibold">Client Bossiz</p>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-700">Email</label>
                            <p className="mt-1">client@bossiz.com</p>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-700">Téléphone</label>
                            <p className="mt-1">+225000000000</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Payment Method */}
                <div className="mt-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Wallet className="w-6 h-6 text-indigo-600" />
                    Méthode de Paiement
                  </h3>
                  
                  {/* Operator Selection */}
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Smartphone className="w-5 h-5 text-indigo-600" />
                      Choisissez votre opérateur de paiement
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { name: 'Orange Money', id: 'CM_OM', color: 'text-orange-600' },
                        { name: 'MTN Money', id: 'CM_TMO', color: 'text-yellow-600' },
                        { name: 'Moov Money', id: 'CM_MOOV', color: 'text-green-600' },
                        { name: 'Carte bancaire', id: 'CARD', color: 'text-blue-600' }
                      ].map((operator) => (
                        <button
                          key={operator.id}
                          onClick={() => setSelectedOperator(operator.id)}
                          className={`p-4 border-2 rounded-lg transition-all duration-200 ${
                            selectedOperator === operator.id 
                              ? 'border-indigo-500 bg-indigo-50 shadow-lg' 
                              : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Smartphone className={`w-6 h-6 ${operator.color}`} />
                            <div className="text-left">
                              <div className="font-semibold text-gray-900">{operator.name}</div>
                              <div className="text-sm text-gray-500">
                                {operator.id === 'CM_OM' && 'Paiement par Orange Money'}
                                {operator.id === 'CM_TMO' && 'Paiement par MTN Mobile Money'}
                                {operator.id === 'CM_MOOV' && 'Paiement par Moov Money'}
                                {operator.id === 'CARD' && 'Paiement par Carte Bancaire'}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="p-6 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center shadow-md">
                          <Wallet className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">CinetPay</div>
                          <div className="text-sm text-gray-600">Plateforme de paiement sécurisée</div>
                          {selectedOperator && (
                            <div className="text-xs text-indigo-600 font-medium mt-1">
                              Opérateur sélectionné: {selectedOperator}
                            </div>
                          )}
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-800 font-medium">
                        <Lock className="w-3 h-3 mr-1" />
                        Sécurisé
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { name: 'Orange Money', icon: Smartphone, color: 'text-orange-600' },
                        { name: 'MTN Money', icon: Smartphone, color: 'text-yellow-600' },
                        { name: 'Moov Money', icon: Smartphone, color: 'text-green-600' },
                        { name: 'Carte bancaire', icon: CreditCard, color: 'text-blue-600' }
                      ].map((method, index) => (
                        <div key={index} className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-100">
                          <method.icon className={`w-4 h-4 ${method.color}`} />
                          <span className="text-sm text-gray-700 font-medium">{method.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Order Summary */}
                <div className="mt-8 p-6 bg-gray-50 rounded-lg">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Database className="w-5 h-5 text-gray-600" />
                    Récapitulatif de Commande
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-gray-700">
                      <span>{planData.plan.name} - {billingCycle === 'monthly' ? 'Mensuel' : 'Annuel'}</span>
                      <span className="font-semibold text-gray-900">
                        {billingCycle === 'monthly' ? monthlyPrice : yearlyPrice} EUR
                      </span>
                    </div>
                    
                    {planData.pricing.setup_fee > 0 && (
                      <div className="flex justify-between text-gray-700">
                        <span>Frais d'installation</span>
                        <span className="font-semibold text-gray-900">
                          {planData.pricing.setup_fee} EUR
                        </span>
                      </div>
                    )}
                    
                    {yearlyPricing && savings > 0 && (
                      <div className="flex justify-between text-green-700">
                        <span>Économies annuelles</span>
                        <span className="font-medium">
                          -{Math.round(monthlyPrice * 12 * savings / 100)} EUR
                        </span>
                      </div>
                    )}
                  </div>
                
                  <Separator className="my-4" />
                  
                  <div className="flex justify-between text-xl font-bold text-gray-900">
                    <span>Total</span>
                    <span className="text-indigo-600">
                      {(billingCycle === 'monthly' ? monthlyPrice : yearlyPrice) + planData.pricing.setup_fee} EUR
                    </span>
                  </div>
                </div>

                {/* Payment Button */}
                <div className="mt-8">
                  <Button 
                    onClick={handlePayment}
                    disabled={processing}
                    className="w-full h-14 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-lg rounded-xl transition-all duration-300 shadow-lg"
                  >
                    {processing ? (
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Traitement en cours...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-3">
                        <CreditCard className="w-5 h-5" />
                        <span>Payer Maintenant</span>
                        <ArrowRight className="w-5 h-5" />
                      </div>
                    )}
                  </Button>
                </div>

                {/* Security Info */}
                <div className="mt-6 text-center">
                  <div className="flex items-center justify-center gap-2 text-gray-600 text-sm mb-2">
                    <Shield className="w-4 h-4" />
                    <span>Paiement sécurisé via CinetPay</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-gray-500 text-xs">
                    <Globe className="w-3 h-3" />
                    <span>SSL 256 bits | Partenaire officiel Afrique</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-12 text-center">
          <div className="flex items-center justify-center gap-8 text-gray-600">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium">Croissance garantie</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium">Activation instantanée</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium">Satisfaction 100%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernSubscriptionPayment;
