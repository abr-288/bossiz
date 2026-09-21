// Métadonnées SEO par route. L'application est une SPA : sans cela, toutes les
// pages partageaient le titre, la description et la canonique de l'accueil.
// Règle : toute route absente de cette table est "noindex" (admin, agence,
// paiement, compte, 404...), on n'indexe que ce qui est listé ici.

export const SITE_URL = "https://app.bossiz.com";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/logo-bossiz.png`;

export interface RouteSeo {
  title: string;
  description: string;
  /** Chemin canonique si différent du chemin courant (ex: /home -> /). */
  canonical?: string;
}

export const DEFAULT_SEO: RouteSeo = {
  title: "B-Reserve - Réservation de Voyages en Côte d'Ivoire | Vols, Hôtels, Tours",
  description:
    "Réservez vos voyages en Côte d'Ivoire facilement : vols, hôtels, locations de voiture, circuits touristiques, trains et événements. Paiement sécurisé avec CinetPay.",
};

const ROUTES: Record<string, RouteSeo> = {
  "/": DEFAULT_SEO,
  "/home": { ...DEFAULT_SEO, canonical: "/" },
  "/flights": {
    title: "Vols vers et depuis la Côte d'Ivoire | B-Reserve",
    description:
      "Comparez et réservez vos billets d'avion vers Abidjan et au départ de la Côte d'Ivoire. Meilleurs tarifs, paiement sécurisé.",
  },
  "/hotels": {
    title: "Hôtels à Abidjan et en Côte d'Ivoire | B-Reserve",
    description:
      "Trouvez et comparez les hôtels à Abidjan et partout en Côte d'Ivoire. Réservation en ligne auprès de nos partenaires.",
  },
  "/hotels-partenaires": {
    title: "Hôtels partenaires | B-Reserve",
    description:
      "Hôteliers, référencez votre établissement sur B-Reserve et touchez de nouveaux voyageurs en Côte d'Ivoire.",
  },
  "/cars": {
    title: "Location de voiture en Côte d'Ivoire | B-Reserve",
    description:
      "Louez une voiture à Abidjan et en Côte d'Ivoire, avec ou sans chauffeur, auprès de partenaires vérifiés.",
  },
  "/tours": {
    title: "Circuits et guides touristiques en Côte d'Ivoire | B-Reserve",
    description:
      "Réservez des circuits touristiques et des guides locaux pour découvrir la Côte d'Ivoire.",
  },
  "/restaurants": {
    title: "Restaurants à Abidjan : réservez une table | B-Reserve",
    description:
      "Découvrez les restaurants partenaires à Abidjan et réservez votre table en temps réel.",
  },
  "/artisans": {
    title: "Artisans locaux de Côte d'Ivoire | B-Reserve",
    description:
      "Rencontrez les artisans locaux ivoiriens et découvrez leurs créations authentiques.",
  },
  "/bien-etre-beaute": {
    title: "Bien-être et beauté : spas, salons, yoga | B-Reserve",
    description:
      "Spas, instituts de beauté, salons de manucure, barbiers et yoga : réservez vos soins bien-être en Côte d'Ivoire.",
  },
  "/entreprises": {
    title: "Voyages d'affaires pour entreprises | B-Reserve",
    description:
      "Comptes entreprise, facturation centralisée, politique de voyage et validation des déplacements pour vos équipes.",
  },
  "/destinations": {
    title: "Destinations en Côte d'Ivoire | B-Reserve",
    description:
      "Explorez les plus belles destinations de Côte d'Ivoire : Abidjan, Grand-Bassam, Yamoussoukro, Assinie et plus.",
  },
  "/activities": {
    title: "Activités et loisirs en Côte d'Ivoire | B-Reserve",
    description:
      "Réservez des activités, excursions et expériences à vivre en Côte d'Ivoire.",
  },
  "/stays": {
    title: "Séjours en Côte d'Ivoire | B-Reserve",
    description:
      "Séjours et hébergements sélectionnés en Côte d'Ivoire, à réserver en ligne.",
  },
  "/events": {
    title: "Événements en Côte d'Ivoire | B-Reserve",
    description:
      "Concerts, festivals et événements en Côte d'Ivoire : découvrez l'agenda et réservez vos places.",
  },
  "/trains": {
    title: "Billets de train en Côte d'Ivoire | B-Reserve",
    description: "Voyagez en train en Côte d'Ivoire : horaires, tarifs et réservation.",
  },
  "/flight-hotel": {
    title: "Forfaits vol + hôtel | B-Reserve",
    description:
      "Combinez vol et hôtel pour votre voyage en Côte d'Ivoire et voyagez malin.",
  },
  "/partenariat": {
    title: "Devenir partenaire B-Reserve | Hôtels, restaurants, artisans",
    description:
      "Hôtels, restaurants, artisans, guides, spas, loueurs de voitures : rejoignez le réseau de partenaires B-Reserve.",
  },
  "/devenir-partenaire": {
    title: "Déposer une candidature partenaire | B-Reserve",
    description:
      "Remplissez le formulaire pour devenir partenaire B-Reserve et référencer votre activité.",
  },
  "/partenaires/voitures": {
    title: "Partenaires voiture : formules et abonnements | B-Reserve",
    description:
      "Loueurs et chauffeurs : découvrez les formules d'abonnement pour proposer vos véhicules sur B-Reserve.",
  },
  "/bossiz-portal": {
    title: "Bossiz Conciergerie | Portail",
    description: "Accédez aux services de conciergerie Bossiz pour la Côte d'Ivoire et le Sénégal.",
  },
  "/bossiz-conciergerie-ci": {
    title: "Bossiz Conciergerie Côte d'Ivoire",
    description: "Conciergerie de voyage et de vie quotidienne en Côte d'Ivoire : services sur mesure Bossiz.",
  },
  "/bossiz-conciergerie-ci/services": {
    title: "Services Bossiz Conciergerie Côte d'Ivoire",
    description: "Découvrez les services de conciergerie Bossiz en Côte d'Ivoire.",
  },
  "/bossiz-conciergerie-ci/a-propos": {
    title: "À propos de Bossiz Conciergerie Côte d'Ivoire",
    description: "Qui est Bossiz Conciergerie en Côte d'Ivoire : notre équipe et nos engagements.",
  },
  "/bossiz-conciergerie-ci/formules": {
    title: "Formules Bossiz Conciergerie Côte d'Ivoire",
    description: "Comparez les formules d'abonnement Bossiz Conciergerie en Côte d'Ivoire.",
  },
  "/bossiz-conciergerie-sn": {
    title: "Bossiz Conciergerie Sénégal",
    description: "Conciergerie de voyage et de vie quotidienne au Sénégal : services sur mesure Bossiz.",
  },
  "/bossiz-conciergerie-sn/services": {
    title: "Services Bossiz Conciergerie Sénégal",
    description: "Découvrez les services de conciergerie Bossiz au Sénégal.",
  },
  "/bossiz-conciergerie-sn/a-propos": {
    title: "À propos de Bossiz Conciergerie Sénégal",
    description: "Qui est Bossiz Conciergerie au Sénégal : notre équipe et nos engagements.",
  },
  "/bossiz-conciergerie-sn/formules": {
    title: "Formules Bossiz Conciergerie Sénégal",
    description: "Comparez les formules d'abonnement Bossiz Conciergerie au Sénégal.",
  },
  "/help": {
    title: "Centre d'aide | B-Reserve",
    description: "Réponses aux questions fréquentes sur vos réservations, paiements et votre compte B-Reserve.",
  },
  "/support": {
    title: "Support client | B-Reserve",
    description: "Contactez le support B-Reserve et parcourez les guides par thème.",
  },
  "/contact": {
    title: "Contact | B-Reserve",
    description: "Contactez l'équipe B-Reserve par WhatsApp, e-mail ou téléphone.",
  },
  "/install": {
    title: "Installer l'application B-Reserve",
    description: "Installez B-Reserve sur votre téléphone Android ou iPhone en quelques secondes.",
  },
  "/install/android": {
    title: "Installer B-Reserve sur Android",
    description: "Guide d'installation de l'application B-Reserve sur Android.",
  },
  "/install/ios": {
    title: "Installer B-Reserve sur iPhone",
    description: "Guide d'installation de l'application B-Reserve sur iPhone (iOS).",
  },
  "/compatibility": {
    title: "Compatibilité navigateurs et appareils | B-Reserve",
    description: "Navigateurs et appareils compatibles avec B-Reserve.",
  },
  "/privacy": {
    title: "Politique de confidentialité | B-Reserve",
    description: "Comment B-Reserve collecte, utilise et protège vos données personnelles.",
  },
  "/privacy-policy": {
    title: "Politique de confidentialité | B-Reserve",
    description: "Comment B-Reserve collecte, utilise et protège vos données personnelles.",
    canonical: "/privacy",
  },
  "/terms": {
    title: "Conditions générales d'utilisation | B-Reserve",
    description: "Conditions générales d'utilisation des services B-Reserve.",
  },
  "/terms-of-service": {
    title: "Conditions générales d'utilisation | B-Reserve",
    description: "Conditions générales d'utilisation des services B-Reserve.",
    canonical: "/terms",
  },
};

// Pages à paramètre : titre générique, canonique = leur propre URL.
const DYNAMIC: Array<{ prefix: string; seo: RouteSeo }> = [
  {
    prefix: "/destinations/",
    seo: {
      title: "Destination en Côte d'Ivoire | B-Reserve",
      description: "Découvrez cette destination de Côte d'Ivoire : à voir, à faire, où dormir.",
    },
  },
  {
    prefix: "/support/",
    seo: {
      title: "Aide et support | B-Reserve",
      description: "Guides et réponses du support B-Reserve.",
    },
  },
];

export interface ResolvedSeo extends RouteSeo {
  noindex: boolean;
  canonicalUrl: string;
}

export const resolveSeo = (rawPath: string): ResolvedSeo => {
  const path = rawPath.length > 1 ? rawPath.replace(/\/+$/, "") : rawPath;
  const exact = ROUTES[path];
  const dynamic = DYNAMIC.find((d) => path.startsWith(d.prefix));
  const seo = exact ?? dynamic?.seo;

  if (!seo) {
    return { ...DEFAULT_SEO, noindex: true, canonicalUrl: `${SITE_URL}${path}` };
  }
  return { ...seo, noindex: false, canonicalUrl: `${SITE_URL}${seo.canonical ?? path}` };
};
