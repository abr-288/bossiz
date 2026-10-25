import { useQuery } from "@tanstack/react-query";
import { Building2, CalendarDays, Megaphone, Newspaper, Sparkles, Tag, type LucideIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

// Actualités Bossiz (/actualites), gérées dans /admin/actualites. Le texte
// suit le format de la page Culture : voir parseArticle() dans lib/culture.

export type NewsPost = Tables<"news_posts">;
export type NewsCategory = "annonce" | "nouveaute" | "partenaire" | "offre" | "evenement" | "presse";

export const NEWS_CATEGORIES: { value: NewsCategory; label: string; icon: LucideIcon }[] = [
  { value: "annonce", label: "Annonces", icon: Megaphone },
  { value: "nouveaute", label: "Nouveautés", icon: Sparkles },
  { value: "partenaire", label: "Partenaires", icon: Building2 },
  { value: "offre", label: "Offres", icon: Tag },
  { value: "evenement", label: "Événements", icon: CalendarDays },
  { value: "presse", label: "Presse", icon: Newspaper },
];

export const newsCategory = (value: string) => NEWS_CATEGORIES.find((c) => c.value === value) ?? NEWS_CATEGORIES[0];

export const newsPostPath = (post: Pick<NewsPost, "slug">) => `/actualites/${post.slug}`;

export interface NewsPageSettings {
  title: string;
  subtitle: string;
}

export const DEFAULT_NEWS_PAGE: NewsPageSettings = {
  title: "Actualités",
  subtitle: "Toute l'actualité Bossiz+ : nouveautés, partenaires, offres et événements.",
};

export const NEWS_POSTS_QUERY_KEY = ["news_posts"] as const;
export const NEWS_PAGE_QUERY_KEY = ["site_config", "news_page"] as const;

// Un article est visible par le public s'il est publié et que sa date est
// atteinte (même règle que la policy RLS) ; l'admin voit aussi le reste.
export const isNewsPostLive = (post: Pick<NewsPost, "published" | "published_at">, now = new Date()) =>
  post.published && new Date(post.published_at) <= now;

// Bouton d'action : chemin interne ou adresse https uniquement.
export const isSafeNewsLink = (url: string) => /^\/(?!\/)/.test(url) || /^https:\/\//.test(url);

export function formatNewsDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export function useNewsPosts() {
  return useQuery({
    queryKey: NEWS_POSTS_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news_posts")
        .select("*")
        .order("pinned", { ascending: false })
        .order("published_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60_000,
  });
}

export function useNewsPage() {
  return useQuery({
    queryKey: NEWS_PAGE_QUERY_KEY,
    queryFn: async (): Promise<NewsPageSettings> => {
      const { data } = await supabase
        .from("site_config")
        .select("config_value")
        .eq("config_key", "news_page")
        .maybeSingle();
      const v = (data?.config_value ?? {}) as Partial<NewsPageSettings>;
      return {
        title: typeof v.title === "string" && v.title.trim() ? v.title : DEFAULT_NEWS_PAGE.title,
        subtitle: typeof v.subtitle === "string" ? v.subtitle : DEFAULT_NEWS_PAGE.subtitle,
      };
    },
    staleTime: 5 * 60_000,
  });
}
