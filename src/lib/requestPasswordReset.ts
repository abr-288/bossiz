import { supabase } from "@/integrations/supabase/client";

// Demande d'e-mail de réinitialisation via l'Edge Function send-password-reset
// (envoi par le prestataire e-mail du site plutôt que par le mailer de
// Supabase Auth). La fonction répond toujours "succès" que le compte existe
// ou non ; on ne lève d'erreur que si l'appel lui-même échoue.
export async function requestPasswordReset(
  email: string,
  redirectPath: "/reset-password" | "/auth" = "/reset-password",
): Promise<void> {
  const { error } = await supabase.functions.invoke("send-password-reset", {
    body: { email, redirectPath },
  });
  if (error) throw error;
}
