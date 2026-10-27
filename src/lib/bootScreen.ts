// Écran de démarrage d'index.html (logo Conciergerie Bossiz animé).
// React le remplace dès son premier rendu : on attend que l'entrée (cubes qui
// tombent, « Conciergerie » et ses traits) se soit jouée en entier.

// Au-delà, on affiche le site quoi qu'il arrive (onglet en arrière-plan, etc.).
const MAX_WAIT_MS = 2500;
// Fin de l'entrée définie dans index.html (dernier trait : 1 s + 0,5 s).
const INTRO_MS = 1600;

let handedOverAt = -Infinity;

export const bootIntroPlayed = (): Promise<unknown> => {
  const screen = document.querySelector("#root .loader-container");
  if (!screen || document.hidden || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return Promise.resolve();
  }
  const cap = new Promise((resolve) => setTimeout(resolve, MAX_WAIT_MS));
  // getAnimations : iOS 13.4+ ; avant, on se repère au début du chargement.
  if (!screen.getAnimations) {
    return new Promise((resolve) => setTimeout(resolve, Math.max(0, INTRO_MS - performance.now())));
  }
  const intro = screen
    .getAnimations({ subtree: true })
    .filter((a) => a.effect?.getComputedTiming().endTime !== Infinity)
    .map((a) => a.finished);
  return Promise.race([Promise.all(intro).catch(() => undefined), cap]);
};

export const markBootScreenHandedOver = () => {
  handedOverAt = performance.now();
};

// Le premier BrandLoader (chargement de la première page) prend le relais de
// l'écran de démarrage : il ne rejoue pas l'entrée.
export const continuesBootScreen = () => performance.now() - handedOverAt < 1000;
