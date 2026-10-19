// Champs traduits automatiquement, par table. Garder synchronisé avec
// src/lib/translatableContent.ts (écran « Traductions » de l'admin).
export const TRANSLATABLE_FIELDS: Record<string, string[]> = {
  advertisements: ["title", "description", "link_text"],
  promotions: ["name", "description"],
  subscription_plans: ["name", "subtitle", "description", "price_note", "features"],
  car_partner_plans: ["name", "tagline", "features"],
  homepage_features: ["title", "description"],
  services: ["name", "description"],
  activities: ["name", "description", "duration", "highlights", "included"],
  stays: ["name", "description", "duration", "highlights"],
  restaurants: ["description", "cuisine_type"],
  artisans: ["bio"],
  wellness_services: ["description"],
};

export const TARGET_LANGS = ["en", "zh"] as const;
