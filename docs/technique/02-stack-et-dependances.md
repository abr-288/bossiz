# 02 — Stack technique et dépendances

## 1. Langages et outils de build

| Élément | Valeur constatée | Source |
|---|---|---|
| Langage principal | TypeScript 5.8.3 | [package.json](../../package.json) |
| Framework UI | React 18.3.1 | [package.json](../../package.json) |
| Bundler / dev server | Vite 5.4.19 (plugin `@vitejs/plugin-react-swc`, compilation SWC) | [vite.config.ts](../../vite.config.ts) |
| Styles | Tailwind CSS 3.4.17 + `tailwindcss-animate` + `@tailwindcss/typography` | [tailwind.config.ts](../../tailwind.config.ts) |
| Composants UI | shadcn/ui (généré localement dans [src/components/ui/](../../src/components/ui/)) sur base Radix UI | [components.json](../../components.json) |
| Gestion de formulaires | `react-hook-form` + `zod` + `@hookform/resolvers` | [package.json](../../package.json) |
| État serveur / cache | `@tanstack/react-query` 5.83.0 | [package.json](../../package.json) |
| Internationalisation | `i18next` / `react-i18next` 25.6 / 16.2 — 3 langues (fr, en, zh) | [src/i18n/locales/](../../src/i18n/locales/) |
| PWA | `vite-plugin-pwa` 1.1.0 | [vite.config.ts](../../vite.config.ts) |
| Mobile natif | Capacitor 8.5.2 (`@capacitor/android`, `@capacitor/ios`, `@capacitor/core`, `@capacitor/cli`) | [capacitor.config.ts](../../capacitor.config.ts) |
| Tests | Vitest 4.0.13 + Testing Library (React + DOM + jest-dom) + jsdom | [vitest.config.ts](../../vitest.config.ts) |
| Lint / format | ESLint 9 (config flat, `typescript-eslint`) + Prettier | [eslint.config.js](../../eslint.config.js) |
| Backend / BaaS | Supabase (`@supabase/supabase-js` 2.86.0), Edge Functions en Deno (runtime `std@0.168.0`, constaté dans les imports des fonctions) | [supabase/config.toml](../../supabase/config.toml) |
| Validation serveur | `zod` (partagé frontend/backend) | [supabase/functions/_shared/zodValidation.ts](../../supabase/functions/_shared/zodValidation.ts) |

## 2. Dépendances runtime et licences

Licences extraites directement des `package.json` de chaque paquet installé dans `node_modules/` (champ `license`), pas de valeur supposée. Aucune licence copyleft forte (GPL/AGPL) détectée parmi les dépendances directes.

| Dépendance | Version (package.json) | Licence |
|---|---|---|
| @capacitor/android, @capacitor/cli, @capacitor/core, @capacitor/ios | ^8.5.2 | MIT |
| @dnd-kit/core, /sortable, /utilities | ^6-10.x | MIT |
| @hookform/resolvers | ^3.10.0 | MIT |
| @lovable.dev/cloud-auth-js | ^0.0.3 | MIT |
| @radix-ui/react-* (26 paquets : accordion, alert-dialog, aspect-ratio, avatar, checkbox, collapsible, context-menu, dialog, dropdown-menu, hover-card, label, menubar, navigation-menu, popover, progress, radio-group, scroll-area, select, separator, slider, slot, switch, tabs, toast, toggle, toggle-group, tooltip) | 1.x-2.x | MIT |
| @supabase/supabase-js | ^2.86.0 | MIT |
| @swc/core | ^1.13.2 | Apache-2.0 |
| @tanstack/react-query | ^5.83.0 | MIT |
| @testing-library/jest-dom, /react, /dom | — | MIT |
| class-variance-authority | ^0.7.1 | Apache-2.0 |
| clsx | ^2.1.1 | MIT |
| cmdk | ^1.1.1 | MIT |
| date-fns | ^3.6.0 | MIT |
| dompurify | ^3.3.1 | MPL-2.0 OR Apache-2.0 |
| embla-carousel-autoplay, embla-carousel-react | ^8.6.0 | MIT |
| framer-motion | ^12.38.0 | MIT |
| ftp | ^0.3.10 | MIT |
| i18next, react-i18next | ^25.6.0 / ^16.2.4 | MIT |
| idb | ^8.0.3 | ISC |
| input-otp | ^1.4.2 | MIT |
| jsdom | ^27.2.0 | MIT |
| lucide-react | ^0.462.0 | ISC |
| next-themes | ^0.3.0 | MIT |
| react, react-dom | ^18.3.1 | MIT |
| react-day-picker | ^8.10.1 | MIT |
| react-helmet-async | ^2.0.5 | Apache-2.0 |
| react-hook-form | ^7.61.1 | MIT |
| react-resizable-panels | ^2.1.9 | MIT |
| react-router-dom | ^6.30.1 | MIT |
| recharts | ^2.15.4 | MIT |
| sonner | ^1.7.4 | MIT |
| tailwind-merge | ^2.6.0 | MIT |
| tailwindcss-animate | ^1.0.7 | MIT |
| vaul | ^0.9.9 | MIT |
| vite-plugin-pwa | ^1.1.0 | MIT |
| vitest | ^4.0.13 | MIT |
| zod | ^3.25.76 | MIT |
| terser (dev) | ^5.36.0 | BSD-2-Clause |
| typescript (dev) | ^5.8.3 | Apache-2.0 |
| vite (dev) | ^5.4.19 | MIT |
| eslint et plugins (dev) | 9.x | MIT |

**Constat notable** : la dépendance `@lovable.dev/cloud-auth-js` et le très grand nombre de commits attribués à `gpt-engineer-app[bot]` (890 sur 944, voir Phase 1) indiquent que le projet a été développé/itéré en grande partie via la plateforme **Lovable** (outil de génération de code par IA). C'est cohérent avec la variable d'environnement `LOVABLE_API_KEY` présente dans [.env.example](../../.env.example).

## 3. Services tiers utilisés (constatés dans le code, détail complet en [09-integrations.md](09-integrations.md))

| Service | Usage constaté | Fichier |
|---|---|---|
| Supabase | Base de données, auth, storage, edge functions | tout le dépôt |
| CinetPay | Paiement (carte, mobile money, Côte d'Ivoire) | [supabase/functions/_shared/cinetpayRefund.ts](../../supabase/functions/_shared/cinetpayRefund.ts), `process-payment`, `payment-callback` |
| Jèko | Paiement / webhook | [supabase/functions/_shared/jeko.ts](../../supabase/functions/_shared/jeko.ts), `jeko-webhook` |
| Amadeus | Recherche vols (API GDS) | variables `AMADEUS_API_KEY`/`AMADEUS_API_SECRET` dans [.env.example](../../.env.example) |
| RapidAPI (Aerodatabox, Travel Advisor, Flight Fare Search) | Infos avions/aéroports, recommandations voyage, tarifs vols | variables `AERODATABOX_*`, `TRAVEL_ADVISOR_*`, `FLIGHT_FARE_SEARCH_*` |
| TravelPayouts | Comparateur vols / tracking (`tpembars.com`, `*.travelpayouts.com` en CSP) | [deploy-vps/nginx.conf](../../deploy-vps/nginx.conf) |
| Stay22 | Widget hôtel embarqué (iframe, en CSP) | [deploy-vps/nginx.conf](../../deploy-vps/nginx.conf) |
| Resend | Envoi d'e-mails transactionnels | [supabase/functions/_shared/integrations.ts:77](../../supabase/functions/_shared/integrations.ts) |
| SMTP générique | Envoi d'e-mails (alternative à Resend) | [supabase/functions/_shared/smtp.ts](../../supabase/functions/_shared/smtp.ts) |
| Twilio | SMS/WhatsApp | [supabase/functions/_shared/integrations.ts:205,361](../../supabase/functions/_shared/integrations.ts) |
| Orange SMS API | SMS (Afrique de l'Ouest) | [supabase/functions/_shared/integrations.ts:227,240](../../supabase/functions/_shared/integrations.ts) |
| Sendexa | SMS/WhatsApp | [supabase/functions/_shared/integrations.ts:274,387](../../supabase/functions/_shared/integrations.ts) |
| Africa's Talking | SMS | [supabase/functions/_shared/integrations.ts:298](../../supabase/functions/_shared/integrations.ts) |
| Anthropic (Claude, modèle `claude-sonnet-5`) | Assistant IA voyage (conseils, chatbot) | [supabase/functions/ai-travel-advisor/index.ts:8,25,45,53](../../supabase/functions/ai-travel-advisor/index.ts), `travel-chatbot` |
| Web Push (VAPID) | Notifications push navigateur | `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY`, `send-push-notification` |

**Multiplicité des fournisseurs SMS/e-mail** : le code prévoit *quatre* fournisseurs SMS possibles (Twilio, Orange, Sendexa, Africa's Talking) et *deux* fournisseurs e-mail (Resend, SMTP générique) dans le même module [_shared/integrations.ts](../../supabase/functions/_shared/integrations.ts) — **[déduction]** cela suggère soit une bascule progressive d'un fournisseur à l'autre, soit un mécanisme de sélection/fallback dont la logique exacte est à vérifier dans [09-integrations.md](09-integrations.md).
