import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function MajesticPlansDebug() {
  const [logs, setLogs] = useState<string[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [pricing, setPricing] = useState<any[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    const debugMajesticPlans = async () => {
      addLog("Début du debug des plans Majestic Club...");
      
      try {
        // Test 1: Vérifier tous les plans
        addLog("Test 1: Recherche de tous les plans...");
        const { data: allPlans, error: allPlansError } = await supabase
          .from('subscription_plans' as any)
          .select('*')
          .order('sort_order', { ascending: true });
        
        if (allPlansError) {
          addLog(`ERREUR Tous les plans: ${JSON.stringify(allPlansError)}`);
          return;
        }
        addLog(`Nombre total de plans: ${allPlans?.length || 0}`);
        
        // Test 2: Plans Majestic spécifiquement
        addLog("Test 2: Recherche des plans Majestic Club...");
        const { data: majesticPlans, error: majesticError } = await supabase
          .from('subscription_plans' as any)
          .select('*')
          .like('plan_id', 'majestic_%')
          .order('sort_order', { ascending: true });
        
        if (majesticError) {
          addLog(`ERREUR Plans Majestic: ${JSON.stringify(majesticError)}`);
          return;
        }
        
        addLog(`Plans Majestic trouvés: ${majesticPlans?.length || 0}`);
        setPlans(majesticPlans || []);
        
        // Test 3: Vérifier la structure des plans Majestic
        if (majesticPlans && majesticPlans.length > 0) {
          addLog("Test 3: Structure des plans Majestic...");
          majesticPlans.forEach((plan, index) => {
            addLog(`Plan ${index + 1}: ${plan.name} (${plan.plan_id}) - Prix: ${plan.price}`);
            addLog(`  Features: ${plan.features ? JSON.stringify(plan.features) : 'Aucun'}`);
            addLog(`  Role: ${plan.assigned_role || 'Non défini'}`);
            addLog(`  Type: ${plan.subscription_type || 'Non défini'}`);
          });
        }
        
        // Test 4: Tarifications Majestic
        addLog("Test 4: Recherche des tarifications Majestic...");
        const { data: majesticPricing, error: pricingError } = await supabase
          .from('subscription_pricing' as any)
          .select('*')
          .like('plan_id', 'majestic_%')
          .order('plan_id', { ascending: true });
        
        if (pricingError) {
          addLog(`ERREUR Tarifications Majestic: ${JSON.stringify(pricingError)}`);
        } else {
          addLog(`Tarifications Majestic trouvées: ${majesticPricing?.length || 0}`);
          setPricing(majesticPricing || []);
          
          if (majesticPricing && majesticPricing.length > 0) {
            majesticPricing.forEach((price, index) => {
              addLog(`Tarif ${index + 1}: ${price.plan_id} - ${price.billing_cycle} - ${price.price} ${price.currency}`);
            });
          }
        }
        
        // Test 5: Test direct de recherche par plan_id
        addLog("Test 5: Test de recherche directe par plan_id...");
        const testPlanIds = ['majestic_access', 'majestic_prive', 'majestic_black'];
        
        for (const planId of testPlanIds) {
          const { data: plan, error: planError } = await supabase
            .from('subscription_plans' as any)
            .select('*')
            .eq('plan_id', planId)
            .single();
          
          if (planError) {
            addLog(`ERREUR recherche ${planId}: ${JSON.stringify(planError)}`);
          } else {
            addLog(`SUCCÈS: ${planId} trouvé - ${plan.name}`);
          }
        }
        
      } catch (error) {
        addLog(`ERREUR GÉNÉRALE: ${JSON.stringify(error)}`);
      }
      
      addLog("Debug terminé");
    };

    debugMajesticPlans();
  }, []);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Debug - Plans Majestic Club</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Logs de Debug</h2>
        <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
          {logs.map((log, index) => (
            <div key={index} className="mb-1">{log}</div>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Plans Majestic Club Trouvés ({plans.length})</h2>
          {plans.length === 0 ? (
            <p className="text-red-600">Aucun plan Majestic trouvé</p>
          ) : (
            <div className="space-y-4">
              {plans.map((plan, index) => (
                <div key={plan.id} className="border p-4 rounded-lg">
                  <h3 className="font-semibold">{plan.name}</h3>
                  <p className="text-sm text-gray-600">ID: {plan.plan_id}</p>
                  <p className="text-sm">Prix: {plan.price} {plan.price_note}</p>
                  <p className="text-sm">Type: {plan.subscription_type}</p>
                  <p className="text-sm">Rôle: {plan.assigned_role}</p>
                  <p className="text-sm">Assistance: {plan.assistance_level}</p>
                  <div className="mt-2">
                    <p className="text-sm font-semibold">Features:</p>
                    <ul className="text-sm list-disc list-inside">
                      {plan.features?.map((feature: string, idx: number) => (
                        <li key={idx}>{feature}</li>
                      )) || <li>Aucune feature</li>}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Tarifications Majestic Club Trouvées ({pricing.length})</h2>
          {pricing.length === 0 ? (
            <p className="text-red-600">Aucune tarification Majestic trouvée</p>
          ) : (
            <div className="space-y-4">
              {pricing.map((price, index) => (
                <div key={price.id} className="border p-4 rounded-lg">
                  <h3 className="font-semibold">{price.plan_id}</h3>
                  <p className="text-sm">Cycle: {price.billing_cycle}</p>
                  <p className="text-sm">Prix: {price.price} {price.currency}</p>
                  <p className="text-sm">Réduction: {price.discount_percentage}%</p>
                  <p className="text-sm">Jours d'essai: {price.trial_days}</p>
                  <p className="text-sm">Frais d'installation: {price.setup_fee}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="flex gap-4">
        <button 
          onClick={() => window.location.href = '/subscriptions'}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Voir la page d'abonnements
        </button>
        <button 
          onClick={() => window.location.href = '/subscription-payment?planId=majestic_access&billingCycle=monthly'}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Test paiement Majestic Access
        </button>
        <button 
          onClick={() => window.location.reload()}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Recharger
        </button>
      </div>
    </div>
  );
}
