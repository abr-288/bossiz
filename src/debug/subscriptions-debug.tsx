import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function SubscriptionsDebug() {
  const [logs, setLogs] = useState<string[]>([]);
  const [plans, setPlans] = useState<any[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    const debugPlans = async () => {
      addLog("Début du debug des plans d'abonnement...");
      
      try {
        // Test 1: Vérifier la connexion Supabase
        addLog("Test 1: Vérification de la connexion Supabase...");
        const { data: testData, error: testError } = await supabase
          .from('subscription_plans')
          .select('count')
          .limit(1);
        
        if (testError) {
          addLog(`ERREUR Connexion: ${JSON.stringify(testError)}`);
          return;
        }
        addLog("Connexion Supabase OK");
        
        // Test 2: Compter tous les plans
        addLog("Test 2: Comptage de tous les plans...");
        const { data: countData, error: countError } = await supabase
          .from('subscription_plans')
          .select('id', { count: 'exact' });
        
        if (countError) {
          addLog(`ERREUR Comptage: ${JSON.stringify(countError)}`);
          return;
        }
        addLog(`Nombre total de plans: ${countData?.length || 0}`);
        
        // Test 3: Plans actifs
        addLog("Test 3: Plans actifs (is_active = true)...");
        const { data: activeData, error: activeError } = await supabase
          .from('subscription_plans')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });
        
        if (activeError) {
          addLog(`ERREUR Plans actifs: ${JSON.stringify(activeError)}`);
          return;
        }
        
        addLog(`Plans actifs trouvés: ${activeData?.length || 0}`);
        setPlans(activeData || []);
        
        // Test 4: Vérifier la structure des données
        addLog("Test 4: Vérification de la structure des données...");
        if (activeData && activeData.length > 0) {
          const firstPlan = activeData[0];
          addLog(`Structure du premier plan: ${JSON.stringify(Object.keys(firstPlan))}`);
          addLog(`Premier plan complet: ${JSON.stringify(firstPlan)}`);
        } else {
          addLog("Aucun plan trouvé pour vérifier la structure");
        }
        
        // Test 5: Plans non actifs
        addLog("Test 5: Plans non actifs (is_active = false)...");
        const { data: inactiveData, error: inactiveError } = await supabase
          .from('subscription_plans')
          .select('*')
          .eq('is_active', false);
        
        if (inactiveError) {
          addLog(`ERREUR Plans inactifs: ${JSON.stringify(inactiveError)}`);
        } else {
          addLog(`Plans inactifs trouvés: ${inactiveData?.length || 0}`);
        }
        
        // Test 6: Tous les plans sans filtre
        addLog("Test 6: Tous les plans sans filtre...");
        const { data: allData, error: allError } = await supabase
          .from('subscription_plans')
          .select('*');
        
        if (allError) {
          addLog(`ERREUR Tous les plans: ${JSON.stringify(allError)}`);
        } else {
          addLog(`Tous les plans trouvés: ${allData?.length || 0}`);
          if (allData && allData.length > 0) {
            allData.forEach((plan, index) => {
              addLog(`Plan ${index}: ${plan.name} (active: ${plan.is_active})`);
            });
          }
        }
        
      } catch (error) {
        addLog(`ERREUR GÉNÉRALE: ${JSON.stringify(error)}`);
      }
      
      addLog("Debug terminé");
    };

    debugPlans();
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Debug - Page d'Abonnements</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Logs de Debug</h2>
        <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
          {logs.map((log, index) => (
            <div key={index} className="mb-1">{log}</div>
          ))}
        </div>
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Plans Actifs Trouvés ({plans.length})</h2>
        {plans.length === 0 ? (
          <p className="text-red-600">Aucun plan actif trouvé</p>
        ) : (
          <div className="space-y-4">
            {plans.map((plan, index) => (
              <div key={plan.id} className="border p-4 rounded-lg">
                <h3 className="font-semibold">{plan.name}</h3>
                <p>ID: {plan.plan_id}</p>
                <p>Prix: {plan.price}</p>
                <p>Actif: {plan.is_active ? 'Oui' : 'Non'}</p>
                <p>Ordre: {plan.sort_order}</p>
                <p>Features: {plan.features ? JSON.stringify(plan.features) : 'Aucun'}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="flex gap-4">
        <button 
          onClick={() => window.location.href = '/subscriptions'}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Voir la page d'abonnements
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
