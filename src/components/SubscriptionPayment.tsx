import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Wallet
} from "lucide-react";
import CinetPayService from "@/services/cinetpay";

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

const SubscriptionPayment = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [planData, setPlanData] = useState<PaymentData | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [paymentMethod, setPaymentMethod] = useState<string>('cinetpay');

  const planId = searchParams.get('planId');
  const bookingId = searchParams.get('bookingId');

  useEffect(() => {
    const fetchPlanData = async () => {
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
        // Fetch plan details
        const { data: plan, error: planError } = await supabase
          .from('subscription_plans' as any)
          .select('*')
          .eq('plan_id', planId)
          .single();

        if (planError || !plan) {
          throw new Error('Plan non trouvé');
        }

        // Fetch pricing options
        const { data: pricing, error: pricingError } = await supabase
          .from('subscription_pricing' as any)
          .select('*')
          .eq('plan_id', planId);

        if (pricingError || !pricing || pricing.length === 0) {
          throw new Error('Tarifs non disponibles');
        }

        // Get default pricing (monthly)
        const defaultPricing = pricing.find((p: any) => p.billing_cycle === 'monthly') || pricing[0];
        const yearlyPricing = pricing.find((p: any) => p.billing_cycle === 'yearly');

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
          payment_method: paymentMethod,
          transaction_id: transactionId
        })
        .select()
        .single();

      if (subscriptionError) throw subscriptionError;

      // Create initial billing period
      const { error: billingError } = await supabase
        .rpc('create_billing_period', { 
          p_user_subscription_id: subscription.id,
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
        customer_name: profile?.full_name || user.email?.split('@')[0] || 'Client',
        customer_email: user.email || '',
        customer_phone: profile?.phone || '+225000000000',
        return_url: `${window.location.origin}/payment-success?subscription_id=${subscription.id}`,
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
        description: 'Vous allez être redirigé vers la page de paiement sécurisée CinetPay.',
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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!planData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-black mb-4">Plan non trouvé</h2>
          <Button onClick={() => navigate('/subscriptions')} className="bg-black hover:bg-gray-800 text-white">
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

  return (
    <div className="min-h-screen bg-white pt-16">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-black mb-2">Finaliser votre abonnement</h1>
          <p className="text-gray-700">Choisissez votre cycle de facturation et procédez au paiement</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Plan Details */}
          <Card className="border-2 border-gray-300">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 ${isMajestic ? 'bg-gradient-to-br from-black to-gray-800' : 'bg-black'} rounded-xl flex items-center justify-center`}>
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-black">{planData.plan.name}</CardTitle>
                  {planData.plan.subtitle && (
                    <p className="text-sm text-gray-600">{planData.plan.subtitle}</p>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isMajestic && (
                <Badge className="bg-black text-white w-full justify-center py-2">
                  Assistance 24/7 - Accès VIP Exclusif
                </Badge>
              )}
              
              <div className="space-y-2">
                {planData.plan.features?.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-black">{feature}</span>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-black">Sécurité des paiements</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-500" />
                  <span className="text-sm text-black">Annulation à tout moment</span>
                </div>
                {isMajestic && (
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm text-black">Activation instantanée</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <Card className="border-2 border-gray-300">
            <CardHeader>
              <CardTitle className="text-black">Options de facturation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Billing Cycle Selection */}
              <div>
                <Label className="text-base font-medium text-black mb-3 block">Cycle de facturation</Label>
                <RadioGroup 
                  value={billingCycle} 
                  onValueChange={(value) => handleBillingCycleChange(value as 'monthly' | 'yearly')}
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-3 p-3 border border-gray-300 rounded-lg">
                    <RadioGroupItem value="monthly" id="monthly" />
                    <Label htmlFor="monthly" className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-black">Mensuel</span>
                        <span className="text-lg font-bold text-black">{monthlyPrice} EUR/mois</span>
                      </div>
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 border border-gray-300 rounded-lg relative">
                    <RadioGroupItem value="yearly" id="yearly" />
                    <Label htmlFor="yearly" className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-black">Annuel</span>
                        <div className="text-right">
                          <span className="text-lg font-bold text-black">{yearlyPrice} EUR/an</span>
                          {savings > 0 && (
                            <div className="flex items-center gap-1 text-green-600">
                              <Percent className="w-3 h-3" />
                              <span className="text-xs">Économisez {savings}%</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Label>
                    {savings > 0 && (
                      <Badge className="absolute -top-2 -right-2 bg-green-500 text-white text-xs">
                        Offre
                      </Badge>
                    )}
                  </div>
                </RadioGroup>
              </div>

              {/* Trial Information */}
              {planData.pricing.trial_days > 0 && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-700">
                    <Gift className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {planData.pricing.trial_days} jours d'essai gratuits
                    </span>
                  </div>
                </div>
              )}

              {/* Payment Method - CinetPay Only */}
              <div>
                <Label className="text-base font-medium text-black mb-3 block">Méthode de paiement</Label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-4 border-2 border-orange-300 bg-orange-50 rounded-lg">
                    <Wallet className="w-6 h-6 text-orange-500" />
                    <div className="flex-1">
                      <div className="font-medium text-black">CinetPay</div>
                      <div className="text-sm text-gray-600">Orange Money, MTN, Moov, Carte bancaire</div>
                    </div>
                    <Badge className="bg-orange-500 text-white">Sécurisé</Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <div className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded">
                      <Smartphone className="w-4 h-4 text-orange-500" />
                      <span className="text-xs text-black">Orange Money</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded">
                      <Smartphone className="w-4 h-4 text-yellow-500" />
                      <span className="text-xs text-black">MTN Money</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded">
                      <Smartphone className="w-4 h-4 text-green-500" />
                      <span className="text-xs text-black">Moov Money</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded">
                      <CreditCard className="w-4 h-4 text-blue-500" />
                      <span className="text-xs text-black">Carte bancaire</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                <h3 className="font-medium text-black">Récapitulatif</h3>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {planData.plan.name} - {billingCycle === 'monthly' ? 'Mensuel' : 'Annuel'}
                  </span>
                  <span className="text-black font-medium">
                    {billingCycle === 'monthly' ? monthlyPrice : yearlyPrice} EUR
                  </span>
                </div>
                
                {planData.pricing.setup_fee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Frais d'installation</span>
                    <span className="text-black font-medium">
                      {planData.pricing.setup_fee} EUR
                    </span>
                  </div>
                )}
                
                {yearlyPricing && savings > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Économies annuelles</span>
                    <span className="font-medium">
                      -{Math.round(monthlyPrice * 12 * savings / 100)} EUR
                    </span>
                  </div>
                )}
                
                <Separator />
                
                <div className="flex justify-between font-bold text-black">
                  <span>Total</span>
                  <span>
                    {(billingCycle === 'monthly' ? monthlyPrice : yearlyPrice) + planData.pricing.setup_fee} EUR
                  </span>
                </div>
                
                {planData.pricing.trial_days > 0 && (
                  <p className="text-xs text-gray-500 text-center">
                    Après la période d'essai de {planData.pricing.trial_days} jours
                  </p>
                )}
              </div>

              {/* Payment Button */}
              <Button 
                onClick={handlePayment}
                disabled={processing}
                className="w-full bg-black hover:bg-gray-800 text-white py-3"
              >
                {processing ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Traitement en cours...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Payer maintenant
                  </div>
                )}
              </Button>

              <div className="text-center text-xs text-gray-500">
                <p>En procédant au paiement, vous acceptez nos conditions générales</p>
                <p>Paiement sécurisé via CinetPay - SSL 256 bits</p>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <Wallet className="w-3 h-3" />
                  <span>Partenaire de paiement officiel pour l'Afrique</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPayment;
