import i18n from "@/i18n/config";

const locale = () => (i18n.language === "en" ? "en-GB" : i18n.language === "zh" ? "zh-CN" : "fr-FR");

export const formatAmount = (amount: number | null | undefined) =>
  `${Math.round(Number(amount ?? 0)).toLocaleString(locale())} FCFA`;

export const formatRate = (rate: number | null | undefined) =>
  `${Number(rate ?? 0).toLocaleString(locale(), { maximumFractionDigits: 2 })} %`;

// Date seule (AAAA-MM-JJ) ou horodatage ISO.
export const formatDate = (value: string | null | undefined, withTime = false) => {
  if (!value) return "—";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00`) : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(locale(), {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
};

export const formatMonth = (isoMonthStart: string) =>
  new Date(`${isoMonthStart}T00:00:00`).toLocaleDateString(locale(), { month: "long", year: "numeric" });
