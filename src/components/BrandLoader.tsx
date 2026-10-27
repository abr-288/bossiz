// Logo Conciergerie Bossiz animé (cubes qui tombent puis ondulent).
// Les styles .loader-container / .bz-* sont dans index.html, pour que le même
// écran s'affiche avant le chargement de React et pendant celui des pages.
import { continuesBootScreen } from "@/lib/bootScreen";

const CUBES = [
  ["B", "bz-blue"],
  ["O", "bz-green"],
  ["S", "bz-orange"],
  ["S", "bz-blue"],
  ["i", "bz-green"],
  ["Z", "bz-orange"],
] as const;

const BrandLoader = () => (
  <div
    className={`loader-container${continuesBootScreen() ? " bz-still" : ""}`}
    role="status"
    aria-label="Chargement — Conciergerie Bossiz"
  >
    <div className="bz-word" aria-hidden="true">
      {CUBES.map(([letter, color], i) => (
        <span key={i} className={`bz-cube ${color}`}>
          {letter}
        </span>
      ))}
    </div>
    <div className="bz-sub" aria-hidden="true">
      Conciergerie
    </div>
  </div>
);

export default BrandLoader;
