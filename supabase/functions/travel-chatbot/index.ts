import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getClientIP, checkRateLimit, createRateLimitResponse } from "../_shared/rate-limiter.ts";
import { maskCardNumbers } from "../_shared/sensitive.ts";
import { buildContext } from "./context.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ANTHROPIC_MODEL = 'claude-sonnet-5';
const API_TIMEOUT_MS = 25_000;
const HANDOFF_MARKER = /\s*\[\[CONSEILLER\]\]\s*/g;
const LOCALES = ['fr', 'en', 'zh'];

// Le comportement et la connaissance stable de l'assistante sont dans
// prompt-systeme.md, modifiable sans toucher au code (redéployer la
// fonction ensuite). Le contexte vivant est ajouté par context.ts.
let basePrompt: string | null = null;
async function loadBasePrompt(): Promise<string> {
  if (basePrompt === null) {
    basePrompt = await Deno.readTextFile(new URL('./prompt-systeme.md', import.meta.url));
  }
  return basePrompt;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

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
    const { messages, locale } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return json({ success: false, error: 'messages requis' }, 400);
    }

    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicApiKey) {
      // Pas de réponse inventée : sans clé, il n'y a pas d'assistante.
      console.log('ANTHROPIC_API_KEY not configured');
      return json({ success: false, error: "L'assistante n'est pas disponible pour le moment." }, 503);
    }

    // Historique borné : seuls les derniers échanges, chacun tronqué, et les
    // numéros de carte masqués avant de quitter nos serveurs. Anthropic exige
    // que la conversation commence par un message du client : le message
    // d'accueil du widget (assistant) est retiré.
    let history = (messages as Array<{ role: string; content: string }>)
      .slice(-20)
      .map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: maskCardNumbers(String(m.content ?? '').slice(0, 2000)),
      }));
    while (history.length > 0 && history[0].role !== 'user') {
      history = history.slice(1);
    }
    if (history.length === 0) {
      return json({ success: false, error: 'Aucun message utilisateur à traiter' }, 400);
    }

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
    const [prompt, context] = await Promise.all([
      loadBasePrompt(),
      buildContext(admin, token, LOCALES.includes(locale) ? locale : 'fr'),
    ]);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
    let response: Response;
    try {
      response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        signal: controller.signal,
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
          system: `${prompt}\n\n${context.text}`,
          messages: history,
        }),
      });
    } catch (error) {
      const timedOut = error instanceof DOMException && error.name === 'AbortError';
      console.error(timedOut ? 'Anthropic API timeout' : 'Anthropic API unreachable:', error);
      return json({ success: false, error: "L'assistante met trop de temps à répondre." }, 504);
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      console.error('Anthropic API error:', response.status, await response.text());
      return json({ success: false, error: "L'assistante est temporairement indisponible." }, 502);
    }

    const data = await response.json();
    // La réponse peut contenir plusieurs blocs : on assemble tous les blocs
    // de texte au lieu de ne lire que le premier.
    const raw = (data.content ?? [])
      .filter((b: { type: string }) => b.type === 'text')
      .map((b: { text: string }) => b.text)
      .join('')
      .trim();

    // Le marqueur [[CONSEILLER]] signale que l'assistante propose de passer
    // la main : le widget affiche alors le bouton de transmission.
    const handoff = raw.includes('[[CONSEILLER]]');
    const reply = raw.replace(HANDOFF_MARKER, ' ').trim();

    if (!reply) {
      console.error('Anthropic API returned no text content:', JSON.stringify(data).substring(0, 500));
      return json({ success: false, error: "L'assistante n'a pas pu générer de réponse." }, 502);
    }

    return json({ success: true, reply, handoff });
  } catch (error) {
    console.error('Error in travel-chatbot:', error);
    return json({ success: false, error: 'Erreur interne' }, 500);
  }
});
