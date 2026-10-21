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

// Matière de la carte de membre selon la formule : un support (dégradé en
// trois tons, du plus clair au plus profond) et une finition « foil »
// métallique utilisée pour le nom de la formule, la puce et les filets.
export interface MemberCardTheme {
  material: [string, string, string];
  foil: string[];
  ink: string;
  inkMuted: string;
  icon: LucideIcon;
  // Raccourcis pour les aplats (bandeau de la page de vérification...)
  from: string;
  to: string;
  accent: string;
}

const make = (
  material: [string, string, string],
  foil: string[],
  icon: LucideIcon,
  ink = "#F7F3EA",
  inkMuted = "rgba(247, 243, 234, 0.62)",
): MemberCardTheme => ({
  material,
  foil,
  ink,
  inkMuted,
  icon,
  from: material[0],
  to: material[2],
  accent: foil[1],
});

// Finitions métalliques
const GOLD = ["#8A6A1F", "#F6E27A", "#B8892B", "#FFF3B0", "#A07A28", "#E9CF6A"];
const BRONZE = ["#6E4220", "#E6B07A", "#94602F", "#F6D4A8", "#7A4C27", "#D9A26C"];
const SILVER = ["#7F8A95", "#F2F5F8", "#A3AEB9", "#FFFFFF", "#78838E", "#DCE2E8"];
const PLATINUM = ["#8F9499", "#F7F8F9", "#B5BAC0", "#FFFFFF", "#868B91", "#E3E6E9"];
const CHAMPAGNE = ["#A58C5D", "#F7E7C4", "#C4A874", "#FFF6DF", "#9C8356", "#EAD6AC"];
const ICE = ["#7FA2C8", "#EAF5FF", "#A3C7EB", "#FFFFFF", "#7096BF", "#CFE6FA"];
const ROSE_GOLD = ["#9A574B", "#F6C8B8", "#BD7B6B", "#FFE3D8", "#8E5045", "#EDB4A2"];
const HOLO = ["#8A7CF0", "#FFD1F7", "#A7F3FF", "#E2D4FF", "#9B8CFF", "#C6F6D5"];
const PINK_GOLD = ["#B46A7E", "#FFD6E0", "#D29AA9", "#FFF0F4", "#A85F73", "#F3BFCC"];

const THEMES: Record<string, MemberCardTheme> = {
  basic: make(["#3E444D", "#24282E", "#14171B"], BRONZE, Star),
  premium: make(["#22325A", "#0F1A33", "#050A17"], GOLD, Crown),
  business: make(["#125A60", "#072E33", "#021719"], SILVER, Briefcase),
  corporate: make(["#2D2D31", "#141416", "#050506"], PLATINUM, Building2),
  family: make(["#21603D", "#0E3421", "#061A10"], CHAMPAGNE, Heart),
  student: make(["#2A50D0", "#142D80", "#0A1747"], ICE, GraduationCap),
  visa: make(["#7E2230", "#440E18", "#22060B"], ROSE_GOLD, FileCheck),
  billets: make(["#5C2DAA", "#2F1468", "#160934"], HOLO, Plane),
  events: make(["#A61C5E", "#5C0C34", "#2C0518"], PINK_GOLD, CalendarDays),
};

// Formule ajoutée depuis l'admin sans thème dédié : une teinte stable est
// dérivée de son identifiant, avec une finition argent.
const fallbackTheme = (planId: string): MemberCardTheme => {
  let hue = 0;
  for (const char of planId) hue = (hue * 31 + char.charCodeAt(0)) % 360;
  return make([`hsl(${hue} 45% 34%)`, `hsl(${hue} 55% 18%)`, `hsl(${hue} 60% 8%)`], SILVER, Star);
};

export const memberCardTheme = (planId: string): MemberCardTheme => THEMES[planId] ?? fallbackTheme(planId);

export const foilGradient = (theme: MemberCardTheme, angle = 115): string => {
  const stops = theme.foil.map((color, i) => `${color} ${Math.round((i / (theme.foil.length - 1)) * 100)}%`);
  return `linear-gradient(${angle}deg, ${stops.join(", ")})`;
};

// Numéro lisible imprimé sur la carte, dérivé du code membre aléatoire
// (BZ-XXXX-XXXX). Le QR code, lui, contient le code complet.
export const memberNumber = (memberCode: string): string => {
  const hex = memberCode.replace(/-/g, "").toUpperCase();
  return `BZ-${hex.slice(0, 4)}-${hex.slice(4, 8)}`;
};

export const memberVerifyUrl = (memberCode: string): string =>
  `${window.location.origin}/verifier-membre/${memberCode}`;
