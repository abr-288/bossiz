import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CACHE_TTL_HOURS = 1; // Cache duration in hours

// Initialize Supabase client for cache operations
function getSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  return createClient(supabaseUrl, supabaseServiceKey);
}

// Generate cache key from search parameters
function getCacheKey(query?: string | null, category?: string | null): string {
  const q = query?.toLowerCase().trim() || 'default';
  const c = category?.toLowerCase().trim() || 'all';
  return `destinations_${q}_${c}`;
}

// Get cached destinations from database
async function getCachedDestinations(cacheKey: string): Promise<{ destinations: any[]; source: string } | null> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('destinations_cache')
      .select('destinations, source')
      .eq('cache_key', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .single();
    
    if (error || !data) {
      console.log(`Cache miss for key: ${cacheKey}`);
      return null;
    }
    
    console.log(`Cache hit for key: ${cacheKey}`);
    return { destinations: data.destinations, source: `${data.source}-cached` };
  } catch (e) {
    console.error('Cache read error:', e);
    return null;
  }
}

// Store destinations in cache
async function setCachedDestinations(cacheKey: string, destinations: any[], source: string): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + CACHE_TTL_HOURS);
    
    const { error } = await supabase
      .from('destinations_cache')
      .upsert({
        cache_key: cacheKey,
        destinations,
        source,
        expires_at: expiresAt.toISOString(),
      }, { onConflict: 'cache_key' });
    
    if (error) {
      console.error('Cache write error:', error);
    } else {
      console.log(`Cached ${destinations.length} destinations with key: ${cacheKey}`);
    }
    
    // Clean expired cache entries (async, don't wait)
    cleanExpiredCache().catch(console.log);
  } catch (e) {
    console.error('Cache store error:', e);
  }
}

// Clean expired cache entries
async function cleanExpiredCache(): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    await supabase.rpc('clean_expired_destinations_cache');
    console.log('Expired cache entries cleaned');
  } catch (e) {
    console.log('Cache cleanup skipped:', e);
  }
}

interface Destination {
  id: string;
  name: string;
  location: string;
  country: string;
  image: string;
  images: string[];
  rating: number;
  reviews: number;
  price: number;
  currency: string;
  description: string;
  category: string;
  amenities: string[];
  highlights: string[];
  temperature?: number;
  bestTime?: string;
  trending?: boolean;
  source: string;
}

// Enhanced TripAdvisor API search with location details
async function searchTripAdvisorLocation(
  query: string,
  rapidApiKey: string
): Promise<Destination[]> {
  try {
    console.log('Searching TripAdvisor for:', query);
    
    // Step 1: Search for location
    const searchResponse = await fetch(
      `https://travel-advisor.p.rapidapi.com/locations/search?query=${encodeURIComponent(query)}&limit=5&offset=0&units=km&currency=EUR&sort=relevance&lang=fr_FR`,
      {
        headers: {
          'X-RapidAPI-Key': rapidApiKey,
          'X-RapidAPI-Host': 'travel-advisor.p.rapidapi.com'
        }
      }
    );

    if (!searchResponse.ok) {
      console.error('TripAdvisor search error:', searchResponse.status);
      return [];
    }

    const searchData = await searchResponse.json();
    const results: Destination[] = [];
    
    if (searchData.data && Array.isArray(searchData.data)) {
      for (const item of searchData.data.slice(0, 3)) {
        const loc = item.result_object;
        if (!loc) continue;

        const locationId = loc.location_id;
        let photos: string[] = [];
        let details: any = null;

        // Step 2: Get location photos
        try {
          const photosResponse = await fetch(
            `https://travel-advisor.p.rapidapi.com/photos/list?location_id=${locationId}&currency=EUR&lang=fr_FR&limit=5`,
            {
              headers: {
                'X-RapidAPI-Key': rapidApiKey,
                'X-RapidAPI-Host': 'travel-advisor.p.rapidapi.com'
              }
            }
          );
          
          if (photosResponse.ok) {
            const photosData = await photosResponse.json();
            if (photosData.data && Array.isArray(photosData.data)) {
              photos = photosData.data
                .slice(0, 5)
                .map((p: any) => p.images?.large?.url || p.images?.original?.url)
                .filter(Boolean);
            }
          }
        } catch (e) {
          console.log('Photos fetch failed for:', locationId);
        }

        // Step 3: Get location details
        try {
          const detailsResponse = await fetch(
            `https://travel-advisor.p.rapidapi.com/locations/${locationId}/details?currency=EUR&lang=fr_FR`,
            {
              headers: {
                'X-RapidAPI-Key': rapidApiKey,
                'X-RapidAPI-Host': 'travel-advisor.p.rapidapi.com'
              }
            }
          );
          
          if (detailsResponse.ok) {
            details = await detailsResponse.json();
          }
        } catch (e) {
          console.log('Details fetch failed for:', locationId);
        }

        const mainImage = photos[0] || loc.photo?.images?.large?.url || getDefaultImage(query);
        const category = getCategoryFromType(loc.location_type, loc.subcategory);

        // Only real fields from TripAdvisor's response are used here - no
        // invented rating/review-count/price/description/"trending" flag.
        // A field TripAdvisor didn't actually return stays empty/zero
        // rather than being filled in with something fabricated.
        results.push({
          id: `ta-${locationId}`,
          name: loc.name || query,
          location: getLocationString(loc),
          country: getCountryFromLocation(loc, details),
          image: mainImage,
          images: photos.length > 0 ? photos : [mainImage],
          rating: loc.rating ? parseFloat(loc.rating) : (details?.rating ? parseFloat(details.rating) : 0),
          reviews: parseInt(loc.num_reviews || details?.num_reviews || '0') || 0,
          price: 0,
          currency: 'EUR',
          description: details?.description || loc.description || '',
          category,
          amenities: [],
          highlights: details?.subcategory?.map((s: any) => s.name).filter(Boolean) || [],
          temperature: undefined,
          bestTime: undefined,
          trending: false,
          source: 'tripadvisor',
        });
      }
    }
    
    console.log('TripAdvisor results:', results.length);
    return results;
  } catch (error) {
    console.error('TripAdvisor API exception:', error);
    return [];
  }
}

// Search TripAdvisor Attractions
async function searchTripAdvisorAttractions(
  query: string,
  rapidApiKey: string
): Promise<Destination[]> {
  try {
    // First get location ID
    const searchResponse = await fetch(
      `https://travel-advisor.p.rapidapi.com/locations/search?query=${encodeURIComponent(query)}&limit=1&offset=0&units=km&currency=EUR&lang=fr_FR`,
      {
        headers: {
          'X-RapidAPI-Key': rapidApiKey,
          'X-RapidAPI-Host': 'travel-advisor.p.rapidapi.com'
        }
      }
    );

    if (!searchResponse.ok) return [];

    const searchData = await searchResponse.json();
    const locationId = searchData.data?.[0]?.result_object?.location_id;
    
    if (!locationId) return [];

    // Get attractions for this location
    const attractionsResponse = await fetch(
      `https://travel-advisor.p.rapidapi.com/attractions/list?location_id=${locationId}&currency=EUR&lang=fr_FR&limit=5&sort=recommended`,
      {
        headers: {
          'X-RapidAPI-Key': rapidApiKey,
          'X-RapidAPI-Host': 'travel-advisor.p.rapidapi.com'
        }
      }
    );

    if (!attractionsResponse.ok) return [];

    const attractionsData = await attractionsResponse.json();
    const results: Destination[] = [];

    if (attractionsData.data && Array.isArray(attractionsData.data)) {
      for (const attraction of attractionsData.data.slice(0, 3)) {
        if (!attraction.name) continue;

        results.push({
          id: `ta-attr-${attraction.location_id || results.length}`,
          name: attraction.name,
          location: attraction.location_string || query,
          country: getCountryFromAttraction(attraction),
          image: attraction.photo?.images?.large?.url || getDefaultImage(attraction.name),
          images: [attraction.photo?.images?.large?.url || getDefaultImage(attraction.name)],
          rating: attraction.rating ? parseFloat(attraction.rating) : 0,
          reviews: parseInt(attraction.num_reviews || '0') || 0,
          price: 0,
          currency: 'EUR',
          description: attraction.description || '',
          category: 'Attraction',
          amenities: [],
          highlights: attraction.subcategory?.map((s: any) => s.name).filter(Boolean) || [],
          temperature: undefined,
          bestTime: undefined,
          trending: false,
          source: 'tripadvisor-attractions',
        });
      }
    }

    return results;
  } catch (error) {
    console.error('TripAdvisor Attractions error:', error);
    return [];
  }
}

function getLocationString(loc: any): string {
  if (loc.location_string) return loc.location_string;
  if (loc.address_obj) {
    const parts = [loc.address_obj.city, loc.address_obj.state, loc.address_obj.country].filter(Boolean);
    return parts.join(', ') || 'Destination populaire';
  }
  return 'Destination populaire';
}

function getCountryFromLocation(loc: any, details: any): string {
  if (details?.address_obj?.country) return details.address_obj.country;
  if (loc.address_obj?.country) return loc.address_obj.country;
  if (loc.ancestors && Array.isArray(loc.ancestors)) {
    const country = loc.ancestors.find((a: any) => a.level === 'Country');
    if (country) return country.name;
  }
  return 'International';
}

function getCountryFromAttraction(attraction: any): string {
  if (attraction.address_obj?.country) return attraction.address_obj.country;
  const locationParts = (attraction.location_string || '').split(', ');
  return locationParts[locationParts.length - 1] || 'International';
}

function getCategoryFromType(locationType: string, subcategory?: any[]): string {
  const type = (locationType || '').toLowerCase();
  const subNames = subcategory?.map((s: any) => (s.name || '').toLowerCase()).join(' ') || '';
  
  if (type.includes('beach') || subNames.includes('beach') || subNames.includes('plage')) return 'Plage';
  if (type.includes('mountain') || subNames.includes('mountain') || subNames.includes('ski')) return 'Montagne';
  if (type.includes('island') || subNames.includes('island') || subNames.includes('île')) return 'Île';
  if (type.includes('nature') || subNames.includes('parc') || subNames.includes('nature')) return 'Nature';
  if (type.includes('historic') || subNames.includes('historic') || subNames.includes('museum')) return 'Culture';
  return 'Ville';
}

// getEstimatedPrice / generateDescription / generateReviewCount /
// getHighlightsForDestination / getAmenitiesForCategory / getTemperature /
// getBestTime were removed - they fabricated price, description, review
// count, highlights, amenities, temperature and best-time-to-visit for any
// destination the hardcoded lookup tables didn't happen to cover (or, for
// several fields, unconditionally). Fields TripAdvisor's API doesn't
// actually return are now left empty/zero (see the two push() calls
// above) rather than invented.

function getDefaultImage(query: string): string {
  const imageMap: Record<string, string> = {
    'Paris': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80',
    'Dubai': 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80',
    'Maldives': 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&q=80',
    'Tokyo': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80',
    'Bali': 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80',
    'New York': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80',
    'Rome': 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&q=80',
    'Barcelona': 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&q=80',
    'Bangkok': 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800&q=80',
    'Santorini': 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=800&q=80',
    'Marrakech': 'https://images.unsplash.com/photo-1597212618440-806262de4f6b?w=800&q=80',
    'Londres': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&q=80',
    'Sydney': 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800&q=80',
    'Istanbul': 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=800&q=80',
    'Singapour': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&q=80'
  };
  
  return imageMap[query] || `https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const searchQuery = url.searchParams.get('query');
    const category = url.searchParams.get('category');
    
    // Generate cache key
    const cacheKey = getCacheKey(searchQuery, category);
    
    // Check cache first
    const cached = await getCachedDestinations(cacheKey);
    if (cached) {
      console.log(`Returning cached destinations for: ${cacheKey}`);
      return new Response(
        JSON.stringify({ 
          destinations: cached.destinations, 
          source: cached.source, 
          total: cached.destinations.length,
          cached: true 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const rapidApiKey = Deno.env.get('RAPIDAPI_KEY');
    
    if (!rapidApiKey) {
      // No fictitious fallback: without a real API key there is no real
      // destination data to show, so this returns honestly empty rather
      // than a hardcoded list of invented destinations.
      console.log('RAPIDAPI_KEY not configured, returning no results (no fictitious fallback)');
      return new Response(
        JSON.stringify({ destinations: [], source: 'no-api-key', total: 0, cached: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching destinations from TripAdvisor API...');

    const popularQueries = searchQuery 
      ? [searchQuery] 
      : ['Paris', 'Dubai', 'Bali', 'Tokyo', 'Maldives', 'Santorini', 'Barcelona', 'Marrakech', 'New York'];
    
    // Fetch from TripAdvisor with locations and attractions
    const allResults = await Promise.all(
      popularQueries.map(async (query) => {
        const [locations, attractions] = await Promise.all([
          searchTripAdvisorLocation(query, rapidApiKey),
          searchTripAdvisorAttractions(query, rapidApiKey),
        ]);
        return [...locations, ...attractions];
      })
    );

    // Flatten and deduplicate by name
    const allDestinations = allResults.flat();
    let uniqueDestinations = allDestinations.reduce((acc: Destination[], dest) => {
      if (!acc.find(d => d.name.toLowerCase() === dest.name.toLowerCase())) {
        acc.push(dest);
      }
      return acc;
    }, []);

    // Apply category filter
    if (category && category !== 'all') {
      uniqueDestinations = uniqueDestinations.filter(d => 
        d.category.toLowerCase() === category.toLowerCase()
      );
    }

    console.log(`Total unique destinations: ${uniqueDestinations.length}`);

    if (uniqueDestinations.length > 0) {
      // Cache the API results
      await setCachedDestinations(cacheKey, uniqueDestinations, 'tripadvisor');
      
      return new Response(
        JSON.stringify({ 
          destinations: uniqueDestinations, 
          source: 'tripadvisor', 
          total: uniqueDestinations.length,
          cached: false 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // No results from the real API: return honestly empty, not a
    // hardcoded list of invented destinations.
    console.log('No destinations from API');
    return new Response(
      JSON.stringify({ destinations: [], source: 'tripadvisor', total: 0, cached: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in search-destinations function:', error);
    return new Response(
      JSON.stringify({ destinations: [], source: 'error', cached: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
