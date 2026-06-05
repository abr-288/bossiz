// Hook pour la recherche d'hôtels
// Utilise React Query pour la gestion de l'état et le cache
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Interface pour les paramètres de recherche d'hôtels
export interface HotelSearchParams {
  destination: string; // Destination de l'hôtel
  checkIn: string; // Date d'arrivée (format ISO)
  checkOut: string; // Date de départ (format ISO)
  guests: number; // Nombre de clients
  rooms?: number; // Nombre de chambres (optionnel)
}

// Interface pour les informations d'hôtel
export interface Hotel {
  id: string; // Identifiant unique de l'hôtel
  name: string; // Nom de l'hôtel
  location: string; // Emplacement de l'hôtel
  rating: number; // Note de l'hôtel
  reviews: number; // Nombre d'avis
  price: number; // Prix par nuit
  currency: string; // Devise du prix
  image_url: string; // URL de l'image de l'hôtel
  amenities: string[]; // Liste des équipements
  description?: string; // Description de l'hôtel (optionnel)
}

// Hook personnalisé pour rechercher des hôtels
// Appelle la fonction Supabase "search-hotels" pour effectuer la recherche
export const useHotelSearch = (params: HotelSearchParams | null) => {
  return useQuery({
    queryKey: ["hotels", params], // Clé de cache pour React Query
    queryFn: async () => {
      if (!params) return null;

      // Appel de la fonction Supabase pour rechercher les hôtels
      const { data, error } = await supabase.functions.invoke("search-hotels", {
        body: params,
      });

      if (error) throw error;
      return data?.hotels as Hotel[] || [];
    },
    enabled: !!params, // N'exécuter la requête que si les paramètres sont fournis
  });
};
