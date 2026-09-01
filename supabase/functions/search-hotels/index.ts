import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { hotelSearchSchema, validateData, createValidationErrorResponse } from "../_shared/zodValidation.ts";
import { getClientIP, checkRateLimit, createRateLimitResponse, getRateLimitHeaders, RATE_LIMITS } from "../_shared/rate-limiter.ts";
import { signOffer } from "../_shared/priceSignature.ts";
import { applyMarkup } from "../_shared/pricing.ts";

const OFFER_VALIDITY_MINUTES = 30;

// Extract a plain numeric price regardless of the provider's price shape
// (number, or { grandTotal|total }), apply the retail markup on top of the
// raw supplier price, then attach a server-signed offer so create-booking
// can verify at checkout time that this exact price/name/location bundle
// really came out of this search — never out of the client. The displayed
// hotel.price is overwritten with the marked-up value so what the customer
// sees is exactly what they'll be charged. `noMarkupSources` skips the
// markup step (partner listings already show their own final retail price).
async function signHotelResults(results: Record<string, any[]>, fallbackLocation: string, noMarkupSources: Set<string> = new Set()) {
  const expiresAt = new Date(Date.now() + OFFER_VALIDITY_MINUTES * 60 * 1000).toISOString();

  for (const [sourceKey, providerHotels] of Object.entries(results)) {
    const skipMarkup = noMarkupSources.has(sourceKey);
    for (const hotel of providerHotels) {
      const rawPrice = hotel.price;
      const supplierPrice = typeof rawPrice === 'object' && rawPrice !== null
        ? parseFloat(rawPrice.grandTotal ?? rawPrice.total ?? '0')
        : typeof rawPrice === 'number'
        ? rawPrice
        : parseFloat(rawPrice || '0');

      const unitPrice = skipMarkup ? Math.round(supplierPrice) : applyMarkup(supplierPrice);
      hotel.price = typeof rawPrice === 'object' && rawPrice !== null
        ? { ...rawPrice, grandTotal: unitPrice }
        : unitPrice;

      const payload = {
        service_type: 'hotel',
        service_name: String(hotel.name || 'Hôtel'),
        location: String(hotel.location || fallbackLocation),
        unit_price: unitPrice,
        currency: hotel.currency || 'EUR',
        expires_at: expiresAt,
      };

      hotel.offer_expires_at = expiresAt;
      hotel.offer_signature = await signOffer(payload);
    }
  }

  return results;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// City-specific placeholder images for better UX
const getCityPlaceholder = (location: string): string => {
  const cityPlaceholders: Record<string, string> = {
    'paris': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800',
    'dubai': 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800',
    'new york': 'https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?w=800',
    'tokyo': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800',
    'london': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800',
    'abidjan': 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=800',
    'dakar': 'https://images.unsplash.com/photo-1589996448606-27b26c2e2ff0?w=800',
    'casablanca': 'https://images.unsplash.com/photo-1577147443647-81856d5150a4?w=800',
    'marrakech': 'https://images.unsplash.com/photo-1597212618440-806262de4f6b?w=800',
    'cairo': 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=800',
    'cape town': 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=800',
    'johannesburg': 'https://images.unsplash.com/photo-1577948000111-9c970dfe3743?w=800',
    'lagos': 'https://images.unsplash.com/photo-1618828665011-0abd973f7bb8?w=800',
    'nairobi': 'https://images.unsplash.com/photo-1611348524140-53c9a25263d6?w=800',
    'rome': 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800',
    'barcelona': 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=800',
    'amsterdam': 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=800',
    'berlin': 'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=800',
    'bangkok': 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800',
    'singapore': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800',
    'sydney': 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800',
    'los angeles': 'https://images.unsplash.com/photo-1534190760961-74e8c1c5c3da?w=800',
    'miami': 'https://images.unsplash.com/photo-1506966953602-c20cc11f75e3?w=800',
  };
  
  const normalizedLocation = location.toLowerCase().trim();
  for (const [city, url] of Object.entries(cityPlaceholders)) {
    if (normalizedLocation.includes(city)) {
      return url;
    }
  }
  return 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800';
};

// Validate if URL is a real image URL
const isValidImageUrl = (url: string | undefined | null): boolean => {
  if (!url || typeof url !== 'string') return false;
  if (url.includes('placeholder') || url.includes('no-image') || url.includes('default')) return false;
  return url.startsWith('http') && (url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png') || url.includes('.webp') || url.includes('images.unsplash') || url.includes('cf.bstatic.com') || url.includes('exp.cdn-hotels') || url.includes('tripadvisor') || url.includes('agoda') || url.includes('expedia'));
};

// Fetch hotels that partner agencies listed themselves via /agency/services
// (the `services` table, type='hotel'). Public RLS ("Services are viewable
// by everyone" WHERE available = true) already permits this read with the
// anon key - no service-role key needed. Pass `location: null` to return
// every available partner hotel unfiltered.
async function fetchPartnerHotels(location: string | null): Promise<any[]> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    if (!supabaseUrl || !supabaseAnonKey) return [];

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('type', 'hotel')
      .eq('available', true);

    if (error || !data) {
      console.error('Partner services fetch failed:', error?.message);
      return [];
    }

    // Same loose "lowercase + includes()" matching style as getCityPlaceholder().
    const rows = location
      ? data.filter((s: any) => {
          const needle = location.toLowerCase().trim();
          const loc = (s.location || '').toLowerCase();
          const dest = (s.destination || '').toLowerCase();
          return loc.includes(needle) || needle.includes(loc) ||
                 (dest && (dest.includes(needle) || needle.includes(dest)));
        })
      : data;

    return rows.map((s: any) => {
      let imageUrl = s.image_url || (Array.isArray(s.images) && s.images[0]) || null;
      if (!isValidImageUrl(imageUrl)) imageUrl = getCityPlaceholder(s.location || location || '');
      const images = Array.isArray(s.images) && s.images.length > 0 ? s.images : [imageUrl];
      const rawAmenities = Array.isArray(s.amenities)
        ? s.amenities
        : (s.amenities && typeof s.amenities === 'object' ? Object.values(s.amenities) : []);
      const ratingOn5 = Number(s.rating) || 4.0;

      return {
        id: s.id,
        name: s.name,
        location: s.location || location || '',
        address: s.location || '',
        price: { grandTotal: Number(s.price_per_unit) || 0 },
        currency: s.currency || 'EUR',
        rating: Math.min(ratingOn5 * 2, 10),
        stars: Math.max(1, Math.min(5, Math.round(ratingOn5))),
        reviews: s.total_reviews || 0,
        image: imageUrl,
        images,
        description: s.description || `${s.name} à ${s.location}`,
        amenities: rawAmenities.length > 0 ? rawAmenities.slice(0, 8) : ['Wifi', 'Restaurant'],
        freeCancellation: false,
        breakfast: false,
        source: 'partner',
      };
    });
  } catch (error) {
    console.error('Partner hotels fetch exception:', error instanceof Error ? error.message : String(error));
    return [];
  }
}

// Transform Booking.com data to our format
const transformBookingData = (hotels: any[], searchLocation: string) => {
  return hotels.map(hotel => {
    // Extract official hotel name - prioritize all name fields
    const hotelName = hotel.hotel_name || 
                      hotel.name || 
                      hotel.hotel_name_trans ||
                      hotel.property?.name ||
                      hotel.property_name ||
                      hotel.hotelName ||
                      hotel.title ||
                      'Hôtel';
    
    // Extract complete address/location
    const location = hotel.city || 
                     hotel.address || 
                     hotel.city_in_trans ||
                     hotel.city_name_en ||
                     hotel.cityName ||
                     hotel.location ||
                     hotel.property?.address?.city ||
                     hotel.countrycode ||
                     searchLocation;
    
    // Extract main image URL with extensive fallbacks
    let imageUrl = hotel.max_1280_photo_url ||
                   hotel.max_photo_url ||
                   hotel.main_photo_url || 
                   hotel.photo_main_url ||
                   hotel.property?.photoUrls?.[0] ||
                   hotel.imageUrl ||
                   hotel.heroImage ||
                   hotel.mainImage ||
                   hotel.thumbnail ||
                   hotel.image ||
                   (hotel.photos && Array.isArray(hotel.photos) && hotel.photos[0]?.url_original) ||
                   (hotel.photos && Array.isArray(hotel.photos) && hotel.photos[0]) ||
                   (hotel.images && Array.isArray(hotel.images) && hotel.images[0]) ||
                   null;
    
    // Validate and fallback to city placeholder
    if (!isValidImageUrl(imageUrl)) {
      imageUrl = getCityPlaceholder(searchLocation);
    }
    
    // Extract all photo URLs
    const allImages = hotel.photo_urls || 
                      hotel.property?.photoUrls ||
                      hotel.photos?.map((p: any) => p.url_original || p) || 
                      hotel.images || 
                      [imageUrl];
    
    // Extract exact price with multiple paths
    const exactPrice = hotel.min_total_price || 
                       hotel.composite_price_breakdown?.gross_amount_per_night?.value ||
                       hotel.price_breakdown?.gross_price?.value ||
                       hotel.property?.priceBreakdown?.grossPrice?.value ||
                       hotel.price?.amount ||
                       hotel.minPrice ||
                       hotel.price ||
                       hotel.rate ||
                       50;
    
    // Extract rating (normalize to 0-10 scale or 0-5 stars)
    let rating = hotel.review_score || 
                 hotel.rating || 
                 hotel.property?.reviewScore ||
                 hotel.stars ||
                 hotel.starRating ||
                 hotel.guestRating ||
                 4.0;
    
    // If rating is on 0-5 scale, convert to 10 scale for display
    if (rating <= 5) rating = rating * 2;
    
    // Extract review count
    const reviewCount = hotel.review_nr || 
                        hotel.reviews_count || 
                        hotel.review_count ||
                        hotel.property?.reviewCount ||
                        hotel.reviewsCount ||
                        hotel.totalReviews ||
                        0;
    
    // Extract star rating
    const stars = hotel.class || 
                  hotel.stars || 
                  hotel.starRating ||
                  hotel.property?.propertyClass ||
                  Math.floor(rating / 2) ||
                  4;
    
    // Extract amenities/facilities
    const amenities = hotel.hotel_facilities_ids ? 
      ['Wifi', 'Restaurant', 'Parking'] : // Map facility IDs if needed
      hotel.hotel_facilities || 
      hotel.facilities || 
      hotel.amenities ||
      hotel.property?.facilities ||
      ['Wifi', 'Restaurant', 'Service de Chambre'];
    
    return {
      id: hotel.hotel_id || hotel.id || hotel.hotelId || hotel.property?.id || Math.random().toString(36),
      name: hotelName,
      location: location,
      address: hotel.address || hotel.property?.address?.streetAddress || '',
      price: { grandTotal: Math.round(exactPrice) },
      currency: hotel.currency_code || hotel.currency || 'EUR',
      rating: typeof rating === 'number' ? Math.min(rating, 10) : parseFloat(rating) || 8.0,
      stars: Math.min(stars, 5),
      reviews: reviewCount,
      image: imageUrl,
      images: Array.isArray(allImages) ? allImages.filter(Boolean).slice(0, 10) : [imageUrl],
      description: hotel.hotel_description || hotel.description || hotel.property?.description || `${hotelName} est un établissement de qualité offrant confort et services exceptionnels à ${location}.`,
      amenities: Array.isArray(amenities) ? amenities.slice(0, 8) : ['Wifi', 'Restaurant', 'Service de Chambre'],
      freeCancellation: hotel.is_free_cancellable || hotel.free_cancellation || false,
      breakfast: hotel.has_free_breakfast || hotel.breakfast_included || false,
    };
  });
};

// Transform TripAdvisor data to our format
const transformTripAdvisorData = (hotels: any[], searchLocation: string) => {
  return hotels.map(hotel => {
    // Extract name from various TripAdvisor fields
    const hotelName = hotel.name || 
                      hotel.location_string ||
                      hotel.title ||
                      'Hôtel';
    
    // Extract location
    const location = hotel.location_string || 
                     hotel.address_obj?.city ||
                     hotel.address ||
                     searchLocation;
    
    // Extract image - TripAdvisor specific paths
    let imageUrl = hotel.photo?.images?.large?.url ||
                   hotel.photo?.images?.medium?.url ||
                   hotel.photo?.images?.original?.url ||
                   hotel.image ||
                   hotel.thumbnail ||
                   (hotel.photos && hotel.photos[0]?.images?.large?.url) ||
                   null;
    
    if (!isValidImageUrl(imageUrl)) {
      imageUrl = getCityPlaceholder(searchLocation);
    }
    
    // Extract price
    const price = hotel.price?.amount ||
                  hotel.price_level ||
                  parseFloat(hotel.price?.replace(/[^0-9.]/g, '')) ||
                  50;
    
    // Extract rating (TripAdvisor uses 0-5 scale)
    const rating = (hotel.rating || hotel.num_reviews || 4.0) * 2;
    
    return {
      id: hotel.location_id || hotel.id || Math.random().toString(36),
      name: hotelName,
      location: location,
      address: hotel.address_obj?.street1 || hotel.address || '',
      price: { grandTotal: Math.round(price) },
      currency: 'EUR',
      rating: Math.min(rating, 10),
      stars: hotel.hotel_class ? parseInt(hotel.hotel_class) : Math.floor(rating / 2),
      reviews: hotel.num_reviews || hotel.review_count || 0,
      image: imageUrl,
      images: hotel.photos?.map((p: any) => p.images?.large?.url).filter(Boolean) || [imageUrl],
      description: hotel.description || hotel.ranking_data?.ranking_string || `${hotelName} à ${location}`,
      amenities: hotel.amenities || ['Wifi', 'Restaurant'],
      freeCancellation: false,
      breakfast: false,
    };
  });
};

// Transform Hotels.com Provider data
const transformHotelsComData = (hotels: any[], searchLocation: string) => {
  return hotels.map(hotel => {
    const hotelName = hotel.name || 
                      hotel.hotelName ||
                      hotel.property?.name ||
                      'Hôtel';
    
    // Hotels.com specific image extraction
    let imageUrl = hotel.optimizedThumbUrls?.srpDesktop ||
                   hotel.thumbnailUrl ||
                   hotel.thumbnail ||
                   hotel.property?.image?.url ||
                   (hotel.gallery && hotel.gallery[0]?.url) ||
                   (hotel.images && hotel.images[0]) ||
                   null;
    
    if (!isValidImageUrl(imageUrl)) {
      imageUrl = getCityPlaceholder(searchLocation);
    }
    
    const location = hotel.address?.locality || 
                     hotel.neighbourhood ||
                     hotel.location ||
                     searchLocation;
    
    const price = hotel.ratePlan?.price?.current?.amount ||
                  hotel.ratePlan?.price?.exactCurrent ||
                  hotel.price?.lead?.amount ||
                  hotel.price ||
                  50;
    
    const rating = hotel.guestRating || 
                   hotel.starRating || 
                   hotel.reviews?.score ||
                   4.0;
    
    return {
      id: hotel.id || hotel.hotelId || Math.random().toString(36),
      name: hotelName,
      location: location,
      address: hotel.address?.streetAddress || '',
      price: { grandTotal: Math.round(typeof price === 'number' ? price : parseFloat(price) || 50) },
      currency: hotel.ratePlan?.price?.current?.currencyCode || 'EUR',
      rating: rating <= 5 ? rating * 2 : rating,
      stars: hotel.starRating || Math.floor(rating),
      reviews: hotel.guestReviews?.total || hotel.reviews?.total || 0,
      image: imageUrl,
      images: hotel.gallery?.map((g: any) => g.url).filter(Boolean) || [imageUrl],
      description: hotel.tagline || `${hotelName} à ${location}`,
      amenities: hotel.amenities?.map((a: any) => a.text || a) || ['Wifi', 'Restaurant'],
      freeCancellation: hotel.ratePlan?.features?.freeCancellation || false,
      breakfast: hotel.ratePlan?.features?.paymentPreference?.includes('breakfast') || false,
    };
  });
};

// Popular hotels database for realistic fallback data
const getPopularHotels = (location: string) => {
  const locationLower = location.toLowerCase();
  
  // Real hotel names by city with realistic data
  const cityHotels: Record<string, any[]> = {
    'paris': [
      { name: 'Hôtel Plaza Athénée', stars: 5, rating: 9.4, price: 890, image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800' },
      { name: 'Le Bristol Paris', stars: 5, rating: 9.2, price: 850, image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800' },
      { name: 'Hôtel Raphael', stars: 5, rating: 9.0, price: 680, image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800' },
      { name: 'Le Meurice', stars: 5, rating: 9.3, price: 920, image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800' },
      { name: 'Hôtel de Crillon', stars: 5, rating: 9.1, price: 780, image: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800' },
      { name: 'Citadines Tour Eiffel', stars: 4, rating: 8.5, price: 185, image: 'https://images.unsplash.com/photo-1587213811864-46e59f6873b1?w=800' },
      { name: 'Ibis Styles Paris Eiffel', stars: 3, rating: 7.8, price: 120, image: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800' },
      { name: 'Mercure Paris Centre', stars: 4, rating: 8.2, price: 165, image: 'https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?w=800' },
    ],
    'dubai': [
      { name: 'Burj Al Arab Jumeirah', stars: 5, rating: 9.6, price: 1500, image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800' },
      { name: 'Atlantis The Palm', stars: 5, rating: 9.1, price: 450, image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800' },
      { name: 'Armani Hotel Dubai', stars: 5, rating: 9.2, price: 520, image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800' },
      { name: 'Address Downtown', stars: 5, rating: 9.0, price: 380, image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800' },
      { name: 'JW Marriott Marquis', stars: 5, rating: 8.9, price: 290, image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800' },
      { name: 'Rove Downtown Dubai', stars: 3, rating: 8.4, price: 85, image: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800' },
      { name: 'Ibis Dubai Al Barsha', stars: 3, rating: 7.6, price: 65, image: 'https://images.unsplash.com/photo-1587213811864-46e59f6873b1?w=800' },
    ],
    'new york': [
      { name: 'The Plaza Hotel', stars: 5, rating: 9.3, price: 750, image: 'https://images.unsplash.com/photo-1455587734955-081b22074882?w=800' },
      { name: 'The Ritz-Carlton New York', stars: 5, rating: 9.1, price: 680, image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800' },
      { name: 'Park Hyatt New York', stars: 5, rating: 9.0, price: 620, image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800' },
      { name: 'The St. Regis New York', stars: 5, rating: 9.2, price: 720, image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800' },
      { name: 'Marriott Times Square', stars: 4, rating: 8.5, price: 280, image: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800' },
      { name: 'Pod Times Square', stars: 3, rating: 8.0, price: 145, image: 'https://images.unsplash.com/photo-1587213811864-46e59f6873b1?w=800' },
    ],
    'tokyo': [
      { name: 'The Peninsula Tokyo', stars: 5, rating: 9.4, price: 580, image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800' },
      { name: 'Aman Tokyo', stars: 5, rating: 9.5, price: 850, image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800' },
      { name: 'Park Hyatt Tokyo', stars: 5, rating: 9.2, price: 620, image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800' },
      { name: 'Mandarin Oriental Tokyo', stars: 5, rating: 9.3, price: 680, image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800' },
      { name: 'Hotel Gracery Shinjuku', stars: 4, rating: 8.6, price: 180, image: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800' },
      { name: 'APA Hotel Shinjuku', stars: 3, rating: 7.8, price: 95, image: 'https://images.unsplash.com/photo-1587213811864-46e59f6873b1?w=800' },
    ],
    'london': [
      { name: 'The Savoy', stars: 5, rating: 9.4, price: 650, image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800' },
      { name: 'Claridge\'s', stars: 5, rating: 9.3, price: 720, image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800' },
      { name: 'The Langham London', stars: 5, rating: 9.1, price: 480, image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800' },
      { name: 'Corinthia London', stars: 5, rating: 9.2, price: 520, image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800' },
      { name: 'Premier Inn London', stars: 3, rating: 8.2, price: 110, image: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800' },
      { name: 'Travelodge Central', stars: 2, rating: 7.5, price: 75, image: 'https://images.unsplash.com/photo-1587213811864-46e59f6873b1?w=800' },
    ],
    'abidjan': [
      { name: 'Sofitel Abidjan Hôtel Ivoire', stars: 5, rating: 8.8, price: 180, image: 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=800' },
      { name: 'Pullman Abidjan', stars: 5, rating: 8.6, price: 165, image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800' },
      { name: 'Radisson Blu Abidjan Airport', stars: 5, rating: 8.5, price: 145, image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800' },
      { name: 'Novotel Abidjan', stars: 4, rating: 8.2, price: 120, image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800' },
      { name: 'Azalaï Hôtel Abidjan', stars: 4, rating: 8.0, price: 95, image: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800' },
      { name: 'Ibis Abidjan Plateau', stars: 3, rating: 7.6, price: 65, image: 'https://images.unsplash.com/photo-1587213811864-46e59f6873b1?w=800' },
    ],
  };

  // Find matching city hotels
  for (const [city, hotels] of Object.entries(cityHotels)) {
    if (locationLower.includes(city)) {
      return hotels.map((h, index) => ({
        id: `${city}-${index}-${Date.now()}`,
        name: h.name,
        location: location,
        address: `Centre-ville, ${location}`,
        price: { grandTotal: h.price },
        currency: 'EUR',
        rating: h.rating,
        stars: h.stars,
        reviews: Math.floor(Math.random() * 3000) + 500,
        image: h.image,
        images: [h.image],
        description: `${h.name} est un établissement ${h.stars} étoiles offrant un séjour exceptionnel à ${location}.`,
        amenities: h.stars >= 4 ? ['Wifi Gratuit', 'Restaurant', 'Piscine', 'Spa', 'Parking', 'Salle de sport'] : ['Wifi Gratuit', 'Petit-déjeuner', 'Climatisation'],
        freeCancellation: Math.random() > 0.3,
        breakfast: Math.random() > 0.5,
      }));
    }
  }

  // Generic fallback for unknown cities
  return [
    {
      id: `${location}-1-${Date.now()}`,
      name: `Grand Hôtel ${location}`,
      location: location,
      address: `Centre-ville, ${location}`,
      price: { grandTotal: 120 },
      currency: 'EUR',
      rating: 8.5,
      stars: 4,
      reviews: 850,
      image: getCityPlaceholder(location),
      images: [getCityPlaceholder(location)],
      description: `Grand Hôtel ${location} offre un hébergement de qualité avec des services modernes.`,
      amenities: ['Wifi Gratuit', 'Restaurant', 'Parking', 'Climatisation'],
      freeCancellation: true,
      breakfast: true,
    },
    {
      id: `${location}-2-${Date.now()}`,
      name: `Hôtel Central ${location}`,
      location: location,
      address: `Quartier central, ${location}`,
      price: { grandTotal: 85 },
      currency: 'EUR',
      rating: 8.0,
      stars: 3,
      reviews: 620,
      image: getCityPlaceholder(location),
      images: [getCityPlaceholder(location)],
      description: `Hôtel Central ${location} est idéalement situé pour explorer la ville.`,
      amenities: ['Wifi Gratuit', 'Petit-déjeuner', 'Climatisation'],
      freeCancellation: true,
      breakfast: true,
    },
    {
      id: `${location}-3-${Date.now()}`,
      name: `Résidence Premium ${location}`,
      location: location,
      address: `Zone touristique, ${location}`,
      price: { grandTotal: 180 },
      currency: 'EUR',
      rating: 9.0,
      stars: 5,
      reviews: 1200,
      image: getCityPlaceholder(location),
      images: [getCityPlaceholder(location)],
      description: `Résidence Premium ${location} offre une expérience luxueuse avec vue panoramique.`,
      amenities: ['Wifi Gratuit', 'Restaurant', 'Piscine', 'Spa', 'Parking', 'Salle de sport', 'Concierge'],
      freeCancellation: true,
      breakfast: true,
    },
  ];
};

// Fallback mock data only if APIs completely fail
const getMockHotels = (location: string) => {
  return getPopularHotels(location);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting
  const clientIP = getClientIP(req);
  const rateLimitResult = checkRateLimit(clientIP, { ...RATE_LIMITS.SEARCH, keyPrefix: 'hotels' });
  
  if (!rateLimitResult.allowed) {
    console.log(`Rate limit exceeded for IP: ${clientIP.substring(0, 8)}...`);
    return createRateLimitResponse(rateLimitResult, RATE_LIMITS.SEARCH, corsHeaders);
  }

  try {
    const body = await req.json();

    // Validate request with Zod
    const validation = validateData(hotelSearchSchema, body);
    
    if (!validation.success) {
      return createValidationErrorResponse(validation.errors!, corsHeaders);
    }

    const { location, checkIn, checkOut, adults, children, rooms, partnerOnly } = validation.data!;
    console.log('Search hotels for:', { location, checkIn, checkOut, adults, children, rooms, partnerOnly });

    if (partnerOnly) {
      const partnerHotels = await fetchPartnerHotels(null);
      const partnerResults = { services: partnerHotels };
      await signHotelResults(partnerResults, location, new Set(['services']));
      return new Response(
        JSON.stringify({ success: true, data: partnerResults, count: partnerHotels.length, mock: false, source: 'partner' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const RAPIDAPI_KEY = Deno.env.get('RAPIDAPI_KEY');
    const KAYAK_RAPIDAPI_KEY = Deno.env.get('KAYAK_RAPIDAPI_KEY') || RAPIDAPI_KEY;
    const KAYAK_RAPIDAPI_HOST = Deno.env.get('KAYAK_RAPIDAPI_HOST') || 'kayak-api.p.rapidapi.com';
    console.log('RAPIDAPI_KEY configured:', RAPIDAPI_KEY ? 'YES' : 'NO');


const results: {
      booking: any[];
      xotelo: any[];
      tripadvisor: any[];
      amadeus: any[];
      priceline: any[];
      services: any[];
    } = {
      booking: [],
      xotelo: [],
      tripadvisor: [],
      amadeus: [],
      priceline: [],
      services: [],
      kayak: [],
    };


    let apiSuccess = false;
    
    const AMADEUS_API_KEY = Deno.env.get('AMADEUS_API_KEY');
    const AMADEUS_API_SECRET = Deno.env.get('AMADEUS_API_SECRET');
    console.log('AMADEUS credentials configured:', AMADEUS_API_KEY ? 'YES' : 'NO');

    // =====================================================
    // XOTELO API - FREE (No API key required!)
    // =====================================================
    console.log('Starting Xotelo API search (FREE - no key needed)');
    try {
      // First, search for hotels in the location using Xotelo's list endpoint
      const xoteloListParams = new URLSearchParams({
        location: location,
        currency: 'EUR',
        lang: 'en',
      });

      console.log('Calling Xotelo list API for location:', location);
      
      const xoteloResponse = await fetch(
        `https://data.xotelo.com/api/list?${xoteloListParams}`,
        {
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (xoteloResponse.ok) {
        const xoteloData = await xoteloResponse.json();
        console.log('Xotelo API status:', xoteloResponse.status);
        console.log('Xotelo raw response:', JSON.stringify(xoteloData).substring(0, 500));
        
        const hotels = xoteloData.result?.hotels || xoteloData.hotels || xoteloData.data || [];
        if (Array.isArray(hotels) && hotels.length > 0) {
          results.xotelo = hotels.slice(0, 15).map((hotel: any) => {
            let imageUrl = hotel.photo || hotel.image || hotel.thumbnail || null;
            if (!isValidImageUrl(imageUrl)) {
              imageUrl = getCityPlaceholder(location);
            }
            return {
              id: hotel.hotel_key || hotel.id || Math.random().toString(36),
              name: hotel.name || hotel.hotel_name || 'Hotel',
              location: hotel.city || hotel.location || location,
              address: hotel.address || '',
              price: { grandTotal: hotel.price || hotel.min_price || hotel.rate || 80 },
              currency: 'EUR',
              rating: (hotel.rating || hotel.score || 4.0) <= 5 ? (hotel.rating || hotel.score || 4.0) * 2 : (hotel.rating || hotel.score || 4.0),
              stars: hotel.stars || hotel.class || 4,
              reviews: hotel.reviews_count || hotel.num_reviews || 0,
              image: imageUrl,
              images: [imageUrl],
              description: hotel.description || `${hotel.name || 'Hôtel'} à ${location}`,
              amenities: hotel.amenities || ['WiFi', 'Restaurant'],
              freeCancellation: false,
              breakfast: false,
              source: 'xotelo',
            };
          });
          apiSuccess = true;
          console.log('✅ Xotelo results transformed:', results.xotelo.length);
        } else {
          console.log('Xotelo API returned no hotels or unexpected structure');
        }
      } else {
        const errorText = await xoteloResponse.text();
        console.error('Xotelo API failed with status:', xoteloResponse.status);
        console.error('Xotelo error details:', errorText.substring(0, 300));
      }
    } catch (error) {
      console.error('Xotelo API exception:', error instanceof Error ? error.message : String(error));
    }

    // Search Booking.com (booking-com15.p.rapidapi.com)
    if (RAPIDAPI_KEY) {
      console.log('Starting Booking.com search with RAPIDAPI_KEY');
      try {
        // First, get the destination ID
        const destSearchParams = new URLSearchParams({
          query: location,
        });

        console.log('Step 1: Searching for destination ID:', location);
        
        const destResponse = await fetch(
          `https://booking-com15.p.rapidapi.com/api/v1/hotels/searchDestination?${destSearchParams}`,
          {
            headers: {
              'X-RapidAPI-Key': RAPIDAPI_KEY,
              'X-RapidAPI-Host': 'booking-com15.p.rapidapi.com',
            },
          }
        );

        let destId = '-1';
        if (destResponse.ok) {
          const destData = await destResponse.json();
          console.log('Destination search response:', JSON.stringify(destData).substring(0, 300));
          
          if (destData.data && Array.isArray(destData.data) && destData.data.length > 0) {
            destId = destData.data[0].dest_id || destData.data[0].id || '-1';
            console.log('Found dest_id:', destId);
          }
        }

        // Now search hotels with the correct dest_id
        const bookingParams = new URLSearchParams({
          dest_id: destId,
          search_type: 'CITY',
          arrival_date: checkIn,
          departure_date: checkOut,
          adults: adults.toString(),
          children_age: children ? '0' : '',
          room_qty: (rooms || 1).toString(),
          page_number: '1',
          units: 'metric',
          temperature_unit: 'c',
          languagecode: 'en-gb',
          currency_code: 'USD',
        });

        console.log('Calling Booking.com API (searchHotels) with params:', Object.fromEntries(bookingParams));
        
        const bookingResponse = await fetch(
          `https://booking-com15.p.rapidapi.com/api/v1/hotels/searchHotels?${bookingParams}`,
          {
            headers: {
              'X-RapidAPI-Key': RAPIDAPI_KEY,
              'X-RapidAPI-Host': 'booking-com15.p.rapidapi.com',
            },
          }
        );

        if (bookingResponse.ok) {
          const bookingData = await bookingResponse.json();
          console.log('Booking.com API status:', bookingResponse.status);
          console.log('Booking.com raw response:', JSON.stringify(bookingData).substring(0, 500));
          
          if (bookingData.data && bookingData.data.hotels && Array.isArray(bookingData.data.hotels)) {
            results.booking = transformBookingData(bookingData.data.hotels.slice(0, 10), location);
            apiSuccess = true;
            console.log('✅ Booking.com results transformed:', results.booking.length, 'hotels');
            // Log first hotel details for debugging
            if (results.booking.length > 0) {
              const firstHotel = results.booking[0];
              console.log('Sample Booking.com hotel:', {
                name: firstHotel.name,
                image: firstHotel.image.substring(0, 80) + '...',
                location: firstHotel.location,
                price: firstHotel.price.grandTotal
              });
            }
          } else {
            console.log('Booking.com API returned unexpected structure:', Object.keys(bookingData));
          }
        } else {
          const errorText = await bookingResponse.text();
          console.error('Booking.com API failed with status:', bookingResponse.status);
          console.error('Booking.com error details:', errorText.substring(0, 500));
        }
      } catch (error) {
        console.error('Booking.com API exception:', error instanceof Error ? error.message : String(error));
      }
    }

    // Airbnb API skipped - current RapidAPI endpoint returns "app out of date" error
    // Keeping this commented for future implementation with working API
    /*
    if (RAPIDAPI_KEY) {
      try {
        const airbnbParams = new URLSearchParams({
          location: location,
          checkIn: checkIn,
          checkOut: checkOut,
          adults: adults.toString(),
          children: (children || 0).toString(),
          infants: '0',
          pets: '0',
          page: '1',
          currency: 'USD',
        });

        console.log('Calling Airbnb API with params:', Object.fromEntries(airbnbParams));

        const airbnbResponse = await fetch(
          `https://airbnb19.p.rapidapi.com/api/v1/searchPropertyByLocation?${airbnbParams}`,
          {
            headers: {
              'X-RapidAPI-Key': RAPIDAPI_KEY,
              'X-RapidAPI-Host': 'airbnb19.p.rapidapi.com',
            },
          }
        );

        if (airbnbResponse.ok) {
          const airbnbData = await airbnbResponse.json();
          console.log('Airbnb API status:', airbnbResponse.status);
          console.log('Airbnb raw response:', JSON.stringify(airbnbData).substring(0, 500));
          
          if (airbnbData.data && Array.isArray(airbnbData.data)) {
            results.airbnb = transformAirbnbData(airbnbData.data.slice(0, 10));
            apiSuccess = true;
            console.log('Airbnb results transformed:', results.airbnb.length);
          } else {
            console.log('Airbnb API returned unexpected structure:', Object.keys(airbnbData));
          }
        } else {
          const errorText = await airbnbResponse.text();
          console.error('Airbnb API failed with status:', airbnbResponse.status);
          console.error('Airbnb error details:', errorText.substring(0, 500));
        }
      } catch (error) {
        console.error('Airbnb API exception:', error instanceof Error ? error.message : String(error));
      }
    }
    */

    // Search Worldwide Hotels (skipped - API requires location_id which needs geocoding)
    // Keeping this commented for future implementation
    /*
    if (RAPIDAPI_KEY) {
      try {
        console.log('Calling Worldwide Hotels API');
        
        const worldwideResponse = await fetch(
          `https://worldwide-hotels.p.rapidapi.com/search`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-RapidAPI-Key': RAPIDAPI_KEY,
              'X-RapidAPI-Host': 'worldwide-hotels.p.rapidapi.com',
            },
            body: JSON.stringify({
              location_id: '123', // Requires geocoding first
              language: 'en_US',
              currency: 'USD',
              checkin: checkIn,
              checkout: checkOut,
              adults: adults,
              children: children || 0,
              rooms: rooms || 1,
            }),
          }
        );

        if (worldwideResponse.ok) {
          const worldwideData = await worldwideResponse.json();
          console.log('Worldwide Hotels API status:', worldwideResponse.status);
          console.log('Worldwide Hotels raw response:', JSON.stringify(worldwideData).substring(0, 500));
          
          if (worldwideData.hotels && Array.isArray(worldwideData.hotels)) {
            results.worldwide = transformBookingData(worldwideData.hotels.slice(0, 10));
            apiSuccess = true;
            console.log('Worldwide Hotels results transformed:', results.worldwide.length);
          } else {
            console.log('Worldwide Hotels API returned unexpected structure:', Object.keys(worldwideData));
          }
        } else {
          const errorText = await worldwideResponse.text();
          console.error('Worldwide Hotels API failed with status:', worldwideResponse.status);
          console.error('Worldwide Hotels error details:', errorText.substring(0, 500));
        }
      } catch (error) {
        console.error('Worldwide Hotels API exception:', error instanceof Error ? error.message : String(error));
      }
    }
    */

    // Search TripAdvisor (tripadvisor1.p.rapidapi.com)
    if (RAPIDAPI_KEY) {
      console.log('Starting TripAdvisor search');
      try {
        // First search for location ID
        const tripAdvisorSearchParams = new URLSearchParams({
          query: location,
          lang: 'en_US',
        });

        console.log('Step 1: Searching TripAdvisor location ID:', location);
        
        const tripAdvisorSearchResponse = await fetch(
          `https://tripadvisor1.p.rapidapi.com/locations/search?${tripAdvisorSearchParams}`,
          {
            headers: {
              'X-RapidAPI-Key': RAPIDAPI_KEY,
              'X-RapidAPI-Host': 'tripadvisor1.p.rapidapi.com',
            },
          }
        );

        if (tripAdvisorSearchResponse.ok) {
          const tripAdvisorSearchData = await tripAdvisorSearchResponse.json();
          console.log('TripAdvisor location search response:', JSON.stringify(tripAdvisorSearchData).substring(0, 300));
          
          let locationId = null;
          if (tripAdvisorSearchData.data && Array.isArray(tripAdvisorSearchData.data) && tripAdvisorSearchData.data.length > 0) {
            locationId = tripAdvisorSearchData.data[0].result_object?.location_id;
            console.log('Found TripAdvisor location_id:', locationId);
          }

          if (locationId) {
            // Now search hotels for this location
            const tripAdvisorHotelParams = new URLSearchParams({
              location_id: locationId,
              checkin: checkIn,
              checkout: checkOut,
              adults: adults.toString(),
              rooms: (rooms || 1).toString(),
              currency: 'USD',
              lang: 'en_US',
            });

            console.log('Step 2: Searching TripAdvisor hotels with params:', Object.fromEntries(tripAdvisorHotelParams));
            
            const tripAdvisorHotelResponse = await fetch(
              `https://tripadvisor1.p.rapidapi.com/hotels/list?${tripAdvisorHotelParams}`,
              {
                headers: {
                  'X-RapidAPI-Key': RAPIDAPI_KEY,
                  'X-RapidAPI-Host': 'tripadvisor1.p.rapidapi.com',
                },
              }
            );

            if (tripAdvisorHotelResponse.ok) {
              const tripAdvisorHotelData = await tripAdvisorHotelResponse.json();
              console.log('TripAdvisor hotels API status:', tripAdvisorHotelResponse.status);
              console.log('TripAdvisor hotels raw response:', JSON.stringify(tripAdvisorHotelData).substring(0, 500));
              
              if (tripAdvisorHotelData.data && Array.isArray(tripAdvisorHotelData.data)) {
                results.tripadvisor = transformTripAdvisorData(tripAdvisorHotelData.data.slice(0, 10), location);
                apiSuccess = true;
                console.log('TripAdvisor results transformed:', results.tripadvisor.length);
              } else {
                console.log('TripAdvisor hotels API returned unexpected structure:', Object.keys(tripAdvisorHotelData));
              }
            } else {
              const errorText = await tripAdvisorHotelResponse.text();
              console.error('TripAdvisor hotels API failed with status:', tripAdvisorHotelResponse.status);
              console.error('TripAdvisor hotels error details:', errorText.substring(0, 500));
            }
          }
        }
      } catch (error) {
        console.error('TripAdvisor API exception:', error instanceof Error ? error.message : String(error));
      }
    }

    // Hotels4 API removed - requires paid subscription

    // =====================================================
    // PRICELINE API (priceline-com.p.rapidapi.com)
    // =====================================================
    if (RAPIDAPI_KEY) {
      console.log('Starting Priceline hotel search');
      try {
        // First get location ID
        const pricelineLocationParams = new URLSearchParams({
          name: location,
        });

        console.log('Step 1: Searching Priceline location ID:', location);
        
        const pricelineLocationResponse = await fetch(
          `https://priceline-com.p.rapidapi.com/hotels/city/search?${pricelineLocationParams}`,
          {
            headers: {
              'X-RapidAPI-Key': RAPIDAPI_KEY,
              'X-RapidAPI-Host': 'priceline-com.p.rapidapi.com',
            },
          }
        );

        if (pricelineLocationResponse.ok) {
          const pricelineLocationData = await pricelineLocationResponse.json();
          console.log('Priceline location search response:', JSON.stringify(pricelineLocationData).substring(0, 300));
          
          // Extract city ID from response
          let cityId = null;
          if (pricelineLocationData.data && pricelineLocationData.data.length > 0) {
            cityId = pricelineLocationData.data[0].cityID || pricelineLocationData.data[0].id;
            console.log('Found Priceline city ID:', cityId);
          } else if (pricelineLocationData.getHotelAutoSuggestV2?.results?.result?.[0]) {
            cityId = pricelineLocationData.getHotelAutoSuggestV2.results.result[0].cityID;
            console.log('Found Priceline city ID (v2):', cityId);
          }

          if (cityId) {
            // Now search hotels
            const pricelineSearchParams = new URLSearchParams({
              city_id: cityId.toString(),
              date_checkin: checkIn,
              date_checkout: checkOut,
              rooms: (rooms || 1).toString(),
              adults: adults.toString(),
              currency: 'EUR',
            });

            console.log('Step 2: Searching Priceline hotels with params:', Object.fromEntries(pricelineSearchParams));
            
            const pricelineHotelsResponse = await fetch(
              `https://priceline-com.p.rapidapi.com/hotels/city/listing?${pricelineSearchParams}`,
              {
                headers: {
                  'X-RapidAPI-Key': RAPIDAPI_KEY,
                  'X-RapidAPI-Host': 'priceline-com.p.rapidapi.com',
                },
              }
            );

            if (pricelineHotelsResponse.ok) {
              const pricelineData = await pricelineHotelsResponse.json();
              console.log('Priceline hotels API status:', pricelineHotelsResponse.status);
              console.log('Priceline hotels raw response:', JSON.stringify(pricelineData).substring(0, 500));
              
              // Extract hotels from various response structures
              let pricelineHotels: any[] = [];
              if (pricelineData.hotels && Array.isArray(pricelineData.hotels)) {
                pricelineHotels = pricelineData.hotels;
              } else if (pricelineData.data && Array.isArray(pricelineData.data)) {
                pricelineHotels = pricelineData.data;
              } else if (pricelineData.getHotelExpress?.results?.hotels) {
                pricelineHotels = pricelineData.getHotelExpress.results.hotels;
              }

              if (pricelineHotels.length > 0) {
                results.priceline = pricelineHotels.slice(0, 15).map((hotel: any) => {
                  let imageUrl = hotel.thumbnailUrl || 
                                 hotel.thumbnail || 
                                 hotel.images?.[0]?.url ||
                                 hotel.hotelPhotos?.[0] ||
                                 hotel.photo ||
                                 null;
                  
                  if (!isValidImageUrl(imageUrl)) {
                    imageUrl = getCityPlaceholder(location);
                  }

                  const hotelName = hotel.name || hotel.hotelName || 'Hôtel';
                  const hotelLocation = hotel.location || hotel.address?.city || hotel.cityName || location;
                  const price = hotel.ratesSummary?.minPrice || 
                               hotel.price?.amount || 
                               hotel.totalPrice || 
                               hotel.rate ||
                               80;
                  
                  let rating = hotel.overallGuestRating || hotel.rating || hotel.starRating || 4.0;
                  if (rating <= 5) rating = rating * 2;

                  return {
                    id: hotel.hotelId || hotel.id || Math.random().toString(36),
                    name: hotelName,
                    location: hotelLocation,
                    address: hotel.address?.streetAddress || hotel.address || '',
                    price: { grandTotal: Math.round(parseFloat(price.toString()) || 80) },
                    currency: 'EUR',
                    rating: Math.min(rating, 10),
                    stars: hotel.starRating || hotel.stars || Math.floor(rating / 2),
                    reviews: hotel.reviewCount || hotel.reviews || 0,
                    image: imageUrl,
                    images: hotel.images?.map((i: any) => i.url || i).filter(Boolean) || [imageUrl],
                    description: hotel.description || `${hotelName} à ${hotelLocation}`,
                    amenities: hotel.amenities?.map((a: any) => a.name || a) || ['WiFi', 'Restaurant'],
                    freeCancellation: hotel.freeCancel || false,
                    breakfast: hotel.breakfast || false,
                    source: 'priceline',
                  };
                });
                apiSuccess = true;
                console.log('✅ Priceline results transformed:', results.priceline.length, 'hotels');
              } else {
                console.log('Priceline hotels API returned no hotels');
              }
            } else {
              const errorText = await pricelineHotelsResponse.text();
              console.error('Priceline hotels API failed:', pricelineHotelsResponse.status);
              console.error('Priceline hotels error:', errorText.substring(0, 300));
            }
          } else {
            console.log('Could not find Priceline city ID for:', location);
          }
        } else {
          const errorText = await pricelineLocationResponse.text();
          console.error('Priceline location search failed:', pricelineLocationResponse.status);
          console.error('Priceline location error:', errorText.substring(0, 300));
        }
      } catch (error) {
        console.error('Priceline API exception:', error instanceof Error ? error.message : String(error));
      }
    }

    if (AMADEUS_API_KEY && AMADEUS_API_SECRET) {
      console.log('Starting Amadeus Hotel search');
      try {
        // Step 1: Get Amadeus access token
        console.log('Step 1: Getting Amadeus access token');
        const tokenResponse = await fetch(
          'https://test.api.amadeus.com/v1/security/oauth2/token',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              grant_type: 'client_credentials',
              client_id: AMADEUS_API_KEY,
              client_secret: AMADEUS_API_SECRET,
            }),
          }
        );

        if (tokenResponse.ok) {
          const tokenData = await tokenResponse.json();
          const accessToken = tokenData.access_token;
          console.log('Amadeus access token obtained');

          // Step 2: Get hotel list by city code
          console.log('Step 2: Getting hotel list for city:', location);
          
          // Convert location to city code (first 3 letters uppercase)
          const cityCode = location.substring(0, 3).toUpperCase();
          
          const hotelListResponse = await fetch(
            `https://test.api.amadeus.com/v1/reference-data/locations/hotels/by-city?cityCode=${cityCode}&radius=50&radiusUnit=KM&hotelSource=ALL`,
            {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
              },
            }
          );

          if (hotelListResponse.ok) {
            const hotelListData = await hotelListResponse.json();
            console.log('Amadeus hotel list status:', hotelListResponse.status);
            console.log('Amadeus hotel list count:', hotelListData.data?.length || 0);

            if (hotelListData.data && Array.isArray(hotelListData.data) && hotelListData.data.length > 0) {
              // Get hotel IDs (limit to 50 for performance)
              const hotelIds = hotelListData.data.slice(0, 50).map((h: any) => h.hotelId).join(',');
              console.log('Step 3: Searching offers for hotels:', hotelIds.split(',').length, 'hotels');

              // Step 3: Get hotel offers
              const offersSearchParams = new URLSearchParams({
                hotelIds: hotelIds,
                checkInDate: checkIn,
                checkOutDate: checkOut,
                adults: adults.toString(),
                roomQuantity: (rooms || 1).toString(),
                currency: 'USD',
                bestRateOnly: 'true',
                view: 'FULL',
              });

              const offersResponse = await fetch(
                `https://test.api.amadeus.com/v2/shopping/hotel-offers?${offersSearchParams}`,
                {
                  headers: {
                    'Authorization': `Bearer ${accessToken}`,
                  },
                }
              );

              if (offersResponse.ok) {
                const offersData = await offersResponse.json();
                console.log('Amadeus offers status:', offersResponse.status);
                console.log('Amadeus offers count:', offersData.data?.length || 0);

                if (offersData.data && Array.isArray(offersData.data)) {
                  results.amadeus = offersData.data.slice(0, 20).map((offer: any) => {
                    const hotel = offer.hotel;
                    const firstOffer = offer.offers?.[0];
                    const price = firstOffer?.price?.total || 50000;
                    
                    return {
                      id: hotel.hotelId,
                      name: hotel.name || 'Hotel',
                      location: `${hotel.address?.cityName || location}, ${hotel.address?.countryCode || ''}`,
                      price: { grandTotal: Math.round(parseFloat(price)) }, // Keep USD price (convert to EUR later if needed)
                      rating: hotel.rating ? parseFloat(hotel.rating) : 4.0,
                      reviews: Math.floor(Math.random() * 500) + 50,
                      image: `https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&sig=${hotel.hotelId}`,
                      images: [`https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&sig=${hotel.hotelId}`],
                      description: hotel.description?.text || `${hotel.name} est un établissement de qualité.`,
                      amenities: hotel.amenities || ['WiFi', 'Restaurant', 'Room Service'],
                    };
                  });
                  apiSuccess = true;
                  console.log('Amadeus results transformed:', results.amadeus.length);
                } else {
                  console.log('Amadeus offers returned unexpected structure:', Object.keys(offersData));
                }
              } else {
                const errorText = await offersResponse.text();
                console.error('Amadeus offers search failed:', offersResponse.status);
                console.error('Amadeus offers error:', errorText.substring(0, 500));
              }
            } else {
              console.log('No hotels found for city code:', cityCode);
            }
          } else {
            const errorText = await hotelListResponse.text();
            console.error('Amadeus hotel list failed:', hotelListResponse.status);
            console.error('Amadeus hotel list error:', errorText.substring(0, 500));
          }
        } else {
          const errorText = await tokenResponse.text();
          console.error('Amadeus token request failed:', tokenResponse.status);
          console.error('Amadeus token error:', errorText.substring(0, 500));
        }
      } catch (error) {
        console.error('Amadeus API exception:', error instanceof Error ? error.message : String(error));
      }
    }

    if (!RAPIDAPI_KEY) {
      console.log('RAPIDAPI_KEY not configured');
    }

    if (!AMADEUS_API_KEY || !AMADEUS_API_SECRET) {
      console.log('AMADEUS credentials not configured');
    }

    console.log('Fetching partner (agency-listed) hotels for:', location);
    try {
      results.services = await fetchPartnerHotels(location);
      if (results.services.length > 0) {
        console.log('✅ Partner hotels matched:', results.services.length);
      }
    } catch (error) {
      console.error('Partner hotels exception:', error instanceof Error ? error.message : String(error));
    }

    // If no API results, use mock data
    const totalResults = results.booking.length + results.xotelo.length +
                         results.tripadvisor.length + results.amadeus.length + results.priceline.length +
                         results.services.length;

    console.log('=== SEARCH RESULTS SUMMARY ===');
    console.log('API Success:', apiSuccess);
    console.log('Total Results:', totalResults);
    console.log('Results by source:', {
      amadeus: results.amadeus.length,
      booking: results.booking.length,
      xotelo: results.xotelo.length,
      tripadvisor: results.tripadvisor.length,
      priceline: results.priceline.length,
      services: results.services.length,
    });

    if (!apiSuccess && results.services.length === 0) {
      console.log('⚠️ NO API RESULTS - Using realistic hotel data for location:', location);
      const mockHotels = getMockHotels(location);
      results.booking = mockHotels;
    } else {
      console.log('✅ REAL API DATA - Returning results from', totalResults, 'hotels');
    }

    await signHotelResults(results, location, new Set(['services']));

    const finalCount = results.booking.length + results.xotelo.length +
      results.tripadvisor.length + results.amadeus.length + results.priceline.length +
      results.services.length;

    return new Response(
      JSON.stringify({
        success: true,
        data: results,
        count: finalCount,
        mock: !apiSuccess && results.services.length === 0,
        source: !apiSuccess && results.services.length === 0 ? 'mock' : 'api'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in search-hotels function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Kayak Hotels API implementation
async function searchKayakHotels(
  location: string,
  checkIn: string,
  checkOut: string,
  adults: number,
  rooms: number,
  apiKey: string,
  apiHost: string
): Promise<any[]> {
  try {
    console.log(`Resolving Kayak location ID for: ${location}`);
    
    // Step 1: Resolve location name to numeric ID
    const locResponse = await fetch(
      `https://${apiHost}/search-locations?query=${encodeURIComponent(location)}&type=hotelonly`,
      {
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': apiHost
        }
      }
    );

    let locationId = "59560"; // Default (Miami) fallback
    if (locResponse.ok) {
      const locData = await locResponse.json();
      if (locData.data && locData.data[0]) {
        // Find a suitable ID - some Kayak APIs return 'cty-id' or 'id'
        locationId = locData.data[0].ctyId || locData.data[0].id || locationId;
        console.log(`Resolved Kayak location ID: ${locationId}`);
      }
    }

    // Step 2: Search hotels using the ID
    const payload = {
      location: locationId.toString(),
      checkin: checkIn,
      checkout: checkOut,
      adults: adults.toString(),
      rooms: rooms,
      childAges: [],
      searchMetaData: {
        pageNumber: 1,
        priceMode: "total"
      },
      sortParams: {
        sortMode: "price_a"
      }
    };

    const response = await fetch(
      `https://${apiHost}/search-hotels`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': apiHost
        },
        body: JSON.stringify(payload)
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Kayak Hotels API error:', response.status, errorText.substring(0, 300));
      return [];
    }

    const data = await response.json();
    const hotels = data.data || data.results || data.hotels || [];

    if (Array.isArray(hotels) && hotels.length > 0) {
      return hotels.map((hotel: any) => {
        const hotelName = hotel.hotelName || hotel.name || 'Hôtel';
        const rating = hotel.rating || 4.0;
        let imageUrl = hotel.image || hotel.thumbnail || hotel.imageUrl || null;
        if (!isValidImageUrl(imageUrl)) {
          imageUrl = getCityPlaceholder(location);
        }

        return {
          id: hotel.hotelId || hotel.id || Math.random().toString(36),
          name: hotelName,
          location: hotel.city || hotel.location || location,
          address: hotel.address || '',
          price: { grandTotal: Math.round(hotel.price || 100) },
          currency: 'EUR',
          rating: rating <= 5 ? rating * 2 : rating,
          stars: hotel.stars || 4,
          reviews: hotel.reviewCount || 0,
          image: imageUrl,
          images: [imageUrl],
          description: hotel.description || `${hotelName} à ${location}`,
          amenities: ['Wifi', 'Restaurant', 'Service de Chambre'],
          freeCancellation: true,
          breakfast: false,
          source: 'kayak',
          deepLink: hotel.deepLink || hotel.url
        };
      });
    }
    return [];
  } catch (error) {
    console.error('Kayak Hotels API exception:', error);
    return [];
  }
}