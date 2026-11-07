import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";

// Remontée des erreurs JavaScript vers la table app_errors (voir migration
// 20261103000000_monitoring.sql). La fonction health-check prévient l'équipe
// par e-mail quand une nouvelle erreur apparaît ; le détail est dans
// /admin/monitoring.
//
// Volontairement léger : pas de service tiers, au plus MAX_PER_SESSION envois
// par onglet, une même erreur n'est envoyée qu'une fois par onglet, et le bruit
// connu (extensions de navigateur, ResizeObserver, coupures réseau) est ignoré.

const MAX_PER_SESSION = 15;
const sent = new Set<string>();
let count = 0;

const IGNORED = [
  /ResizeObserver loop/i,
  /^Script error\.?$/i,
  /Non-Error promise rejection captured/i,
  /AbortError/i,
  /Load failed$/i, // Safari : requête annulée en quittant la page
  /NetworkError when attempting to fetch/i,
  /Failed to fetch$/i,
  /cancelled|annulé/i,
];

const FROM_EXTENSION = /(chrome|moz|safari(-web)?)-extension:\/\//i;

function toMessageAndStack(error: unknown): { message: string; stack?: string } {
  if (error instanceof Error) return { message: `${error.name}: ${error.message}`, stack: error.stack };
  if (typeof error === "string") return { message: error };
  try {
    return { message: JSON.stringify(error).slice(0, 500) };
  } catch {
    return { message: String(error) };
  }
}

export function reportError(error: unknown, context?: string): void {
  try {
    if (import.meta.env.DEV || import.meta.env.MODE === "test") return;
    const { message, stack } = toMessageAndStack(error);
    if (!message || IGNORED.some((re) => re.test(message))) return;
    if (stack && FROM_EXTENSION.test(stack)) return;

    const key = `${message}|${(stack ?? "").split("\n")[1] ?? ""}`;
    if (sent.has(key) || count >= MAX_PER_SESSION) return;
    sent.add(key);
    count += 1;

    const fullMessage = context ? `${message} (${context})` : message;
    // RPC absente des types générés : appel non typé (en gardant le `this` du client).
    const client = supabase as unknown as {
      rpc: (fn: string, args: Record<string, unknown>) => PromiseLike<unknown>;
    };
    void client
      .rpc("log_client_error", {
        p_source: Capacitor.isNativePlatform() ? "app" : "web",
        p_message: fullMessage.slice(0, 1000),
        p_stack: stack?.slice(0, 4000) ?? null,
        p_url: window.location.pathname + window.location.search,
        p_release: import.meta.env.VITE_APP_VERSION ?? null,
        p_user_agent: navigator.userAgent.slice(0, 300),
      })
      .then(
        () => undefined,
        () => undefined,
      );
  } catch {
    // Le signalement d'erreur ne doit jamais provoquer d'erreur lui-même.
  }
}

export function initErrorReporting(): void {
  window.addEventListener("error", (event) => {
    // Erreurs de chargement de ressources (images…) : ignorées, trop bruyantes.
    if (!(event instanceof ErrorEvent)) return;
    if (event.filename && FROM_EXTENSION.test(event.filename)) return;
    reportError(event.error ?? event.message);
  });
  window.addEventListener("unhandledrejection", (event) => {
    reportError(event.reason, "promesse non gérée");
  });
}
