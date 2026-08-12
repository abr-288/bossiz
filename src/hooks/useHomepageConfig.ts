import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface HomepageFeature {
  id: string;
  icon: string;
  title: string;
  description: string;
  color?: string;
}

export interface HomepageDestination {
  id: string;
  name: string;
  location: string;
  description: string;
  price: number;
  rating: number;
  reviews: number;
  image: string;
  category: string;
  amenities: string[];
  highlights: string[];
}

export interface HomepageSection {
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
  visible: boolean;
  order: number;
}

export interface HomepageConfig {
  features: HomepageFeature[];
  destinations: HomepageDestination[];
  sections: {
    hero: HomepageSection;
    features: HomepageSection;
    destinations: HomepageSection;
    seasonal: HomepageSection;
    testimonials: HomepageSection;
    specialOffers: HomepageSection;
    aiAdvisor: HomepageSection;
    bossizPortal: HomepageSection;
  };
}

const DEFAULT_HOMEPAGE_CONFIG: HomepageConfig = {
  features: [
    {
      id: 'secure-booking',
      icon: 'Shield',
      title: 'Réservation Sécurisée',
      description: 'Réservez en toute confiance avec notre système de paiement sécurisé et notre protection des données.',
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'best-prices',
      icon: 'Award',
      title: 'Meilleurs Prix Garantis',
      description: 'Trouvez les meilleures offres sur les vols, hôtels et locations de voitures.',
      color: 'from-green-500 to-green-600'
    },
    {
      id: 'support-247',
      icon: 'Headphones',
      title: 'Support 24/7',
      description: 'Notre équipe d\'assistance est disponible à tout moment pour vous aider.',
      color: 'from-orange-500 to-orange-600'
    }
  ],
  destinations: [],
  sections: {
    hero: {
      id: 'hero',
      title: 'Hero Section',
      subtitle: 'Section principale avec recherche',
      visible: true,
      order: 1
    },
    features: {
      id: 'features',
      title: 'Features Section',
      subtitle: 'Section des fonctionnalités principales',
      visible: true,
      order: 2
    },
    destinations: {
      id: 'destinations',
      title: 'Popular Destinations',
      subtitle: 'Section des destinations populaires',
      visible: true,
      order: 3
    },
    seasonal: {
      id: 'seasonal',
      title: 'Seasonal Suggestions',
      subtitle: 'Section des suggestions saisonnières',
      visible: true,
      order: 4
    },
    testimonials: {
      id: 'testimonials',
      title: 'Testimonials',
      subtitle: 'Section des témoignages clients',
      visible: true,
      order: 5
    },
    specialOffers: {
      id: 'special-offers',
      title: 'Special Offers',
      subtitle: 'Section des offres spéciales',
      visible: true,
      order: 6
    },
    aiAdvisor: {
      id: 'ai-advisor',
      title: 'AI Travel Advisor',
      subtitle: 'Section du conseiller voyage IA',
      visible: true,
      order: 7
    },
    bossizPortal: {
      id: 'bossiz-portal',
      title: 'Bossiz Portal',
      subtitle: 'Section du portail Bossiz',
      visible: true,
      order: 8
    }
  }
};

export const useHomepageConfig = () => {
  const [config, setConfig] = useState<HomepageConfig>(DEFAULT_HOMEPAGE_CONFIG);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchConfig = useCallback(async () => {
    try {
      // Récupérer la configuration des features
      const { data: featuresData, error: featuresError } = await supabase
        .from("homepage_features")
        .select("*")
        .order('order_num', { ascending: true });

      if (featuresError) throw featuresError;

      // Récupérer la configuration des sections
      const { data: sectionsData, error: sectionsError } = await supabase
        .from("homepage_sections")
        .select("*")
        .order('order_num', { ascending: true });

      if (sectionsError) throw sectionsError;

      const newConfig = { ...DEFAULT_HOMEPAGE_CONFIG };

      // Mettre à jour les features
      if (featuresData && featuresData.length > 0) {
        newConfig.features = featuresData.map(feature => ({
          id: feature.id,
          icon: feature.icon,
          title: feature.title,
          description: feature.description,
          color: feature.color
        }));
      }

      // Mettre à jour les sections
      if (sectionsData && sectionsData.length > 0) {
        sectionsData.forEach(section => {
          if (section.id in newConfig.sections) {
            newConfig.sections[section.id as keyof typeof newConfig.sections] = {
              id: section.id,
              title: section.title,
              subtitle: section.subtitle || '',
              visible: section.visible,
              order: section.order_num
            };
          }
        });
      }

      setConfig(newConfig);
    } catch (error) {
      console.error("Error fetching homepage config:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateFeature = useCallback(async (featureId: string, updates: Partial<HomepageFeature>) => {
    try {
      const { error } = await supabase
        .from("homepage_features")
        .update(updates)
        .eq("id", featureId);

      if (error) throw error;

      setConfig(prev => ({
        ...prev,
        features: prev.features.map(feature => 
          feature.id === featureId ? { ...feature, ...updates } : feature
        )
      }));

      toast({
        title: "Succès",
        description: "Fonctionnalité mise à jour",
      });
    } catch (error: any) {
      console.error("Error updating feature:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour la fonctionnalité",
        variant: "destructive",
      });
    }
  }, [toast]);

  const updateSection = useCallback(async (sectionId: string, updates: Partial<HomepageSection>) => {
    try {
      const { error } = await supabase
        .from("homepage_sections")
        .update(updates)
        .eq("id", sectionId);

      if (error) throw error;

      setConfig(prev => ({
        ...prev,
        sections: {
          ...prev.sections,
          [sectionId]: {
            ...prev.sections[sectionId as keyof typeof prev.sections],
            ...updates
          }
        }
      }));

      toast({
        title: "Succès",
        description: "Section mise à jour",
      });
    } catch (error: any) {
      console.error("Error updating section:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour la section",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  return { 
    config, 
    loading, 
    updateFeature, 
    updateSection, 
    refetch: fetchConfig 
  };
};
