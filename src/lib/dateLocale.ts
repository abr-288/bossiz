import i18n from "i18next";
import { enUS, fr, zhCN, type Locale } from "date-fns/locale";

// Locale de formatage des dates selon la langue de l'interface.
// Avant, les dates étaient formatées en dur en « fr-FR » quelle que soit la langue.
export const currentLocaleTag = (): string => {
  const lang = i18n.language || "fr";
  if (lang.startsWith("zh")) return "zh-CN";
  if (lang.startsWith("en")) return "en-US";
  return "fr-FR";
};

export const currentDateFnsLocale = (): Locale => {
  const lang = i18n.language || "fr";
  if (lang.startsWith("zh")) return zhCN;
  if (lang.startsWith("en")) return enUS;
  return fr;
};
