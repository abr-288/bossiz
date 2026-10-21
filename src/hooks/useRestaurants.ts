import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

/** Horaires d'ouverture par jour (colonne JSON opening_hours). */
export type OpeningHours = Record<string, { open: string; close: string; closed?: boolean }>;

export type Restaurant = Omit<Tables<"restaurants">, "opening_hours"> & { opening_hours: OpeningHours };

export const toRestaurant = (row: Tables<"restaurants">): Restaurant => ({
  ...row,
  opening_hours: (row.opening_hours ?? {}) as unknown as OpeningHours,
});
import { useLocalizedRows } from "@/lib/translatableContent";

export const useRestaurants = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRestaurants = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from("restaurants")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;
      setRestaurants((data || []).map(toRestaurant));
      setError(null);
    } catch (err) {
      console.error("Error fetching restaurants:", err);
      setError(err instanceof Error ? err.message : "Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  const localized = useLocalizedRows(restaurants);
  return { restaurants: localized, loading, error, refetch: fetchRestaurants };
};
