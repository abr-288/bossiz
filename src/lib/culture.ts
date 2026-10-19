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

// Photo de la galerie d'un article, toujours créditée (licence libre).
export interface CulturePhoto {
  url: string;
  caption?: string;
  credit?: string;
  sourceUrl?: string;
}

export interface CultureEntry {
  id: string;
  slug: string | null;
  title: string;
  category: CultureCategory;
  location: string | null;
  period: string | null;
  summary: string;
  content: string | null;
  image_url: string | null;
  image_caption: string | null;
  image_credit: string | null;
  image_source_url: string | null;
  gallery: CulturePhoto[] | null;
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

// Adresse de page lisible à partir d'un titre (« Le Zaouli » -> « le-zaouli »).
export function slugify(title: string): string {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’]/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export const cultureEntryPath = (entry: Pick<CultureEntry, "slug">) => (entry.slug ? `/culture/${entry.slug}` : null);

// Contenu d'article : paragraphes séparés par une ligne vide, intertitres
// « ## », listes « - ».
export type ArticleBlock =
  | { kind: "heading"; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "paragraph"; text: string };

export function parseArticle(content: string | null): ArticleBlock[] {
  if (!content) return [];
  return content
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .flatMap((block): ArticleBlock[] => {
      if (block.startsWith("## ")) {
        const [heading, ...rest] = block.split("\n");
        const blocks: ArticleBlock[] = [{ kind: "heading", text: heading.slice(3).trim() }];
        if (rest.length) blocks.push(...parseArticle(rest.join("\n")));
        return blocks;
      }
      const lines = block.split("\n");
      if (lines.every((line) => line.trim().startsWith("- "))) {
        return [{ kind: "list", items: lines.map((line) => line.trim().slice(2)) }];
      }
      return [{ kind: "paragraph", text: block }];
    });
}

export function readingMinutes(entry: Pick<CultureEntry, "summary" | "content">): number {
  const words = `${entry.summary} ${entry.content ?? ""}`.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

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
      return (data || []).map((row) => ({
        ...row,
        gallery: Array.isArray(row.gallery) ? (row.gallery as unknown as CulturePhoto[]) : [],
      })) as CultureEntry[];
    },
    staleTime: 5 * 60_000,
  });
}
