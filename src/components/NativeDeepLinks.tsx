import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { canReceiveDeepLinks, parseDeepLink } from "@/lib/nativeLinks";
import { safeInternalPath, takePostAuthRedirect } from "@/lib/postAuthRedirect";

// Dans l'app Android / iOS : reçoit les liens com.bossizplus.app://… (retour de
// la connexion Google ouverte dans le navigateur du téléphone, ou lien vers
// une page de l'app) et ouvre la session / la page correspondante.
export function NativeDeepLinks() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!canReceiveDeepLinks()) return;
    let removed = false;
    let remove: (() => void) | undefined;

    const handle = async (url: string) => {
      const link = parseDeepLink(url);
      if (!link) return;

      if (link.kind === "path") {
        const target = safeInternalPath(link.path);
        if (target) navigate(target);
        return;
      }

      if (link.error) {
        toast({ title: "Connexion impossible", description: link.error, variant: "destructive" });
        return;
      }
      const { error } = link.code
        ? await supabase.auth.exchangeCodeForSession(link.code)
        : link.accessToken && link.refreshToken
          ? await supabase.auth.setSession({ access_token: link.accessToken, refresh_token: link.refreshToken })
          : { error: new Error("Réponse de connexion incomplète") };
      if (error) {
        toast({ title: "Connexion impossible", description: error.message, variant: "destructive" });
        return;
      }
      navigate(takePostAuthRedirect() ?? "/dashboard", { replace: true });
    };

    void import("@capacitor/app").then(async ({ App }) => {
      const listener = await App.addListener("appUrlOpen", ({ url }) => void handle(url));
      if (removed) listener.remove();
      else remove = () => listener.remove();
      // Application lancée directement par le lien (elle était fermée).
      const launch = await App.getLaunchUrl();
      if (launch?.url) void handle(launch.url);
    });

    return () => {
      removed = true;
      remove?.();
    };
  }, [navigate]);

  return null;
}
