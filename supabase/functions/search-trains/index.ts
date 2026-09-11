import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { applyMarkup } from "../_shared/pricing.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TrainResult {
  id: string;
  operator: string;
  trainNumber: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: number;
  currency: string;
  class: string;
  availableSeats: number;
  source: string;
}

// Search Indian trains using IRCTC API via RapidAPI
async function searchIRCTC(
  origin: string,
  destination: string,
  departureDate: string,
  travelClass: string,
  rapidApiKey: string
): Promise<TrainResult[]> {
  try {
    console.log('Searching IRCTC API for Indian trains...');
    
    // First, search for trains between stations
    const response = await fetch(
      `https://irctc1.p.rapidapi.com/api/v3/trainBetweenStations?fromStationCode=${encodeURIComponent(origin)}&toStationCode=${encodeURIComponent(destination)}&dateOfJourney=${departureDate}`,
      {
        headers: {
          'X-RapidAPI-Key': rapidApiKey,
          'X-RapidAPI-Host': 'irctc1.p.rapidapi.com',
        },
      }
    );

    if (!response.ok) {
      console.error('IRCTC API error:', response.status);
      return [];
    }

    const data = await response.json();
    console.log('IRCTC response:', JSON.stringify(data).substring(0, 500));

    if (data.status && data.data && Array.isArray(data.data)) {
      return data.data.slice(0, 10).map((train: any, index: number) => {
        // Parse duration
        const durationMinutes = train.duration || 0;
        const hours = Math.floor(durationMinutes / 60);
        const minutes = durationMinutes % 60;
        
        // Estimate price based on class (INR to EUR: ~0.011)
        const basePriceINR = train.train_type?.includes('Rajdhani') ? 2500 : 
                            train.train_type?.includes('Shatabdi') ? 1500 : 800;
        const classMultiplier = travelClass === 'first' ? 3 : travelClass === 'business' ? 2 : 1;
        const priceEur = Math.round(basePriceINR * classMultiplier * 0.011);

        return {
          id: `irctc-${train.train_number || index}`,
          operator: 'Indian Railways',
          trainNumber: train.train_number || '',
          origin: train.from_station_name || origin,
          destination: train.to_station_name || destination,
          departureTime: train.from_std || '',
          arrivalTime: train.to_std || '',
          duration: `${hours}h ${minutes.toString().padStart(2, '0')}m`,
          price: priceEur,
          currency: 'EUR',
          class: travelClass || 'economy',
          availableSeats: train.available_seats || 0,
          source: 'irctc',
        };
      });
    }

    return [];
  } catch (error) {
    console.error('IRCTC API exception:', error);
    return [];
  }
}

// Search French trains using SNCF Open Data API (free, no auth required)
async function searchSNCF(
  origin: string,
  destination: string,
  departureDate: string,
  travelClass: string
): Promise<TrainResult[]> {
  try {
    console.log('Searching SNCF Open Data API for French trains...');
    
    // SNCF Open Data - search for train schedules
    // Dataset: tgvmax (TGV schedules) or horaires-des-trains-voyages
    const response = await fetch(
      `https://ressources.data.sncf.com/api/explore/v2.1/catalog/datasets/tgvmax/records?` +
      new URLSearchParams({
        limit: '20',
        where: `date = '${departureDate}' AND (origine LIKE '%${origin}%' OR destination LIKE '%${destination}%')`,
        order_by: 'heure_depart',
      }),
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error('SNCF API error:', response.status);
      return [];
    }

    const data = await response.json();
    console.log('SNCF response:', JSON.stringify(data).substring(0, 500));

    if (data.results && Array.isArray(data.results)) {
      return data.results.slice(0, 10).map((train: any, index: number) => {
        const departureTime = train.heure_depart || '08:00';
        const arrivalTime = train.heure_arrivee || '12:00';
        
        // Calculate duration
        const depParts = departureTime.split(':');
        const arrParts = arrivalTime.split(':');
        const depMinutes = parseInt(depParts[0]) * 60 + parseInt(depParts[1] || 0);
        const arrMinutes = parseInt(arrParts[0]) * 60 + parseInt(arrParts[1] || 0);
        const durationMinutes = arrMinutes > depMinutes ? arrMinutes - depMinutes : (24 * 60 - depMinutes + arrMinutes);
        const hours = Math.floor(durationMinutes / 60);
        const minutes = durationMinutes % 60;

        // Price estimation (keep in EUR)
        const basePriceEUR = train.od_happy_card === 'OUI' ? 39 : 79;
        const classMultiplier = travelClass === 'first' ? 1.8 : travelClass === 'business' ? 1.4 : 1;
        const priceEur = Math.round(basePriceEUR * classMultiplier);

        return {
          id: `sncf-${index}`,
          operator: 'SNCF',
          trainNumber: train.train_no || `TGV ${6200 + index}`,
          origin: train.origine || origin,
          destination: train.destination || destination,
          departureTime: departureTime,
          arrivalTime: arrivalTime,
          duration: `${hours}h ${minutes.toString().padStart(2, '0')}m`,
          price: priceEur,
          currency: 'EUR',
          class: travelClass || 'economy',
          availableSeats: 0,
          source: 'sncf',
        };
      });
    }

    return [];
  } catch (error) {
    console.error('SNCF API exception:', error);
    return [];
  }
}

// Detect region based on station names
function detectRegion(origin: string, destination: string): 'india' | 'france' | 'europe' | 'other' {
  const indiaStations = ['DEL', 'BOM', 'MAS', 'HWH', 'NDLS', 'BCT', 'CSTM', 'SBC', 'MYS', 'PUNE', 'AMD', 'JP', 'LKO', 'CNB', 'GKP', 'BSB', 'PRYJ', 'MGS'];
  const franceStations = ['PAR', 'LYO', 'MAR', 'TLS', 'NCE', 'NTE', 'STR', 'BOR', 'LIL', 'REN', 'MTP', 'PARIS', 'LYON', 'MARSEILLE', 'TOULOUSE', 'NICE', 'NANTES', 'STRASBOURG', 'BORDEAUX', 'LILLE', 'RENNES', 'MONTPELLIER'];
  
  const originUpper = origin.toUpperCase();
  const destUpper = destination.toUpperCase();
  
  if (indiaStations.some(s => originUpper.includes(s) || destUpper.includes(s))) {
    return 'india';
  }
  if (franceStations.some(s => originUpper.includes(s) || destUpper.includes(s))) {
    return 'france';
  }
  
  const europeCountries = ['LONDON', 'BERLIN', 'AMSTERDAM', 'BRUSSELS', 'MUNICH', 'FRANKFURT', 'ROME', 'MILAN', 'MADRID', 'BARCELONA', 'VIENNA', 'ZURICH', 'GENEVA'];
  if (europeCountries.some(s => originUpper.includes(s) || destUpper.includes(s))) {
    return 'europe';
  }
  
  return 'other';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { origin, destination, departureDate, returnDate, adults = 1, children = 0, travelClass = 'economy' } = await req.json();
    
    console.log('Train search params:', { origin, destination, departureDate, returnDate, adults, children, travelClass });

    const rapidApiKey = Deno.env.get('RAPIDAPI_KEY');
    const region = detectRegion(origin, destination);
    
    console.log('Detected region:', region);

    let allTrains: TrainResult[] = [];

    // Search based on detected region
    if (region === 'india' && rapidApiKey) {
      console.log('Searching Indian trains via IRCTC...');
      const irctcResults = await searchIRCTC(origin, destination, departureDate, travelClass, rapidApiKey);
      allTrains.push(...irctcResults);
    }
    
    if (region === 'france') {
      console.log('Searching French trains via SNCF...');
      const sncfResults = await searchSNCF(origin, destination, departureDate, travelClass);
      allTrains.push(...sncfResults);
    }
    
    // No real data source is integrated for other European rail operators
    // (Eurostar, Thalys, DB, Trenitalia, Renfe) yet, so region === 'europe'
    // and any unmatched region simply return no results instead of
    // fabricating a fake schedule.

    // Apply retail markup on top of the raw supplier/estimated price so the
    // platform earns a margin on this vertical too (previously the exact
    // supplier price was passed straight through with zero markup).
    for (const train of allTrains) {
      train.price = applyMarkup(train.price);
    }

    // Sort by price
    allTrains.sort((a, b) => a.price - b.price);

    console.log(`Total trains found: ${allTrains.length}`);

    return new Response(
      JSON.stringify({ trains: allTrains }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in search-trains:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
