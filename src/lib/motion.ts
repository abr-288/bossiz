/**
 * Durées et courbe d'animation communes (en secondes, pour framer-motion).
 * Reprennent --dur-fast / --dur-base / --dur-slow et --ease-standard de index.css.
 */
export const MOTION = {
  fast: 0.12,
  base: 0.2,
  slow: 0.32,
  ease: [0.2, 0, 0, 1] as [number, number, number, number],
};
