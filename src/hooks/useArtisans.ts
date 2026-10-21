import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import type { ArtisanProduct } from "@/components/artisans/ArtisanOrderDialog";

export type Artisan = Omit<Tables<"artisans">, "products"> & { products: ArtisanProduct[] };

// La colonne products (JSON) contient la liste des créations de l'artisan.
export const toArtisan = (row: Tables<"artisans">): Artisan => ({
  ...row,
  products: Array.isArray(row.products) ? (row.products as unknown as ArtisanProduct[]) : [],
});
import { useLocalizedRows } from "@/lib/translatableContent";

export const useArtisans = () => {
  const [artisans, setArtisans] = useState<Artisan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchArtisans = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from("artisans")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;
      setArtisans((data || []).map(toArtisan));
      setError(null);
    } catch (err) {
      console.error("Error fetching artisans:", err);
      setError(err instanceof Error ? err.message : "Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArtisans();
  }, [fetchArtisans]);

  const localized = useLocalizedRows(artisans);
  return { artisans: localized, loading, error, refetch: fetchArtisans };
};
