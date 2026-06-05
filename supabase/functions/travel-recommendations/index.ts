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
    const { destination, interests, budget, duration } = await req.json();
    
    const rapidApiKey = Deno.env.get('RAPIDAPI_KEY');

    if (!rapidApiKey) {
      console.log('RAPIDAPI_KEY not configured, returning mock data');
      return getMockRecommendations(destination, interests, budget, duration);
    }

    console.log('Getting travel recommendations for:', destination);

    // Using TripAdvisor API via RapidAPI for travel recommendations
    const response = await fetch(
      `https://tripadvisor16.p.rapidapi.com/api/v1/flights/search-destination?query=${encodeURIComponent(destination || '')}`,
      {
        headers: {
          'X-RapidAPI-Key': rapidApiKey,
          'X-RapidAPI-Host': 'tripadvisor16.p.rapidapi.com'
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('TripAdvisor API error:', response.status, errorText);
      console.log('Falling back to mock data');
      return getMockRecommendations(destination, interests, budget, duration);
    }

    const data = await response.json();
    
    // Transform the response to match our expected format
    const recommendations = {
      destination: destination,
      top_attractions: data.data?.attractions?.slice(0, 5).map((attr: any) => ({
        name: attr.name || 'Attraction',
        description: attr.description || 'Popular attraction',
        rating: attr.rating || 4.5
      })) || [],
      hotels: data.data?.hotels?.slice(0, 5).map((hotel: any) => ({
        name: hotel.name || 'Hotel',
        rating: hotel.rating || 4.0,
        price: hotel.price || '$$'
      })) || [],
      restaurants: data.data?.restaurants?.slice(0, 5).map((rest: any) => ({
        name: rest.name || 'Restaurant',
        cuisine: rest.cuisine || 'Local',
        rating: rest.rating || 4.0
      })) || [],
      source: 'tripadvisor'
    };

    return new Response(
      JSON.stringify({
        success: true,
        data: recommendations,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in travel-recommendations:', error);
    const { destination, interests, budget, duration } = await req.json();
    return getMockRecommendations(destination, interests, budget, duration);
  }
});

function getMockRecommendations(destination: string, interests?: string, budget?: string, duration?: string) {
  const mockData = {
    destination: destination || 'Unknown Destination',
    top_attractions: [
      { name: 'Historic City Center', description: 'Explore the ancient architecture and local culture', rating: 4.8 },
      { name: 'Scenic Viewpoint', description: 'Breathtaking panoramic views of the city', rating: 4.6 },
      { name: 'Local Market', description: 'Experience authentic local life and crafts', rating: 4.4 },
      { name: 'National Museum', description: 'Learn about the history and heritage', rating: 4.7 },
      { name: 'City Park', description: 'Relax in beautiful green spaces', rating: 4.3 },
    ],
    hotels: [
      { name: 'Luxury Grand Hotel', rating: 4.8, price: '$$$' },
      { name: 'Boutique City Center', rating: 4.5, price: '$$' },
      { name: 'Budget Friendly Inn', rating: 4.2, price: '$' },
      { name: 'Business Traveler Hotel', rating: 4.4, price: '$$' },
      { name: 'Family Resort', rating: 4.6, price: '$$$' },
    ],
    restaurants: [
      { name: 'Fine Dining Experience', cuisine: 'International', rating: 4.7 },
      { name: 'Local Street Food', cuisine: 'Local', rating: 4.5 },
      { name: 'Seafood Specialties', cuisine: 'Seafood', rating: 4.6 },
      { name: 'Vegetarian Garden', cuisine: 'Vegetarian', rating: 4.4 },
      { name: 'Traditional Kitchen', cuisine: 'Traditional', rating: 4.8 },
    ],
    accommodation_tips: 'Stay in the city center for easy access to attractions. Book in advance for better rates.',
    best_time_to_visit: 'Spring and fall offer pleasant weather and fewer crowds.',
    estimated_daily_budget: {
      low: '$50-100',
      medium: '$100-200',
      high: '$200+',
    },
    source: 'mock'
  };

  return new Response(
    JSON.stringify({
      success: true,
      data: mockData,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
