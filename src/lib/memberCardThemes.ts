import {
  Briefcase,
  Building2,
  CalendarDays,
  Crown,
  FileCheck,
  GraduationCap,
  Heart,
  Plane,
  Star,
  type LucideIcon,
} from "lucide-react";

// Apparence de la carte de membre selon la formule. Chaque formule a sa
// propre couleur (dégradé) et sa couleur d'accent (liseré, numéro...).
export interface MemberCardTheme {
  from: string;
  to: string;
  accent: string;
  icon: LucideIcon;
}

const THEMES: Record<string, MemberCardTheme> = {
  basic: { from: "#475569", to: "#1E293B", accent: "#E2B07A", icon: Star },
  premium: { from: "#1B2A4A", to: "#0A1222", accent: "#D4AF37", icon: Crown },
  business: { from: "#0F4C5C", to: "#082A33", accent: "#5EEAD4", icon: Briefcase },
  corporate: { from: "#27272A", to: "#09090B", accent: "#E5E7EB", icon: Building2 },
  family: { from: "#166534", to: "#0A3A1E", accent: "#FCD34D", icon: Heart },
  student: { from: "#1D4ED8", to: "#172554", accent: "#93C5FD", icon: GraduationCap },
  visa: { from: "#7F1D1D", to: "#3F0A0A", accent: "#FCA5A5", icon: FileCheck },
  billets: { from: "#5B21B6", to: "#2A0E5E", accent: "#C4B5FD", icon: Plane },
  events: { from: "#9D174D", to: "#4A0725", accent: "#F9A8D4", icon: CalendarDays },
};

// Formule ajoutée depuis l'admin sans thème dédié : une teinte stable est
// dérivée de son identifiant, pour que chaque formule reste reconnaissable.
const fallbackTheme = (planId: string): MemberCardTheme => {
  let hash = 0;
  for (const char of planId) hash = (hash * 31 + char.charCodeAt(0)) % 360;
  return {
    from: `hsl(${hash} 55% 32%)`,
    to: `hsl(${hash} 60% 14%)`,
    accent: `hsl(${(hash + 40) % 360} 80% 75%)`,
    icon: Star,
  };
};

export const memberCardTheme = (planId: string): MemberCardTheme =>
  THEMES[planId] ?? fallbackTheme(planId);

// Numéro lisible imprimé sur la carte, dérivé du code membre aléatoire
// (BZ-XXXX-XXXX). Le QR code, lui, contient le code complet.
export const memberNumber = (memberCode: string): string => {
  const hex = memberCode.replace(/-/g, "").toUpperCase();
  return `BZ-${hex.slice(0, 4)}-${hex.slice(4, 8)}`;
};

export const memberVerifyUrl = (memberCode: string): string =>
  `${window.location.origin}/verifier-membre/${memberCode}`;
