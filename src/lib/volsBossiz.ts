// Intégration avec vols.bossiz.com (site TravelPayouts White Label).
// Le format d'URL de recherche (code compact IATA+dates dans le chemin) est celui
// utilisé en interne par le widget officiel TravelPayouts pour construire ses liens
// de recherche Aviasales — vols.bossiz.com utilise le même moteur et accepte ce format.

export const VOLS_BOSSIZ_URL = "https://vols.bossiz.com/";

const extractIataCode = (value: string): string => {
  const match = value.match(/\(([A-Za-z0-9]{2,4})\)\s*$/);
  return (match ? match[1] : value).trim().toUpperCase().slice(0, 3);
};

const toDDMM = (isoDate: string): string => {
  const [, month, day] = isoDate.split("-");
  return `${day ?? ""}${month ?? ""}`;
};

export interface VolsBossizSearchParams {
  origin: string;
  destination: string;
  departureDate: string; // yyyy-MM-dd
  returnDate?: string; // yyyy-MM-dd
  adults?: number;
  children?: number;
  infants?: number;
  travelClass?: string; // economy | premium_economy | business | first (insensible à la casse)
}

export function buildVolsBossizSearchUrl(params: VolsBossizSearchParams): string {
  const originCode = extractIataCode(params.origin || "");
  const destinationCode = extractIataCode(params.destination || "");

  if (!originCode || !destinationCode || !params.departureDate) {
    return VOLS_BOSSIZ_URL;
  }

  const departCode = toDDMM(params.departureDate);
  const returnCode = params.returnDate ? toDDMM(params.returnDate) : "";
  const classCode = ["business", "first"].includes((params.travelClass || "").toLowerCase())
    ? "c"
    : "";
  const adults = params.adults ?? 1;
  const children = params.children ?? 0;
  const infants = params.infants ?? 0;

  const code = `${originCode}${departCode}${destinationCode}${returnCode}${classCode}${adults}${children}${infants}`;
  const query = new URLSearchParams({
    currency: "xof",
    language: "fr",
    locale: "fr",
    with_request: "true",
  });

  return `https://vols.bossiz.com/search/${code}?${query.toString()}`;
}
