// Point d'entrée principal de l'application React
import React from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import "./index.css";
import "./i18n/config";

// Une île de code (route lazy-loaded) référencée par un onglet resté ouvert
// depuis avant un déploiement n'existe plus une fois le build suivant publié
// (rsync --delete supprime les anciens fichiers hashés) -> Vite émet cet
// événement au lieu de planter silencieusement. Un simple rechargement va
// chercher le nouvel index.html/manifeste et résout le problème. Protégé par
// un flag sessionStorage pour ne pas boucler si le déploiement est vraiment
// cassé ; le flag est levé après un démarrage stable pour permettre un futur
// rechargement si un nouveau déploiement survient plus tard dans le même onglet.
window.addEventListener('vite:preloadError', () => {
  const key = 'vite-preload-reload-attempted';
  if (!sessionStorage.getItem(key)) {
    sessionStorage.setItem(key, '1');
    window.location.reload();
  }
});
setTimeout(() => sessionStorage.removeItem('vite-preload-reload-attempted'), 10000);

// Enregistrement du service worker pour la PWA (Progressive Web App).
// registerSW (registerType: 'autoUpdate') recharge automatiquement la page
// dès qu'une nouvelle version est activée -> chaque client reçoit la mise à
// jour sans action manuelle. Le navigateur ne vérifie de lui-même que sur
// certaines navigations ; on force une vérification périodique et au retour
// sur l'onglet pour que la mise à jour soit détectée rapidement après un
// déploiement, même sur un onglet resté ouvert longtemps.
if ('serviceWorker' in navigator) {
  registerSW({
    immediate: true,
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;
      setInterval(() => registration.update(), 60 * 60 * 1000);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') registration.update();
      });
    },
    onRegisterError(error) {
      console.log('SW registration failed:', error);
    }
  });
}

// Rendu de l'application React dans l'élément root du DOM
// React.StrictMode active des vérifications supplémentaires en développement
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
