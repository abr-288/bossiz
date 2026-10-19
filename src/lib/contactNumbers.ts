/**
 * Les numéros de démonstration (« +225 00 00 00 00 », « +225 XX XX XX XX »…)
 * ne doivent jamais être montrés aux clients : on ne garde qu'un numéro qui
 * ressemble à un vrai.
 */
export function realPhoneNumber(value?: string | null): string | null {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  if (/x/i.test(value) || digits.length < 8 || /0{6,}/.test(digits)) return null;
  return value.trim();
}

/** Lien WhatsApp (wa.me) pour un numéro réel, sinon null. */
export function whatsAppLink(value?: string | null, text?: string): string | null {
  const phone = realPhoneNumber(value);
  if (!phone) return null;
  const query = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${phone.replace(/\D/g, "")}${query}`;
}
