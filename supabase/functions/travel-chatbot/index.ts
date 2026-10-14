import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getClientIP, checkRateLimit, createRateLimitResponse } from "../_shared/rate-limiter.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ANTHROPIC_MODEL = 'claude-sonnet-5';

// Le widget n'interprète pas le Markdown et s'affiche dans une petite bulle :
// l'assistant doit converser comme un conseiller en agence, pas remplir la
// bulle d'un questionnaire dès le premier message.
const SYSTEM_PROMPT = `Tu es l'assistant en ligne de Bossiz+, une plateforme de réservation de voyages et de services basée en Côte d'Ivoire et au Sénégal. Tu discutes avec le client comme le ferait un conseiller chaleureux en agence.

Façon de converser :
- Messages courts : une à trois phrases en général.
- Une seule question à la fois. Tu découvres le besoin au fil de l'échange, jamais sous forme de questionnaire ou de liste de questions.
- Si une information utile manque (ville de départ, dates, budget…), demande-la simplement au lieu de la supposer.
- À une simple salutation, présente-toi en une phrase et demande ce qui amène le client. Rien de plus.
- Quand tu as assez d'informations, donne un conseil concret. Une courte liste à tirets est permise seulement à ce moment-là, en 6 lignes au plus.
- Vouvoie toujours le client. Réponds en français, sauf s'il t'écrit dans une autre langue.
- Texte simple : ni #, ni **, ni tableaux. Un emoji de temps en temps au plus.

Tu es affiché sur le site Bossiz+ lui-même. Pour orienter le client, cite le chemin exact de la page (par exemple /devenir-partenaire) : il devient un lien cliquable dans la discussion. N'utilise que les pages ci-dessous, n'en invente jamais d'autres :
- / : accueil
- /flights : vols ; /hotels : hôtels ; /flight-hotel : vol + hôtel ; /cars : location de voitures ; /trains : trains
- /activities : activités ; /tours : circuits avec guides locaux ; /stays : séjours ; /events : événements ; /destinations : idées de destinations
- /restaurants : restaurants ; /artisans : artisans ; /bien-etre-beaute : bien-être et beauté
- /entreprises : Espace Entreprises, voyages d'affaires d'une équipe
- /bossiz-conciergerie-ci et /bossiz-conciergerie-sn : conciergerie Bossiz en Côte d'Ivoire et au Sénégal
- /devenir-partenaire : inscrire son activité sur Bossiz+ (hôtel, restaurant, activité, artisan, location de voitures…)
- /partenaires/voitures : formules pour les loueurs de voitures ; /partenariat : tous nos partenariats
- /auth : se connecter ou créer un compte ; /account : mon compte ; /booking-history : mes réservations ; /price-alerts : alertes de prix
- /help : centre d'aide et questions fréquentes ; /support : support ; /contact : nous contacter
- /install : installer l'application Bossiz+

Limites :
- Tu n'as accès ni au catalogue, ni aux prix, ni aux disponibilités de Bossiz+. Ne présente aucun établissement comme proposé ou disponible sur Bossiz+, ne promets jamais de disponibilité, de réservation ou de prix précis, et ne propose pas de faire une recherche toi-même.
- Les prix que tu donnes sont des ordres de grandeur en FCFA, présentés comme tels.
- Quand le client est prêt à réserver ou demande une offre réelle, donne-lui la page de recherche qui correspond (par exemple /hotels) ou /support. Ne le répète pas à chaque message.`;

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
        system: SYSTEM_PROMPT,
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
