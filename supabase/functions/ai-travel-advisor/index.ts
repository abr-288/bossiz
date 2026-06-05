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
    
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      console.log('LOVABLE_API_KEY not configured, returning mock data');
      return getMockRecommendations(destination, interests, budget, duration);
    }

    console.log('Getting AI travel recommendations for:', destination);

    // Call Lovable API for AI-powered travel recommendations
    const prompt = `Act as a travel advisor. Provide personalized travel recommendations for ${destination}. 
    Interests: ${interests || 'general tourism'}
    Budget: ${budget || 'flexible'}
    Duration: ${duration || 'not specified'}
    
    Provide recommendations in JSON format with:
    - top_attractions: array of attraction names and descriptions
    - local_cuisine: array of food recommendations
    - accommodation_tips: string with advice
    - best_time_to_visit: string
    - estimated_daily_budget: object with low, medium, high ranges
    - insider_tips: array of local tips`;

    const response = await fetch('https://api.lovable.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a knowledgeable travel advisor providing personalized recommendations in JSON format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable API error:', response.status, errorText);
      console.log('Falling back to mock data');
      return getMockRecommendations(destination, interests, budget, duration);
    }

    const data = await response.json();
    const recommendations = JSON.parse(data.choices[0].message.content);

    return new Response(
      JSON.stringify({
        success: true,
        data: recommendations,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ai-travel-advisor:', error);
    const { destination, interests, budget, duration } = await req.json();
    return getMockRecommendations(destination, interests, budget, duration);
  }
});

function getMockRecommendations(destination: string, interests?: string, budget?: string, duration?: string) {
  const mockData = {
    destination: destination || 'Unknown Destination',
    top_attractions: [
      { name: 'Historic City Center', description: 'Explore the ancient architecture and local culture' },
      { name: 'Scenic Viewpoint', description: 'Breathtaking panoramic views of the city' },
      { name: 'Local Market', description: 'Experience authentic local life and crafts' },
    ],
    local_cuisine: [
      { name: 'Traditional Dish', description: 'Signature local specialty dish' },
      { name: 'Street Food Tour', description: 'Sample various local street foods' },
    ],
    accommodation_tips: 'Stay in the city center for easy access to attractions. Book in advance for better rates.',
    best_time_to_visit: 'Spring and fall offer pleasant weather and fewer crowds.',
    estimated_daily_budget: {
      low: '$50-100',
      medium: '$100-200',
      high: '$200+',
    },
    insider_tips: [
      'Learn a few basic phrases in the local language',
      'Use public transportation for cost-effective travel',
      'Visit attractions early morning or late afternoon to avoid crowds',
    ],
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
