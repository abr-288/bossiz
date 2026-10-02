# 03 — Configuration (variables d'environnement)

> Aucune valeur réelle n'est reproduite dans ce document — uniquement les noms de variables et leur rôle déduit de leur usage dans le code. Sources : [.env.example](../../.env.example), [.env.deploy.example](../../.env.deploy.example), recherche exhaustive de `import.meta.env.VITE_*` dans `src/` et `Deno.env.get(...)` dans `supabase/functions/`.

## 1. Frontend (Vite, préfixe `VITE_`)

| Variable | Où utilisée | Rôle | Obligatoire | Dans `.env.example` |
|---|---|---|---|---|
| `VITE_SUPABASE_URL` | [src/integrations/supabase/client.ts](../../src/integrations/supabase/client.ts) + plusieurs composants | URL du projet Supabase (SDK client) | **Oui** — l'app ne fonctionne pas sans | Oui |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | idem | Clé publique/anon Supabase | **Oui** | Oui |
| `VITE_SUPABASE_PROJECT_ID` | [src/config/appConfig.ts](../../src/config/appConfig.ts) | Identifiant du projet (affichage/config) | Non (défaut placeholder) | Oui |
| `VITE_VAPID_PUBLIC_KEY` | [src/hooks/usePushNotifications.ts](../../src/hooks/usePushNotifications.ts) | Clé publique VAPID pour l'abonnement push | Non (dégrade en refus silencieux) | Oui |
| `VITE_APP_NAME` | appConfig.ts | Nom affiché de l'app | Non (défaut « Bossiz Conciergerie ») | Oui |
| `VITE_APP_VERSION` | appConfig.ts | Version affichée | Non (défaut `1.0.0`) | Oui |
| `VITE_APP_ENVIRONMENT` | appConfig.ts | Sélecteur config prod/dev | Non (défaut `development`) | Oui |
| `VITE_API_BASE_URL` | appConfig.ts | URL de base d'une API interne | Non (défaut localhost) | Non — absente |
| `VITE_WEB_BASE_URL` | appConfig.ts | URL de base web | Non (défaut localhost) | Non — absente |
| `REACT_APP_SUPABASE_*` (3 variables) | appConfig.ts | Alias legacy (compat Create-React-App) | Non (fallback seulement) | Non — absentes |

## 2. Backend (Supabase Edge Functions, `Deno.env.get`)

| Variable | Où utilisée | Rôle | Obligatoire | Dans `.env.example` |
|---|---|---|---|---|
| `SUPABASE_URL` | ~50 fonctions | URL projet (injectée automatiquement par le runtime Edge) | Oui (technique, non à définir manuellement) | Non — normal, auto-injectée |
| `SUPABASE_SERVICE_ROLE_KEY` | ~50 fonctions | Clé privilégiée bypassant RLS | Oui | Non — normal, auto-injectée |
| `SUPABASE_ANON_KEY` | de nombreuses fonctions | Client Supabase non privilégié | Oui | Non — normal, auto-injectée |
| `PRICE_SIGNING_SECRET` | `checkout`, `prebook`, `_shared/priceSignature.ts` | Secret HMAC de signature de prix (distinct de `SERVICE_ROLE_KEY`), anti-falsification | **Oui** — bloque explicitement si absent | Oui |
| `RAPIDAPI_KEY` | `airport-info`, `search-*`, `hotel-autocomplete`, `get-weather`, `travel-recommendations` | Clé RapidAPI partagée (météo, hôtels, vols, trains, événements) | Non (repli mock/vide) | Oui |
| `AMADEUS_API_KEY` / `AMADEUS_API_SECRET` | `create-pnr`, `search-flights`, `search-hotels` | OAuth2 Amadeus (GDS) | Non (bascule sur autres fournisseurs) | Oui |
| `TRAVELPAYOUTS_TOKEN` | `search-flight-hotel-packages`, `search-flights` | Recherche vols Travelpayouts | Non | Oui |
| `KAYAK_RAPIDAPI_KEY` / `KAYAK_RAPIDAPI_HOST` | `search-flights`, `search-hotels` | Fournisseur Kayak (RapidAPI) | Non (repli sur `RAPIDAPI_KEY`) | **Non — absentes** (mais utilisées réellement) |
| `ANTHROPIC_API_KEY` | `ai-travel-advisor`, `travel-chatbot` | Clé API Anthropic (Claude) — assistant IA et chatbot | Oui pour la fonctionnalité (erreur honnête si absente) | **Non — absente** ⚠️ |
| `CINETPAY_API_KEY` / `CINETPAY_SITE_ID` | `_shared/integrations.ts`, `_shared/cinetpayRefund.ts` | Passerelle paiement CinetPay | Non (échec géré en douceur) | Mentionnées en commentaire seulement |
| `RESEND_API_KEY` | `_shared/integrations.ts`, quasi tous les `send-*` | Envoi d'e-mails transactionnels | Non (échec non bloquant) | Oui |
| `SUPPORT_INBOX_EMAIL` | `send-support-email` | Adresse de réception du formulaire de contact | Non (défaut `support@bossiz.com`) | Non — absente |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` | `send-push-notification` | Clés serveur Web Push (la publique doit correspondre à `VITE_VAPID_PUBLIC_KEY`) | Non (bascule en notification mock) | Mentionnées en commentaire seulement (volontaire) |

## 3. Déploiement FTP ([.env.deploy.example](../../.env.deploy.example), utilisé par [deploy-ftp.js](../../deploy-ftp.js))

| Variable | Rôle | Obligatoire |
|---|---|---|
| `FTP_HOST`, `FTP_USER`, `FTP_PASSWORD` | Identifiants serveur FTP | **Oui** (`process.exit(1)` si absent) |
| `FTP_PORT` | Port FTP | Non (défaut 21) |
| `FTP_REMOTE_DIR` | Répertoire distant | Non (défaut `/public_html`) |

**Note** : ce mécanisme de déploiement FTP coexiste avec le déploiement VPS réel ([deploy-vps/redeploy.sh](../../deploy-vps/redeploy.sh)) — voir [10-deploiement-exploitation.md](10-deploiement-exploitation.md) pour la clarification de ce qui est effectivement utilisé en production.

## 4. `supabase/config.toml` — configuration CLI locale

Fichier de boilerplate généré par `supabase init`. Les variables suivantes pointent vers des fonctionnalités **désactivées** (`enabled = false`) ou vers l'outillage Supabase Studio local — hors périmètre des secrets applicatifs :

| Variable | Section | Rôle | Statut |
|---|---|---|---|
| `OPENAI_API_KEY` | `[studio]` | Assistant IA de Supabase Studio (dev local) | Optionnel, outillage local |
| `S3_HOST`, `S3_REGION`, `S3_ACCESS_KEY`, `S3_SECRET_KEY` | `[experimental]` | Bucket S3 pour stockage OrioleDB expérimental | Non branché par défaut |
| `SUPABASE_AUTH_SMS_TWILIO_AUTH_TOKEN` | `[auth.sms.twilio]` | SMS d'authentification Twilio | Provider désactivé |
| `SUPABASE_AUTH_EXTERNAL_APPLE_SECRET` | `[auth.external.apple]` | OAuth Apple | Provider désactivé |

## 5. Incohérences constatées entre `.env.example` et le code réel

**Documentées dans `.env.example` mais jamais utilisées dans le code (obsolètes probables)** :
- `LOVABLE_API_KEY` — aucun usage trouvé (`Deno.env.get`/`import.meta.env`) ; seules des URLs `lovable.app` codées en dur existent. L'IA utilise en réalité `ANTHROPIC_API_KEY`.
- `AERODATABOX_API_KEY`/`HOST`, `TRAVEL_ADVISOR_API_KEY`/`HOST`, `FLIGHT_FARE_SEARCH_API_KEY`/`HOST` — aucun usage trouvé dans `supabase/functions/`. Un commentaire dans [src/pages/admin/AdminConfiguration.tsx](../../src/pages/admin/AdminConfiguration.tsx) indique explicitement que ces clés « ne sont jamais lues depuis `site_config` » — fonctionnalité probablement abandonnée ou jamais finalisée.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` — aucune occurrence dans le code ; l'envoi d'e-mails passe exclusivement par Resend. Vestige probable d'une intégration SMTP abandonnée.

**Utilisées dans le code mais absentes de `.env.example` (documentation à corriger)** :
- **`ANTHROPIC_API_KEY`** — utilisée et nécessaire au fonctionnement de l'assistant IA, totalement absente du fichier d'exemple (qui documente à sa place `LOVABLE_API_KEY`, non utilisée). C'est l'incohérence la plus significative à corriger en priorité.
- `KAYAK_RAPIDAPI_KEY`, `KAYAK_RAPIDAPI_HOST` — utilisées dans `search-flights`/`search-hotels`, absentes de l'exemple.
- `SUPPORT_INBOX_EMAIL` — utilisée dans `send-support-email`, absente.
- `VITE_API_BASE_URL`, `VITE_WEB_BASE_URL`, alias `REACT_APP_SUPABASE_*` — impact mineur (valeurs par défaut existent).

## 6. Recommandation

Mettre à jour [.env.example](../../.env.example) pour : ajouter `ANTHROPIC_API_KEY` et `KAYAK_RAPIDAPI_*` (secrets actifs et nécessaires), retirer ou clairement marquer comme obsolètes `LOVABLE_API_KEY`, `AERODATABOX_*`, `TRAVEL_ADVISOR_*`, `FLIGHT_FARE_SEARCH_*`, `SMTP_*`. **[déduction]** Cet écart suggère que la documentation de configuration n'a pas suivi les dernières évolutions du code (probablement lors du passage à Anthropic/Resend/Kayak).
