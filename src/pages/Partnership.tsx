import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { LazyImage } from "@/components/ui/lazy-image";
import {
  Handshake,
  Hotel,
  UtensilsCrossed,
  Compass,
  Hammer,
  Car,
  Sparkles,
  Check,
  FileText,
  Search,
  Rocket,
  LayoutGrid,
  Percent,
  Clock,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import bannerTours from "@/assets/banner-tours.jpg";

interface PartnershipType {
  id: string;
  icon: typeof Hotel;
  title: string;
  tagline: string;
  facts: string[];
  conditions: string[];
  ctaLabel: string;
  ctaTo: string;
  highlight?: string;
}

const partnershipTypes: PartnershipType[] = [
  {
    id: "hotels",
    icon: Hotel,
    title: "Hôtels & hébergements",
    tagline: "Chambres, résidences, villas",
    facts: ["Gratuit", "Commission 10%"],
    conditions: [
      "Inscription gratuite, sans engagement",
      "Vos tarifs restent les vôtres : aucune commission n'est ajoutée à l'affichage pour le client",
      "Commission de 10% prélevée sur chaque réservation confirmée",
      "Espace de gestion autonome (offres, disponibilités) une fois la candidature validée",
    ],
    ctaLabel: "Devenir partenaire hôtel",
    ctaTo: "/devenir-partenaire?type=hotel",
  },
  {
    id: "restaurants",
    icon: UtensilsCrossed,
    title: "Restaurants",
    tagline: "Réservation de table en ligne",
    facts: ["Gratuit", "Commission 10%"],
    conditions: [
      "Inscription gratuite, sans engagement",
      "Commission de 10% calculée sur chaque réservation confirmée, sur la base de votre prix moyen par personne",
      "Gérez votre menu et vos disponibilités depuis votre espace agence",
    ],
    ctaLabel: "Devenir partenaire restaurant",
    ctaTo: "/devenir-partenaire?type=restaurant",
  },
  {
    id: "activities",
    icon: Compass,
    title: "Activités & tours",
    tagline: "Excursions, visites guidées",
    facts: ["Gratuit", "Commission 10%"],
    conditions: [
      "Inscription gratuite, sans engagement",
      "Commission de 10% sur chaque réservation",
      "Visibilité dans les résultats Activités & Tours",
    ],
    ctaLabel: "Devenir partenaire activité",
    ctaTo: "/devenir-partenaire?type=activity",
  },
  {
    id: "artisans",
    icon: Hammer,
    title: "Artisans & guides",
    tagline: "Créations & savoir-faire local",
    facts: ["Gratuit", "Commission 10%"],
    conditions: [
      "Inscription gratuite, sans engagement",
      "Commission de 10% sur les commandes que vous confirmez, calculée sur le prix affiché de la création",
      "Fiche dédiée avec photos et description",
    ],
    ctaLabel: "Devenir partenaire artisan",
    ctaTo: "/devenir-partenaire?type=artisan",
  },
  {
    id: "wellness",
    icon: Sparkles,
    title: "Bien-être & Beauté",
    tagline: "Spa, coiffure, institut, yoga",
    facts: ["Gratuit", "Commission 10%"],
    conditions: [
      "Inscription gratuite, sans engagement",
      "Commission de 10% calculée sur chaque rendez-vous confirmé, sur la base du prix de la prestation choisie",
      "Gérez vos prestations, tarifs, horaires et créneaux depuis votre espace agence",
    ],
    ctaLabel: "Devenir partenaire bien-être",
    ctaTo: "/devenir-partenaire?type=wellness",
  },
  {
    id: "cars",
    icon: Car,
    title: "Location de voitures",
    tagline: "Découverte, Pro ou Flotte",
    facts: ["Dès 0 XOF/mois", "Commission 5 à 12%"],
    conditions: [
      "3 forfaits : Découverte (gratuit), Pro (25 000 XOF/mois) et Flotte (60 000 XOF/mois)",
      "Commission dégressive selon le forfait : 12% → 8% → 5%",
      "Mise en avant, support prioritaire et badge vérifié selon le forfait choisi",
    ],
    ctaLabel: "Devenir partenaire voiture",
    ctaTo: "/devenir-partenaire?type=cars",
    highlight: "Forfaits payants",
  },
];

const PartnershipCard = ({ type, index }: { type: PartnershipType; index: number }) => {
  const Icon = type.icon;
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Card className="flex flex-col h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/40">
        <CardContent className="p-5 flex flex-col flex-1">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="w-11 h-11 flex-shrink-0 bg-primary/10 rounded-xl flex items-center justify-center">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            {type.highlight && (
              <Badge variant="secondary" className="flex-shrink-0 text-xs">
                {type.highlight}
              </Badge>
            )}
          </div>

          <h3 className="font-bold text-base mb-0.5">{type.title}</h3>
          <p className="text-sm text-muted-foreground mb-3">{type.tagline}</p>

          <div className="flex flex-wrap gap-1.5 mb-4">
            {type.facts.map((fact) => (
              <span
                key={fact}
                className="text-xs font-medium px-2 py-1 rounded-full bg-muted text-muted-foreground"
              >
                {fact}
              </span>
            ))}
          </div>

          <Collapsible open={open} onOpenChange={setOpen} className="mb-4">
            <CollapsibleTrigger className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              Voir les conditions
              <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", open && "rotate-180")} />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <ul className="space-y-1.5 mt-3">
                {type.conditions.map((condition) => (
                  <li key={condition} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    <Check className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                    <span>{condition}</span>
                  </li>
                ))}
              </ul>
            </CollapsibleContent>
          </Collapsible>

          <Button asChild className="w-full mt-auto">
            <Link to={type.ctaTo}>{type.ctaLabel}</Link>
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const steps = [
  {
    icon: FileText,
    title: "Envoyez votre candidature",
    description: "Choisissez votre type de partenariat et remplissez le formulaire en quelques minutes.",
  },
  {
    icon: Search,
    title: "Étude de votre dossier",
    description: "Notre équipe étudie chaque candidature manuellement avant toute activation.",
  },
  {
    icon: Rocket,
    title: "Activation de votre espace",
    description: "Une fois validé, vous gérez vos offres, tarifs et disponibilités en toute autonomie.",
  },
];

const Partnership = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col pt-16">
      <Navbar />

      {/* Hero */}
      <section className="relative py-16 md:py-20 bg-primary overflow-hidden">
        <LazyImage
          src={bannerTours}
          alt="Devenir partenaire B-Reserve"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-primary/70" />
        <div className="relative z-10 container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 text-white/90 text-sm font-medium mb-3">
            <Handshake className="w-4 h-4" />
            Espace partenaires
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tighter drop-shadow-lg">
            Tous nos partenariats
          </h1>
          <p className="text-lg md:text-xl text-white/95 max-w-2xl mx-auto font-medium mb-8">
            Hôtels, restaurants, activités, artisans ou location de voitures : choisissez votre catégorie,
            découvrez les conditions et inscrivez-vous en quelques minutes.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-white/90 text-sm font-medium">
            <span className="flex items-center gap-2">
              <LayoutGrid className="w-4 h-4 text-gold" />
              6 catégories de partenariat
            </span>
            <span className="flex items-center gap-2">
              <Percent className="w-4 h-4 text-gold" />
              Commission dès 5%
            </span>
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gold" />
              Réponse sous quelques jours
            </span>
          </div>
        </div>
      </section>

      <main className="flex-1 container mx-auto px-4 py-12 md:py-16">
        {/* Partnership types */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-16">
          {partnershipTypes.map((type, index) => (
            <PartnershipCard key={type.id} type={type} index={index} />
          ))}
        </div>

        {/* How it works */}
        <div className="mb-16">
          <h2 className="text-2xl font-black text-foreground mb-10 text-center">Comment ça marche</h2>
          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-6 max-w-4xl mx-auto">
            <div className="hidden md:block absolute top-7 left-[16.5%] right-[16.5%] h-px bg-border" />
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="relative text-center px-4">
                  <div className="relative w-14 h-14 mx-auto mb-4 bg-background border-2 border-primary/20 rounded-2xl flex items-center justify-center">
                    <Icon className="w-7 h-7 text-primary" />
                    <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold flex items-center justify-center">
                      {index + 1}
                    </span>
                  </div>
                  <h3 className="font-bold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center max-w-xl mx-auto">
          <p className="text-sm text-muted-foreground mb-2">
            Vous proposez un autre type de service touristique ?
          </p>
          <Button asChild variant="outline" size="lg">
            <Link to="/devenir-partenaire">Envoyer une candidature générale</Link>
          </Button>
          <p className="text-sm text-muted-foreground mt-6">
            Déjà partenaire ?{" "}
            <Link to="/agency" className="text-primary font-medium hover:underline">
              Accédez à votre espace agence
            </Link>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Partnership;
