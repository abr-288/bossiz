import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LazyImage } from "@/components/ui/lazy-image";
import {
  Plane,
  Hotel,
  Car,
  Home,
  Luggage,
  BedDouble,
  Compass,
  Globe,
  Ticket,
  PartyPopper,
  TrainFront,
  BadgePercent,
  ShieldCheck,
  Headphones,
  Handshake,
  ClipboardCheck,
  Rocket,
  Phone,
  Mail,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";

import shotHome from "@/assets/presentation/shot-home.png";
import shotHotels from "@/assets/presentation/shot-hotels.png";
import shotCars from "@/assets/presentation/shot-cars.png";
import shotFlights from "@/assets/presentation/shot-flights.png";
import shotFlightHotel from "@/assets/presentation/shot-flight-hotel.png";
import shotStays from "@/assets/presentation/shot-stays.png";
import shotTours from "@/assets/presentation/shot-tours.png";
import shotDestinations from "@/assets/presentation/shot-destinations.png";
import shotActivities from "@/assets/presentation/shot-activities.png";
import shotEvents from "@/assets/presentation/shot-events.png";
import shotTrains from "@/assets/presentation/shot-trains.png";
import bannerPresentation from "@/assets/hero-slide-2.jpg";

const modules = [
  {
    id: "accueil",
    icon: Home,
    title: "Accueil",
    route: "/",
    description:
      "Le point d'entrée de la plateforme : un moteur de recherche unique donne accès à tous les services, complété par des offres du moment et des recommandations pour maximiser les conversions dès la première visite.",
    features: [
      "Recherche unifiée pour vols, hôtels, voitures, séjours et trains",
      "Bannières promotionnelles et offres exclusives mises en avant",
      "Suggestions saisonnières selon la période de l'année",
      "Assistant de voyage intelligent pour orienter les visiteurs indécis",
    ],
    src: shotHome,
  },
  {
    id: "vols",
    icon: Plane,
    title: "Vols",
    route: "/flights",
    description:
      "Un moteur de recherche de vols complet, pensé pour transformer une recherche en réservation en quelques étapes seulement.",
    features: [
      "Aller-retour ou aller simple, avec adultes, enfants et bébés",
      "Choix de la classe de voyage (Économique, Affaires, etc.)",
      "Suggestions de destinations populaires au départ d'Abidjan",
      "Comparateur de vols avant la réservation finale",
    ],
    src: shotFlights,
  },
  {
    id: "hotels",
    icon: Hotel,
    title: "Hôtels",
    route: "/hotels",
    description:
      "C'est précisément ici que vos disponibilités et vos tarifs apparaîtront une fois votre candidature de partenaire approuvée — devant des voyageurs qui recherchent activement un hébergement.",
    features: [
      "Filtres par destination, nombre d'étoiles, budget et équipements",
      "Comparaison de plusieurs hôtels côte à côte (jusqu'à 4)",
      "Réservation sécurisée avec prix garanti au moment de la recherche",
      "Vos établissements listés sans commission additionnelle sur votre prix",
    ],
    src: shotHotels,
  },
  {
    id: "vol-hotel",
    icon: Luggage,
    title: "Vol + Hôtel",
    route: "/flight-hotel",
    description:
      "Une formule package qui simplifie la décision du voyageur en combinant vol et hébergement dans une seule réservation — un canal de visibilité supplémentaire pour les hôtels partenaires.",
    features: [
      "Recherche combinée vol + hôtel en un seul formulaire",
      "Économies affichées jusqu'à 30% par rapport à une réservation séparée",
      "Sélection du nombre de chambres, d'adultes et d'enfants",
    ],
    src: shotFlightHotel,
  },
  {
    id: "location-voiture",
    icon: Car,
    title: "Location de voiture",
    route: "/cars",
    description: "Réservation de véhicules de location, avec ou sans restitution dans une ville différente.",
    features: [
      "Lieu de prise en charge et de restitution personnalisables",
      "Choix précis des dates et heures de location",
      "Filtrage selon l'âge du conducteur",
    ],
    src: shotCars,
  },
  {
    id: "sejours",
    icon: BedDouble,
    title: "Séjours",
    route: "/stays",
    description:
      "Un catalogue de séjours de type villas et appartements, pour les voyages plus longs, les familles ou les groupes.",
    features: [
      "Filtrage par type de logement (villas, appartements)",
      "Recherche par destination, dates et nombre de voyageurs",
      "Compteur en temps réel des séjours disponibles",
    ],
    src: shotStays,
  },
  {
    id: "tours",
    icon: Compass,
    title: "Circuits & Tours",
    route: "/tours",
    description: "Des circuits organisés et expériences guidées pour les voyageurs qui recherchent un itinéraire clé en main.",
    features: [
      "Filtres par destination et durée du circuit",
      "Tri par popularité",
      "Catalogue affichant le nombre de circuits disponibles",
    ],
    src: shotTours,
  },
  {
    id: "destinations",
    icon: Globe,
    title: "Destinations",
    route: "/destinations",
    description:
      "Une page d'inspiration qui met en avant les destinations les plus recherchées, avant même que le voyageur ne lance une recherche précise.",
    features: [
      "Recherche libre par destination",
      "Statistiques de confiance affichées (destinations, pays couverts, voyageurs, note moyenne)",
    ],
    src: shotDestinations,
  },
  {
    id: "activites",
    icon: Ticket,
    title: "Activités",
    route: "/activities",
    description: "Réservation d'activités et d'expériences locales sur place, en complément d'un hébergement ou d'un vol.",
    features: [
      "Recherche par destination, date et nombre de participants",
      "Filtrage par catégorie d'activité",
    ],
    src: shotActivities,
  },
  {
    id: "evenements",
    icon: PartyPopper,
    title: "Événements",
    route: "/events",
    description: "Une billetterie pour des événements — concerts, sport, théâtre, festivals — avec recherche par lieu et date.",
    features: [
      "Catégories dédiées : Concerts, Sport, Théâtre, Festivals",
      "Recherche par lieu, date et nombre de participants",
    ],
    src: shotEvents,
  },
  {
    id: "trains",
    icon: TrainFront,
    title: "Trains",
    route: "/trains",
    description: "Recherche de trajets en train, un complément utile aux vols pour les liaisons régionales ou nationales.",
    features: [
      "Origine, destination et dates aller-retour",
      "Choix de la classe et du nombre de passagers",
    ],
    src: shotTrains,
  },
];

const partnerBenefits = [
  {
    icon: BadgePercent,
    title: "Vos prix, sans surcoût",
    description: "Aucune commission ajoutée sur les tarifs que vous listez vous-même.",
  },
  {
    icon: ShieldCheck,
    title: "Visibilité immédiate",
    description: "Vos hôtels apparaissent directement dans les résultats de recherche des voyageurs.",
  },
  {
    icon: Headphones,
    title: "Gestion autonome",
    description: "Un espace dédié pour ajouter et mettre à jour vos offres à tout moment.",
  },
];

const steps = [
  {
    icon: ClipboardCheck,
    title: "1. Vous soumettez votre candidature",
    description: "Un formulaire simple avec les informations de votre établissement.",
  },
  {
    icon: Handshake,
    title: "2. Notre équipe étudie votre dossier",
    description: "Chaque candidature est validée manuellement avant activation.",
  },
  {
    icon: Rocket,
    title: "3. Vous gérez vos offres en autonomie",
    description: "Un espace partenaire dédié pour publier et actualiser vos hébergements.",
  },
];

const BrowserFrame = ({ src, alt, label }: { src: string; alt: string; label: string }) => (
  <div className="rounded-xl overflow-hidden border border-border shadow-lg bg-card">
    <div className="flex items-center gap-1.5 px-3 py-2 bg-muted/60 border-b border-border">
      <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
      <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
      <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
      <span className="ml-3 text-xs text-muted-foreground font-medium">{label}</span>
    </div>
    <img src={src} alt={alt} className="w-full h-auto block" loading="lazy" />
  </div>
);

const PlatformPresentation = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col pt-16">
      <Navbar />

      {/* Hero */}
      <section className="relative py-16 md:py-24 bg-[#192443] overflow-hidden">
        <LazyImage
          src={bannerPresentation}
          alt="B-Reserve"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-[#192443]/65" />
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none">
          <div
            className="absolute top-0 left-0 w-full h-full"
            style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "32px 32px" }}
          />
        </div>
        <div className="relative z-10 container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight drop-shadow-lg">
            B-Reserve, la plateforme de réservation qui connecte voyageurs et partenaires
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto font-medium mb-8">
            Vols, hôtels, location de voiture, séjours, circuits, activités, événements et trains — tout ce dont vos
            futurs clients ont besoin, réuni sur une seule plateforme.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" className="bg-[#00F59B] text-[#192443] hover:bg-[#00F59B]/90 font-semibold">
              <Link to="/devenir-partenaire">Devenir partenaire</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
              <Link to="/">Visiter le site</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Quick nav */}
      <div className="sticky top-16 z-20 bg-background/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 py-3 flex flex-wrap justify-center gap-2">
          {modules.map(({ id, title }) => (
            <a
              key={id}
              href={`#${id}`}
              className="text-xs md:text-sm px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:border-[#00F59B] hover:text-foreground transition-colors"
            >
              {title}
            </a>
          ))}
        </div>
      </div>

      <main className="flex-1">
        {/* Intro */}
        <section className="container mx-auto px-4 py-14 md:py-16 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
            Documentation complète de la plateforme
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Chaque module ci-dessous est illustré par une capture d'écran réelle de la plateforme en production —
            aucune manipulation nécessaire pour vous faire une idée complète du site.
          </p>
        </section>

        {/* Module-by-module walkthrough */}
        {modules.map(({ id, icon: Icon, title, route, description, features, src }, index) => (
          <section
            id={id}
            key={id}
            className={`scroll-mt-32 py-12 md:py-16 ${index % 2 === 1 ? "bg-muted/30" : ""}`}
          >
            <div className="container mx-auto px-4">
              <div
                className={`max-w-6xl mx-auto flex flex-col gap-8 md:gap-12 items-center ${
                  index % 2 === 1 ? "md:flex-row-reverse" : "md:flex-row"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-11 h-11 rounded-xl bg-[#00F59B]/15 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-[#00F59B]" strokeWidth={2.2} />
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold text-foreground">{title}</h3>
                  </div>
                  <p className="text-muted-foreground mb-4">{description}</p>
                  <ul className="space-y-2 mb-6">
                    {features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm text-foreground/90">
                        <CheckCircle2 className="w-4 h-4 text-[#00F59B] mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button asChild variant="outline" size="sm" className="gap-2">
                    <Link to={route}>
                      Voir la page <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </Button>
                </div>
                <div className="flex-1 w-full min-w-0">
                  <BrowserFrame src={src} alt={title} label={title} />
                </div>
              </div>
            </div>
          </section>
        ))}

        {/* Partner benefits */}
        <section className="container mx-auto px-4 py-14 md:py-20">
          <div className="text-center mb-10 md:mb-14">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">Pourquoi devenir partenaire</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Rejoignez un réseau d'hôtels visibles auprès de voyageurs qui recherchent activement un hébergement.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 max-w-4xl mx-auto">
            {partnerBenefits.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex flex-col items-center text-center gap-3">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-[#00F59B]/15">
                  <Icon className="w-7 h-7 text-[#00F59B]" strokeWidth={2.2} />
                </div>
                <h3 className="text-lg font-semibold text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground max-w-xs">{description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="bg-muted/30 py-14 md:py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10 md:mb-14">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">Comment ça marche</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {steps.map(({ icon: Icon, title, description }) => (
                <Card key={title} className="border border-border">
                  <CardContent className="p-6 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-[#192443]/5 flex items-center justify-center mx-auto mb-4">
                      <Icon className="w-7 h-7 text-[#192443]" strokeWidth={2.2} />
                    </div>
                    <h3 className="font-bold text-foreground mb-2">{title}</h3>
                    <p className="text-sm text-muted-foreground">{description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="container mx-auto px-4 py-14 md:py-20">
          <div className="rounded-2xl bg-[#192443] px-6 py-10 md:px-12 md:py-14 text-center max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Prêt à faire connaître votre hôtel à de nouveaux voyageurs ?
            </h2>
            <p className="text-white/80 mb-8 max-w-xl mx-auto">
              Soumettez votre candidature en quelques minutes, notre équipe vous recontacte après étude de votre
              dossier.
            </p>
            <Button asChild size="lg" className="bg-[#00F59B] text-[#192443] hover:bg-[#00F59B]/90 font-semibold mb-8">
              <Link to="/devenir-partenaire">Devenir partenaire</Link>
            </Button>
            <div className="flex flex-wrap justify-center gap-6 text-white/80 text-sm">
              <a href="tel:+22527200000000" className="flex items-center gap-2 hover:text-white">
                <Phone className="w-4 h-4" /> +225 27 20 00 00 00
              </a>
              <a href="mailto:support@bossiz.com" className="flex items-center gap-2 hover:text-white">
                <Mail className="w-4 h-4" /> support@bossiz.com
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default PlatformPresentation;
