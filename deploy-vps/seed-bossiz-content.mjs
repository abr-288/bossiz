import { createClient } from '@supabase/supabase-js';

const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const ciContent = {
  tagline: "L'art de vivre ivoirien, réinventé",
  hero: {
    eyebrow: "Conciergerie Bossiz · Côte d'Ivoire",
    titleLine1: "Votre quotidien,",
    titleLine2: "notre exigence",
    subtitle: "De Cocody à Marcory, une équipe dédiée s'occupe de tout — voyages, logement, événements — pour que vous n'ayez qu'à profiter.",
    stats: {
      clients: { value: "800+", label: "Clients accompagnés" },
      partners: { value: "80+", label: "Partenaires à Abidjan" },
      availability: { value: "24/7", label: "Disponibilité" },
    },
  },
  philosophy: "Nous croyons que le vrai luxe, c'est de ne plus avoir à s'inquiéter de rien.",
  about: {
    title: "Une conciergerie pensée pour Abidjan",
    description: "Fondée par une équipe locale, Conciergerie Bossiz combine une connaissance fine du terrain ivoirien et des standards de service internationaux.",
    values: {
      trust: { title: "Confiance", text: "Chaque demande est traitée avec la plus grande discrétion, par une équipe que vous connaissez et qui vous connaît." },
      availability: { title: "Disponibilité", text: "Une ligne dédiée joignable à toute heure, sept jours sur sept, pour l'imprévu comme pour le planifié." },
      excellence: { title: "Excellence", text: "Un réseau de partenaires triés sur le volet à Abidjan et dans les grandes villes de Côte d'Ivoire." },
    },
    cta: "Découvrir nos formules",
  },
  services: {
    eyebrow: "Nos services",
    title: "Un accompagnement complet",
    subtitle: "Chaque formule Conciergerie Bossiz s'adapte à votre rythme de vie à Abidjan.",
  },
  testimonialsTitle: "Ils nous font confiance à Abidjan",
  contactCta: {
    title: "Parlons de votre prochain projet",
    button: "Nous contacter",
  },
  contact: {
    phone: "+225 07 01 67 60 09",
    phoneHref: "tel:+2250701676009",
    email: "contact@bossiz.com",
    address: "Cocody Riviera, Abidjan",
  },
  plans: {
    monthlyLabel: "Formules mensuelles",
    shortStayLabel: "Séjours courts",
    recommendedLabel: "Recommandée",
    title: "Choisissez votre formule",
    subtitle: "Des formules pensées pour chaque rythme de vie à Abidjan, sans engagement caché.",
  },
  servicesList: [
    {
      id: "voyage",
      icon: "Plane",
      title: "Voyage & Séjours",
      description: "Organisation complète de vos déplacements : vols, hébergements et itinéraires sur-mesure.",
      features: ["Réservations vols & hôtels", "Itinéraires personnalisés", "Accueil VIP aéroport"],
    },
    {
      id: "immobilier",
      icon: "Building",
      title: "Immobilier",
      description: "Recherche, gestion locative et suivi de vos biens immobiliers à Abidjan en toute sérénité.",
      features: ["Recherche de biens", "Gestion locative", "Suivi administratif"],
    },
    {
      id: "transport",
      icon: "Car",
      title: "Transport Privé",
      description: "Chauffeurs privés, véhicules de prestige et transferts disponibles à toute heure à Abidjan.",
      features: ["Chauffeur privé", "Véhicules de prestige", "Transferts 24/7"],
    },
    {
      id: "evenementiel",
      icon: "Calendar",
      title: "Événementiel",
      description: "Conception et organisation d'événements privés ou professionnels d'exception.",
      features: ["Événements privés", "Séminaires & réceptions", "Coordination complète"],
    },
  ],
  additionalServicesList: [
    { id: "personnel", icon: "Users", title: "Assistant Personnel", items: ["Gestion d'agenda", "Courses & démarches", "Assistance dédiée"] },
    { id: "quotidien", icon: "Briefcase", title: "Assistance Quotidienne", items: ["Ménage & entretien", "Gestion des factures", "Coordination fournisseurs"] },
    { id: "bien-etre", icon: "Heart", title: "Bien-être", items: ["Spa & massages", "Coach sportif", "Rendez-vous santé"] },
    { id: "loisirs", icon: "Gamepad2", title: "Loisirs", items: ["Réservations culturelles", "Activités sur-mesure", "Accès VIP"] },
    { id: "gastronomie", icon: "Utensils", title: "Gastronomie", items: ["Chef privé", "Réservations restaurants", "Cave à vin sur-mesure"] },
    { id: "shopping", icon: "ShoppingBag", title: "Shopping", items: ["Personal shopper", "Livraisons express", "Accès boutiques privées"] },
  ],
  monthlyPlansList: [
    { name: "Premium", detail: "L'essentiel de la conciergerie pour un quotidien facilité à Abidjan.", featured: false },
    { name: "Privilège", detail: "Un accompagnement étendu avec accès prioritaire à nos services.", featured: true },
    { name: "Excellence", detail: "L'expérience conciergerie ultime, sans aucune limite.", featured: false },
  ],
  shortStayPlansList: [
    { name: "3 Jours", detail: "Idéal pour un court séjour professionnel ou privé à Abidjan." },
    { name: "1 Semaine", detail: "Un accompagnement complet pour un séjour d'une semaine." },
    { name: "1 Mois", detail: "La formule idéale pour un séjour prolongé en toute sérénité." },
  ],
  testimonialsList: [
    { name: "M. Kouadio", role: "Chef d'entreprise", content: "Un service irréprochable, toujours à l'écoute de mes besoins les plus exigeants.", location: "Abidjan" },
    { name: "Mme Touré", role: "Cadre supérieure", content: "La réactivité et la discrétion de l'équipe Bossiz sont exceptionnelles.", location: "Abidjan" },
    { name: "M. Bamba", role: "Investisseur", content: "Grâce à Bossiz, je peux me concentrer sur l'essentiel en toute confiance.", location: "Abidjan" },
  ],
};

const snContent = {
  tagline: "Le Sénégal, en toute sérénité",
  hero: {
    eyebrow: "Bossiz Sénégal",
    titleLine1: "Votre allié",
    titleLine2: "à Dakar",
    subtitle: "Un point de contact unique pour organiser votre séjour, votre logement et vos déplacements, de la Corniche au Plateau.",
    stats: {
      clients: { value: "500+", label: "Clients accompagnés" },
      partners: { value: "60+", label: "Partenaires à Dakar" },
      availability: { value: "24/7", label: "Disponibilité" },
    },
  },
  philosophy: "La meilleure conciergerie est celle qu'on oublie — parce que tout se passe simplement.",
  about: {
    title: "L'excellence à la sénégalaise",
    description: "Bossiz Sénégal s'appuie sur un ancrage local fort à Dakar pour offrir un accompagnement fluide, humain et sur-mesure.",
    values: {
      trust: { title: "Confiance", text: "Un interlocuteur unique et discret, qui suit votre dossier du premier échange jusqu'au bout." },
      availability: { title: "Disponibilité", text: "Une équipe joignable à toute heure pour répondre aux imprévus comme aux demandes planifiées." },
      excellence: { title: "Excellence", text: "Un réseau de partenaires de confiance sélectionnés à Dakar et sur toute la Petite Côte." },
    },
    cta: "Voir nos formules",
  },
  services: {
    eyebrow: "Nos services",
    title: "Tout ce dont vous avez besoin à Dakar",
    subtitle: "Des formules Bossiz Sénégal adaptées à vos séjours, courts ou longs.",
  },
  testimonialsTitle: "Ils nous font confiance à Dakar",
  contactCta: {
    title: "Un projet à Dakar ? Écrivez-nous",
    button: "Nous contacter",
  },
  contact: {
    email: "contact@bossiz.com",
    address: "Dakar, Sénégal",
  },
  plans: {
    monthlyLabel: "Formules mensuelles",
    shortStayLabel: "Séjours courts",
    recommendedLabel: "Recommandée",
    title: "Choisissez votre formule",
    subtitle: "Des formules Bossiz Sénégal sans engagement caché, adaptées à votre séjour à Dakar.",
  },
  servicesList: [
    {
      id: "voyage",
      icon: "Plane",
      title: "Voyage & Séjours",
      description: "Vols, hébergements et itinéraires sur-mesure pour vos déplacements à Dakar et sur la Petite Côte.",
      features: ["Réservations vols & hôtels", "Itinéraires personnalisés", "Accueil VIP aéroport"],
    },
    {
      id: "immobilier",
      icon: "Building",
      title: "Immobilier",
      description: "Recherche, gestion locative et suivi de vos biens immobiliers à Dakar en toute tranquillité.",
      features: ["Recherche de biens", "Gestion locative", "Suivi administratif"],
    },
    {
      id: "transport",
      icon: "Car",
      title: "Transport Privé",
      description: "Chauffeurs privés et véhicules confortables pour vos trajets à Dakar, disponibles à toute heure.",
      features: ["Chauffeur privé", "Véhicules de prestige", "Transferts 24/7"],
    },
    {
      id: "evenementiel",
      icon: "Calendar",
      title: "Événementiel",
      description: "Organisation d'événements privés ou professionnels sur mesure, du Plateau à la Corniche.",
      features: ["Événements privés", "Séminaires & réceptions", "Coordination complète"],
    },
  ],
  additionalServicesList: [
    { id: "personnel", icon: "Users", title: "Assistant Personnel", items: ["Gestion d'agenda", "Courses & démarches", "Assistance dédiée"] },
    { id: "quotidien", icon: "Briefcase", title: "Assistance Quotidienne", items: ["Ménage & entretien", "Gestion des factures", "Coordination fournisseurs"] },
    { id: "bien-etre", icon: "Heart", title: "Bien-être", items: ["Spa & massages", "Coach sportif", "Rendez-vous santé"] },
    { id: "loisirs", icon: "Compass", title: "Loisirs", items: ["Excursions sur la Petite Côte", "Activités sur-mesure", "Accès VIP"] },
    { id: "gastronomie", icon: "Utensils", title: "Gastronomie", items: ["Chef privé", "Réservations restaurants", "Sélection de vins"] },
    { id: "shopping", icon: "ShoppingBag", title: "Shopping", items: ["Personal shopper", "Livraisons express", "Accès boutiques privées"] },
  ],
  monthlyPlansList: [
    { name: "Premium", detail: "L'essentiel de la conciergerie pour un quotidien facilité à Dakar.", featured: false },
    { name: "Privilège", detail: "Un accompagnement étendu avec accès prioritaire à nos services.", featured: true },
    { name: "Excellence", detail: "L'expérience conciergerie ultime, sans aucune limite.", featured: false },
  ],
  shortStayPlansList: [
    { name: "3 Jours", detail: "Idéal pour un court séjour professionnel ou privé à Dakar." },
    { name: "1 Semaine", detail: "Un accompagnement complet pour un séjour d'une semaine." },
    { name: "1 Mois", detail: "La formule idéale pour un séjour prolongé en toute sérénité." },
  ],
  testimonialsList: [
    { name: "M. Diop", role: "Chef d'entreprise", content: "Une équipe d'exception, toujours disponible et d'une grande discrétion.", location: "Dakar" },
    { name: "Mme Fall", role: "Cadre supérieure", content: "Bossiz a transformé mon quotidien à Dakar avec un service impeccable.", location: "Dakar" },
    { name: "M. Samba", role: "Investisseur", content: "Un accompagnement de très haute qualité, à chaque instant.", location: "Dakar" },
  ],
};

async function upsert(key, value) {
  const { data: existing } = await admin.from('site_config').select('id').eq('config_key', key).maybeSingle();
  if (existing) {
    const { error } = await admin.from('site_config').update({ config_value: value }).eq('id', existing.id);
    if (error) throw error;
    console.log(`= updated ${key}`);
  } else {
    const { error } = await admin.from('site_config').insert({
      config_key: key,
      config_value: value,
      category: 'bossiz',
      description: `Contenu éditable du microsite ${key}`,
    });
    if (error) throw error;
    console.log(`+ inserted ${key}`);
  }
}

await upsert('bossiz_ci_content', ciContent);
await upsert('bossiz_sn_content', snContent);
console.log('Done.');
