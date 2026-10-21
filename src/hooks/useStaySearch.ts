import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { useLocalizedRows } from "@/lib/translatableContent";

export type Stay = Tables<"stays">;

export const useStaySearch = () => {
  const [stays, setStays] = useState<Stay[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const searchStays = async (filters?: { location?: string; type?: string; minPrice?: number; maxPrice?: number }) => {
    setLoading(true);
    try {
      let query = supabase
        .from("stays")
        .select("*")
        .eq("available", true)
        .order("featured", { ascending: false })
        .order("rating", { ascending: false });

      if (filters?.location) {
        query = query.ilike("location", `%${filters.location}%`);
      }

      if (filters?.type) {
        query = query.eq("type", filters.type);
      }

      if (filters?.minPrice) {
        query = query.gte("price_per_unit", filters.minPrice);
      }

      if (filters?.maxPrice) {
        query = query.lte("price_per_unit", filters.maxPrice);
      }

      const { data, error } = await query;

      if (error) throw error;

      setStays(data || []);
    } catch (error) {
      console.error("Error searching stays:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les séjours",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const localized = useLocalizedRows(stays);
  return {
    stays: localized,
    loading,
    searchStays,
  };
};
