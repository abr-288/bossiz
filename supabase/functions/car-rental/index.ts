import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { carRentalSchema, validateData, createValidationErrorResponse } from "../_shared/zodValidation.ts";
import { getClientIP, checkRateLimit, createRateLimitResponse, RATE_LIMITS } from "../_shared/rate-limiter.ts";
import { signOffer } from "../_shared/priceSignature.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OFFER_VALIDITY_MINUTES = 30;

// Cars are partner-only (see the 2026-09-10 removal of the RapidAPI
// providers): every result is an agency's own listing at the agency's own
// final price, so no retail markup is applied here - just sign the price
// so create-booking can verify at checkout time that this exact
// price/name/location bundle really came out of this search.
async function signCarResults(cars: CarResult[], fallbackLocation: string) {
  const expiresAt = new Date(Date.now() + OFFER_VALIDITY_MINUTES * 60 * 1000).toISOString();

  for (const car of cars) {
    const unitPrice = Math.round(Number(car.price) || 0);
    car.price = unitPrice;

    const payload = {
      service_type: 'car',
      service_name: String(car.name || 'Véhicule'),
      location: String(car.pickupLocation || fallbackLocation),
      unit_price: unitPrice,
      currency: car.currency || 'EUR',
      expires_at: expiresAt,
    };

    car.offer_expires_at = expiresAt;
    car.offer_signature = await signOffer(payload);
  }

  return cars;
}

// Fetch vehicles that partner agencies listed themselves via
// /agency/services (the `services` table, type='car'). Public RLS
// ("Services are viewable by everyone" WHERE available = true) already
// permits this read with the anon key - no service-role key needed. Pass
// `pickupLocation: null` to return every available partner car unfiltered.
async function fetchPartnerCars(pickupLocation: string | null): Promise<CarResult[]> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    if (!supabaseUrl || !supabaseAnonKey) return [];

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('type', 'car')
      .eq('available', true);

    if (error || !data) {
      console.error('Partner car services fetch failed:', error?.message);
      return [];
    }

    const rows = pickupLocation
      ? data.filter((s: any) => {
          const needle = pickupLocation.toLowerCase().trim();
          const loc = (s.location || '').toLowerCase();
          const dest = (s.destination || '').toLowerCase();
          return loc.includes(needle) || needle.includes(loc) ||
                 (dest && (dest.includes(needle) || needle.includes(dest)));
        })
      : data;

    return rows.map((s: any) => {
      const specs = (s.specifications && typeof s.specifications === 'object') ? s.specifications : {};
      const imageUrl = s.image_url || (Array.isArray(s.images) && s.images[0]) || getCarImage(specs.category || 'Standard', specs.brand, specs.model);

      return {
        id: s.id,
        name: s.name,
        brand: specs.brand || '',
        model: specs.model || '',
        category: specs.category || 'Standard',
        price: Number(s.price_per_unit) || 0,
        currency: s.currency || 'EUR',
        rating: Math.min(Number(s.rating) || 4.5, 5),
        reviews: s.total_reviews || 0,
        image: imageUrl,
        images: Array.isArray(s.images) ? s.images : [imageUrl],
        seats: specs.seats || 5,
        transmission: specs.transmission || 'Automatique',
        fuel: specs.fuel || 'Essence',
        luggage: specs.luggage || 3,
        airConditioning: true,
        provider: 'Partenaire',
        source: 'partner',
        unlimitedMileage: !!specs.unlimitedMileage,
        freeCancellation: !!specs.freeCancellation,
        fuelPolicy: specs.fuelPolicy || 'full-to-full',
        deposit: null,
        doors: specs.doors || 4,
        engineSize: specs.engineSize || '',
        year: specs.year || new Date().getFullYear(),
        pickupLocation: s.location || pickupLocation || '',
        features: Array.isArray(specs.features) ? specs.features : ['Climatisation'],
      };
    });
  } catch (error) {
    console.error('Partner cars fetch exception:', error instanceof Error ? error.message : String(error));
    return [];
  }
}

interface CarResult {
  id: string;
  name: string;
  category: string;
  price: number;
  currency: string;
  rating: number;
  reviews: number;
  image: string;
  images?: string[];
  seats: number;
  transmission: string;
  fuel: string;
  luggage: number;
  airConditioning: boolean;
  provider: string;
  source: string;
  unlimitedMileage: boolean;
  freeCancellation: boolean;
  fuelPolicy: string;
  deposit: number | null;
  doors: number;
  engineSize: string;
  model: string;
  brand: string;
  year: number;
  pickupLocation: string;
  features: string[];
  offer_signature?: string;
  offer_expires_at?: string;
}

// Real-time car image API using imagin.studio (same as Kiwi/Trip.com) -
// used as a fallback when a partner didn't (or couldn't) supply a photo.
function getImaginStudioCarImage(brand: string, model: string, color?: string): string {
  const make = brand.toLowerCase().replace(/[^a-z0-9]/g, '');
  const modelFamily = model.toLowerCase().replace(/[^a-z0-9]/g, '').split(' ')[0];
  const paintColor = color || 'black';

  const params = new URLSearchParams({
    customer: 'hrjavascript-masede',
    make: make,
    modelFamily: modelFamily,
    paintId: paintColor,
    angle: '01', // Front 3/4 view (most common in rental sites)
    width: '800',
    height: '500',
    countryCode: 'FR'
  });

  return `https://cdn.imagin.studio/getimage?${params.toString()}`;
}

// High quality car images by brand using verified working URLs
const carImagesByBrand: Record<string, Record<string, string>> = {
  'Toyota': {
    'Corolla': 'https://images.unsplash.com/photo-1623869675781-80aa31012a5a?w=800&h=500&fit=crop',
    'Yaris': 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=800&h=500&fit=crop',
    'RAV4': 'https://images.unsplash.com/photo-1581540222194-0def2dda95b8?w=800&h=500&fit=crop',
    'Land Cruiser': 'https://images.unsplash.com/photo-1594611396940-fbea2a9b2f33?w=800&h=500&fit=crop',
    'Camry': 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800&h=500&fit=crop',
    'default': 'https://images.unsplash.com/photo-1559416523-140ddc3d238c?w=800&h=500&fit=crop'
  },
  'Renault': {
    'Clio': 'https://images.unsplash.com/photo-1601929862217-f1bf94503333?w=800&h=500&fit=crop',
    'Megane': 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&h=500&fit=crop',
    'Captur': 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&h=500&fit=crop',
    'default': 'https://images.unsplash.com/photo-1601929862217-f1bf94503333?w=800&h=500&fit=crop'
  },
  'Peugeot': {
    '208': 'https://images.unsplash.com/photo-1609073242909-38e7a2e5c2c0?w=800&h=500&fit=crop',
    '308': 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&h=500&fit=crop',
    '3008': 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&h=500&fit=crop',
    'default': 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&h=500&fit=crop'
  },
  'Volkswagen': {
    'Golf': 'https://images.unsplash.com/photo-1471479917193-f00955256257?w=800&h=500&fit=crop',
    'Polo': 'https://images.unsplash.com/photo-1606611013016-969c19ba27bb?w=800&h=500&fit=crop',
    'Passat': 'https://images.unsplash.com/photo-1612825173281-9a193378527e?w=800&h=500&fit=crop',
    'Tiguan': 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&h=500&fit=crop',
    'default': 'https://images.unsplash.com/photo-1471479917193-f00955256257?w=800&h=500&fit=crop'
  },
  'Mercedes-Benz': {
    'Classe A': 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&h=500&fit=crop',
    'Classe C': 'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=800&h=500&fit=crop',
    'Classe E': 'https://images.unsplash.com/photo-1563720360172-67b8f3dce741?w=800&h=500&fit=crop',
    'GLA': 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&h=500&fit=crop',
    'GLC': 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&h=500&fit=crop',
    'default': 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&h=500&fit=crop'
  },
  'BMW': {
    'Série 1': 'https://images.unsplash.com/photo-1556189250-72ba954cfc2b?w=800&h=500&fit=crop',
    'Série 3': 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&h=500&fit=crop',
    'X1': 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&h=500&fit=crop',
    'X3': 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&h=500&fit=crop',
    'X5': 'https://images.unsplash.com/photo-1616422285623-13ff0162193c?w=800&h=500&fit=crop',
    'default': 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&h=500&fit=crop'
  },
  'Audi': {
    'A1': 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&h=500&fit=crop',
    'A3': 'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?w=800&h=500&fit=crop',
    'A4': 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&h=500&fit=crop',
    'Q3': 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&h=500&fit=crop',
    'Q5': 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=800&h=500&fit=crop',
    'default': 'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?w=800&h=500&fit=crop'
  },
  'Ford': {
    'Fiesta': 'https://images.unsplash.com/photo-1551830820-330a71b99659?w=800&h=500&fit=crop',
    'Focus': 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&h=500&fit=crop',
    'Puma': 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&h=500&fit=crop',
    'Kuga': 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&h=500&fit=crop',
    'default': 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&h=500&fit=crop'
  },
  'Hyundai': {
    'i10': 'https://images.unsplash.com/photo-1629897048514-3dd7414fe72a?w=800&h=500&fit=crop',
    'i20': 'https://images.unsplash.com/photo-1629897048514-3dd7414fe72a?w=800&h=500&fit=crop',
    'Tucson': 'https://images.unsplash.com/photo-1637072388637-1f11b05a40c1?w=800&h=500&fit=crop',
    'Kona': 'https://images.unsplash.com/photo-1637072388637-1f11b05a40c1?w=800&h=500&fit=crop',
    'default': 'https://images.unsplash.com/photo-1637072388637-1f11b05a40c1?w=800&h=500&fit=crop'
  },
  'Kia': {
    'Picanto': 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=800&h=500&fit=crop',
    'Rio': 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=800&h=500&fit=crop',
    'Sportage': 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=800&h=500&fit=crop',
    'default': 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=800&h=500&fit=crop'
  },
  'Nissan': {
    'Micra': 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=800&h=500&fit=crop',
    'Juke': 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&h=500&fit=crop',
    'Qashqai': 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=800&h=500&fit=crop',
    'default': 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=800&h=500&fit=crop'
  },
  'Fiat': {
    '500': 'https://images.unsplash.com/photo-1595787142916-aa0f36cfc545?w=800&h=500&fit=crop',
    'Panda': 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&h=500&fit=crop',
    'default': 'https://images.unsplash.com/photo-1595787142916-aa0f36cfc545?w=800&h=500&fit=crop'
  },
  'Citroën': {
    'C3': 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&h=500&fit=crop',
    'C4': 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&h=500&fit=crop',
    'default': 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&h=500&fit=crop'
  },
  'Opel': {
    'Corsa': 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&h=500&fit=crop',
    'Astra': 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&h=500&fit=crop',
    'default': 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&h=500&fit=crop'
  }
};

// Fallback category images (high quality car photos from Unsplash)
const carImagesByCategory: Record<string, string> = {
  'Économique': 'https://images.unsplash.com/photo-1601929862217-f1bf94503333?w=800&h=500&fit=crop',
  'economy': 'https://images.unsplash.com/photo-1601929862217-f1bf94503333?w=800&h=500&fit=crop',
  'Mini': 'https://images.unsplash.com/photo-1595787142916-aa0f36cfc545?w=800&h=500&fit=crop',
  'Compacte': 'https://images.unsplash.com/photo-1471479917193-f00955256257?w=800&h=500&fit=crop',
  'compact': 'https://images.unsplash.com/photo-1471479917193-f00955256257?w=800&h=500&fit=crop',
  'Berline': 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&h=500&fit=crop',
  'sedan': 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&h=500&fit=crop',
  'SUV': 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&h=500&fit=crop',
  'suv': 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&h=500&fit=crop',
  'Luxe': 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&h=500&fit=crop',
  'luxury': 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&h=500&fit=crop',
  'premium': 'https://images.unsplash.com/photo-1563720360172-67b8f3dce741?w=800&h=500&fit=crop',
  'Monospace': 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=500&fit=crop',
  'minivan': 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=500&fit=crop',
  'default': 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&h=500&fit=crop'
};

function getCarImage(category: string, brand?: string, model?: string): string {
  // PRIORITY 1: Use imagin.studio for real-time car images (like Kiwi/Trip.com)
  if (brand && model) {
    return getImaginStudioCarImage(brand, model);
  }

  // PRIORITY 2: Use imagin.studio with brand only
  if (brand) {
    const defaultModels: Record<string, string> = {
      'Toyota': 'corolla',
      'Renault': 'clio',
      'Peugeot': '308',
      'Volkswagen': 'golf',
      'Mercedes-Benz': 'cclass',
      'BMW': '3series',
      'Audi': 'a4',
      'Ford': 'focus',
      'Hyundai': 'i20',
      'Kia': 'sportage',
      'Nissan': 'qashqai',
      'Fiat': '500',
      'Citroën': 'c3',
      'Opel': 'corsa',
      'Honda': 'civic',
      'Mazda': '3',
      'Suzuki': 'swift',
      'Seat': 'leon',
      'Skoda': 'octavia',
      'Volvo': 'xc60'
    };

    const defaultModel = defaultModels[brand] || 'sedan';
    return getImaginStudioCarImage(brand, defaultModel);
  }

  // PRIORITY 3: Map category to a known car for imagin.studio
  const categoryToCar: Record<string, { brand: string; model: string }> = {
    'Économique': { brand: 'toyota', model: 'yaris' },
    'economy': { brand: 'toyota', model: 'yaris' },
    'Mini': { brand: 'fiat', model: '500' },
    'Compacte': { brand: 'volkswagen', model: 'golf' },
    'compact': { brand: 'volkswagen', model: 'golf' },
    'Berline': { brand: 'mercedes', model: 'cclass' },
    'sedan': { brand: 'mercedes', model: 'cclass' },
    'SUV': { brand: 'bmw', model: 'x5' },
    'suv': { brand: 'bmw', model: 'x5' },
    'Luxe': { brand: 'mercedes', model: 'sclass' },
    'luxury': { brand: 'mercedes', model: 'sclass' },
    'premium': { brand: 'audi', model: 'a6' },
    'Monospace': { brand: 'renault', model: 'scenic' },
    'minivan': { brand: 'renault', model: 'scenic' }
  };

  const carMapping = categoryToCar[category] || categoryToCar[category.toLowerCase()];
  if (carMapping) {
    return getImaginStudioCarImage(carMapping.brand, carMapping.model);
  }

  // PRIORITY 4: Try category keywords
  const lowerCat = category.toLowerCase();
  for (const [key, mapping] of Object.entries(categoryToCar)) {
    if (lowerCat.includes(key.toLowerCase())) {
      return getImaginStudioCarImage(mapping.brand, mapping.model);
    }
  }

  // PRIORITY 5: Default fallback using imagin.studio with generic car
  return getImaginStudioCarImage('toyota', 'corolla');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting
  const clientIP = getClientIP(req);
  const rateLimitResult = checkRateLimit(clientIP, { ...RATE_LIMITS.SEARCH, keyPrefix: 'cars' });

  if (!rateLimitResult.allowed) {
    console.log(`Rate limit exceeded for IP: ${clientIP.substring(0, 8)}...`);
    return createRateLimitResponse(rateLimitResult, RATE_LIMITS.SEARCH, corsHeaders);
  }

  try {
    const body = await req.json();

    // Validate request with Zod
    const validation = validateData(carRentalSchema, body);

    if (!validation.success) {
      return createValidationErrorResponse(validation.errors!, corsHeaders);
    }

    const { pickupLocation, partnerOnly } = validation.data!;

    console.log('Searching car rentals (partner-only):', { pickupLocation, partnerOnly });

    // 2026-09-10: RapidAPI (Booking.com, Priceline, Skyscanner, Cars-Rental
    // API, Kayak) has been removed entirely - real agency partners are now
    // onboarding and taking real payments, and this marketplace only ever
    // shows vehicles an agency actually listed. No key, no third-party
    // call, no fictitious inventory possible even by misconfiguration.
    const partnerCars = await fetchPartnerCars(partnerOnly ? null : pickupLocation);
    partnerCars.sort((a, b) => a.price - b.price);
    await signCarResults(partnerCars, pickupLocation);

    return new Response(
      JSON.stringify({ success: true, data: partnerCars, source: partnerCars.length > 0 ? 'partner' : 'none' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in car-rental function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: [],
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
