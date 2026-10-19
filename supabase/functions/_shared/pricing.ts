// ============================================================
// Shared helper: retail markup
// Third-party search results (hotels, cars, trains) come back at the
// supplier's raw price. Without a markup applied here, before the price is
// ever shown to the customer or signed into an offer, the platform earns
// nothing on these verticals — only flights carry a service fee (see
// supabase/functions/prebook/index.ts SERVICE_FEE_PERCENTAGE).
// ============================================================

export const RETAIL_MARKUP_PERCENTAGE = 0.08; // 8%

export function applyMarkup(supplierPrice: number): number {
  return Math.round(supplierPrice * (1 + RETAIL_MARKUP_PERCENTAGE));
}

// ============================================================
// Shared helper: EUR/USD/... -> XOF conversion
// XOF (FCFA) is the platform's single settlement/charge currency (see
// process-payment, which always charges CinetPay in XOF). Any supplier
// price that arrives in another currency MUST be converted through this
// table before it is used in a real amount calculation - search-flights
// always returns EUR, and prebook's price breakdown was, until this fix,
// treating that EUR number as if it were already XOF: a flight quoted at
// 250 EUR was being charged as 250 XOF (~0.38 EUR), a ~656x undercharge.
// ============================================================

export const EXCHANGE_RATES_TO_XOF: Record<string, number> = {
  XOF: 1,
  FCFA: 1,
  EUR: 655.957,
  USD: 602.123,
  GBP: 785.234,
  CHF: 703.891,
};

export function convertToXOF(amount: number, currency: string): number {
  const rate = EXCHANGE_RATES_TO_XOF[(currency || 'XOF').toUpperCase()] ?? 1;
  return Math.round(amount * rate);
}
