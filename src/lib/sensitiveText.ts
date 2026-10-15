// Numéro de carte bancaire : 13 à 19 chiffres collés, ou par groupes de 4
// (4-6-5 pour American Express). Un numéro précédé de « + » est un téléphone.
// Même règle que supabase/functions/_shared/sensitive.ts.
const CARD_NUMBER = /(?<![+\d])(?:\d{13,19}|\d{4}(?:[ -]\d{4}){2,3}(?:[ -]\d{1,3})?|\d{4}[ -]\d{6}[ -]\d{5})(?!\d)/g;

/** Masque les numéros de carte avant de garder ou d'envoyer un message du chat. */
export function maskCardNumbers(text: string, replacement = "[numéro de carte masqué]"): string {
  return text.replace(CARD_NUMBER, replacement);
}
