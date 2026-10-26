import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { takePostAuthRedirect } from "@/lib/postAuthRedirect";

// Dès que la session existe (retour du lien de confirmation ou de Google),
// renvoie vers la page mémorisée avant l'inscription. La page /auth gère
// elle-même la connexion par mot de passe.
export function PostAuthRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session || (event !== "SIGNED_IN" && event !== "INITIAL_SESSION")) return;
      if (window.location.pathname === "/auth") return;
      const target = takePostAuthRedirect();
      if (target && target !== `${window.location.pathname}${window.location.search}`) {
        // Différé : ne pas naviguer pendant le traitement de l'événement.
        setTimeout(() => navigate(target, { replace: true }), 0);
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  return null;
}
