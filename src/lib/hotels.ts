import type { Json } from "@/integrations/supabase/types";

// Hôtels partenaires façon Booking (migration 20261017030000).
// L'hôtel est une ligne `services` (type 'hotel') : galerie dans `images`,
// équipements dans `amenities`, infos complémentaires dans `specifications`.
// Ses types de chambre et tarifs vivent dans hotel_room_types / hotel_rates.

export const HOTEL_AMENITIES = [
  "Wi-Fi gratuit",
  "Parking gratuit",
  "Piscine",
  "Climatisation",
  "Restaurant",
  "Bar",
  "Petit-déjeuner",
  "Réception 24h/24",
  "Navette aéroport",
  "Salle de sport",
  "Spa",
  "Service d'étage",
  "Chambres familiales",
  "Chambres non-fumeurs",
  "Ascenseur",
  "Groupe électrogène",
  "Sécurité 24h/24",
  "Jardin",
  "Terrasse",
  "Vue sur mer",
  "Accès plage",
  "Blanchisserie",
  "Salle de réunion",
  "Animaux acceptés",
] as const;

export const ROOM_AMENITIES = [
  "Climatisation",
  "Salle de bains privée",
  "Télévision à écran plat",
  "Wi-Fi gratuit",
  "Cuisine équipée",
  "Kitchenette",
  "Réfrigérateur",
  "Micro-ondes",
  "Machine à laver",
  "Balcon",
  "Terrasse",
  "Vue sur la ville",
  "Vue sur mer",
  "Coffre-fort",
  "Bureau",
  "Sèche-cheveux",
  "Fer à repasser",
  "Bouilloire",
  "Canal+",
  "Insonorisation",
] as const;

export const HOTEL_GALLERY_MAX = 12;
export const ROOM_GALLERY_MAX = 6;

export interface HotelSpecs {
  stars: number;
  highlights: string[];
  checkInFrom: string;
  checkOutUntil: string;
  houseRules: string;
}

export const emptyHotelSpecs: HotelSpecs = {
  stars: 0,
  highlights: [],
  checkInFrom: "14:00",
  checkOutUntil: "12:00",
  houseRules: "",
};

const asRecord = (value: Json | null | undefined): Record<string, Json | undefined> =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, Json | undefined>) : {};

export function parseHotelSpecs(value: Json | null | undefined): HotelSpecs {
  const specs = asRecord(value);
  const stars = Number(specs.stars);
  return {
    stars: Number.isFinite(stars) ? Math.min(Math.max(Math.round(stars), 0), 5) : 0,
    highlights: Array.isArray(specs.highlights)
      ? specs.highlights.filter((h): h is string => typeof h === "string" && h.trim().length > 0)
      : [],
    checkInFrom: typeof specs.checkInFrom === "string" ? specs.checkInFrom : emptyHotelSpecs.checkInFrom,
    checkOutUntil: typeof specs.checkOutUntil === "string" ? specs.checkOutUntil : emptyHotelSpecs.checkOutUntil,
    houseRules: typeof specs.houseRules === "string" ? specs.houseRules : "",
  };
}

export function parseStringList(value: Json | null | undefined): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === "string" && v.trim().length > 0);
  if (value && typeof value === "object") {
    return Object.values(value).filter((v): v is string => typeof v === "string" && v.trim().length > 0);
  }
  return [];
}

export const formatFcfa = (amount: number) => `${Math.round(amount).toLocaleString("fr-FR")} FCFA`;

// Nuits entre deux dates ISO (AAAA-MM-JJ), 0 si invalide.
export function nightsBetween(checkIn: string, checkOut: string): number {
  const start = Date.parse(`${checkIn}T00:00:00Z`);
  const end = Date.parse(`${checkOut}T00:00:00Z`);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0;
  return Math.round((end - start) / 86_400_000);
}

export function isoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDays(iso: string, days: number): string {
  const date = new Date(`${iso}T00:00:00`);
  date.setDate(date.getDate() + days);
  return isoDate(date);
}

export interface HotelRate {
  id: string;
  room_type_id: string;
  occupancy: number;
  price_per_night: number;
  breakfast_included: boolean;
  free_cancellation: boolean;
  free_cancellation_days: number;
  pay_at_property: boolean;
  sort_order: number;
  is_active: boolean;
}

export interface HotelRoomType {
  id: string;
  service_id: string;
  name: string;
  description: string | null;
  bed_info: string | null;
  size_m2: number | null;
  max_guests: number;
  total_units: number;
  amenities: string[];
  images: string[];
  sort_order: number;
  is_active: boolean;
}

export function cancellationLabel(rate: Pick<HotelRate, "free_cancellation" | "free_cancellation_days">): string {
  if (!rate.free_cancellation) return "Non remboursable";
  if (rate.free_cancellation_days <= 0) return "Annulation gratuite jusqu'au jour d'arrivée";
  return rate.free_cancellation_days === 1
    ? "Annulation gratuite jusqu'à la veille de l'arrivée"
    : `Annulation gratuite jusqu'à ${rate.free_cancellation_days} jours avant l'arrivée`;
}
