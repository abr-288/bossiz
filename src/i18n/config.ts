import i18n, { type BackendModule } from "i18next";
import { initReactI18next } from "react-i18next";
import fr from "./locales/fr.json";

// Seul le français (langue par défaut et de secours) est embarqué dans le
// bundle principal. Les autres langues (~220 Ko chacune) sont téléchargées
// à la demande, uniquement par les visiteurs qui les utilisent.
const lazyLocales: Record<string, () => Promise<{ default: Record<string, unknown> }>> = {
  en: () => import("./locales/en.json"),
  zh: () => import("./locales/zh.json"),
};

const lazyLocaleBackend: BackendModule = {
  type: "backend",
  init() {},
  read(language, _namespace, callback) {
    const load = lazyLocales[language];
    if (!load) {
      callback(null, {});
      return;
    }
    load().then(
      (module) => callback(null, module.default),
      (error) => callback(error, false),
    );
  },
};

// Fonction pour détecter la langue du navigateur
const detectBrowserLanguage = (): string => {
  const browserLang = navigator.language || navigator.languages?.[0] || "fr";
  const langCode = browserLang.split("-")[0].toLowerCase();

  // Vérifier si la langue détectée est supportée
  const supportedLanguages = ["fr", "en", "zh"];
  return supportedLanguages.includes(langCode) ? langCode : "fr";
};

// Récupérer la langue: localStorage (choix explicite de l'utilisateur) >
// navigateur > défaut. On ne persiste PAS la détection navigateur dans
// localStorage : ça permet à applyDefaultLanguage() de savoir si
// l'utilisateur a fait un choix explicite ou non, et donc d'appliquer la
// langue par défaut configurée en admin tant qu'aucun choix n'a été fait.
const getInitialLanguage = (): string => {
  const storedLang = localStorage.getItem("language");
  if (storedLang) return storedLang;
  return detectBrowserLanguage();
};

// Applique la langue par défaut définie dans la configuration admin
// (site_config.locale.defaultLanguage) si l'utilisateur n'a jamais fait de
// choix explicite via le sélecteur de langue.
export const applyDefaultLanguage = (defaultLanguage: string) => {
  if (localStorage.getItem("language")) return; // choix explicite déjà fait
  if (!defaultLanguage || defaultLanguage === i18n.language) return;
  i18n.changeLanguage(defaultLanguage);
};

// Résolue quand la langue initiale est prête : main.tsx attend cette
// promesse avant le premier rendu pour éviter un flash de texte en français
// chez un visiteur anglophone ou sinophone.
export const i18nReady = i18n
  .use(lazyLocaleBackend)
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: fr },
    },
    partialBundledLanguages: true,
    lng: getInitialLanguage(),
    fallbackLng: "fr",
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
