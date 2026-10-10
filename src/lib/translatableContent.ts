import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";

/**
 * Contenus saisis en français dans l'admin / l'espace partenaire, traduits
 * automatiquement par l'Edge Function translate-content (colonne
 * `translations`). Garder synchronisé avec
 * supabase/functions/_shared/translatableFields.ts.
 */
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

export type TranslatedValue = string | string[];
export interface ContentTranslations {
  en?: Record<string, TranslatedValue>;
  zh?: Record<string, TranslatedValue>;
  src?: Record<string, string>;
  manual?: { en?: string[]; zh?: string[] };
}

const isFilled = (v: unknown): v is TranslatedValue =>
  (typeof v === "string" && v.trim() !== "") || (Array.isArray(v) && v.length > 0);

/**
 * Remplace les champs d'une ligne par leur traduction dans `lang`.
 * Français, langue inconnue ou traduction absente : la ligne est rendue telle quelle.
 */
export function localizeRow<T>(row: T, lang: string): T {
  const short = lang.slice(0, 2);
  if (short === "fr" || !row || typeof row !== "object") return row;
  const translations = (row as { translations?: ContentTranslations }).translations;
  const values = translations?.[short as "en" | "zh"];
  if (!values) return row;
  const out: Record<string, unknown> = { ...(row as Record<string, unknown>) };
  for (const [field, value] of Object.entries(values)) {
    if (isFilled(value) && field in out) out[field] = value;
  }
  return out as T;
}

/** Version React : se met à jour quand la langue change. */
export function useLocalizedRows<T>(rows: T[]): T[] {
  const { i18n } = useTranslation();
  return useMemo(() => rows.map((row) => localizeRow(row, i18n.language)), [rows, i18n.language]);
}

/**
 * Demande la traduction des contenus nouveaux ou modifiés (sans attendre).
 * La fonction ne traduit que ce qui a changé : l'appel est gratuit sinon.
 */
export function requestContentTranslation(table?: string) {
  return supabase.functions
    .invoke("translate-content", { body: table ? { table } : {} })
    .then(({ data, error }) => (error ? { translated: 0, pending: 0, errors: [error.message] } : data))
    .catch(() => ({ translated: 0, pending: 0, errors: ["network"] }));
}

/**
 * Pendant qu'un admin ou un partenaire travaille dans son espace, traduit en
 * arrière-plan ce qui vient d'être enregistré : au chargement, toutes les
 * 2 minutes et au retour sur l'onglet. Rien à ajouter dans les formulaires.
 */
export function useBackgroundTranslation(enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    let running = false;
    const run = () => {
      if (running || document.visibilityState !== "visible") return;
      running = true;
      requestContentTranslation().finally(() => {
        running = false;
      });
    };
    run();
    const timer = window.setInterval(run, 2 * 60 * 1000);
    document.addEventListener("visibilitychange", run);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", run);
    };
  }, [enabled]);
}
