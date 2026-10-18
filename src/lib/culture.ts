import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Drum, Landmark, Palette, PartyPopper, UtensilsCrossed, type LucideIcon } from "lucide-react";

// Page éditoriale « Culture » (migration 20261017040000) : entrées de
// culture_entries et réglages site_config 'culture_page'.

export const CULTURE_CATEGORIES: { value: CultureCategory; label: string; icon: LucideIcon; gradient: string }[] = [
  { value: "patrimoine", label: "Patrimoine & sites", icon: Landmark, gradient: "from-amber-700 to-orange-500" },
  { value: "festivals", label: "Festivals & fêtes", icon: PartyPopper, gradient: "from-fuchsia-700 to-rose-500" },
  { value: "musees", label: "Musées & galeries", icon: BookOpen, gradient: "from-sky-800 to-cyan-600" },
  { value: "arts", label: "Arts & traditions", icon: Palette, gradient: "from-emerald-800 to-lime-600" },
  { value: "musique_danse", label: "Musique & danse", icon: Drum, gradient: "from-violet-800 to-indigo-500" },
  { value: "gastronomie", label: "Gastronomie", icon: UtensilsCrossed, gradient: "from-red-700 to-amber-500" },
];

export type CultureCategory = "patrimoine" | "festivals" | "musees" | "arts" | "musique_danse" | "gastronomie";

export const cultureCategory = (value: string) =>
  CULTURE_CATEGORIES.find((c) => c.value === value) ?? CULTURE_CATEGORIES[0];

export interface CultureEntry {
  id: string;
  title: string;
  category: CultureCategory;
  location: string | null;
  period: string | null;
  summary: string;
  content: string | null;
  image_url: string | null;
  link_url: string | null;
  featured: boolean;
  published: boolean;
  sort_order: number;
}

export interface CulturePageSettings {
  title: string;
  subtitle: string;
  intro: string;
  heroImage: string;
}

export const DEFAULT_CULTURE_PAGE: CulturePageSettings = {
  title: "La culture ivoirienne",
  subtitle: "Patrimoine, festivals, arts et traditions à découvrir pendant votre séjour",
  intro: "",
  heroImage: "",
};

export const CULTURE_PAGE_QUERY_KEY = ["site_config", "culture_page"] as const;
export const CULTURE_ENTRIES_QUERY_KEY = ["culture_entries"] as const;

export function useCulturePage() {
  return useQuery({
    queryKey: CULTURE_PAGE_QUERY_KEY,
    queryFn: async (): Promise<CulturePageSettings> => {
      const { data, error } = await supabase
        .from("site_config")
        .select("config_value")
        .eq("config_key", "culture_page")
        .maybeSingle();
      if (error) throw error;
      const value = (data?.config_value ?? {}) as Partial<CulturePageSettings>;
      return {
        title: value.title || DEFAULT_CULTURE_PAGE.title,
        subtitle: value.subtitle ?? DEFAULT_CULTURE_PAGE.subtitle,
        intro: value.intro ?? "",
        heroImage: value.heroImage ?? "",
      };
    },
    staleTime: 5 * 60_000,
  });
}

// Entrées publiées pour le public ; l'admin lit tout (RLS).
export function useCultureEntries() {
  return useQuery({
    queryKey: CULTURE_ENTRIES_QUERY_KEY,
    queryFn: async (): Promise<CultureEntry[]> => {
      const { data, error } = await supabase
        .from("culture_entries")
        .select("*")
        .order("sort_order")
        .order("created_at");
      if (error) throw error;
      return (data || []) as CultureEntry[];
    },
    staleTime: 5 * 60_000,
  });
}
