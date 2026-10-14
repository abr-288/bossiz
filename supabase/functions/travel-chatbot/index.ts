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
  const rateLimit = { windowMs: 60 * 60 * 1000, maxRequests: 60, keyPrefix: 'travel-chatbot' };
  const rate = checkRateLimit(getClientIP(req), rateLimit);
  if (!rate.allowed) {
    return createRateLimitResponse(rate, rateLimit, corsHeaders);
  }

  try {
    const { messages } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'messages requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');

    if (!anthropicApiKey) {
      // No fictitious fallback: without a real API key there is no real
      // assistant to answer, so this returns an honest error instead of a
      // hardcoded keyword-matched reply pretending to be AI.
      console.log('ANTHROPIC_API_KEY not configured, returning error (no fictitious fallback)');
      return new Response(
        JSON.stringify({ success: false, error: "L'assistant IA n'est pas configuré pour le moment." }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Anthropic requires the conversation to start with a 'user' message -
    // the widget's stored greeting is an 'assistant' message, so drop any
    // leading assistant turn(s) before sending the history along.
    // Historique borné : seuls les derniers échanges, chacun tronqué.
    let history = (messages as Array<{ role: string; content: string }>)
      .slice(-20)
      .map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content ?? '').slice(0, 2000) }));
    while (history.length > 0 && history[0].role !== 'user') {
      history = history.slice(1);
    }

    if (history.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Aucun message utilisateur à traiter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing travel chatbot request with', history.length, 'messages');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 800,
        // Pas de réflexion préalable : elle pouvait consommer tout max_tokens
        // avant le premier mot, et la réponse arrivait vide.
        thinking: { type: 'disabled' },
        system: 'Tu es un assistant de voyage serviable pour Bossiz+. Donne des conseils de voyage concis et utiles, de l\'aide pour les réservations et des recommandations de destinations. Sois amical et professionnel, et vouvoie toujours le client. Réponds en français sauf si on te parle dans une autre langue. Tu n\'as accès ni au catalogue, ni aux prix, ni aux disponibilités de Bossiz+ : ne cite aucun établissement comme étant proposé ou disponible sur Bossiz+, ne promets jamais de disponibilité, de réservation ou de prix précis, et ne propose pas de faire une recherche toi-même. Les prix que tu donnes sont des ordres de grandeur, présentés comme tels. Pour les offres réelles, invite le client à utiliser la recherche du site (vols, hôtels, voitures, activités) ou à contacter le support. Tes réponses s\'affichent dans une petite bulle de discussion qui n\'interprète pas le Markdown : écris en texte simple (pas de #, pas de **, pas de tableaux), en 8 lignes au plus, avec des tirets pour les listes.',
        messages: history.map((m) => ({ role: m.role, content: m.content })),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ success: false, error: "L'assistant IA est temporairement indisponible." }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    // La réponse peut contenir plusieurs blocs (réflexion, texte…) : on
    // assemble tous les blocs de texte au lieu de ne lire que le premier.
    const reply = (data.content ?? [])
      .filter((b: { type: string }) => b.type === 'text')
      .map((b: { text: string }) => b.text)
      .join('')
      .trim();

    if (!reply) {
      console.error('Anthropic API returned no text content:', JSON.stringify(data).substring(0, 500));
      return new Response(
        JSON.stringify({ success: false, error: "L'assistant IA n'a pas pu générer de réponse." }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, reply }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in travel-chatbot:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
