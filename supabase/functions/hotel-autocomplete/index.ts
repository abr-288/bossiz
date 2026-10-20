import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    console.log('Hotel autocomplete search for:', query);

    if (!query || query.length < 2) {
      return new Response(
        JSON.stringify({ success: true, data: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const RAPIDAPI_KEY = Deno.env.get('RAPIDAPI_KEY');
    // Suggestion renvoyée au client (Booking.com ou destinations populaires).
    interface Suggestion {
      id: string;
      name: string;
      type: string;
      country: string;
      region: string;
      description: string;
      image: string;
      hotels_count: number;
      average_price: number;
      price_range: { min: number; max: number };
    }

    // Destination de l'API Booking.com searchDestination (champs lus ici).
    interface BookingDestination {
      dest_id?: string;
      id?: string;
      dest_name?: string;
      name?: string;
      search_type?: string;
      country?: string;
      region?: string;
      nr_hotels?: number;
      image_url?: string;
    }

    const results: Suggestion[] = [];

    // Search Booking.com for destinations
    if (RAPIDAPI_KEY) {
      try {
        const destSearchParams = new URLSearchParams({
          query: query,
        });

        console.log('Searching Booking.com destinations for:', query);
        
        const destResponse = await fetch(
          `https://booking-com15.p.rapidapi.com/api/v1/hotels/searchDestination?${destSearchParams}`,
          {
            headers: {
              'X-RapidAPI-Key': RAPIDAPI_KEY,
              'X-RapidAPI-Host': 'booking-com15.p.rapidapi.com',
            },
          }
        );

        if (destResponse.ok) {
          const destData = await destResponse.json();
          console.log('Booking.com autocomplete response:', JSON.stringify(destData).substring(0, 300));
          
          if (destData.data && Array.isArray(destData.data)) {
            const suggestions = destData.data.slice(0, 8).map((item: BookingDestination): Suggestion => {
              // Estimate average price based on destination type and location
              let avgPrice = 80; // Default price in EUR
              
              if (item.search_type === 'CITY') {
                // Estimate based on number of hotels (more hotels = more variety = potentially lower avg)
                const hotelCount = item.nr_hotels || 100;
                if (hotelCount > 500) avgPrice = 70;
                else if (hotelCount > 200) avgPrice = 85;
                else avgPrice = 100;
              } else if (item.search_type === 'HOTEL') {
                avgPrice = 115; // Hotels directly tend to be mid-range
              }

              return {
                id: item.dest_id || item.id || '',
                name: item.search_type === 'CITY' 
                  ? `${item.dest_name || item.name}`
                  : item.dest_name || item.name || '',
                type: item.search_type || 'CITY',
                country: item.country || '',
                region: item.region || '',
                description: item.search_type === 'CITY'
                  ? `Ville - ${item.nr_hotels || 0} hôtels disponibles`
                  : item.search_type === 'HOTEL'
                  ? `Hôtel`
                  : `Destination`,
                image: item.image_url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400',
                hotels_count: item.nr_hotels || 0,
                average_price: avgPrice,
                price_range: {
                  min: Math.round(avgPrice * 0.5),
                  max: Math.round(avgPrice * 2)
                }
              };
            });
            
            results.push(...suggestions);
            console.log('Found', suggestions.length, 'autocomplete suggestions');
          }
        } else {
          console.error('Booking.com autocomplete failed:', destResponse.status);
        }
      } catch (error) {
        console.error('Booking.com autocomplete exception:', error);
      }
    }

    // Fallback: Popular destinations with real data
    if (results.length === 0) {
      const popularDestinations = [
        {
          id: 'abidjan',
          name: 'Abidjan',
          type: 'CITY',
          country: 'Côte d\'Ivoire',
          region: 'Afrique de l\'Ouest',
          description: 'Ville - Capitale économique de la Côte d\'Ivoire',
          image: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=400',
          hotels_count: 150,
          average_price: 45000,
          price_range: { min: 25000, max: 85000 }
        },
        {
          id: 'paris',
          name: 'Paris',
          type: 'CITY',
          country: 'France',
          region: 'Europe',
          description: 'Ville - Capitale de la France, Ville Lumière',
          image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400',
          hotels_count: 3500,
          average_price: 95000,
          price_range: { min: 40000, max: 200000 }
        },
        {
          id: 'london',
          name: 'Londres',
          type: 'CITY',
          country: 'Royaume-Uni',
          region: 'Europe',
          description: 'Ville - Capitale du Royaume-Uni',
          image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400',
          hotels_count: 2800,
          average_price: 85000,
          price_range: { min: 35000, max: 180000 }
        },
        {
          id: 'dubai',
          name: 'Dubaï',
          type: 'CITY',
          country: 'Émirats Arabes Unis',
          region: 'Moyen-Orient',
          description: 'Ville - Ville moderne aux gratte-ciels impressionnants',
          image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400',
          hotels_count: 1200,
          average_price: 110000,
          price_range: { min: 50000, max: 250000 }
        },
        {
          id: 'newyork',
          name: 'New York',
          type: 'CITY',
          country: 'États-Unis',
          region: 'Amérique du Nord',
          description: 'Ville - The Big Apple, ville qui ne dort jamais',
          image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400',
          hotels_count: 2500,
          average_price: 120000,
          price_range: { min: 55000, max: 280000 }
        },
        {
          id: 'tokyo',
          name: 'Tokyo',
          type: 'CITY',
          country: 'Japon',
          region: 'Asie',
          description: 'Ville - Capitale du Japon, mélange tradition et modernité',
          image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400',
          hotels_count: 1800,
          average_price: 75000,
          price_range: { min: 35000, max: 150000 }
        },
      ];

      const filtered = popularDestinations.filter(dest =>
        dest.name.toLowerCase().includes(query.toLowerCase()) ||
        dest.country.toLowerCase().includes(query.toLowerCase())
      );

      results.push(...filtered);
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in hotel-autocomplete:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
