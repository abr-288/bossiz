export const JEKO_PAYOUT_METHODS = [
  { value: "wave", label: "Wave" },
  { value: "orange_money", label: "Orange Money" },
  { value: "mtn", label: "MTN Mobile Money" },
  { value: "moov", label: "Moov Money" },
  { value: "djamo", label: "DJAMO" },
  { value: "bank", label: "Virement bancaire (RIB)" },
] as const;

export type JekoPayoutMethod = (typeof JEKO_PAYOUT_METHODS)[number]["value"];

export const JEKO_PAYOUT_METHOD_LABELS: Record<JekoPayoutMethod, string> =
  Object.fromEntries(JEKO_PAYOUT_METHODS.map(({ value, label }) => [value, label])) as Record<JekoPayoutMethod, string>;
