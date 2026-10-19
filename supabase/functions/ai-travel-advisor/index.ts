import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getClientIP, checkRateLimit, createRateLimitResponse } from "../_shared/rate-limiter.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ANTHROPIC_MODEL = 'claude-sonnet-5';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Fonction publique qui consomme l'API Claude : plafond par IP pour
  // qu'un script muni de la clé anon ne puisse pas faire exploser la facture.
  const rateLimit = { windowMs: 60 * 60 * 1000, maxRequests: 20, keyPrefix: 'ai-travel-advisor' };
  const rate = checkRateLimit(getClientIP(req), rateLimit);
  if (!rate.allowed) {
    return createRateLimitResponse(rate, rateLimit, corsHeaders);
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

    const field = (v: unknown) => String(v ?? '').slice(0, 300);
    const userPrompt = `Destination : ${field(destination)}
Centres d'intérêt : ${field(interests) || 'non précisé'}
Budget : ${field(budget) || 'non précisé'}
Durée du séjour : ${field(duration) || 'non précisée'}

Rédige des recommandations de voyage personnalisées pour cette destination, structurées avec des sections claires (attractions incontournables, gastronomie locale, conseils d'hébergement, meilleure période pour visiter, budget quotidien estimé, astuces d'initié). Réponds en français, en texte simple et lisible (pas de JSON, pas de Markdown : ni #, ni **), avec des titres de section sur leur propre ligne et des listes à tirets.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 1500,
        // Pas de réflexion préalable : elle pouvait consommer tout max_tokens
        // avant le premier mot, et la réponse arrivait vide.
        thinking: { type: 'disabled' },
        system: 'Tu es un conseiller de voyage expert et chaleureux pour Bossiz+, une agence de voyage. Tu donnes des recommandations concrètes, honnêtes et utiles, jamais génériques ou inventées au hasard.',
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
    // La réponse peut contenir plusieurs blocs (réflexion, texte…) : on
    // assemble tous les blocs de texte au lieu de ne lire que le premier.
    const recommendations = (data.content ?? [])
      .filter((b: { type: string }) => b.type === 'text')
      .map((b: { text: string }) => b.text)
      .join('')
      .trim();

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
