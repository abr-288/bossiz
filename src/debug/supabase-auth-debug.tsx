import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export default function SupabaseAuthDebug() {
  const [logs, setLogs] = useState<string[]>([]);
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const navigate = useNavigate();

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    const debugAuth = async () => {
      addLog("Début du debug de l'authentification Supabase...");
      
      try {
        // Test 1: Vérifier la session actuelle
        addLog("Test 1: Vérification de la session actuelle...");
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          addLog(`ERREUR Session: ${JSON.stringify(sessionError)}`);
        } else {
          addLog(`Session trouvée: ${currentSession ? 'OUI' : 'NON'}`);
          setSession(currentSession);
          
          if (currentSession) {
            addLog(`User ID: ${currentSession.user?.id}`);
            addLog(`User Email: ${currentSession.user?.email}`);
            addLog(`User Role: ${currentSession.user?.user_metadata?.role || 'Non défini'}`);
            setUser(currentSession.user);
          }
        }
        
        // Test 2: Écouter les changements d'authentification
        addLog("Test 2: Configuration de l'écouteur d'authentification...");
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, session) => {
            addLog(`Event Auth: ${event}`);
            addLog(`Session State: ${session ? 'Active' : 'Inactive'}`);
            
            if (session?.user) {
              addLog(`User connected: ${session.user.email}`);
              setUser(session.user);
              setSession(session);
            } else {
              addLog("User disconnected");
              setUser(null);
              setSession(null);
            }
          }
        );
        
        // Test 3: Tester l'accès à la base de données
        addLog("Test 3: Test d'accès à la base de données...");
        const { data: testData, error: testError } = await supabase
          .from('subscription_plans' as any)
          .select('count')
          .limit(1);
        
        if (testError) {
          addLog(`ERREUR BDD: ${JSON.stringify(testError)}`);
        } else {
          addLog("Accès BDD: OK");
        }
        
        // Test 4: Tester les permissions RLS
        addLog("Test 4: Test des permissions RLS...");
        const { data: plansData, error: plansError } = await supabase
          .from('subscription_plans' as any)
          .select('*')
          .eq('is_active', true)
          .limit(5);
        
        if (plansError) {
          addLog(`ERREUR RLS: ${JSON.stringify(plansError)}`);
        } else {
          addLog(`Plans récupérés: ${plansData?.length || 0}`);
          if (plansData && plansData.length > 0) {
            addLog(`Premier plan: ${plansData[0].name}`);
          }
        }
        
        // Test 5: Vérifier les métadonnées utilisateur
        addLog("Test 5: Vérification des métadonnées utilisateur...");
        if (currentSession?.user) {
          const metadata = currentSession.user.user_metadata;
          addLog(`Métadonnées: ${JSON.stringify(metadata)}`);
          
          // Vérifier le rôle
          const userRole = metadata?.role || metadata?.user_role;
          addLog(`Rôle détecté: ${userRole || 'Aucun'}`);
          
          // Vérifier si l'utilisateur a un abonnement actif
          const hasSubscription = metadata?.subscription_status === 'active';
          addLog(`Abonnement actif: ${hasSubscription ? 'OUI' : 'NON'}`);
        }
        
        // Test 6: Test de navigation avec authentification
        addLog("Test 6: Test de navigation vers paiement...");
        const testPlanId = 'majestic_access';
        const testUrl = `/subscription-payment?planId=${testPlanId}&billingCycle=monthly`;
        addLog(`URL de test: ${testUrl}`);
        
        // Simuler la navigation
        setTimeout(() => {
          addLog("Tentative de navigation...");
          // navigate(testUrl); // Commenté pour éviter la navigation automatique
        }, 2000);
        
        // Nettoyer l'écouteur
        return () => {
          subscription.unsubscribe();
          addLog("Écouteur d'authentification nettoyé");
        };
        
      } catch (error) {
        addLog(`ERREUR GÉNÉRALE: ${JSON.stringify(error)}`);
      }
      
      addLog("Debug terminé");
    };

    debugAuth();
  }, [navigate]);

  const handleTestNavigation = () => {
    addLog("Navigation manuelle vers paiement...");
    navigate('/subscription-payment?planId=majestic_access&billingCycle=monthly');
  };

  const handleTestAuth = async () => {
    addLog("Test de connexion manuelle...");
    
    // Essayer de se connecter avec un utilisateur test
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'testpassword'
    });
    
    if (error) {
      addLog(`ERREUR Connexion: ${JSON.stringify(error)}`);
    } else {
      addLog(`Connexion réussie: ${data.user?.email}`);
    }
  };

  const handleTestLogout = async () => {
    addLog("Déconnexion...");
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      addLog(`ERREUR Déconnexion: ${JSON.stringify(error)}`);
    } else {
      addLog("Déconnexion réussie");
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Debug - Authentification Supabase</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">État de l'Authentification</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Utilisateur</h3>
            <p className="text-sm">Connecté: {user ? 'OUI' : 'NON'}</p>
            {user && (
              <>
                <p className="text-sm">Email: {user.email}</p>
                <p className="text-sm">ID: {user.id}</p>
                <p className="text-sm">Rôle: {user.user_metadata?.role || 'Non défini'}</p>
              </>
            )}
          </div>
          
          <div className="border p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Session</h3>
            <p className="text-sm">Active: {session ? 'OUI' : 'NON'}</p>
            {session && (
              <>
                <p className="text-sm">Expire: {new Date(session.expires_at * 1000).toLocaleString()}</p>
                <p className="text-sm">Token: {session.access_token ? 'Présent' : 'Absent'}</p>
              </>
            )}
          </div>
        </div>
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Logs de Debug</h2>
        <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
          {logs.map((log, index) => (
            <div key={index} className="mb-1">{log}</div>
          ))}
        </div>
      </div>
      
      <div className="flex gap-4 flex-wrap">
        <button 
          onClick={handleTestNavigation}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Test Navigation Paiment
        </button>
        <button 
          onClick={handleTestAuth}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Test Connexion
        </button>
        <button 
          onClick={handleTestLogout}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Test Déconnexion
        </button>
        <button 
          onClick={() => window.location.href = '/subscriptions'}
          className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
        >
          Page Abonnements
        </button>
        <button 
          onClick={() => window.location.href = '/majestic-plans-debug'}
          className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
        >
          Debug Plans Majestic
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
