import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { BossizCountry } from "@/components/bossiz/BossizSiteLayout";

export interface BossizMicrositeContent {
  tagline: string;
  hero: {
    eyebrow: string;
    titleLine1: string;
    titleLine2: string;
    subtitle: string;
    stats: {
      clients: { value: string; label: string };
      partners: { value: string; label: string };
      availability: { value: string; label: string };
    };
  };
  philosophy: string;
  about: {
    title: string;
    description: string;
    values: {
      trust: { title: string; text: string };
      availability: { title: string; text: string };
      excellence: { title: string; text: string };
    };
    cta: string;
  };
  services: {
    eyebrow: string;
    title: string;
    subtitle: string;
  };
  testimonialsTitle: string;
  contactCta: {
    title: string;
    button: string;
  };
  contact: {
    phone?: string;
    phoneHref?: string;
    email: string;
    address: string;
  };
  plans: {
    monthlyLabel: string;
    shortStayLabel: string;
    recommendedLabel: string;
    title: string;
    subtitle: string;
  };
  servicesList: Array<{
    id: string;
    icon: string;
    title: string;
    description: string;
    features: string[];
  }>;
  additionalServicesList: Array<{
    id: string;
    icon: string;
    title: string;
    items: string[];
  }>;
  monthlyPlansList: Array<{
    name: string;
    detail: string;
    featured: boolean;
  }>;
  shortStayPlansList: Array<{
    name: string;
    detail: string;
  }>;
  testimonialsList: Array<{
    name: string;
    role: string;
    content: string;
    location: string;
  }>;
}

const configKeyFor = (country: BossizCountry) => `bossiz_${country}_content`;

export const useBossizMicrositeContent = (country: BossizCountry) => {
  const [content, setContent] = useState<BossizMicrositeContent | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchContent = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("site_config")
        .select("config_value")
        .eq("config_key", configKeyFor(country))
        .maybeSingle();

      if (error) throw error;
      setContent((data?.config_value as unknown as BossizMicrositeContent) ?? null);
    } catch (error) {
      console.error("Error fetching Bossiz microsite content:", error);
    } finally {
      setLoading(false);
    }
  }, [country]);

  const updateContent = useCallback(async (updates: BossizMicrositeContent) => {
    try {
      const { error } = await supabase
        .from("site_config")
        .update({ config_value: updates as any })
        .eq("config_key", configKeyFor(country));

      if (error) throw error;
      setContent(updates);
      toast({ title: "Succès", description: "Contenu mis à jour" });
    } catch (error: any) {
      console.error("Error updating Bossiz microsite content:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour le contenu",
        variant: "destructive",
      });
    }
  }, [country, toast]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  return { content, loading, updateContent, refetch: fetchContent };
};
