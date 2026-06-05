// Point d'entrée principal de l'application React
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n/config";

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
