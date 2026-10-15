// Masque les numéros de carte bancaire (13 à 19 chiffres collés, ou par
// groupes de 4 ; un numéro précédé de « + » est un téléphone) dans un texte
// saisi par un client, avant de l'envoyer à l'IA ou au support. Les mots de
// passe et codes OTP ne sont pas détectables de façon fiable : le prompt de
// l'assistante demande de ne jamais les répéter.
// Même règle que src/lib/sensitiveText.ts.
const CARD_NUMBER = /(?<![+\d])(?:\d{13,19}|\d{4}(?:[ -]\d{4}){2,3}(?:[ -]\d{1,3})?|\d{4}[ -]\d{6}[ -]\d{5})(?!\d)/g;

export function maskCardNumbers(text: string): string {
  return text.replace(CARD_NUMBER, "[numéro de carte masqué]");
}
