// ============================================================
// Garde pour les fonctions déclenchées uniquement par pg_cron.
//
// Ces fonctions tournent avec la clé service-role et agissent sans
// utilisateur (versements, auto-approbation, rappels, agent IA). Elles ne
// sont appelées par aucune interface. pg_cron leur envoie un secret partagé
// dans l'en-tête « x-cron-secret » ; tout appel sans ce secret est refusé,
// pour qu'un tiers ne puisse pas les déclencher depuis l'extérieur.
//
// Mettre le secret des deux côtés, à la même valeur :
//   - secret de fonction CRON_SECRET (Dashboard > Edge Functions > Secrets) ;
//   - secret Vault « cron_secret » (lu par les tâches cron).
// ============================================================
export function rejectIfNotCron(
  req: Request,
  corsHeaders: Record<string, string>,
): Response | null {
  const expected = Deno.env.get("CRON_SECRET");
  const provided = req.headers.get("x-cron-secret");
  if (!expected || !provided || provided !== expected) {
    return new Response(
      JSON.stringify({ success: false, error: "Accès refusé" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
  return null;
}
