import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface SiteConfig {
  branding: {
    siteName: string;
    tagline: string;
    logoLight: string;
    logoDark: string;
    favicon: string;
  };
  contact: {
    email: string;
    phone: string;
    address: string;
    whatsapp: string;
  };
  social: {
    facebook: string;
    instagram: string;
    twitter: string;
    linkedin: string;
    youtube: string;
  };
  hero: {
    title: string;
    subtitle: string;
    ctaText: string;
    slides: Array<{ image: string; title: string }>;
  };
  features: {
    title: string;
    items: Array<{ icon: string; title: string; description: string }>;
  };
  seo: {
    defaultTitle: string;
    defaultDescription: string;
    keywords: string;
  };
  locale: {
    defaultCurrency: string;
    availableCurrencies: string[];
    defaultLanguage: string;
    availableLanguages: string[];
  };
  footer: {
    copyright: string;
    showNewsletter: boolean;
    newsletterTitle: string;
  };
  pricing: {
    showOriginalPrice: boolean;
    discountBadgeColor: string;
    currencyPosition: string;
  };
  booking: {
    minAdvanceHours: number;
    maxGuestsPerBooking: number;
    requirePhoneVerification: boolean;
    autoConfirmBookings: boolean;
  };
}

const DEFAULT_CONFIG: SiteConfig = {
  branding: {
    siteName: "B-Reserve",
    tagline: "Votre partenaire voyage",
    logoLight: "",
    logoDark: "",
    favicon: "/favicon.ico",
  },
  contact: {
    email: "contact@b-reserve.com",
    phone: "+225 00 00 00 00",
    address: "Abidjan, Côte d'Ivoire",
    whatsapp: "+225 00 00 00 00",
  },
  social: {
    facebook: "",
    instagram: "",
    twitter: "",
    linkedin: "",
    youtube: "",
  },
  hero: {
    title: "Voyagez en toute sérénité",
    subtitle: "Réservez vos vols, hôtels et voitures en quelques clics",
    ctaText: "Commencer",
    slides: [],
  },
  features: {
    title: "Pourquoi nous choisir?",
    items: [],
  },
  seo: {
    defaultTitle: "B-Reserve - Réservation de voyages",
    defaultDescription: "Plateforme de réservation de vols, hôtels et voitures",
    keywords: "voyage, vol, hôtel, voiture",
  },
  locale: {
    defaultCurrency: "EUR",
    availableCurrencies: ["EUR", "USD", "XOF"],
    defaultLanguage: "fr",
    availableLanguages: ["fr", "en"],
  },
  footer: {
    copyright: "© 2024 B-Reserve. Tous droits réservés.",
    showNewsletter: true,
    newsletterTitle: "Abonnez-vous",
  },
  pricing: {
    showOriginalPrice: true,
    discountBadgeColor: "red",
    currencyPosition: "after",
  },
  booking: {
    minAdvanceHours: 24,
    maxGuestsPerBooking: 10,
    requirePhoneVerification: false,
    autoConfirmBookings: false,
  },
};

export const useSiteConfig = () => {
  const [config, setConfig] = useState<SiteConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchConfig = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("site_config")
        .select("config_key, config_value");

      if (error) throw error;

      const newConfig = { ...DEFAULT_CONFIG };
      data?.forEach((item) => {
        const key = item.config_key as keyof SiteConfig;
        if (key in newConfig) {
          (newConfig as any)[key] = item.config_value;
        }
      });

      setConfig(newConfig);
    } catch (error) {
      console.error("Error fetching site config:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const updateConfig = async (key: keyof SiteConfig, value: any) => {
    try {
      const { error } = await supabase
        .from("site_config")
        .update({ config_value: value })
        .eq("config_key", key);

      if (error) throw error;

      setConfig((prev) => ({ ...prev, [key]: value }));
      toast({
        title: "Succès",
        description: "Configuration mise à jour",
      });
    } catch (error: any) {
      console.error("Error updating config:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour",
        variant: "destructive",
      });
    }
  };

  return { config, loading, updateConfig, refetch: fetchConfig };
};
