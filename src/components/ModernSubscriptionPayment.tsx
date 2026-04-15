import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Crown, 
  Check, 
  CreditCard, 
  Calendar, 
  Percent, 
  Gift,
  Shield,
  Clock,
  Star,
  Zap,
  Smartphone,
  Wallet,
  Sparkles,
  Rocket,
  Globe,
  Lock,
  TrendingUp,
  Cpu,
  Wifi,
  Database,
  Cloud,
  ChevronRight,
  ArrowRight,
  CheckCircle2
} from "lucide-react";
import CinetPayService from "@/services/cinetpay";
import { motion, AnimatePresence } from "framer-motion";
import { autoConvertAndFormat } from "@/utils/currencyConverter";

// Fonctions utilitaires pour les prix par défaut (en XOF/FCFA pour le marché africain)
const getDefaultPrice = (planId: string): number => {
  const prices: Record<string, number> = {
    'majestic_access': 327000, // 499 EUR * 655.957
    'majestic_prive': 655000, // 999 EUR * 655.957
    'majestic_black': 1310000, // 1999 EUR * 655.957
    'basic': 51800, // 79 EUR * 655.957
    'premium': 97700, // 149 EUR * 655.957
    'business': 196000, // 299 EUR * 655.957
    'enterprise': 393000 // 599 EUR * 655.957
  };
  return prices[planId] || 65000;
};

const getDefaultTrialDays = (planId: string, billingCycle: string): number => {
  if (!planId.startsWith('majestic_')) return 0;
  
  const trials: Record<string, Record<string, number>> = {
    'majestic_access': { monthly: 7, yearly: 14 },
    'majestic_prive': { monthly: 14, yearly: 30 },
    'majestic_black': { monthly: 30, yearly: 60 }
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
  const [testAmount, setTestAmount] = useState('327000');
  const [testCurrency, setTestCurrency] = useState('XOF');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [planData, setPlanData] = useState<PaymentData | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [isHovered, setIsHovered] = useState(false);

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
        navigate('/subscriptions');
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
              billing_cycle: 'monthly',
              price: getDefaultPrice(planId),
              currency: 'EUR',
              discount_percentage: 0,
              trial_days: getDefaultTrialDays(planId, 'monthly'),
              setup_fee: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };

            setPlanData({
              plan,
              pricing: defaultMonthlyPricing,
              billingCycle: 'monthly'
            });
          } else {
            // Utiliser les tarifications par défaut de la fonction SQL
            const monthlyPricing = (defaultPricing as any[])[0];
            setPlanData({
              plan,
              pricing: {
                id: 'default-monthly',
                plan_id: planId,
                billing_cycle: 'monthly',
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
          plan,
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
        navigate('/subscriptions');
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
        throw new Error(`Tarif ${cycle} non disponible`);
      }

      setBillingCycle(cycle);
      setPlanData({
        ...planData,
        pricing
      });

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

      // Generate transaction ID
      const transactionId = CinetPayService.generateTransactionId();

      // Create user subscription
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
          transaction_id: transactionId
        })
        .select()
        .single();

      if (subscriptionError) throw subscriptionError;

      // Create initial billing period
      const { error: billingError } = await supabase
        .rpc('create_billing_period' as any, { 
          p_user_subscription_id: (subscription as any).id,
          p_start_date: new Date().toISOString()
        });

      if (billingError) throw billingError;

      // Initiate CinetPay payment
      const cinetPayService = new CinetPayService();
      
      // Get customer info from user profile
      const { data: profile } = await supabase
        .from('profiles' as any)
        .select('full_name, phone')
        .eq('id', user.id)
        .single();

      const paymentData = {
        amount: CinetPayService.formatAmount(planData.pricing.price, planData.pricing.currency),
        currency: planData.pricing.currency === 'EUR' ? 'XOF' : planData.pricing.currency,
        transaction_id: transactionId,
        description: `Abonnement ${planData.plan.name} - ${billingCycle === 'monthly' ? 'Mensuel' : 'Annuel'}`,
        customer_name: (profile as any)?.full_name || user.email?.split('@')[0] || 'Client',
        customer_email: user.email || '',
        customer_phone: (profile as any)?.phone || '+225000000000',
        return_url: `${window.location.origin}/payment-success?subscription_id=${(subscription as any).id}`,
        notify_url: `${window.location.origin}/api/cinetpay/notify`,
        channels: cinetPayService.getAvailableChannels()
      };

      // Validate payment data
      const validationErrors = CinetPayService.validatePaymentData(paymentData);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(', '));
      }

      const paymentResponse = await cinetPayService.initiatePayment(paymentData);

      toast({
        title: 'Redirection vers CinetPay',
        description: 'Vous allez être redirigé vers la page de paiement sécurisée.',
      });

      // Redirect to CinetPay payment page
      setTimeout(() => {
        cinetPayService.redirectToPayment(paymentResponse.payment_url);
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full mx-auto mb-4"
          />
          <div className="text-cyan-400 text-lg font-medium">Chargement du plan...</div>
        </div>
      </div>
    );
  }

  if (!planData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Plan non trouvé</h2>
          <Button 
            onClick={() => navigate('/subscriptions')}
            className="bg-cyan-500 hover:bg-cyan-600 text-white"
          >
            Retour aux abonnements
          </Button>
        </div>
      </div>
    );
  }

  const isMajestic = planData.plan.subscription_type === 'majestic';
  const yearlyPricing = planData.pricing.billing_cycle === 'yearly';
  const monthlyPrice = planData.pricing.price;
  const yearlyPrice = planData.pricing.price;
  const savings = yearlyPricing ? planData.pricing.discount_percentage || 0 : 0;

  // Convertir automatiquement les prix en XOF pour l'affichage
  const displayMonthlyPrice = autoConvertAndFormat(monthlyPrice, planData.pricing.currency);
  const displayYearlyPrice = autoConvertAndFormat(yearlyPrice, planData.pricing.currency);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ 
            x: [0, 100, 0],
            y: [0, -100, 0],
          }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute top-20 left-20 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ 
            x: [0, -100, 0],
            y: [0, 100, 0],
          }}
          transition={{ duration: 25, repeat: Infinity }}
          className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 15, repeat: Infinity }}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl"
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Rocket className="w-8 h-8 text-cyan-400" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Finaliser Votre Abonnement
            </h1>
            <Sparkles className="w-8 h-8 text-purple-400" />
          </div>
          <p className="text-xl text-gray-300">
            Rejoignez l'ère numérique avec Bossiz Conciergerie
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Plan Details - Modern Card */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="relative">
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-3xl blur-xl"></div>
              
              <div className="relative bg-slate-800/50 backdrop-blur-xl border border-cyan-500/20 rounded-3xl p-8">
                {/* Plan Header */}
                <div className="flex items-center gap-4 mb-6">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                      isMajestic ? 'bg-gradient-to-br from-yellow-400 to-orange-500' : 'bg-gradient-to-br from-cyan-400 to-blue-500'
                    }`}
                  >
                    <Crown className="w-8 h-8 text-white" />
                  </motion.div>
                  <div>
                    <h2 className="text-3xl font-bold text-white">{planData.plan.name}</h2>
                    {planData.plan.subtitle && (
                      <p className="text-gray-400">{planData.plan.subtitle}</p>
                    )}
                  </div>
                </div>

                {isMajestic && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-6"
                  >
                    <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 text-sm font-bold">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Premium VIP Access
                    </Badge>
                  </motion.div>
                )}

                {/* Features */}
                <div className="space-y-4 mb-6">
                  {planData.plan.features?.slice(0, 6).map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-3"
                    >
                      <motion.div
                        whileHover={{ scale: 1.2, rotate: 360 }}
                        transition={{ duration: 0.3 }}
                        className="w-6 h-6 bg-cyan-500/20 rounded-full flex items-center justify-center"
                      >
                        <Check className="w-3 h-3 text-cyan-400" />
                      </motion.div>
                      <span className="text-gray-300">{feature}</span>
                    </motion.div>
                  ))}
                </div>

                <Separator className="bg-cyan-500/20" />

                {/* Tech Features */}
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-cyan-400">
                    <Cpu className="w-5 h-5" />
                    <span className="text-sm">AI-Powered</span>
                  </div>
                  <div className="flex items-center gap-2 text-purple-400">
                    <Cloud className="w-5 h-5" />
                    <span className="text-sm">Cloud Sync</span>
                  </div>
                  <div className="flex items-center gap-2 text-green-400">
                    <Wifi className="w-5 h-5" />
                    <span className="text-sm">Real-time</span>
                  </div>
                  <div className="flex items-center gap-2 text-orange-400">
                    <Database className="w-5 h-5" />
                    <span className="text-sm">Secure Storage</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Payment Form - Modern Interface */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="relative">
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-3xl blur-xl"></div>
              
              <div className="relative bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-3xl p-8">
                {/* Billing Cycle Selection */}
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-purple-400" />
                    Cycle de Facturation
                  </h3>
                  
                  <RadioGroup 
                    value={billingCycle} 
                    onValueChange={(value) => handleBillingCycleChange(value as 'monthly' | 'yearly')}
                    className="space-y-3"
                  >
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className={`p-4 rounded-2xl border-2 transition-all ${
                        billingCycle === 'monthly' 
                          ? 'border-cyan-500 bg-cyan-500/10' 
                          : 'border-gray-600 bg-gray-800/50'
                      }`}>
                        <RadioGroupItem value="monthly" id="monthly" className="sr-only" />
                        <Label htmlFor="monthly" className="flex items-center justify-between cursor-pointer">
                          <div>
                            <div className="font-medium text-white">Mensuel</div>
                            <div className="text-sm text-gray-400">Facturation mensuelle</div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-cyan-400">{displayMonthlyPrice}</div>
                            <div className="text-sm text-gray-400">/mois</div>
                          </div>
                        </Label>
                      </div>
                    </motion.div>
                    
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className={`p-4 rounded-2xl border-2 transition-all relative ${
                        billingCycle === 'yearly' 
                          ? 'border-purple-500 bg-purple-500/10' 
                          : 'border-gray-600 bg-gray-800/50'
                      }`}>
                        <RadioGroupItem value="yearly" id="yearly" className="sr-only" />
                        <Label htmlFor="yearly" className="flex items-center justify-between cursor-pointer">
                          <div>
                            <div className="font-medium text-white">Annuel</div>
                            <div className="text-sm text-gray-400">Économisez 17%</div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-purple-400">{displayYearlyPrice}</div>
                            <div className="text-sm text-gray-400">/an</div>
                          </div>
                        </Label>
                        {savings > 0 && (
                          <Badge className="absolute -top-2 -right-2 bg-gradient-to-r from-green-400 to-emerald-500 text-white">
                            <Percent className="w-3 h-3 mr-1" />
                            Économie {savings}%
                          </Badge>
                        )}
                      </div>
                    </motion.div>
                  </RadioGroup>
                </div>

                {/* Trial Information */}
                {planData.pricing.trial_days > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8 p-4 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-2xl"
                  >
                    <div className="flex items-center gap-3 text-cyan-400">
                      <Gift className="w-5 h-5" />
                      <span className="font-medium">
                        {planData.pricing.trial_days} jours d'essai gratuits
                      </span>
                    </div>
                  </motion.div>
                )}

                {/* Payment Method - CinetPay Modern */}
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-orange-400" />
                    Méthode de Paiement
                  </h3>
                  
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="p-6 bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-2xl"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center">
                          <Wallet className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <div className="font-bold text-white">CinetPay</div>
                          <div className="text-sm text-gray-300">Plateforme de paiement africaine</div>
                        </div>
                      </div>
                      <Badge className="bg-gradient-to-r from-green-400 to-emerald-500 text-white">
                        <Lock className="w-3 h-3 mr-1" />
                        Sécurisé
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { name: 'Orange Money', icon: Smartphone, color: 'text-orange-400' },
                        { name: 'MTN Money', icon: Smartphone, color: 'text-yellow-400' },
                        { name: 'Moov Money', icon: Smartphone, color: 'text-green-400' },
                        { name: 'Carte bancaire', icon: CreditCard, color: 'text-blue-400' }
                      ].map((method, index) => (
                        <motion.div
                          key={index}
                          whileHover={{ scale: 1.05 }}
                          className="flex items-center gap-2 p-3 bg-slate-800/50 rounded-xl"
                        >
                          <method.icon className={`w-4 h-4 ${method.color}`} />
                          <span className="text-sm text-gray-300">{method.name}</span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </div>

                {/* Order Summary */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8 p-6 bg-slate-900/50 border border-gray-700 rounded-2xl"
                >
                  <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                    <Database className="w-5 h-5 text-gray-400" />
                    Récapitulatif
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-gray-300">
                      <span>{planData.plan.name} - {billingCycle === 'monthly' ? 'Mensuel' : 'Annuel'}</span>
                      <span className="text-white font-medium">
                        {billingCycle === 'monthly' ? monthlyPrice : yearlyPrice} EUR
                      </span>
                    </div>
                    
                    {planData.pricing.setup_fee > 0 && (
                      <div className="flex justify-between text-gray-300">
                        <span>Frais d'installation</span>
                        <span className="text-white font-medium">
                          {planData.pricing.setup_fee} EUR
                        </span>
                      </div>
                    )}
                    
                    {yearlyPricing && savings > 0 && (
                      <div className="flex justify-between text-green-400">
                        <span>Économies annuelles</span>
                        <span className="font-medium">
                          -{Math.round(monthlyPrice * 12 * savings / 100)} EUR
                        </span>
                      </div>
                    )}
                    
                    <Separator className="bg-gray-700" />
                    
                    <div className="flex justify-between text-xl font-bold text-white">
                      <span>Total</span>
                      <span className="text-cyan-400">
                        {(billingCycle === 'monthly' ? monthlyPrice : yearlyPrice) + planData.pricing.setup_fee} EUR
                      </span>
                    </div>
                  </div>
                </motion.div>

                {/* Payment Button */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button 
                    onClick={handlePayment}
                    disabled={processing}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    className="w-full h-14 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-bold text-lg rounded-2xl transition-all duration-300 shadow-lg"
                  >
                    {processing ? (
                      <div className="flex items-center gap-3">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                        />
                        <span>Traitement en cours...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-3">
                        <AnimatePresence mode="wait">
                          {isHovered ? (
                            <motion.div
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 10 }}
                            >
                              <Rocket className="w-5 h-5" />
                            </motion.div>
                          ) : (
                            <motion.div
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 10 }}
                            >
                              <CreditCard className="w-5 h-5" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                        <span>Payer Maintenant</span>
                        <ArrowRight className="w-5 h-5" />
                      </div>
                    )}
                  </Button>
                </motion.div>

                {/* Security Info */}
                <div className="mt-6 text-center">
                  <div className="flex items-center justify-center gap-2 text-gray-400 text-sm mb-2">
                    <Shield className="w-4 h-4" />
                    <span>Paiement sécurisé via CinetPay</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-gray-500 text-xs">
                    <Globe className="w-3 h-3" />
                    <span>SSL 256 bits | Partenaire officiel Afrique</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom Tech Elements */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-12 text-center"
        >
          <div className="flex items-center justify-center gap-8 text-gray-400">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <span className="text-sm">Croissance garantie</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" />
              <span className="text-sm">Activation instantanée</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-purple-400" />
              <span className="text-sm">Satisfaction 100%</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ModernSubscriptionPayment;
