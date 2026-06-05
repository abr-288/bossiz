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
    const { airportCode } = await req.json();
    
    const rapidApiKey = Deno.env.get('RAPIDAPI_KEY');

    if (!rapidApiKey) {
      console.log('RAPIDAPI_KEY not configured, returning mock data');
      return getMockAirportInfo(airportCode);
    }

    console.log('Getting airport info for:', airportCode);

    // Using Aviation Stack API via RapidAPI for airport information
    const response = await fetch(
      `https://aviation-stack-api.p.rapidapi.com/airports?iata_code=${airportCode}`,
      {
        headers: {
          'X-RapidAPI-Key': rapidApiKey,
          'X-RapidAPI-Host': 'aviation-stack-api.p.rapidapi.com'
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Aviation Stack API error:', response.status, errorText);
      console.log('Falling back to mock data');
      return getMockAirportInfo(airportCode);
    }

    const data = await response.json();
    
    if (!data.data || data.data.length === 0) {
      console.log('No airport data found, returning mock');
      return getMockAirportInfo(airportCode);
    }

    const airport = data.data[0];
    const airportInfo = {
      iata_code: airport.iata_code,
      name: airport.airport_name,
      city: airport.city,
      country: airport.country_name,
      country_iso2: airport.country_iso2,
      latitude: airport.latitude,
      longitude: airport.longitude,
      timezone: airport.timezone,
      gmt: airport.gmt,
      phone: airport.phone_number,
      website: airport.website,
      source: 'aviation-stack'
    };

    return new Response(
      JSON.stringify({
        success: true,
        data: airportInfo,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in airport-info:', error);
    const { airportCode } = await req.json();
    return getMockAirportInfo(airportCode);
  }
});

function getMockAirportInfo(airportCode: string) {
  const mockData = {
    iata_code: airportCode || 'XXX',
    name: `${airportCode || 'International'} Airport`,
    city: 'Sample City',
    country: 'Sample Country',
    country_iso2: 'SC',
    latitude: 0.0,
    longitude: 0.0,
    timezone: 'UTC',
    gmt: '+0:00',
    phone: '+1 234 567 8900',
    website: 'https://www.example-airport.com',
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
