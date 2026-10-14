import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================================
// Identification de l'appelant d'une Edge Function.
//
// Deux appelants légitimes possibles :
// - "service" : un appel serveur-à-serveur (payment-callback,
//   postPaymentSuccess, create-pnr, cron…) qui présente la clé
//   service-role elle-même comme bearer token ;
// - "user" : un utilisateur connecté (JWT Supabase), admin ou non.
//
// La clé anon seule ne suffit jamais : getCaller renvoie null.
// ============================================================

export type Caller =
  | { kind: "service" }
  | { kind: "user"; userId: string; email: string | null; isAdmin: boolean };

export async function getCaller(req: Request, admin: SupabaseClient): Promise<Caller | null> {
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return null;

  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (serviceKey && token === serviceKey) return { kind: "service" };

  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return null;

  const { data: isAdmin } = await admin.rpc("has_role", { _user_id: data.user.id, _role: "admin" });
  return { kind: "user", userId: data.user.id, email: data.user.email ?? null, isAdmin: isAdmin === true };
}

/** Appel serveur interne ou administrateur. */
export function isStaff(caller: Caller | null): boolean {
  return caller?.kind === "service" || (caller?.kind === "user" && caller.isAdmin);
}

/** Le propriétaire de la réservation, un admin ou un appel serveur interne. */
export function canAccessBooking(caller: Caller | null, booking: { user_id: string | null }): boolean {
  if (isStaff(caller)) return true;
  return caller?.kind === "user" && booking.user_id === caller.userId;
}
