# 09 — Intégrations tierces

> Source : [supabase/functions/_shared/integrations.ts](../../supabase/functions/_shared/integrations.ts), [_shared/jeko.ts](../../supabase/functions/_shared/jeko.ts), [_shared/cinetpayRefund.ts](../../supabase/functions/_shared/cinetpayRefund.ts), et les Edge Functions individuelles.

## 1. Paiement

### CinetPay
- Paiement carte/mobile money (Côte d'Ivoire et zone UEMOA).
- Utilisé par : `process-payment` (initiation), `payment-callback` (webhook + re-vérification serveur-à-serveur), `refund-payment`/`_shared/cinetpayRefund.ts` (remboursement).
- Identifiants : `CINETPAY_API_KEY`, `CINETPAY_SITE_ID` — résolus via `integration_credentials` (table admin-only) avec repli sur variables d'environnement ([_shared/integrations.ts](../../supabase/functions/_shared/integrations.ts)).
- ⚠️ L'API de remboursement CinetPay n'a, selon un commentaire explicite du code, **jamais été testée en conditions réelles**.
- ⚠️ Pas de vérification de signature cryptographique sur le webhook entrant — la sécurité repose sur une re-vérification serveur-à-serveur du statut réel (voir [08-flux-critiques.md](08-flux-critiques.md) §3).

### Jèko
- Paiement mobile money (Côte d'Ivoire).
- Utilisé par : `process-payment` (via `getActivePaymentProvider`), `jeko-webhook` (webhook signé).
- Vérification de signature HMAC-SHA256 sur le webhook, en temps constant, sur le corps brut — bonne pratique de sécurité constatée.

**Sélection du prestataire actif** : `getActivePaymentProvider()` ([_shared/integrations.ts](../../supabase/functions/_shared/integrations.ts)) détermine dynamiquement lequel de CinetPay/Jèko est utilisé, configurable depuis `/admin/integrations` (table `integration_credentials`).

## 2. Recherche voyage

| Fournisseur | Usage | Fonctions |
|---|---|---|
| Amadeus (GDS) | Recherche vols/hôtels, émission de PNR | `search-flights`, `search-hotels`, `create-pnr` |
| RapidAPI — Aerodatabox | Infos aéroports (variables documentées mais **jamais utilisées dans le code**) | — (fonctionnalité non implémentée, voir [03-configuration.md](03-configuration.md) §5) |
| RapidAPI — Travel Advisor / Aviation Stack / Kiwi / Sky-Scrapper / Kayak / TripAdvisor / Booking.com / Hotels.com / Priceline / IRCTC / WeatherAPI / Real-Time Events Search | Recherche vols, hôtels, trains, événements, météo, infos aéroport, autocomplétion | `search-flights`, `search-hotels`, `search-trains`, `search-events`, `search-destinations`, `travel-recommendations`, `airport-info`, `get-weather`, `hotel-autocomplete`, `search-flight-hotel-packages` |
| Travelpayouts | Recherche vols, tracking/embed (`tpembars.com`) | `search-flights`, `search-flight-hotel-packages`, widget embarqué (CSP) |
| SNCF Open Data | Recherche trains France (gratuit, sans clé) | `search-trains` |
| exchangerate-api.com | Conversion de devises pour l'affichage (public, gratuit) | `currency-exchange` — **différent** du taux fixe utilisé pour les calculs transactionnels (`_shared/pricing.ts`) |
| Stay22 | Widget hôtel embarqué (iframe) | référencé uniquement en CSP frontend, pas d'Edge Function dédiée |

⚠️ **Environnement Amadeus de test en production** : `create-pnr` et `search-flights` pointent vers `test.api.amadeus.com`, pas l'environnement de production Amadeus.

## 3. Communication (email, SMS, WhatsApp, push)

Point d'entrée unique : [_shared/integrations.ts](../../supabase/functions/_shared/integrations.ts) — toutes les fonctions `send-*` du dépôt sont censées passer par ce module plutôt que d'appeler un prestataire directement (2 exceptions constatées : `send-contact-message`/`send-support-email` n'utilisent pas `validateSupportMessage` bien que disponible).

| Canal | Fournisseurs (par ordre de code) | Sélection |
|---|---|---|
| Email | Resend (API), SMTP générique (`_shared/smtp.ts`, `nodemailer`) | via `integration_credentials`, catégorie `email` |
| SMS | Twilio, Orange SMS API (Afrique de l'Ouest), Sendexa, Africa's Talking | via `integration_credentials`, catégorie `sms` |
| WhatsApp | Twilio WhatsApp, Sendexa WhatsApp | via `integration_credentials`, catégorie `whatsapp` |
| Push web | VAPID (`web-push` npm) | `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY`/`VAPID_SUBJECT`, abonnements dans `push_subscriptions` |

**Multiplicité des fournisseurs** : le code prévoit 4 fournisseurs SMS/WhatsApp possibles et 2 fournisseurs email dans le même module — configuration centralisée admin (`/admin/integrations`), avec repli sur variables d'environnement si `integration_credentials` n'a pas d'entrée active. **[déduction]** Ceci suggère une stratégie de bascule progressive/marché par marché plutôt qu'un choix figé.

## 4. Intelligence artificielle

**Anthropic Claude** (modèle `claude-sonnet-5`), appel direct à `https://api.anthropic.com/v1/messages` :
- `ai-travel-advisor` — conseils de voyage personnalisés (destination/intérêts/budget/durée).
- `travel-chatbot` — assistant conversationnel (composant frontend [ChatWidget.tsx](../../src/components/ChatWidget.tsx)).

Les deux fonctions sont **publiques (non authentifiées)** et **sans rate limiting applicatif**, malgré l'existence d'un préréglage dédié `RATE_LIMITS.AI` dans `_shared/rate-limiter.ts` — risque d'abus de coût API. Bonne pratique commune constatée : aucun fallback fictif si la clé `ANTHROPIC_API_KEY` est absente (erreur honnête retournée plutôt que réponse inventée).

⚠️ **Incohérence de configuration** : `ANTHROPIC_API_KEY` est la clé réellement utilisée et nécessaire, mais elle est **absente de [.env.example](../../.env.example)**, qui documente à sa place `LOVABLE_API_KEY` (jamais utilisée dans le code). Voir [03-configuration.md](03-configuration.md) §5.

## 5. Génération de documents (PDF/QR)

- **QR codes réels** (scannables) : librairie `qrcode` (esm.sh) — utilisée par `generate-booking-pdf` et `generate-subscription-receipt`.
- **QR code factice** : `generate-flight-ticket` génère un motif SVG pseudo-aléatoire basé sur un hash, **non scannable** — incohérence à corriger si ce billet doit servir de preuve à l'aéroport.
- Aucune de ces fonctions ne produit de PDF binaire réel : elles retournent du HTML (parfois encodé en base64 sous un nom de fichier `.pdf`), le rendu PDF final se faisant côté client ou par un mécanisme non identifié dans ce dépôt.

## 6. Widgets tiers embarqués (frontend)

Référencés dans la Content Security Policy de production ([deploy-vps/nginx.conf](../../deploy-vps/nginx.conf)) :
- **Stay22** — widget de réservation hôtelière embarqué (iframe).
- **TravelPayouts / tpembars.com** — script de comparaison/tracking vols.
- **api.qrserver.com** — génération de QR codes côté client (usage distinct du QR code serveur ci-dessus).
- **Google Fonts** — polices.
- **Unsplash / avs.io** — images.

## 7. Constat transverse

L'architecture centralise correctement la résolution des identifiants de prestataires (`integration_credentials`, configurable depuis l'admin) pour paiement et communication, ce qui permet de changer de fournisseur sans redéploiement de code. En revanche, les intégrations de **recherche voyage** (RapidAPI, Amadeus, Travelpayouts) restent codées en dur par variable d'environnement fonction par fonction, sans point de configuration centralisé équivalent — cohérence à améliorer si de nouveaux fournisseurs doivent être ajoutés fréquemment.
