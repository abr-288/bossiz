import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Fn = Database["public"]["Functions"];

// Fiche notée (public.reviews.target_type) et prestation notée (source_type).
export type ReviewTargetType = "service" | "restaurant" | "wellness" | "artisan" | "activity" | "stay";
export type ReviewSourceType = "booking" | "restaurant_reservation" | "wellness_booking" | "artisan_order";

export type ReviewableItem = Fn["my_reviewable_items"]["Returns"][number];
export type PublicReview = Fn["public_reviews"]["Returns"][number];

export interface ReviewSummary {
  count: number;
  average: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}

export function parseReviewSummary(value: unknown): ReviewSummary {
  const v = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  const d = (v.distribution && typeof v.distribution === "object" ? v.distribution : {}) as Record<string, unknown>;
  const n = (x: unknown) => Number(x ?? 0) || 0;
  return {
    count: n(v.count),
    average: n(v.average),
    distribution: { 1: n(d["1"]), 2: n(d["2"]), 3: n(d["3"]), 4: n(d["4"]), 5: n(d["5"]) },
  };
}

export const reviewItemKey = (sourceType: string, sourceId: string) => `${sourceType}:${sourceId}`;

// Prestations du client connecté qui peuvent être notées (effectuées) et
// celles déjà notées (reviewed). Vide pour un visiteur.
export function useMyReviewableItems(enabled = true) {
  return useQuery({
    queryKey: ["my-reviewable-items"],
    enabled,
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return [] as ReviewableItem[];
      const [{ data, error }, { data: promptEnabled }] = await Promise.all([
        supabase.rpc("my_reviewable_items"),
        supabase.rpc("review_prompt_enabled"),
      ]);
      if (error) throw error;
      // Invitations désactivées (Admin > Configuration) : rien à proposer.
      return promptEnabled === false ? [] : (data ?? []);
    },
    staleTime: 60_000,
  });
}

export function useRefreshReviewableItems() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["my-reviewable-items"] });
}

export async function submitReview(sourceType: string, sourceId: string, rating: number, comment: string) {
  return supabase.rpc("submit_review", {
    p_source_type: sourceType,
    p_source_id: sourceId,
    p_rating: rating,
    p_comment: comment.trim() || null,
  });
}

export function usePublicReviews(targetType: ReviewTargetType, targetId: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: ["public-reviews", targetType, targetId],
    enabled: enabled && !!targetId,
    queryFn: async () => {
      const [list, summary] = await Promise.all([
        supabase.rpc("public_reviews", { p_target_type: targetType, p_target_id: targetId!, p_limit: 50 }),
        supabase.rpc("public_review_summary", { p_target_type: targetType, p_target_id: targetId! }),
      ]);
      if (list.error) throw list.error;
      if (summary.error) throw summary.error;
      return { reviews: list.data ?? [], summary: parseReviewSummary(summary.data) };
    },
    staleTime: 5 * 60_000,
  });
}
