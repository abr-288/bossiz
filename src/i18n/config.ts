import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import fr from './locales/fr.json';
import en from './locales/en.json';
import zh from './locales/zh.json';

// Fonction pour détecter la langue du navigateur
const detectBrowserLanguage = (): string => {
  const browserLang = navigator.language || navigator.languages?.[0] || 'fr';
  const langCode = browserLang.split('-')[0].toLowerCase();
  
  // Vérifier si la langue détectée est supportée
  const supportedLanguages = ['fr', 'en', 'zh'];
  return supportedLanguages.includes(langCode) ? langCode : 'fr';
};

// Récupérer la langue: localStorage (choix explicite de l'utilisateur) >
// navigateur > défaut. On ne persiste PAS la détection navigateur dans
// localStorage : ça permet à applyDefaultLanguage() de savoir si
// l'utilisateur a fait un choix explicite ou non, et donc d'appliquer la
// langue par défaut configurée en admin tant qu'aucun choix n'a été fait.
const getInitialLanguage = (): string => {
  const storedLang = localStorage.getItem('language');
  if (storedLang) return storedLang;
  return detectBrowserLanguage();
};

// Applique la langue par défaut définie dans la configuration admin
// (site_config.locale.defaultLanguage) si l'utilisateur n'a jamais fait de
// choix explicite via le sélecteur de langue.
export const applyDefaultLanguage = (defaultLanguage: string) => {
  if (localStorage.getItem('language')) return; // choix explicite déjà fait
  if (!defaultLanguage || defaultLanguage === i18n.language) return;
  i18n.changeLanguage(defaultLanguage);
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: fr },
      en: { translation: en },
      zh: { translation: zh }
    },
    lng: getInitialLanguage(),
    fallbackLng: 'fr',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
