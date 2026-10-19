import type { TFunction } from "i18next";

// Les véhicules (API et partenaires) arrivent avec un vocabulaire français
// (« Automatique », « Essence », « Berline »…) qui sert aussi de valeur de
// filtre. On ne traduit que l'affichage : la valeur reste inchangée.
const CAR_VOCABULARY: Record<string, string> = {
  automatique: "automatic",
  manuelle: "manual",
  essence: "petrol",
  diesel: "diesel",
  hybride: "hybrid",
  électrique: "electric",
  electrique: "electric",
  mini: "mini",
  économique: "economy",
  economique: "economy",
  compacte: "compact",
  berline: "sedan",
  monospace: "minivan",
  luxe: "luxury",
  "luxe / premium": "luxury",
  "suv / 4x4": "suv",
  suv: "suv",
};

export const carLabel = (t: TFunction, value: string | null | undefined): string => {
  if (!value) return "";
  const key = CAR_VOCABULARY[value.trim().toLowerCase()];
  return key ? t(`ux.car.${key}`) : value;
};
