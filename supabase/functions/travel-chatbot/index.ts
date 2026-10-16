import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Anthropic from "npm:@anthropic-ai/sdk";
import { getClientIP, checkRateLimit, createRateLimitResponse } from "../_shared/rate-limiter.ts";
import { maskCardNumbers } from "../_shared/sensitive.ts";
import { buildContext } from "./context.ts";
import { CATALOG_TOOL, runCatalogSearch } from "./catalog.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MODEL = 'claude-opus-5-5';
// Discussion en direct : réflexion légère, le conseiller doit répondre vite.
const EFFORT = 'low';
const REQUEST_TIMEOUT_MS = 30_000;
// Au plus trois recherches dans le catalogue par message du client
const MAX_TOOL_ROUNDS = 3;
const HANDOFF_MARKER = /\s*\[\[CONSEILLER\]\]\s*/g;
const LOCALES = ['fr', 'en', 'zh'];

// Le comportement et la connaissance stable du conseiller sont dans
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
      // Pas de réponse inventée : sans clé, il n'y a pas de conseiller.
      console.log('ANTHROPIC_API_KEY not configured');
      return json({ success: false, error: "L'assistante n'est pas disponible pour le moment." }, 503);
    }

    // Historique borné : seuls les derniers échanges, chacun tronqué, et les
    // numéros de carte masqués avant de quitter nos serveurs. La conversation
    // doit commencer par un message du client : le message d'accueil du
    // widget (assistant) est retiré.
    let history: Anthropic.Beta.BetaMessageParam[] = (messages as Array<{ role: string; content: string }>)
      .slice(-20)
      .map((m) => ({
        role: m.role === 'assistant' ? 'assistant' as const : 'user' as const,
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

    const client = new Anthropic({ apiKey: anthropicApiKey, timeout: REQUEST_TIMEOUT_MS, maxRetries: 1 });

    // Le prompt stable est mis en cache ; le contexte (date, client) varie
    // et vient après.
    const system = [
      { type: 'text' as const, text: prompt, cache_control: { type: 'ephemeral' as const } },
      { type: 'text' as const, text: context.text },
    ];

    let response: Anthropic.Beta.BetaMessage;
    try {
      for (let round = 0; ; round++) {
        // `fallbacks: "default"` : si le modèle décline une demande, l'API la
        // rejoue sur le modèle de repli recommandé, dans le même appel.
        const params = {
          model: MODEL,
          max_tokens: 4000,
          betas: ['server-side-fallback-2026-07-01'],
          fallbacks: 'default',
          output_config: { effort: EFFORT },
          system,
          tools: [CATALOG_TOOL],
          messages: history,
        };
        response = await client.beta.messages.create(
          params as unknown as Anthropic.Beta.MessageCreateParamsNonStreaming,
        );

        if (response.stop_reason !== 'tool_use' || round >= MAX_TOOL_ROUNDS) break;

        // Le tour complet (blocs de réflexion compris) est renvoyé tel quel.
        history = [...history, { role: 'assistant', content: response.content }];
        const toolUses = response.content.filter(
          (b): b is Anthropic.Beta.BetaToolUseBlock => b.type === 'tool_use',
        );
        const results: Anthropic.Beta.BetaToolResultBlockParam[] = await Promise.all(
          toolUses.map(async (tool) => {
            if (tool.name !== CATALOG_TOOL.name) {
              return { type: 'tool_result' as const, tool_use_id: tool.id, content: 'Outil inconnu.', is_error: true };
            }
            try {
              return { type: 'tool_result' as const, tool_use_id: tool.id, content: await runCatalogSearch(admin, tool.input) };
            } catch (error) {
              console.error('Recherche catalogue impossible:', error);
              return { type: 'tool_result' as const, tool_use_id: tool.id, content: 'Catalogue indisponible pour le moment.', is_error: true };
            }
          }),
        );
        history = [...history, { role: 'user', content: results }];
      }
    } catch (error) {
      if (error instanceof Anthropic.APIConnectionTimeoutError) {
        console.error('Anthropic API timeout');
        return json({ success: false, error: "L'assistante met trop de temps à répondre." }, 504);
      }
      if (error instanceof Anthropic.APIError) {
        console.error('Anthropic API error:', error.status, error.message);
        return json({ success: false, error: "L'assistante est temporairement indisponible." }, 502);
      }
      throw error;
    }

    // Toute la chaîne (modèle principal et repli) a décliné : on propose un
    // conseiller humain plutôt qu'une réponse vide.
    if (response!.stop_reason === 'refusal') {
      console.warn('Refus du modèle:', JSON.stringify(response!.stop_details ?? null));
      return json({
        success: true,
        reply: "Je préfère qu'un conseiller prenne le relais sur cette demande : il vous suffit de cliquer sur le bouton ci-dessous.",
        handoff: true,
      });
    }

    // La réponse peut contenir plusieurs blocs : on assemble tous les blocs
    // de texte (les blocs de réflexion ne sont pas montrés au client).
    const raw = response!.content
      .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('')
      .trim();

    // Le marqueur [[CONSEILLER]] signale que le conseiller propose de passer
    // la main : le widget affiche alors le bouton de transmission.
    const handoff = raw.includes('[[CONSEILLER]]');
    const reply = raw.replace(HANDOFF_MARKER, ' ').trim();

    if (!reply) {
      console.error('Réponse sans texte:', response!.stop_reason, JSON.stringify(response!.content).substring(0, 500));
      return json({ success: false, error: "L'assistante n'a pas pu générer de réponse." }, 502);
    }

    return json({ success: true, reply, handoff });
  } catch (error) {
    console.error('Error in travel-chatbot:', error);
    return json({ success: false, error: 'Erreur interne' }, 500);
  }
});
