// Retour à la page d'origine après une inscription (lien de confirmation par
// e-mail) ou une connexion Google : ces parcours repassent par l'accueil, le
// paramètre ?redirect= de /auth est donc perdu. La page à retrouver est
// gardée dans le navigateur 24 h, puis reprise par PostAuthRedirect.

const KEY = "bossiz:post-auth-redirect";
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

// Chemin interne uniquement, jamais une URL externe.
export const safeInternalPath = (path: string | null | undefined): string | null =>
  path && path.startsWith("/") && !path.startsWith("//") ? path : null;

export function rememberPostAuthRedirect(path: string | null | undefined) {
  const safe = safeInternalPath(path);
  if (!safe || safe === "/") return;
  try {
    localStorage.setItem(KEY, JSON.stringify({ path: safe, at: Date.now() }));
  } catch {
    // Stockage indisponible (navigation privée) : retour à l'accueil.
  }
}

export function clearPostAuthRedirect() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignoré
  }
}

// Lit et efface la page mémorisée (null si absente ou trop ancienne).
export function takePostAuthRedirect(now = Date.now()): string | null {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return null;
  }
  if (!raw) return null;
  clearPostAuthRedirect();
  try {
    const { path, at } = JSON.parse(raw) as { path?: string; at?: number };
    if (typeof at !== "number" || now - at > MAX_AGE_MS) return null;
    return safeInternalPath(path);
  } catch {
    return null;
  }
}
