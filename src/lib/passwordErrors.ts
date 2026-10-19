import type { TFunction } from "i18next";

export type PasswordErrorKind = "same" | "weak" | "session" | "other";

/**
 * Classe une erreur Supabase de mise à jour du mot de passe. Les messages
 * bruts sont en anglais et parfois techniques ; on les remplace par un texte
 * traduit qui dit quoi faire.
 */
export function classifyPasswordError(error: { message?: string; code?: string } | null | undefined): PasswordErrorKind {
  const code = error?.code ?? "";
  const message = error?.message ?? "";
  if (code === "same_password" || /different from the old/i.test(message)) return "same";
  if (code === "weak_password" || /weak|pwned|leaked|at least \d+ characters/i.test(message)) return "weak";
  if (/session|jwt|expired|not.?found|reauthenticat/i.test(message) || code === "session_not_found") return "session";
  return "other";
}

export function passwordErrorMessage(t: TFunction, error: { message?: string; code?: string } | null | undefined): string {
  switch (classifyPasswordError(error)) {
    case "same":
      return t("ux.reset.samePassword");
    case "weak":
      return t("ux.reset.weakPassword");
    case "session":
      return t("ux.reset.sessionExpired");
    default:
      return t("ux.reset.genericError");
  }
}
