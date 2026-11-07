// Adresse de l'API Amadeus Self-Service.
//
// Par défaut on reste sur l'environnement de TEST (test.api.amadeus.com) :
// il renvoie de vrais horaires mais n'émet aucun billet réel.
// Une fois le contrat Amadeus « production » signé et les clés de production
// obtenues, il suffit de définir le secret de fonction :
//   AMADEUS_ENV = production
// (et de remplacer AMADEUS_API_KEY / AMADEUS_API_SECRET par les clés de prod)
// pour basculer search-flights, search-hotels et create-pnr sans toucher au code.

export const isAmadeusProduction = (): boolean =>
  (Deno.env.get("AMADEUS_ENV") || "").trim().toLowerCase() === "production";

export const amadeusBaseUrl = (): string =>
  isAmadeusProduction() ? "https://api.amadeus.com" : "https://test.api.amadeus.com";
