import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { carRentalSchema, validateData, createValidationErrorResponse } from "../_shared/zodValidation.ts";
import { getClientIP, checkRateLimit, createRateLimitResponse, getRateLimitHeaders, RATE_LIMITS } from "../_shared/rate-limiter.ts";
import { signOffer } from "../_shared/priceSignature.ts";
import { applyMarkup } from "../_shared/pricing.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OFFER_VALIDITY_MINUTES = 30;

// Apply the retail markup on top of the raw supplier daily price, overwrite
// car.price with it so the customer sees exactly what they'll be charged,
// then attach a server-signed offer so create-booking can verify at checkout
// time that this exact price/name/location bundle really came out of this
// search — never out of the client. `noMarkupSources` skips the markup step
// (partner listings already show their own final retail price).
async function signCarResults(cars: any[], fallbackLocation: string, noMarkupSources: Set<string> = new Set()) {
  const expiresAt = new Date(Date.now() + OFFER_VALIDITY_MINUTES * 60 * 1000).toISOString();

  for (const car of cars) {
    const supplierPrice = Number(car.price) || 0;
    const unitPrice = noMarkupSources.has(car.source) ? Math.round(supplierPrice) : applyMarkup(supplierPrice);
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
  // Additional fields for Trip.com/Kiwi style
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
}

// Real-time car image API using imagin.studio (same as Kiwi/Trip.com)
function getImaginStudioCarImage(brand: string, model: string, color?: string): string {
  // imagin.studio API - free tier available, used by major travel sites
  const make = brand.toLowerCase().replace(/[^a-z0-9]/g, '');
  const modelFamily = model.toLowerCase().replace(/[^a-z0-9]/g, '').split(' ')[0];
  const paintColor = color || 'black';
  
  // Build imagin.studio URL with parameters for high-quality car renders
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

// Alternative: Car Data Images API from RapidAPI
async function fetchCarDataImage(brand: string, model: string, rapidApiKey: string): Promise<string | null> {
  try {
    // Use Car Data API which has reliable image endpoints
    const response = await fetch(
      `https://car-data.p.rapidapi.com/cars?limit=1&make=${encodeURIComponent(brand)}&model=${encodeURIComponent(model)}`,
      {
        headers: {
          'X-RapidAPI-Key': rapidApiKey,
          'X-RapidAPI-Host': 'car-data.p.rapidapi.com',
        },
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      if (data?.[0]) {
        // Car Data API returns car info, use imagin.studio with exact model info
        const car = data[0];
        return getImaginStudioCarImage(car.make || brand, car.model || model);
      }
    }
    return null;
  } catch (error) {
    console.log('Car Data API error, using imagin.studio directly');
    return null;
  }
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
    // Map common models for each brand
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

// Provider logos
const providerLogos: Record<string, string> = {
  'Europcar': 'https://logo.clearbit.com/europcar.com',
  'Hertz': 'https://logo.clearbit.com/hertz.com',
  'Avis': 'https://logo.clearbit.com/avis.com',
  'Sixt': 'https://logo.clearbit.com/sixt.com',
  'Enterprise': 'https://logo.clearbit.com/enterprise.com',
  'Budget': 'https://logo.clearbit.com/budget.com',
  'National': 'https://logo.clearbit.com/nationalcar.com',
  'Alamo': 'https://logo.clearbit.com/alamo.com',
  'Dollar': 'https://logo.clearbit.com/dollar.com',
  'Thrifty': 'https://logo.clearbit.com/thrifty.com',
};

// Search cars using Booking.com Car Rental API
async function searchBookingCars(
  pickupLocation: string,
  pickupDate: string,
  dropoffDate: string,
  pickupTime: string,
  dropoffTime: string,
  rapidApiKey: string
): Promise<CarResult[]> {
  try {
    console.log('Searching Booking.com Car Rentals...');
    
    // First get location coordinates
    const locationResponse = await fetch(
      `https://booking-com15.p.rapidapi.com/api/v1/cars/searchDestination?query=${encodeURIComponent(pickupLocation)}`,
      {
        headers: {
          'X-RapidAPI-Key': rapidApiKey,
          'X-RapidAPI-Host': 'booking-com15.p.rapidapi.com',
        },
      }
    );

    let coordinates = { lat: '0', lng: '0', name: pickupLocation };
    if (locationResponse.ok) {
      const locData = await locationResponse.json();
      if (locData.data && locData.data[0]) {
        coordinates.lat = locData.data[0].latitude || '0';
        coordinates.lng = locData.data[0].longitude || '0';
        coordinates.name = locData.data[0].name || pickupLocation;
        console.log('Booking.com coordinates found');
      }
    }

    const bookingParams = new URLSearchParams({
      pick_up_latitude: coordinates.lat,
      pick_up_longitude: coordinates.lng,
      drop_off_latitude: coordinates.lat,
      drop_off_longitude: coordinates.lng,
      pick_up_date: pickupDate,
      drop_off_date: dropoffDate,
      pick_up_time: pickupTime,
      drop_off_time: dropoffTime,
      driver_age: '30',
      currency_code: 'EUR',
    });

    const response = await fetch(
      `https://booking-com15.p.rapidapi.com/api/v1/cars/searchCarRentals?${bookingParams}`,
      {
        headers: {
          'X-RapidAPI-Key': rapidApiKey,
          'X-RapidAPI-Host': 'booking-com15.p.rapidapi.com',
        },
      }
    );

    if (!response.ok) {
      console.error('Booking.com Cars API error:', response.status);
      return [];
    }

    const data = await response.json();

    if (data.data?.vehicles && Array.isArray(data.data.vehicles)) {
      return data.data.vehicles.slice(0, 15).map((vehicle: any, index: number) => {
        const category = vehicle.category || vehicle.vehicle_info?.category || 'Standard';
        const brand = vehicle.vehicle_info?.v_make || vehicle.make || 'Unknown';
        const model = vehicle.vehicle_info?.v_name || vehicle.name || 'Véhicule';
        
        return {
          id: `booking-${vehicle.id || index}`,
          name: `${brand} ${model}`.trim(),
          brand,
          model,
          category,
          price: parseFloat(vehicle.price?.total_price || vehicle.pricing?.total || 50),
          currency: 'EUR',
          rating: vehicle.supplier_info?.rating || 4.5,
          reviews: vehicle.supplier_info?.reviews_count || Math.floor(Math.random() * 500) + 50,
          image: vehicle.image_url || vehicle.vehicle_info?.image || getCarImage(category, brand, model),
          seats: vehicle.passengers || vehicle.vehicle_info?.passengers || 5,
          transmission: vehicle.transmission?.toLowerCase().includes('auto') ? 'Automatique' : 'Manuelle',
          fuel: vehicle.fuel_type || 'Essence',
          luggage: vehicle.bags_fit || vehicle.vehicle_info?.bags || 3,
          airConditioning: vehicle.has_ac !== false,
          provider: vehicle.supplier_name || 'Booking.com',
          source: 'booking',
          unlimitedMileage: vehicle.unlimited_mileage !== false,
          freeCancellation: vehicle.free_cancellation === true,
          fuelPolicy: vehicle.fuel_policy || 'full-to-full',
          deposit: vehicle.deposit_amount || null,
          doors: vehicle.doors || 4,
          engineSize: vehicle.engine_size || '1.4L',
          year: 2024 - Math.floor(Math.random() * 3),
          pickupLocation: coordinates.name,
          features: [
            vehicle.has_ac !== false ? 'Climatisation' : null,
            vehicle.unlimited_mileage !== false ? 'Kilométrage illimité' : null,
            'GPS disponible',
            'Assurance incluse',
          ].filter(Boolean) as string[],
        };
      });
    }

    return [];
  } catch (error) {
    console.error('Booking.com Cars exception:', error);
    return [];
  }
}

// Search cars using Priceline API
async function searchPricelineCars(
  pickupLocation: string,
  pickupDate: string,
  dropoffDate: string,
  pickupTime: string,
  dropoffTime: string,
  rapidApiKey: string
): Promise<CarResult[]> {
  try {
    console.log('Searching Priceline Car Rentals...');
    
    // First search for location
    const locationResponse = await fetch(
      `https://priceline-com-provider.p.rapidapi.com/v2/cars/autoComplete?string=${encodeURIComponent(pickupLocation)}`,
      {
        headers: {
          'X-RapidAPI-Key': rapidApiKey,
          'X-RapidAPI-Host': 'priceline-com-provider.p.rapidapi.com',
        },
      }
    );

    let locationId = '';
    let locationName = pickupLocation;
    if (locationResponse.ok) {
      const locData = await locationResponse.json();
      if (locData.results && locData.results[0]) {
        locationId = locData.results[0].id || locData.results[0].cityId || '';
        locationName = locData.results[0].name || pickupLocation;
      }
    }

    if (!locationId) {
      console.log('Priceline: No location found');
      return [];
    }

    const pricelineParams = new URLSearchParams({
      pickUpLocationId: locationId,
      dropOffLocationId: locationId,
      pickUpDate: pickupDate,
      dropOffDate: dropoffDate,
      pickUpTime: pickupTime,
      dropOffTime: dropoffTime,
    });

    const response = await fetch(
      `https://priceline-com-provider.p.rapidapi.com/v2/cars/resultsPage?${pricelineParams}`,
      {
        headers: {
          'X-RapidAPI-Key': rapidApiKey,
          'X-RapidAPI-Host': 'priceline-com-provider.p.rapidapi.com',
        },
      }
    );

    if (!response.ok) {
      console.error('Priceline Cars API error:', response.status);
      return [];
    }

    const data = await response.json();

    if (data.cars && Array.isArray(data.cars)) {
      return data.cars.slice(0, 15).map((car: any, index: number) => {
        const category = car.category || car.class || 'Standard';
        const nameParts = (car.name || car.vehicle_name || 'Véhicule').split(' ');
        const brand = nameParts[0] || 'Unknown';
        const model = nameParts.slice(1).join(' ') || car.description || 'Model';
        
        return {
          id: `priceline-${index}`,
          name: car.name || car.vehicle_name || car.description || 'Véhicule',
          brand,
          model,
          category,
          price: parseFloat(car.price || car.total_price || car.displayPrice || 45),
          currency: 'EUR',
          rating: car.rating || 4.3,
          reviews: car.reviews_count || Math.floor(Math.random() * 400) + 30,
          image: car.image || car.vehicleImage || getCarImage(category, brand, model),
          seats: car.passengers || car.capacity || 5,
          transmission: car.transmission?.toLowerCase().includes('auto') ? 'Automatique' : 'Manuelle',
          fuel: car.fuel || car.fuelType || 'Essence',
          luggage: car.baggage || car.bags || 3,
          airConditioning: true,
          provider: car.provider || car.supplierName || 'Priceline',
          source: 'priceline',
          unlimitedMileage: car.unlimitedMileage !== false,
          freeCancellation: car.freeCancellation === true,
          fuelPolicy: car.fuelPolicy || 'full-to-full',
          deposit: car.deposit || null,
          doors: car.doors || 4,
          engineSize: car.engineSize || '1.6L',
          year: 2024 - Math.floor(Math.random() * 3),
          pickupLocation: locationName,
          features: [
            'Climatisation',
            car.unlimitedMileage !== false ? 'Kilométrage illimité' : null,
            'Assistance routière 24/7',
          ].filter(Boolean) as string[],
        };
      });
    }

    return [];
  } catch (error) {
    console.error('Priceline Cars exception:', error);
    return [];
  }
}

// Search cars using Sky-Scanner API (via RapidAPI)
async function searchSkyscannerCars(
  pickupLocation: string,
  pickupDate: string,
  dropoffDate: string,
  pickupTime: string,
  dropoffTime: string,
  rapidApiKey: string
): Promise<CarResult[]> {
  try {
    console.log('Searching Skyscanner Car Rentals...');
    
    // Search for location entity
    const locationResponse = await fetch(
      `https://sky-scrapper.p.rapidapi.com/api/v1/cars/searchLocation?query=${encodeURIComponent(pickupLocation)}`,
      {
        headers: {
          'X-RapidAPI-Key': rapidApiKey,
          'X-RapidAPI-Host': 'sky-scrapper.p.rapidapi.com',
        },
      }
    );

    let entityId = '';
    let locationName = pickupLocation;
    if (locationResponse.ok) {
      const locData = await locationResponse.json();
      if (locData.data && locData.data[0]) {
        entityId = locData.data[0].entityId || locData.data[0].id || '';
        locationName = locData.data[0].name || pickupLocation;
      }
    }

    if (!entityId) {
      console.log('Skyscanner: No location entity found');
      return [];
    }

    const searchParams = new URLSearchParams({
      pickUpEntityId: entityId,
      dropOffEntityId: entityId,
      pickUpDate: pickupDate,
      dropOffDate: dropoffDate,
      pickUpTime: pickupTime,
      dropOffTime: dropoffTime,
      currency: 'EUR',
      market: 'FR',
      locale: 'fr-FR',
    });

    const response = await fetch(
      `https://sky-scrapper.p.rapidapi.com/api/v1/cars/searchCars?${searchParams}`,
      {
        headers: {
          'X-RapidAPI-Key': rapidApiKey,
          'X-RapidAPI-Host': 'sky-scrapper.p.rapidapi.com',
        },
      }
    );

    if (!response.ok) {
      console.error('Skyscanner Cars API error:', response.status);
      return [];
    }

    const data = await response.json();

    if (data.data?.cars && Array.isArray(data.data.cars)) {
      return data.data.cars.slice(0, 15).map((car: any, index: number) => {
        const category = car.category || car.carType || 'Standard';
        const nameParts = (car.name || car.carName || car.model || 'Véhicule').split(' ');
        const brand = nameParts[0] || 'Unknown';
        const model = nameParts.slice(1).join(' ') || 'Model';
        
        return {
          id: `skyscanner-${index}`,
          name: car.name || car.carName || car.model || 'Véhicule',
          brand,
          model,
          category,
          price: parseFloat(car.price?.amount || car.totalPrice || 55),
          currency: 'EUR',
          rating: car.rating || 4.4,
          reviews: car.reviewsCount || Math.floor(Math.random() * 350) + 40,
          image: car.imageUrl || car.image || getCarImage(category, brand, model),
          seats: car.seats || car.passengers || 5,
          transmission: car.transmission?.toLowerCase().includes('manual') ? 'Manuelle' : 'Automatique',
          fuel: car.fuelType || car.fuel || 'Essence',
          luggage: car.bags || car.luggage || 3,
          airConditioning: car.airConditioning !== false,
          provider: car.supplier || car.providerName || 'Skyscanner',
          source: 'skyscanner',
          unlimitedMileage: car.unlimitedMileage !== false,
          freeCancellation: car.freeCancellation === true,
          fuelPolicy: car.fuelPolicy || 'full-to-full',
          deposit: car.deposit || null,
          doors: car.doors || 4,
          engineSize: car.engineSize || '1.8L',
          year: 2024 - Math.floor(Math.random() * 3),
          pickupLocation: locationName,
          features: [
            car.airConditioning !== false ? 'Climatisation' : null,
            car.unlimitedMileage !== false ? 'Kilométrage illimité' : null,
            'Protection vol',
          ].filter(Boolean) as string[],
        };
      });
    }

    return [];
  } catch (error) {
    console.error('Skyscanner Cars exception:', error);
    return [];
  }
}

// Search cars using Car Rental API (cars-rental.p.rapidapi.com)
async function searchCarsRentalAPI(
  pickupLocation: string,
  pickupDate: string,
  dropoffDate: string,
  pickupTime: string,
  dropoffTime: string,
  rapidApiKey: string
): Promise<CarResult[]> {
  try {
    console.log('Searching Cars Rental API...');
    
    const searchParams = new URLSearchParams({
      pickUpLocation: pickupLocation,
      dropOffLocation: pickupLocation,
      pickUpDate: pickupDate,
      dropOffDate: dropoffDate,
      pickUpTime: pickupTime,
      dropOffTime: dropoffTime,
      currency: 'EUR',
    });

    const response = await fetch(
      `https://cars-rental.p.rapidapi.com/api/cars/search?${searchParams}`,
      {
        headers: {
          'X-RapidAPI-Key': rapidApiKey,
          'X-RapidAPI-Host': 'cars-rental.p.rapidapi.com',
        },
      }
    );

    if (!response.ok) {
      console.log('Cars Rental API not available:', response.status);
      return [];
    }

    const data = await response.json();

    if (data.cars && Array.isArray(data.cars)) {
      return data.cars.slice(0, 15).map((car: any, index: number) => {
        const category = car.category || 'Standard';
        return {
          id: `carsrental-${index}`,
          name: car.name || car.model || 'Véhicule',
          brand: car.brand || 'Unknown',
          model: car.model || 'Model',
          category,
          price: parseFloat(car.price || car.totalPrice || 50),
          currency: 'EUR',
          rating: car.rating || 4.3,
          reviews: car.reviews || Math.floor(Math.random() * 300) + 25,
          image: car.image || getCarImage(category, car.brand, car.model),
          seats: car.seats || 5,
          transmission: car.transmission || 'Automatique',
          fuel: car.fuel || 'Essence',
          luggage: car.luggage || 3,
          airConditioning: true,
          provider: car.provider || 'Car Rental',
          source: 'carsrental',
          unlimitedMileage: car.unlimitedMileage !== false,
          freeCancellation: car.freeCancellation === true,
          fuelPolicy: car.fuelPolicy || 'full-to-full',
          deposit: car.deposit || null,
          doors: car.doors || 4,
          engineSize: car.engineSize || '1.5L',
          year: 2024 - Math.floor(Math.random() * 3),
          pickupLocation,
          features: ['Climatisation', 'Kilométrage illimité'],
        };
      });
    }

    return [];
  } catch (error) {
    console.error('Cars Rental API exception:', error);
    return [];
  }
}

// Enhanced mock data with comprehensive car details (Trip.com/Kiwi style)
function getMockCarRentals(pickupLocation: string): CarResult[] {
  const cars = [
    { brand: 'Toyota', model: 'Corolla 2024', category: 'Économique', price: 38, seats: 5, transmission: 'Automatique', fuel: 'Essence', doors: 4, luggage: 3, engine: '1.8L' },
    { brand: 'Renault', model: 'Clio V', category: 'Compacte', price: 33, seats: 5, transmission: 'Manuelle', fuel: 'Essence', doors: 5, luggage: 2, engine: '1.0L' },
    { brand: 'Peugeot', model: '308 GT', category: 'Berline', price: 53, seats: 5, transmission: 'Automatique', fuel: 'Diesel', doors: 5, luggage: 4, engine: '1.5L' },
    { brand: 'Mercedes-Benz', model: 'Classe E', category: 'Luxe', price: 95, seats: 5, transmission: 'Automatique', fuel: 'Diesel', doors: 4, luggage: 4, engine: '2.0L' },
    { brand: 'Toyota', model: 'Land Cruiser', category: 'SUV', price: 110, seats: 7, transmission: 'Automatique', fuel: 'Diesel', doors: 5, luggage: 5, engine: '2.8L' },
    { brand: 'Volkswagen', model: 'Polo', category: 'Économique', price: 30, seats: 5, transmission: 'Manuelle', fuel: 'Essence', doors: 5, luggage: 2, engine: '1.0L' },
    { brand: 'BMW', model: 'X5', category: 'SUV', price: 125, seats: 5, transmission: 'Automatique', fuel: 'Diesel', doors: 5, luggage: 5, engine: '3.0L' },
    { brand: 'Audi', model: 'A4 Avant', category: 'Berline', price: 75, seats: 5, transmission: 'Automatique', fuel: 'Essence', doors: 5, luggage: 4, engine: '2.0L' },
    { brand: 'Nissan', model: 'Qashqai', category: 'SUV', price: 65, seats: 5, transmission: 'Automatique', fuel: 'Essence', doors: 5, luggage: 4, engine: '1.3L' },
    { brand: 'Hyundai', model: 'Tucson Hybrid', category: 'SUV', price: 72, seats: 5, transmission: 'Automatique', fuel: 'Hybride', doors: 5, luggage: 4, engine: '1.6L' },
    { brand: 'Ford', model: 'Fiesta', category: 'Compacte', price: 28, seats: 5, transmission: 'Manuelle', fuel: 'Essence', doors: 5, luggage: 2, engine: '1.0L' },
    { brand: 'Citroën', model: 'C3 Aircross', category: 'Compacte', price: 42, seats: 5, transmission: 'Automatique', fuel: 'Essence', doors: 5, luggage: 3, engine: '1.2L' },
    { brand: 'Kia', model: 'Sportage', category: 'SUV', price: 68, seats: 5, transmission: 'Automatique', fuel: 'Essence', doors: 5, luggage: 4, engine: '1.6L' },
    { brand: 'Skoda', model: 'Octavia', category: 'Berline', price: 48, seats: 5, transmission: 'Automatique', fuel: 'Diesel', doors: 5, luggage: 4, engine: '2.0L' },
    { brand: 'Fiat', model: '500', category: 'Mini', price: 25, seats: 4, transmission: 'Manuelle', fuel: 'Essence', doors: 3, luggage: 1, engine: '1.0L' },
    { brand: 'Seat', model: 'Leon', category: 'Compacte', price: 40, seats: 5, transmission: 'Manuelle', fuel: 'Essence', doors: 5, luggage: 3, engine: '1.5L' },
    { brand: 'Dacia', model: 'Duster', category: 'SUV', price: 45, seats: 5, transmission: 'Manuelle', fuel: 'Diesel', doors: 5, luggage: 4, engine: '1.5L' },
    { brand: 'Volvo', model: 'XC60', category: 'SUV', price: 105, seats: 5, transmission: 'Automatique', fuel: 'Hybride', doors: 5, luggage: 5, engine: '2.0L' },
    { brand: 'Opel', model: 'Corsa-e', category: 'Économique', price: 45, seats: 5, transmission: 'Automatique', fuel: 'Électrique', doors: 5, luggage: 2, engine: 'EV' },
    { brand: 'Tesla', model: 'Model 3', category: 'Luxe', price: 85, seats: 5, transmission: 'Automatique', fuel: 'Électrique', doors: 4, luggage: 3, engine: 'EV' },
  ];

  const providers = ['Europcar', 'Hertz', 'Avis', 'Sixt', 'Enterprise', 'Budget', 'National', 'Alamo', 'Dollar', 'Thrifty'];
  const fuelPolicies = ['full-to-full', 'same-to-same', 'full-to-empty'];

  return cars.map((car, index) => ({
    id: `car-${index + 1}`,
    name: `${car.brand} ${car.model}`,
    brand: car.brand,
    model: car.model,
    category: car.category,
    price: car.price,
    currency: 'EUR',
    rating: parseFloat((4.2 + Math.random() * 0.7).toFixed(1)),
    reviews: Math.floor(Math.random() * 800) + 50,
    image: getCarImage(car.category, car.brand, car.model),
    seats: car.seats,
    transmission: car.transmission,
    fuel: car.fuel,
    luggage: car.luggage,
    airConditioning: true,
    provider: providers[index % providers.length],
    source: 'breserve',
    unlimitedMileage: Math.random() > 0.3,
    freeCancellation: Math.random() > 0.4,
    fuelPolicy: fuelPolicies[Math.floor(Math.random() * fuelPolicies.length)],
    deposit: Math.random() > 0.5 ? Math.floor(Math.random() * 500) + 200 : null,
    doors: car.doors,
    engineSize: car.engine,
    year: 2024 - Math.floor(Math.random() * 2),
    pickupLocation,
    features: [
      'Climatisation',
      Math.random() > 0.3 ? 'Kilométrage illimité' : 'Kilométrage limité (500 km/jour)',
      Math.random() > 0.5 ? 'GPS inclus' : 'GPS en option',
      'Assurance collision (CDW)',
      Math.random() > 0.4 ? 'Protection vol (TP)' : null,
      Math.random() > 0.6 ? 'Siège enfant disponible' : null,
      'Assistance routière 24/7',
    ].filter(Boolean) as string[],
  }));
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

    const { pickupLocation, dropoffLocation, pickupDate, dropoffDate, pickupTime = '10:00', dropoffTime = '10:00', partnerOnly } = validation.data!;

    console.log('Searching car rentals:', { pickupLocation, pickupDate, dropoffDate, partnerOnly });

    if (partnerOnly) {
      const partnerCars = await fetchPartnerCars(null);
      await signCarResults(partnerCars, pickupLocation, new Set(['partner']));
      return new Response(
        JSON.stringify({ success: true, data: partnerCars, source: 'partner' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const partnerCars = await fetchPartnerCars(pickupLocation);

    const rapidApiKey = Deno.env.get('RAPIDAPI_KEY');
    if (!rapidApiKey) {
      console.log('RapidAPI key not configured, returning mock data + partner cars');
      const combined = [...getMockCarRentals(pickupLocation), ...partnerCars];
      await signCarResults(combined, pickupLocation, new Set(['partner']));
      return new Response(
        JSON.stringify({ success: true, data: combined, source: partnerCars.length > 0 ? 'mixed' : 'mock' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const kayakRapidApiKey = Deno.env.get('KAYAK_RAPIDAPI_KEY') || rapidApiKey;
    const kayakRapidApiHost = Deno.env.get('KAYAK_RAPIDAPI_HOST') || 'kayak-api.p.rapidapi.com';

    // Search all available car rental APIs in parallel
    const [bookingResults, pricelineResults, skyscannerResults, carsRentalResults, kayakResults] = await Promise.all([
      searchBookingCars(pickupLocation, pickupDate, dropoffDate, pickupTime, dropoffTime, rapidApiKey),
      searchPricelineCars(pickupLocation, pickupDate, dropoffDate, pickupTime, dropoffTime, rapidApiKey),
      searchSkyscannerCars(pickupLocation, pickupDate, dropoffDate, pickupTime, dropoffTime, rapidApiKey),
      searchCarsRentalAPI(pickupLocation, pickupDate, dropoffDate, pickupTime, dropoffTime, rapidApiKey),
      searchKayakCars(pickupLocation, pickupDate, dropoffDate, pickupTime, dropoffTime, kayakRapidApiKey, kayakRapidApiHost),
    ]);

    const allCars = [...bookingResults, ...pricelineResults, ...skyscannerResults, ...carsRentalResults, ...kayakResults, ...partnerCars];

    console.log(`Total cars found: ${allCars.length} (Booking: ${bookingResults.length}, Priceline: ${pricelineResults.length}, Skyscanner: ${skyscannerResults.length}, CarsRental: ${carsRentalResults.length}, Kayak: ${kayakResults.length}, Partner: ${partnerCars.length})`);


    // If no API results (and no partner cars either), return mock data
    if (allCars.length === 0) {
      console.log('No car rental results from APIs, returning mock data');
      const mockCars = getMockCarRentals(pickupLocation);
      await signCarResults(mockCars, pickupLocation);
      return new Response(
        JSON.stringify({ success: true, data: mockCars, source: 'mock' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sort by price
    allCars.sort((a, b) => a.price - b.price);
    await signCarResults(allCars, pickupLocation, new Set(['partner']));

    return new Response(
      JSON.stringify({ success: true, data: allCars, source: 'api' }),
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

// Search cars using Kayak API via RapidAPI
async function searchKayakCars(
  pickupLocation: string,
  pickupDate: string,
  dropoffDate: string,
  pickupTime: string,
  dropoffTime: string,
  rapidApiKey: string,
  rapidApiHost: string
): Promise<CarResult[]> {
  try {
    console.log(`Resolving Kayak car location ID for: ${pickupLocation}`);
    
    // Step 1: Resolve location
    const locResponse = await fetch(
      `https://${rapidApiHost}/search-locations?query=${encodeURIComponent(pickupLocation)}&type=caronly`,
      {
        headers: {
          'X-RapidAPI-Key': rapidApiKey,
          'X-RapidAPI-Host': rapidApiHost
        }
      }
    );

    let locationId = "16078"; // Default fallback
    if (locResponse.ok) {
      const locData = await locResponse.json();
      if (locData.data && locData.data[0]) {
        locationId = locData.data[0].ctyId || locData.data[0].id || locationId;
      }
    }

    // Step 2: Search cars
    const pickupHour = parseInt(pickupTime.split(':')[0]) || 10;
    const dropoffHour = parseInt(dropoffTime.split(':')[0]) || 10;

    const payload = {
      pickup_location: locationId.toString(),
      pickup_date: pickupDate,
      dropoff_date: dropoffDate,
      pickup_hour: pickupHour,
      dropoff_hour: dropoffHour,
      searchMetaData: {
        pageNumber: 0,
        pageSize: 20,
        priceMode: "total"
      },
      carSearchParams: {
        sortMode: "price_a"
      }
    };

    const response = await fetch(
      `https://${rapidApiHost}/search-cars`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-RapidAPI-Key': rapidApiKey,
          'X-RapidAPI-Host': rapidApiHost
        },
        body: JSON.stringify(payload)
      }
    );

    if (!response.ok) {
      console.error('Kayak Cars API error:', response.status);
      return [];
    }

    const data = await response.json();
    const carList = data.data || data.results || data.cars || [];

    if (Array.isArray(carList) && carList.length > 0) {
      return carList.map((car: any, index: number) => {
        const brand = car.brand || car.make || 'Unknown';
        const model = car.model || 'Véhicule';
        const category = car.category || car.carClass || 'Standard';
        const price = car.price?.total || car.price || 50;

        return {
          id: `kayak-car-${index}`,
          name: `${brand} ${model}`,
          brand,
          model,
          category,
          price: parseFloat(price.toString()),
          currency: 'EUR',
          rating: car.rating || 4.2,
          reviews: car.reviews || 100,
          image: car.image || getCarImage(category, brand, model),
          seats: car.seats || 5,
          transmission: car.transmission || 'Automatique',
          fuel: car.fuel || 'Essence',
          luggage: car.luggage || 3,
          airConditioning: true,
          provider: car.provider || 'Kayak',
          source: 'kayak',
          unlimitedMileage: true,
          freeCancellation: true,
          fuelPolicy: 'full-to-full',
          deposit: null,
          doors: 4,
          engineSize: '1.6L',
          year: 2024,
          pickupLocation,
          features: ['Climatisation', 'Kilométrage illimité'],
        };
      });
    }

    return [];
  } catch (error) {
    console.error('Kayak Cars exception:', error);
    return [];
  }
}

