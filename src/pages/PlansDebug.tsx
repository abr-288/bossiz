import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Database, 
  Check, 
  AlertCircle, 
  ExternalLink,
  CreditCard,
  Crown,
  Rocket
} from "lucide-react";

interface Plan {
  id: string;
  plan_id: string;
  name: string;
  subtitle: string | null;
  icon: string;
  features: string[] | null;
  subscription_type: string;
  assigned_role: string;
  assistance_level: string;
  is_active: boolean;
  price: string;
  created_at: string;
}

interface Pricing {
  id: string;
  plan_id: string;
  billing_cycle: string;
  price: number;
  currency: string;
  discount_percentage: number;
  trial_days: number;
  setup_fee: number;
  created_at: string;
}

export default function PlansDebug() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [pricing, setPricing] = useState<Pricing[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch plans
        const { data: plansData, error: plansError } = await supabase
          .from('subscription_plans' as any)
          .select('*')
          .order('created_at', { ascending: false });

        if (plansError) {
          throw new Error(`Plans error: ${plansError.message}`);
        }

        // Fetch pricing
        const { data: pricingData, error: pricingError } = await supabase
          .from('subscription_pricing' as any)
          .select('*')
          .order('created_at', { ascending: false });

        if (pricingError) {
          throw new Error(`Pricing error: ${pricingError.message}`);
        }

        setPlans(plansData || []);
        setPricing(pricingData || []);
        
        console.log('Plans found:', plansData?.length || 0);
        console.log('Pricing found:', pricingData?.length || 0);

      } catch (error: any) {
        console.error('Debug error:', error);
        setError(error.message);
        toast({
          title: 'Erreur de debug',
          description: error.message,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  const goToPayment = (planId: string) => {
    navigate(`/subscription-payment?planId=${planId}`);
  };

  const goToSubscriptions = () => {
    navigate('/subscriptions');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Database className="w-16 h-16 text-cyan-400 mx-auto mb-4 animate-pulse" />
          <div className="text-cyan-400 text-lg font-medium">Chargement des données...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-8">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Database className="w-8 h-8 text-cyan-400" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Debug des Plans d'Abonnement
            </h1>
            <Rocket className="w-8 h-8 text-purple-400" />
          </div>
          <p className="text-gray-300">Vérification des plans disponibles dans la base de données</p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
            <div className="flex items-center gap-2 text-red-400">
              <AlertCircle className="w-5 h-5" />
              <span>Erreur: {error}</span>
            </div>
          </div>
        )}

        {/* Plans Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Crown className="w-6 h-6 text-yellow-400" />
            Plans Disponibles ({plans.length})
          </h2>
          
          {plans.length === 0 ? (
            <div className="text-center py-12 bg-slate-800/50 rounded-lg border border-gray-700">
              <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">Aucun plan trouvé dans la base de données</p>
              <Button onClick={goToSubscriptions} className="bg-cyan-500 hover:bg-cyan-600">
                Vérifier la page d'abonnements
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map((plan) => {
                const planPricing = pricing.filter(p => p.plan_id === plan.plan_id);
                const isActive = plan.is_active;
                
                return (
                  <Card key={plan.id} className="bg-slate-800/50 border border-gray-700">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-white">{plan.name}</CardTitle>
                        <Badge className={isActive ? 'bg-green-500' : 'bg-red-500'}>
                          {isActive ? 'Actif' : 'Inactif'}
                        </Badge>
                      </div>
                      {plan.subtitle && (
                        <p className="text-gray-400 text-sm">{plan.subtitle}</p>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="text-sm text-gray-400">
                          <strong>ID:</strong> {plan.plan_id}
                        </div>
                        <div className="text-sm text-gray-400">
                          <strong>Type:</strong> {plan.subscription_type}
                        </div>
                        <div className="text-sm text-gray-400">
                          <strong>Rôle:</strong> {plan.assigned_role}
                        </div>
                        <div className="text-sm text-gray-400">
                          <strong>Prix affiché:</strong> {plan.price || 'Non défini'}
                        </div>
                      </div>

                      {planPricing.length > 0 && (
                        <div className="space-y-2">
                          <div className="text-sm font-medium text-white">Tarifications:</div>
                          {planPricing.map((price) => (
                            <div key={price.id} className="text-xs text-gray-400 bg-slate-900/50 p-2 rounded">
                              {price.billing_cycle}: {price.price} {price.currency}
                              {price.discount_percentage > 0 && (
                                <span className="text-green-400 ml-2">(-{price.discount_percentage}%)</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {plan.features && plan.features.length > 0 && (
                        <div className="space-y-2">
                          <div className="text-sm font-medium text-white">Fonctionnalités:</div>
                          <div className="space-y-1">
                            {plan.features.slice(0, 3).map((feature, index) => (
                              <div key={index} className="text-xs text-gray-400 flex items-center gap-1">
                                <Check className="w-3 h-3 text-green-400" />
                                {feature}
                              </div>
                            ))}
                            {plan.features.length > 3 && (
                              <div className="text-xs text-gray-500">
                                +{plan.features.length - 3} autres fonctionnalités
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <Button 
                        onClick={() => goToPayment(plan.plan_id)}
                        disabled={!isActive}
                        className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4" />
                          {isActive ? 'Tester le paiement' : 'Plan inactif'}
                        </div>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Pricing Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Database className="w-6 h-6 text-cyan-400" />
            Tarifications Disponibles ({pricing.length})
          </h2>
          
          {pricing.length === 0 ? (
            <div className="text-center py-12 bg-slate-800/50 rounded-lg border border-gray-700">
              <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
              <p className="text-gray-400">Aucune tarification trouvée</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pricing.map((price) => (
                <Card key={price.id} className="bg-slate-800/50 border border-gray-700">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-white">{price.plan_id}</div>
                      <div className="text-lg font-bold text-cyan-400">
                        {price.price} {price.currency}
                      </div>
                      <div className="text-xs text-gray-400">
                        Cycle: {price.billing_cycle}
                      </div>
                      {price.discount_percentage > 0 && (
                        <div className="text-xs text-green-400">
                          Remise: {price.discount_percentage}%
                        </div>
                      )}
                      <div className="text-xs text-gray-400">
                        Essai: {price.trial_days} jours
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-center gap-4">
          <Button onClick={goToSubscriptions} variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800">
            Page d'abonnements
          </Button>
          <Button onClick={() => window.location.reload()} className="bg-cyan-500 hover:bg-cyan-600">
            Actualiser
          </Button>
        </div>

        {/* Instructions */}
        <div className="mt-12 p-6 bg-slate-800/30 rounded-lg border border-gray-700">
          <h3 className="text-lg font-bold text-white mb-4">Instructions:</h3>
          <ol className="space-y-2 text-gray-300">
            <li>1. Vérifiez que des plans sont bien présents dans la base de données</li>
            <li>2. Assurez-vous que les plans sont actifs (badge vert)</li>
            <li>3. Cliquez sur "Tester le paiement" pour accéder à la page moderne</li>
            <li>4. Si aucun plan n'existe, exécutez les migrations SQL</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
