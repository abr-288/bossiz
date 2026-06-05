// Hook pour la recherche de vols
// Utilise React Query pour la gestion de l'état et le cache
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Interface pour les paramètres de recherche de vols
export interface FlightSearchParams {
  origin: string; // Code de l'aéroport de départ
  destination: string; // Code de l'aéroport d'arrivée
  departureDate: string; // Date de départ (format ISO)
  returnDate?: string; // Date de retour pour les vols aller-retour
  adults: number; // Nombre d'adultes
  children?: number; // Nombre d'enfants
  infants?: number; // Nombre de nourrissons
  travelClass?: string; // Classe de voyage (economy, business, first)
}

// Interface pour les informations de vol
export interface Flight {
  id: string; // Identifiant unique du vol
  airline: string; // Nom de la compagnie aérienne
  flightNumber: string; // Numéro de vol
  departure: {
    airport: string; // Code de l'aéroport de départ
    time: string; // Heure de départ
    date: string; // Date de départ
  };
  arrival: {
    airport: string; // Code de l'aéroport d'arrivée
    time: string; // Heure d'arrivée
    date: string; // Date d'arrivée
  };
  duration: string; // Durée du vol
  price: number; // Prix du vol
  currency: string; // Devise du prix
  availableSeats: number; // Nombre de sièges disponibles
  class: string; // Classe du vol
}

// Hook personnalisé pour rechercher des vols
// Appelle la fonction Supabase "search-flights" pour effectuer la recherche
export const useFlightSearch = (params: FlightSearchParams | null) => {
  return useQuery({
    queryKey: ["flights", params], // Clé de cache pour React Query
    queryFn: async () => {
      if (!params) return null;

      // Appel de la fonction Supabase pour rechercher les vols
      const { data, error } = await supabase.functions.invoke("search-flights", {
        body: params,
      });

      if (error) throw error;
      return data?.flights as Flight[] || [];
    },
    enabled: !!params, // N'exécuter la requête que si les paramètres sont fournis
  });
};
