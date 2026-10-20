// Moteur de rendu pour les modèles d'email stockés dans `email_templates`.
// Chaque fonction d'envoi appelle renderEmailTemplate(supabase, key, vars) et
// utilise le résultat si trouvé, sinon retombe sur son propre HTML par
// défaut codé en dur - un admin qui vide/désactive un modèle, ou une base
// pas encore migrée, ne doit jamais empêcher l'envoi d'un email.
//
// Les variables sont substituées comme {{nomVariable}} dans le sujet et le
// HTML. Par défaut chaque valeur est échappée (sécurité : les données
// injectées viennent souvent d'un client - nom, message...). Les clés
// listées dans `rawKeys` sont insérées telles quelles : réservées aux
// fragments HTML déjà construits par notre propre code (ex: une liste de
// passagers), jamais à du texte saisi directement par un utilisateur.

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// Réservation et passagers lus par les emails de repli (quand aucun modèle
// n'est configuré dans email_templates).
export interface FallbackEmailBooking {
  id: string;
  customer_name: string;
  start_date: string;
  end_date: string | null;
  total_price: number;
  currency: string;
  guests?: number;
  external_ref?: string | null;
  service_name?: string;
  location?: string;
}

export interface FallbackEmailPassenger {
  first_name: string;
  last_name: string;
  document_type?: string | null;
  document_number?: string | null;
}

export interface RenderedEmail {
  subject: string;
  html: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function substitute(template: string, vars: Record<string, string>, rawKeys: string[]): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key) => {
    if (!(key in vars)) return match;
    const value = vars[key] ?? "";
    return rawKeys.includes(key) ? value : escapeHtml(value);
  });
}

// Un seul modèle actif par clé : si un admin en laisse plusieurs actifs par
// erreur pour le même type, on prend le plus récemment modifié plutôt que
// d'échouer ou de choisir au hasard.
export async function renderEmailTemplate(
  supabase: SupabaseClient,
  key: string,
  vars: Record<string, string>,
  rawKeys: string[] = []
): Promise<RenderedEmail | null> {
  try {
    const { data, error } = await supabase
      .from("email_templates")
      .select("subject, html_content")
      .eq("type", key)
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;

    return {
      subject: substitute(data.subject, vars, rawKeys),
      html: substitute(data.html_content, vars, rawKeys),
    };
  } catch {
    // Table absente, erreur réseau, etc. : l'appelant retombe sur son HTML par défaut.
    return null;
  }
}

export { escapeHtml };
