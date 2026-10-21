import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Destination {
  id: string;
  name: string;
  location: string;
  country: string;
  image: string;
  images: string[];
  rating: number;
  reviews: number;
  price: number;
  currency: string;
  description: string;
  category: string;
  amenities: string[];
  highlights: string[];
  temperature?: number;
  bestTime?: string;
  trending?: boolean;
  source?: string;
}

interface UseDestinationsOptions {
  query?: string;
  category?: string;
  enabled?: boolean;
}

export const useDestinations = (options: UseDestinationsOptions = {}) => {
  const { query, category, enabled = true } = options;

  return useQuery({
    queryKey: ["destinations", query, category],
    queryFn: async () => {
      console.log("Fetching destinations from TripAdvisor API...");

      const params = new URLSearchParams();
      if (query) params.append("query", query);
      if (category && category !== "all") params.append("category", category);

      const { data, error } = await supabase.functions.invoke("search-destinations", {
        headers: {},
      });

      // If params exist, call with URL params
      if (params.toString()) {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/search-destinations?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
              "Content-Type": "application/json",
            },
          },
        );

        if (!response.ok) {
          throw new Error("Failed to fetch destinations");
        }

        const result = await response.json();
        console.log("Destinations received:", result.total, "from", result.source);
        return result.destinations as Destination[];
      }

      if (error) {
        console.error("Error fetching destinations:", error);
        throw error;
      }

      console.log("Destinations received:", data?.total, "from", data?.source);
      return data.destinations as Destination[];
    },
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes
    retry: 2,
    enabled,
  });
};

export const useDestinationSearch = (searchQuery: string) => {
  return useDestinations({ query: searchQuery, enabled: searchQuery.length >= 2 });
};

export const useDestinationsByCategory = (category: string) => {
  return useDestinations({ category });
};
