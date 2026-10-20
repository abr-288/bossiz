/**
 * Message d'une erreur attrapée dans un `catch` : Error, erreur Supabase
 * (objet avec `message`) ou valeur quelconque. Renvoie undefined quand il n'y
 * a pas de message, pour garder le repli `getErrorMessage(e) || "…"`.
 */
export function getErrorMessage(error: unknown): string | undefined {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  return undefined;
}
