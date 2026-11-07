import { Capacitor } from "@capacitor/core";
import { publicOrigin } from "@/lib/publicOrigin";

// Liens entre l'application Android / iOS et le navigateur du téléphone.
//
// Google refuse les connexions dans une WebView, et les pages de paiement
// Jèko sont sur un autre domaine : dans l'app, elles s'ouvrent donc dans le
// navigateur du téléphone. Pour revenir dans l'app :
//   - connexion Google : Supabase redirige vers com.bossizplus.app://auth/callback,
//     que l'app intercepte (AndroidManifest / Info.plist + composant NativeDeepLinks) ;
//   - paiement : Jèko ne propose pas d'adresse de retour ; quand l'utilisateur
//     revient dans l'app, on l'envoie sur la page qui montre le statut.
//
// Prérequis côté Supabase : ajouter « com.bossizplus.app://** » dans
// Authentication > URL Configuration > Redirect URLs.

export const APP_SCHEME = "com.bossizplus.app";
export const NATIVE_AUTH_CALLBACK = `${APP_SCHEME}://auth/callback`;

export const isNativeApp = () => Capacitor.isNativePlatform();

/** Le plugin App (deep links) n'existe que dans les APK construits après son ajout. */
export const canReceiveDeepLinks = () => isNativeApp() && Capacitor.isPluginAvailable("App");

/** Adresse de retour après connexion Google. */
export const oauthRedirectTo = (): string => (canReceiveDeepLinks() ? NATIVE_AUTH_CALLBACK : publicOrigin());

/**
 * Ouvre une page de paiement externe. Dans l'app, elle s'ouvre dans le
 * navigateur du téléphone ; au retour dans l'app, on affiche `returnPath`.
 */
export function openExternalPayment(url: string, returnPath?: string, opts?: { newTab?: boolean }): void {
  if (!isNativeApp()) {
    if (opts?.newTab) window.open(url, "_blank", "noopener");
    else window.location.assign(url);
    return;
  }
  if (returnPath) {
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      document.removeEventListener("visibilitychange", onVisible);
      window.location.assign(returnPath);
    };
    // Laisse le temps au navigateur externe de s'ouvrir avant d'écouter le retour.
    setTimeout(() => document.addEventListener("visibilitychange", onVisible), 1500);
  }
  // Domaine externe : Capacitor l'ouvre dans le navigateur du téléphone.
  window.location.assign(url);
}

export interface ParsedDeepLink {
  kind: "auth" | "path";
  code?: string;
  accessToken?: string;
  refreshToken?: string;
  error?: string;
  path?: string;
}

/** Analyse com.bossizplus.app://auth/callback?code=… ou #access_token=…, ou com.bossizplus.app://chemin. */
export function parseDeepLink(raw: string): ParsedDeepLink | null {
  if (!raw.startsWith(`${APP_SCHEME}://`)) return null;
  const rest = raw.slice(APP_SCHEME.length + 3);
  const [beforeHash, hash = ""] = rest.split("#", 2);
  const [pathPart, query = ""] = beforeHash.split("?", 2);
  const path = `/${pathPart.replace(/^\/+/, "")}`;
  const qs = new URLSearchParams(query);
  const hs = new URLSearchParams(hash);

  if (path === "/auth/callback") {
    return {
      kind: "auth",
      code: qs.get("code") ?? undefined,
      accessToken: hs.get("access_token") ?? undefined,
      refreshToken: hs.get("refresh_token") ?? undefined,
      error: qs.get("error_description") ?? hs.get("error_description") ?? qs.get("error") ?? undefined,
    };
  }
  return { kind: "path", path: query ? `${path}?${query}` : path };
}
