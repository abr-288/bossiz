import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface BossizSiteConfig {
  id: string;
  title: string;
  subtitle: string;
  tagline: string;
  description: string;
  location: string;
  image: string;
  features: string[];
  color: string;
  bgColor: string;
  borderColor: string;
  stats: Array<{
    value: string;
    label: string;
    icon: string;
  }>;
  contact: {
    phone: string;
    email: string;
    address: string;
  };
  highlights: string[];
  route: string;
}

export interface BossizGlobalConfig {
  hero: {
    title: string;
    subtitle: string;
    description: string;
  };
  services: Array<{
    id: string;
    title: string;
    description: string;
    features: string[];
    color: string;
    image: string;
  }>;
  companyValues: Array<{
    id: string;
    title: string;
    description: string;
    color: string;
    icon: string;
  }>;
  globalStats: Array<{
    value: string;
    label: string;
    description: string;
    icon: string;
  }>;
}

const DEFAULT_BOSSIZ_SITES: BossizSiteConfig[] = [
  {
    id: 'cote-d-ivoire',
    title: 'Bossiz Côte d\'Ivoire',
    subtitle: 'Excellence en Conciergerie',
    tagline: 'L\'élégance ivoirienne au service de l\'excellence',
    description: 'Découvrez une expérience de conciergerie unique en Côte d\'Ivoire, où tradition et modernité se rencontrent pour offrir des services d\'exception.',
    location: 'Abidjan, Yamoussoukro, San Pedro',
    image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    features: [
      'Voyages & Tourisme Premium',
      'Immobilier de Luxe',
      'Transport VIP & Jets Privés',
      'Événements Corporatifs',
      'Services Personnalisés',
      'Assistance 24/7',
      'Gastronomie & Bien-être',
      'Shopping Privé'
    ],
    color: 'from-orange-600 to-red-600',
    bgColor: 'from-orange-50 via-white to-red-50',
    borderColor: 'border-orange-200',
    stats: [
      { value: '15+', label: 'Années d\'Excellence', icon: 'Award' },
      { value: '5000+', label: 'Clients Satisfaits', icon: 'Users' },
      { value: '1000+', label: 'Partenaires Premium', icon: 'Globe' },
      { value: '98%', label: 'Satisfaction', icon: 'Star' }
    ],
    contact: {
      phone: '+225 XX XX XX XX',
      email: 'ci@bossiz.com',
      address: 'Abidjan, Plateau - Tour BOSSIZ'
    },
    highlights: [
      'Expertise locale approfondie',
      'Réseau exclusif de partenaires',
      'Services sur-mesure',
      'Discrétion absolue'
    ],
    route: '/bossiz-conciergerie-ci'
  },
  {
    id: 'senegal',
    title: 'Bossiz Sénégal',
    subtitle: 'Conciergerie d\'Exception',
    tagline: 'La tradition sénégalaise au service du luxe',
    description: 'Vivez une expérience de conciergerie d\'exception au Sénégal, alliant savoir-faire local et standards internationaux pour des services inégalés.',
    location: 'Dakar, Thiès, Saint-Louis',
    image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    features: [
      'Voyages d\'Affaires',
      'Gestion Immobilière',
      'Transport Premium',
      'Organisation d\'Événements',
      'Services aux Entreprises',
      'Conciergerie Digitale',
      'Bien-être & Loisirs',
      'Shopping Premium'
    ],
    color: 'from-green-600 to-blue-600',
    bgColor: 'from-green-50 via-white to-blue-50',
    borderColor: 'border-green-200',
    stats: [
      { value: '10+', label: 'Années d\'Expertise', icon: 'Award' },
      { value: '3000+', label: 'Clients Satisfaits', icon: 'Users' },
      { value: '800+', label: 'Partenaires Premium', icon: 'Globe' },
      { value: '97%', label: 'Satisfaction', icon: 'Star' }
    ],
    contact: {
      phone: '+221 XX XX XX XX',
      email: 'sn@bossiz.com',
      address: 'Dakar, Plateau - Centre BOSSIZ'
    },
    highlights: [
      'Innovation technologique',
      'Approche client personnalisée',
      'Services intégrés',
      'Excellence opérationnelle'
    ],
    route: '/bossiz-conciergerie-sn'
  }
];

const DEFAULT_GLOBAL_CONFIG: BossizGlobalConfig = {
  hero: {
    title: 'BOSSIZ Group',
    subtitle: 'Votre Portail Conciergerie',
    description: 'L\'excellence de la conciergerie premium en Afrique de l\'Ouest'
  },
  services: [
    {
      id: 'voyage',
      title: 'Voyage & Tourisme',
      description: 'Billetterie premium, hébergements de luxe, circuits exclusifs',
      features: ['Jets privés', 'Hôtels 5*', 'Circuits VIP', 'Assistance voyage'],
      color: 'from-blue-500 to-blue-600',
      image: 'https://images.unsplash.com/photo-1436777815745-23d67422a4c3?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
    },
    {
      id: 'immobilier',
      title: 'Immobilier & Patrimoine',
      description: 'Gestion, location, conseil patrimonial et transactions premium',
      features: ['Villas de luxe', 'Gestion locative', 'Conseil patrimonial', 'Investissements'],
      color: 'from-green-500 to-green-600',
      image: 'https://images.unsplash.com/photo-1560448214-04b83dc834d1?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
    },
    {
      id: 'transport',
      title: 'Transport Premium',
      description: 'Véhicules de luxe, jets privés, yachts et services VIP',
      features: ['Voitures luxe', 'Jets privés', 'Yachts', 'Chauffeurs VIP'],
      color: 'from-purple-500 to-purple-600',
      image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
    },
    {
      id: 'evenements',
      title: 'Événements & Célébrations',
      description: 'Wedding planners, événements corporatifs, galas et soirées prestige',
      features: ['Mariages', 'Événements corporatifs', 'Galas', 'Soirées privées'],
      color: 'from-orange-500 to-orange-600',
      image: 'https://images.unsplash.com/photo-1464207687429-7505649dae38?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
    },
    {
      id: 'hotellerie',
      title: 'Hôtellerie & Restauration',
      description: 'Réservations exclusives, chefs privés, expériences gastronomiques',
      features: ['Réservations VIP', 'Chefs privés', 'Gastronomie', 'Dégustations'],
      color: 'from-pink-500 to-pink-600',
      image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
    },
    {
      id: 'services-vip',
      title: 'Services VIP',
      description: 'Assistance personnalisée 24/7, gestionnaire dédié, services sur-mesure',
      features: ['Assistant personnel', 'Manager dédié', 'Services 24/7', 'Conciergerie privée'],
      color: 'from-yellow-500 to-yellow-600',
      image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
    }
  ],
  companyValues: [
    {
      id: 'confiance',
      title: 'Confiance Absolue',
      description: 'Discrétion et confidentialité garanties pour tous nos clients.',
      color: 'from-blue-500 to-blue-600',
      icon: 'Shield'
    },
    {
      id: 'excellence',
      title: 'Excellence',
      description: 'Standards d\'excellence dans chaque service rendu.',
      color: 'from-orange-500 to-orange-600',
      icon: 'Star'
    },
    {
      id: 'innovation',
      title: 'Innovation',
      description: 'Solutions modernes et technologies de pointe.',
      color: 'from-purple-500 to-purple-600',
      icon: 'Zap'
    },
    {
      id: 'passion',
      title: 'Passion',
      description: 'Un engagement passionné pour votre satisfaction.',
      color: 'from-pink-500 to-pink-600',
      icon: 'Heart'
    }
  ],
  globalStats: [
    { value: '25+', label: 'Années d\'Excellence', description: 'Expertise reconnue', icon: 'Award' },
    { value: '8000+', label: 'Clients Satisfaits', description: 'Confiance établie', icon: 'Users' },
    { value: '1800+', label: 'Partenaires Premium', description: 'Réseau mondial', icon: 'Globe' },
    { value: '24/7', label: 'Support Premium', description: 'Disponibilité totale', icon: 'Headphones' }
  ]
};

export const useBossizConfig = () => {
  const [sites, setSites] = useState<BossizSiteConfig[]>(DEFAULT_BOSSIZ_SITES);
  const [globalConfig, setGlobalConfig] = useState<BossizGlobalConfig>(DEFAULT_GLOBAL_CONFIG);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchConfig = useCallback(async () => {
    try {
      // Récupérer la configuration des sites
      const { data: sitesData, error: sitesError } = await supabase
        .from("bossiz_sites_config")
        .select("*")
        .order('created_at', { ascending: false });

      if (sitesError) throw sitesError;

      // Récupérer la configuration globale
      const { data: globalData, error: globalError } = await supabase
        .from("bossiz_global_config")
        .select("*")
        .single();

      if (globalError && globalError.code !== 'PGRST116') throw globalError;

      if (sitesData && sitesData.length > 0) {
        setSites(sitesData);
      }

      if (globalData) {
        setGlobalConfig(globalData.config);
      }
    } catch (error) {
      console.error("Error fetching Bossiz config:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSiteConfig = useCallback(async (siteId: string, updates: Partial<BossizSiteConfig>) => {
    try {
      const { error } = await supabase
        .from("bossiz_sites_config")
        .update(updates)
        .eq("id", siteId);

      if (error) throw error;

      setSites(prev => prev.map(site => 
        site.id === siteId ? { ...site, ...updates } : site
      ));

      toast({
        title: "Succès",
        description: "Configuration du site mise à jour",
      });
    } catch (error: any) {
      console.error("Error updating site config:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour la configuration",
        variant: "destructive",
      });
    }
  }, [toast]);

  const updateGlobalConfig = useCallback(async (updates: Partial<BossizGlobalConfig>) => {
    try {
      const { error } = await supabase
        .from("bossiz_global_config")
        .update({ config: { ...globalConfig, ...updates } })
        .eq("id", "main");

      if (error) throw error;

      setGlobalConfig(prev => ({ ...prev, ...updates }));

      toast({
        title: "Succès",
        description: "Configuration globale mise à jour",
      });
    } catch (error: any) {
      console.error("Error updating global config:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour la configuration",
        variant: "destructive",
      });
    }
  }, [globalConfig, toast]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  return {
    sites,
    globalConfig,
    loading,
    updateSiteConfig,
    updateGlobalConfig,
    refetch: fetchConfig
  };
};
