// Hook pour la recherche de locations de voitures
// Gère la recherche et la réservation de véhicules via Supabase
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// Interface pour les paramètres de recherche de location de voiture
export interface CarRentalParams {
  pickupLocation: string; // Lieu de récupération du véhicule
  dropoffLocation?: string; // Lieu de dépôt du véhicule (optionnel)
  pickupDate: string; // Date de récupération (format ISO)
  dropoffDate: string; // Date de dépôt (format ISO)
}

// Hook personnalisé pour gérer les locations de voitures
export const useCarRental = () => {
  const [loading, setLoading] = useState(false); // État de chargement
  const [error, setError] = useState<string | null>(null); // Erreur de recherche

  // Fonction pour rechercher des locations de voitures
  const searchCarRentals = async (params: CarRentalParams) => {
    setLoading(true);
    setError(null);

    try {
      // Appel de la fonction Supabase pour rechercher les locations
      const { data, error: functionError } = await supabase.functions.invoke('car-rental', {
        body: params
      });

      if (functionError) {
        console.error('Car rental API error:', functionError);
        setError('Service de recherche temporairement indisponible');
        return { success: false, error: functionError.message };
      }
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(errorMessage);
      console.error('Car rental search error:', err);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return { searchCarRentals, loading, error };
};
