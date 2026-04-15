/**
 * Complete airport names database
 * Maps IATA codes to full airport names
 */

interface AirportInfo {
  city: string;
  name: string;
  country: string;
}

export const airportDatabase: Record<string, AirportInfo> = {
  // Côte d'Ivoire
  'ABJ': { city: 'Abidjan', name: 'Aéroport International Félix Houphouët-Boigny', country: 'Côte d\'Ivoire' },
  
  // France
  'CDG': { city: 'Paris', name: 'Aéroport Paris-Charles de Gaulle', country: 'France' },
  'ORY': { city: 'Paris', name: 'Aéroport Paris-Orly', country: 'France' },
  'NCE': { city: 'Nice', name: 'Aéroport Nice Côte d\'Azur', country: 'France' },
  'MRS': { city: 'Marseille', name: 'Aéroport Marseille Provence', country: 'France' },
  'LYS': { city: 'Lyon', name: 'Aéroport Lyon-Saint-Exupéry', country: 'France' },
  'TLS': { city: 'Toulouse', name: 'Aéroport Toulouse-Blagnac', country: 'France' },
  'BOD': { city: 'Bordeaux', name: 'Aéroport Bordeaux-Mérignac', country: 'France' },
  'NTE': { city: 'Nantes', name: 'Aéroport Nantes Atlantique', country: 'France' },
  
  // Middle East
  'DXB': { city: 'Dubaï', name: 'Aéroport International de Dubaï', country: 'Émirats Arabes Unis' },
  'AUH': { city: 'Abu Dhabi', name: 'Aéroport International d\'Abu Dhabi', country: 'Émirats Arabes Unis' },
  'DOH': { city: 'Doha', name: 'Aéroport International Hamad', country: 'Qatar' },
  'IST': { city: 'Istanbul', name: 'Aéroport d\'Istanbul', country: 'Turquie' },
  'SAW': { city: 'Istanbul', name: 'Aéroport Sabiha Gökçen', country: 'Turquie' },
  'RUH': { city: 'Riyad', name: 'Aéroport International King Khalid', country: 'Arabie Saoudite' },
  'JED': { city: 'Djeddah', name: 'Aéroport International King Abdulaziz', country: 'Arabie Saoudite' },
  
  // West Africa
  'ACC': { city: 'Accra', name: 'Aéroport International Kotoka', country: 'Ghana' },
  'DKR': { city: 'Dakar', name: 'Aéroport International Blaise Diagne', country: 'Sénégal' },
  'DSS': { city: 'Dakar', name: 'Aéroport Léopold Sédar Senghor', country: 'Sénégal' },
  'LOS': { city: 'Lagos', name: 'Aéroport International Murtala Muhammed', country: 'Nigeria' },
  'LFW': { city: 'Lomé', name: 'Aéroport International Gnassingbé Eyadema', country: 'Togo' },
  'COO': { city: 'Cotonou', name: 'Aéroport International Cardinal Bernardin Gantin', country: 'Bénin' },
  'BKO': { city: 'Bamako', name: 'Aéroport International Modibo Keita', country: 'Mali' },
  'OUA': { city: 'Ouagadougou', name: 'Aéroport International de Ouagadougou', country: 'Burkina Faso' },
  'CKY': { city: 'Conakry', name: 'Aéroport International Ahmed Sékou Touré', country: 'Guinée' },
  'FNA': { city: 'Freetown', name: 'Aéroport International de Lungi', country: 'Sierra Leone' },
  'ROB': { city: 'Monrovia', name: 'Aéroport International Roberts', country: 'Liberia' },
  'BJL': { city: 'Banjul', name: 'Aéroport International de Banjul', country: 'Gambie' },
  'NIM': { city: 'Niamey', name: 'Aéroport International Diori Hamani', country: 'Niger' },
  
  // North Africa
  'CMN': { city: 'Casablanca', name: 'Aéroport Mohammed V', country: 'Maroc' },
  'RAK': { city: 'Marrakech', name: 'Aéroport Marrakech-Ménara', country: 'Maroc' },
  'TUN': { city: 'Tunis', name: 'Aéroport Tunis-Carthage', country: 'Tunisie' },
  'ALG': { city: 'Alger', name: 'Aéroport Houari Boumédiène', country: 'Algérie' },
  'CAI': { city: 'Le Caire', name: 'Aéroport International du Caire', country: 'Égypte' },
  
  // East Africa
  'ADD': { city: 'Addis-Abeba', name: 'Aéroport International Bole', country: 'Éthiopie' },
  'NBO': { city: 'Nairobi', name: 'Aéroport International Jomo Kenyatta', country: 'Kenya' },
  'DAR': { city: 'Dar es Salaam', name: 'Aéroport International Julius Nyerere', country: 'Tanzanie' },
  'EBB': { city: 'Entebbe', name: 'Aéroport International d\'Entebbe', country: 'Ouganda' },
  
  // Southern Africa
  'JNB': { city: 'Johannesburg', name: 'Aéroport International O.R. Tambo', country: 'Afrique du Sud' },
  'CPT': { city: 'Cape Town', name: 'Aéroport International du Cap', country: 'Afrique du Sud' },
  
  // Europe
  'LHR': { city: 'Londres', name: 'Aéroport Londres Heathrow', country: 'Royaume-Uni' },
  'LGW': { city: 'Londres', name: 'Aéroport Londres Gatwick', country: 'Royaume-Uni' },
  'AMS': { city: 'Amsterdam', name: 'Aéroport Amsterdam-Schiphol', country: 'Pays-Bas' },
  'FRA': { city: 'Francfort', name: 'Aéroport de Francfort', country: 'Allemagne' },
  'MUC': { city: 'Munich', name: 'Aéroport de Munich', country: 'Allemagne' },
  'MAD': { city: 'Madrid', name: 'Aéroport Adolfo Suárez Madrid-Barajas', country: 'Espagne' },
  'BCN': { city: 'Barcelone', name: 'Aéroport de Barcelone-El Prat', country: 'Espagne' },
  'FCO': { city: 'Rome', name: 'Aéroport Léonard de Vinci-Fiumicino', country: 'Italie' },
  'CIA': { city: 'Rome', name: 'Aéroport de Rome-Ciampino', country: 'Italie' },
  'BRU': { city: 'Bruxelles', name: 'Aéroport de Bruxelles', country: 'Belgique' },
  'GVA': { city: 'Genève', name: 'Aéroport International de Genève', country: 'Suisse' },
  'ZRH': { city: 'Zurich', name: 'Aéroport de Zurich', country: 'Suisse' },
  'VIE': { city: 'Vienne', name: 'Aéroport de Vienne', country: 'Autriche' },
  'LIS': { city: 'Lisbonne', name: 'Aéroport Humberto Delgado', country: 'Portugal' },
  
  // North America
  'JFK': { city: 'New York', name: 'Aéroport International John F. Kennedy', country: 'États-Unis' },
  'LAX': { city: 'Los Angeles', name: 'Aéroport International de Los Angeles', country: 'États-Unis' },
  'ORD': { city: 'Chicago', name: 'Aéroport International O\'Hare', country: 'États-Unis' },
  'ATL': { city: 'Atlanta', name: 'Aéroport International Hartsfield-Jackson', country: 'États-Unis' },
  'YUL': { city: 'Montréal', name: 'Aéroport International Montréal-Trudeau', country: 'Canada' },
  'YYZ': { city: 'Toronto', name: 'Aéroport International Pearson', country: 'Canada' },
  
  // Asia
  'PEK': { city: 'Pékin', name: 'Aéroport International de Pékin-Capitale', country: 'Chine' },
  'PVG': { city: 'Shanghai', name: 'Aéroport International de Shanghai-Pudong', country: 'Chine' },
  'HKG': { city: 'Hong Kong', name: 'Aéroport International de Hong Kong', country: 'Hong Kong' },
  'SIN': { city: 'Singapour', name: 'Aéroport de Singapour-Changi', country: 'Singapour' },
  'BKK': { city: 'Bangkok', name: 'Aéroport Suvarnabhumi', country: 'Thaïlande' },
  'NRT': { city: 'Tokyo', name: 'Aéroport International de Narita', country: 'Japon' },
  'ICN': { city: 'Séoul', name: 'Aéroport International d\'Incheon', country: 'Corée du Sud' },
};

/**
 * Get full airport name from IATA code
 */
export const getAirportName = (code: string): string => {
  const airport = airportDatabase[code];
  return airport ? airport.name : code;
};

/**
 * Get city name from IATA code
 */
export const getCityName = (code: string): string => {
  const airport = airportDatabase[code];
  return airport ? airport.city : code;
};

/**
 * Get country from IATA code
 */
export const getCountryName = (code: string): string => {
  const airport = airportDatabase[code];
  return airport ? airport.country : '';
};

/**
 * Get formatted airport display (City - Airport Name)
 */
export const getAirportDisplay = (code: string, format: 'full' | 'city' | 'short' = 'full'): string => {
  const airport = airportDatabase[code];
  
  if (!airport) return code;
  
  switch (format) {
    case 'full':
      return `${airport.city} - ${airport.name}`;
    case 'city':
      return airport.city;
    case 'short':
      return `${airport.city} (${code})`;
    default:
      return code;
  }
};

/**
 * Get IATA code from city name (case-insensitive)
 */
export function getIataByCity(cityName: string): string | null {
  if (!cityName) return null;
  const normalizedSearch = cityName.toLowerCase().trim();
  const entry = Object.entries(airportDatabase).find(([_, info]) => 
    info.city.toLowerCase() === normalizedSearch
  );
  return entry ? entry[0] : null;
}

/**
 * Basic country to flag mapping
 */
export function getCountryFlag(countryName: string): string {
  if (!countryName) return '📍';
  const flags: Record<string, string> = {
    'France': '🇫🇷',
    'Émirats Arabes Unis': '🇦🇪',
    'Turquie': '🇹🇷',
    'Ghana': '🇬🇭',
    'Sénégal': '🇸🇳',
    'Maroc': '🇲🇦',
    'Afrique du Sud': '🇿🇦',
    'Éthiopie': '🇪🇹',
    'Côte d\'Ivoire': '🇨🇮',
    'États-Unis': '🇺🇸',
    'Italie': '🇮🇹',
    'Espagne': '🇪🇸',
    'Royaume-Uni': '🇬🇧',
    'Allemagne': '🇩🇪',
    'Belgique': '🇧🇪',
    'Suisse': '🇨🇭',
    'Canada': '🇨🇦',
    'Japon': '🇯🇵',
    'Chine': '🇨🇳',
  };
  return flags[countryName] || '📍';
}
