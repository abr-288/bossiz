import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ANTHROPIC_MODEL = 'claude-sonnet-5';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { destination, interests, budget, duration } = await req.json();

    if (!destination || !String(destination).trim()) {
      return new Response(
        JSON.stringify({ success: false, error: 'Destination requise' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');

    if (!anthropicApiKey) {
      // No fictitious fallback: without a real API key there is no real
      // AI advisor to consult, so this returns an honest error instead of
      // fabricated, generic recommendations.
      console.log('ANTHROPIC_API_KEY not configured, returning error (no fictitious fallback)');
      return new Response(
        JSON.stringify({ success: false, error: "Le conseiller IA n'est pas configuré pour le moment." }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userPrompt = `Destination : ${destination}
Centres d'intérêt : ${interests || 'non précisé'}
Budget : ${budget || 'non précisé'}
Durée du séjour : ${duration || 'non précisée'}

Rédige des recommandations de voyage personnalisées pour cette destination, structurées avec des sections claires (attractions incontournables, gastronomie locale, conseils d'hébergement, meilleure période pour visiter, budget quotidien estimé, astuces d'initié). Réponds en français, en texte simple et lisible (pas de JSON), avec des titres de section et des listes à puces.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 1200,
        system: 'Tu es un conseiller de voyage expert et chaleureux pour Bossiz (B-Reserve), une agence de voyage. Tu donnes des recommandations concrètes, honnêtes et utiles, jamais génériques ou inventées au hasard.',
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ success: false, error: "Le conseiller IA est temporairement indisponible." }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const recommendations = data.content?.[0]?.text;

    if (!recommendations) {
      console.error('Anthropic API returned no text content:', JSON.stringify(data).substring(0, 500));
      return new Response(
        JSON.stringify({ success: false, error: "Le conseiller IA n'a pas pu générer de réponse." }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, recommendations }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ai-travel-advisor:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
