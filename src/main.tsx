// Point d'entrée principal de l'application React
import React from "react";
import { createRoot } from "react-dom/client";
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

// Enregistrement du service worker pour la PWA (Progressive Web App)
// Permet à l'application de fonctionner hors ligne et d'être installable
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((registration) => {
      console.log('SW registered:', registration);
    }).catch((error) => {
      console.log('SW registration failed:', error);
    });
  });
}

// Rendu de l'application React dans l'élément root du DOM
// React.StrictMode active des vérifications supplémentaires en développement
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
