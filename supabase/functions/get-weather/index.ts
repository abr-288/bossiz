import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { city } = await req.json();
    const RAPIDAPI_KEY = Deno.env.get('RAPIDAPI_KEY');

    // If API key is not configured, return mock data
    if (!RAPIDAPI_KEY) {
      console.log('RAPIDAPI_KEY not configured, returning mock weather data');
      return getMockWeather(city);
    }

    console.log('Fetching weather for city:', city);

    // Using WeatherAPI from RapidAPI
    const response = await fetch(
      `https://weatherapi-com.p.rapidapi.com/current.json?q=${encodeURIComponent(city)}`,
      {
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'weatherapi-com.p.rapidapi.com'
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Weather API error:', response.status, errorText);
      console.log('Falling back to mock weather data');
      return getMockWeather(city);
    }

    const data = await response.json();
    console.log('Weather data received successfully');

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          location: data.location.name,
          country: data.location.country,
          temperature: data.current.temp_c,
          condition: data.current.condition.text,
          icon: data.current.condition.icon,
          humidity: data.current.humidity,
          windSpeed: data.current.wind_kph,
          feelsLike: data.current.feelslike_c,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in get-weather function:', error);
    console.log('Returning mock weather data due to error');
    const { city } = await req.json();
    return getMockWeather(city);
  }
});

// Météo indisponible : on ne renvoie jamais de valeurs inventées, le widget se masque.
function getMockWeather(_city: string) {
  return new Response(
    JSON.stringify({ success: false, error: "Météo indisponible" }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
