import { Crown, Shield, Star, Zap, Gem, Trophy } from "lucide-react";

export interface MajesticPlan {
  id: string;
  name: string;
  price: string;
  priceAmount: number;
  initiationFee: string;
  initiationFeeAmount: number;
  profile: string;
  description: string;
  features: string[];
  icon: any;
  color: string;
  popular?: boolean;
  foundersOffer?: {
    discountPrice: string;
    discountAmount: number;
    remainingSeats: number;
  };
}

export const MAJESTIC_PLANS: MajesticPlan[] = [
  {
    id: "majestic_souverain",
    name: "Souverain",
    price: "500 000 FCFA / an",
    priceAmount: 500000,
    initiationFee: "+ 100 000 FCFA de frais d'initiation",
    initiationFeeAmount: 100000,
    profile: "Jeunes cadres & entrepreneurs dynamiques",
    description: "L'entrée privilégiée dans l'univers Majestic pour ceux qui exigent l'excellence lors de leurs déplacements.",
    icon: Gem,
    color: "from-[#C5A059]/40 to-transparent",
    features: [
      "Accès au catalogue de villas privées",
      "Réservation de billets Business",
      "Conciergerie basique (Restos/Clubs)",
      "Assistance voyage dédiée"
    ]
  },
  {
    id: "majestic_imperial",
    name: "Privilège Impérial",
    price: "1 500 000 FCFA / an",
    priceAmount: 150000,
    initiationFee: "+ 100 000 FCFA de frais d'initiation",
    initiationFeeAmount: 100000,
    profile: "Hommes d'affaires & Expatriés Seniors",
    description: "Le cœur de cible du Club. Une immersion totale avec un service ultra-personnalisé et des accès exclusifs.",
    icon: Crown,
    color: "from-[#C5A059] to-[#8C6B3F]",
    popular: true,
    foundersOffer: {
      discountPrice: "1 000 000 FCFA",
      discountAmount: 1000000,
      remainingSeats: 10
    },
    features: [
      "Accès prioritaire Villas de Luxe",
      "Concierge dédié 24/7",
      "2 Transferts aéroport VIP offerts / an",
      "Accès événements privés",
      "Organisation de dîners à domicile"
    ]
  },
  {
    id: "majestic_black",
    name: "Majestic Black",
    price: "3 500 000 FCFA / an",
    priceAmount: 3500000,
    initiationFee: "+ 100 000 FCFA de frais d'initiation",
    initiationFeeAmount: 100000,
    profile: "Diplomates & CEOs de multinationales",
    description: "L'Ultra-Exclusivité. Pour ceux qui recherchent l'anonymat total et une gestion souveraine de leur art de vivre.",
    icon: Trophy,
    color: "from-[#101820] via-[#0A192F] to-[#C5A059]/20",
    features: [
      "Tout le catalogue 'Off-Market'",
      "Gestion complète Visas & Voyages",
      "Sécurité rapprochée sur demande",
      "Majordome privé en villa",
      "Accès Yachts & Jets privés"
    ]
  }
];
