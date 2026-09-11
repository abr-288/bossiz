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
    let history = messages as Array<{ role: string; content: string }>;
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
        max_tokens: 500,
        system: 'Tu es un assistant de voyage serviable pour Bossiz (B-Reserve). Donne des conseils de voyage concis et utiles, de l\'aide pour les réservations et des recommandations de destinations. Sois amical et professionnel. Réponds en français sauf si on te parle dans une autre langue.',
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
    const reply = data.content?.[0]?.text;

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
