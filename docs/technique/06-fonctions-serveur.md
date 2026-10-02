# 06 — Fonctions serveur (Supabase Edge Functions)

> Source : lecture intégrale des 60 fonctions dans [supabase/functions/](../../supabase/functions/) (72 fichiers `.ts` au total, dont 14 modules partagés `_shared/`). Chaque fonction est documentée avec : objectif, méthode/déclencheur, entrées, autorisation constatée, sorties, dépendances externes, tables lues/écrites, effets de bord, constats de sécurité. Toutes les citations sont au format `fichier:ligne` relatif au dossier de la fonction.
>
> Toutes les fonctions renvoient par défaut l'en-tête CORS `Access-Control-Allow-Origin: '*'` (aucune restriction de domaine), sauf mention contraire — voir analyse transverse en fin de document et [11-securite.md](11-securite.md).

## 1. Comptes, administration et sécurité

### admin-create-partner-account
1. **Objectif** : crée un compte Supabase Auth pour le contact d'une candidature partenaire sans compte, envoie un email de définition de mot de passe.
2. **Déclencheur** : POST, appel direct depuis `AdminAgencies.tsx`.
3. **Entrées** : `email`, `fullName`.
4. **Autorisation** : JWT + rôle admin vérifié via requête `user_roles` (re-vérifiée côté serveur, pas de confiance au frontend).
5. **Sorties** : `{ success, userId, created, emailSent, setupLink? }` ; 401/403/400/500.
6. **Dépendances** : `sendEmail` (Resend/SMTP), Supabase Auth Admin API.
7. **Tables** : lecture `user_roles` ; écriture indirecte `auth.users`/`profiles` (trigger).
8. **Effets de bord** : création de compte, email transactionnel.
9. **Sécurité** : aucun mot de passe généré/transmis ; regex email simple plutôt qu'un schéma zod.

### admin-list-users
Liste tous les utilisateurs (id, nom, email) pour un sélecteur admin. JWT + rôle admin vérifié. Lecture `profiles`+`user_roles`, Auth Admin API (`listUsers`, pagination ~5000 users max). Lecture seule, pas d'effet de bord.

### admin-send-test-email
Permet à un admin de tester l'envoi d'email via le prestataire actif. JWT + rôle admin vérifié. Lecture `integration_credentials`. N'expose jamais les identifiants du prestataire, seulement son nom.

### delete-account
1. **Objectif** : implémente le droit à l'effacement RGPD — anonymise les données personnelles et bannit le compte, sans supprimer les enregistrements transactionnels (obligation comptable, RGPD Art. 17(3)(b)).
4. **Autorisation** : JWT obligatoire, chaque utilisateur n'agit que sur son propre compte.
7. **Tables** : écriture `profiles`, `bookings` (anonymisation nom/email/téléphone), `passengers` (anonymisation, suppression n° de document/date de naissance).
8. **Effets de bord** : bannissement (`ban_duration: '876000h'` ≈ 100 ans), email changé en `deleted-<uuid>@deleted.invalid`.
9. **Sécurité** : rate limiting `RATE_LIMITS.PAYMENT` (3/min) réutilisé pour cette route sensible ; anonymisation best-effort sauf le bannissement final qui est bloquant.

### upload-driver-document
Upload permis de conduire/photo (bucket privé `driver-documents`) avant réservation voiture. JWT requis. Chemin de stockage forcé à `<user_id>/...` **côté serveur** (jamais depuis l'input client) — bonne pratique anti-IDOR. Max 5 Mo, images uniquement, URL signée de prévisualisation (TTL 1h).

### upload-partner-logo
Upload logo pour candidature partenaire (bucket `partner-logos`, public). **Intentionnellement non authentifié** (le candidat n'a pas encore de compte) — commentaire explicite dans le code. Garde-fous : 2 Mo max, MIME strict, nom de fichier `crypto.randomUUID()` (jamais d'écrasement). Surface d'abus limitée (hébergement de fichiers arbitraires dans la limite image/2 Mo) mais sans rate limiting.

### upload-site-asset
Upload d'images marketing (bucket public `site-assets`). JWT + rôle `admin` **ou** `sub_agency`. Le paramètre `folder` n'est pas restreint à une liste blanche — pas de cloisonnement par agence constaté.

## 2. Recherche voyage (autocomplétion, vols, hôtels, voitures, trains, événements, destinations)

Fonctions publiques (non authentifiées) sauf mention contraire.

| Fonction | Fournisseur(s) | Fallback si clé absente | Validation entrée | Rate limit |
|---|---|---|---|---|
| `airport-autocomplete` | aucun (dataset statique `_shared/cities-data.ts`) | — | longueur ≥ 2 car. | non |
| `airport-info` | Aviation Stack (RapidAPI) | mock (`getMockAirportInfo`) | aucune | non |
| `car-location-autocomplete` | aucun (dataset statique) | — | aucune | non |
| `event-location-autocomplete` | aucun (dataset statique) | — | aucune | non — `popularEvents` généré par `Math.random()` présenté comme une statistique réelle |
| `hotel-autocomplete` | Booking.com (RapidAPI) | liste statique de 6 destinations | aucune | non |
| `get-weather` | WeatherAPI (RapidAPI) | mock | aucune | non |
| `currency-exchange` | exchangerate-api.com (public, gratuit) | — | aucune | non — sert uniquement à l'affichage, **différent** du taux fixe `_shared/pricing.ts` utilisé pour les calculs transactionnels |
| `search-destinations` | TripAdvisor (RapidAPI), cache DB `destinations_cache` (TTL 1h) | tableau vide (honnête) | — | non |
| `search-events` | Real-Time Events Search (RapidAPI) | tableau vide (honnête) | — | non |
| `search-flight-hotel-packages` | Travelpayouts, Kiwi, Booking.com15, Hotels.com (RapidAPI) | — | — | non — **aucun markup ni signature de prix appliqués**, contrairement à `search-hotels` |
| `search-flights` | Amadeus (env. **test**), Kiwi, Sky-Scrapper, Travelpayouts, Kayak | — | schéma Zod `flightSearchSchema` | `RATE_LIMITS.SEARCH` |
| `search-hotels` | Xotelo, Booking.com, TripAdvisor, Amadeus, Priceline, Kayak + `services` (hôtels partenaires internes) | — | schéma Zod `hotelSearchSchema` | `RATE_LIMITS.SEARCH` |
| `search-trains` | IRCTC (Inde), SNCF Open Data (France) | pas de données fictives pour les régions non couvertes | aucune | non |
| `travel-recommendations` | TripAdvisor (RapidAPI) | ⚠️ **données mock fictives** (`getMockRecommendations`) | — | non |
| `car-rental` | annonces partenaires internes uniquement (agrégateur tiers retiré le 2026-09-10) | — | schéma Zod `carRentalSchema` | `RATE_LIMITS.SEARCH` (30/min) |

**Constats transverses de ce groupe :**
- **Intégrité des prix** : `search-hotels` et `car-rental` appliquent un markup de 8% (`_shared/pricing.ts`) et **signent chaque offre** en HMAC-SHA256 (`_shared/priceSignature.ts`, secret `PRICE_SIGNING_SECRET` dédié) avec expiration (30 min pour les hôtels) — ceci permet à `create-booking` de vérifier l'intégrité du prix. `search-flight-hotel-packages` et `search-trains` **n'ont pas** cette protection.
- **Incohérence de politique "pas de données fictives"** : `search-destinations`, `search-events`, `search-flights` renvoient honnêtement un résultat vide si la clé API est absente (comportement documenté par commentaires explicites), alors que `airport-info`, `get-weather`, `hotel-autocomplete` et surtout `travel-recommendations` fabriquent des données mock présentées comme réelles.
- **Bug répété** : `airport-info` et `get-weather` (et probablement `travel-recommendations`) relisent `await req.json()` dans leur bloc `catch` alors que le corps de la requête a déjà été consommé — ceci lève une exception secondaire qui casse le fallback en cas d'erreur survenant après le premier parsing.
- **Code mort** : la fonction `searchFlightFare` est définie dans `search-flights/index.ts:239` mais jamais appelée.

## 3. Réservation et paiement

### prebook
1. **Objectif** : verrouille un tarif de vol côté serveur et crée une pré-réservation signée avant paiement.
4. **Autorisation** : JWT requis, pas de contrôle de rôle.
6. **Dépendances** : aucune API tierce réelle — l'étape "vérification de disponibilité" est **simulée** (`isAvailable = true` codé en dur).
7. **Tables** : écriture `flight_prebookings`.
9. **Sécurité** : prix recalculé serveur (base + taxes 12% + frais de service 5%), conversion EUR→XOF, signature HMAC (`PRICE_SIGNING_SECRET`), expiration 10 min ; échoue explicitement si le secret de signature est absent.

### checkout
1. **Objectif** : valide un pré-booking existant, revérifie l'intégrité du prix signé, prépare le paiement (statut `PENDING_PAYMENT`).
4. **Autorisation** : JWT obligatoire, pré-booking filtré par `user_id`.
5. **Sorties** : codes d'erreur structurés (`AUTH_REQUIRED`, `EXPIRED`, `SIGNATURE_INVALID`, etc.).
9. **Sécurité** : vérification HMAC du prix avant d'autoriser le paiement ; rate limiting `RATE_LIMITS.PAYMENT` (3/min).

### create-booking
1. **Objectif** : crée la réservation + passagers après **recalcul serveur systématique du prix**, quel que soit le type de service.
4. **Autorisation** : JWT obligatoire ; appartenance à une société (facturation entreprise) déléguée à la policy RLS INSERT sur `bookings`.
9. **Sécurité — point fort majeur** : `total_price` client **jamais** pris en confiance : recalcul depuis le prix signé HMAC (hôtel/voiture), depuis `flight_prebookings` validé par `checkout` (vols), ou depuis `price_per_unit` stocké en base (service existant). Commentaires explicites "SECURITY: never trust requestData.total_price as-is".

### create-pnr
1. **Objectif** : émet un vrai billet/PNR auprès du GDS Amadeus après paiement ; rembourse automatiquement si l'émission échoue.
4. **Autorisation** : appel interne via `Bearer <SUPABASE_SERVICE_ROLE_KEY>`, ou JWT admin (RPC `has_role`) — aucun autre appelant autorisé.
6. **Dépendances** : Amadeus API — ⚠️ **URL pointant vers l'environnement de test** (`test.api.amadeus.com`), pas production.
9. **Sécurité** : refus explicite de fabriquer un faux PNR si Amadeus échoue — remboursement automatique plutôt que confirmation mensongère ; idempotent.

### process-payment
1. **Objectif** : initie un paiement (CinetPay ou Jèko selon prestataire actif) pour réservation ou abonnement.
4. **Autorisation** : JWT obligatoire, RLS détermine qui peut payer quoi ; rate limiting `RATE_LIMITS.PAYMENT` (3/min).
9. **Sécurité** : montant **jamais** pris du client (relu depuis `bookings.total_price`/`user_subscriptions.amount_paid`) ; réservations "company-billed" doivent être `approval_status='approved'` avant paiement ; verrou de réclamation atomique anti double-paiement (UPDATE conditionnel `pending`→`processing`).

### payment-callback (webhook CinetPay)
4. **Autorisation** : pas de JWT (webhook public) mais `cpm_site_id` vérifié + **re-vérification serveur-à-serveur** du statut réel auprès de l'API CinetPay `check` (jamais confiance au seul body du webhook). Rate limiting IP.
9. **Sécurité** : idempotent par `transaction_id` ; **pas de vérification de signature HMAC** côté CinetPay (contrairement à Jèko) — la sécurité repose entièrement sur le re-check serveur-à-serveur.

### jeko-webhook
4. **Autorisation** : **signature HMAC-SHA256** du webhook (header `Jeko-Signature`), vérifiée en temps constant contre un secret stocké dans `integration_credentials`, calculée sur le corps brut avant parsing JSON.
9. **Sécurité** : idempotence explicite, comparaison à temps constant — bonnes pratiques respectées.

### refund-payment
4. **Autorisation** : JWT, propriétaire du booking OU admin (RPC `has_role`). Rate limiting paiement.
9. **Sécurité** : le module partagé `cinetpayRefund.ts` indique lui-même que l'API de remboursement CinetPay **n'a jamais été testée en conditions réelles**.

### review-booking-approval
1. **Objectif** : un approbateur d'entreprise approuve/rejette une réservation "Business Travel".
4. **Autorisation** : JWT requis, **aucun contrôle de rôle explicite dans le code** — repose entièrement sur la policy RLS "Company approvers can review their company bookings" (si la RLS refuse, l'UPDATE ne matche simplement aucune ligne).

## 4. Génération de documents (billets, factures, reçus)

| Fonction | Contrôle d'accès | QR code | Constat notable |
|---|---|---|---|
| `generate-booking-pdf` | JWT requis, mais **aucun contrôle explicite** `booking.user_id === user.id` — dépend entièrement des RLS | vrai QR (librairie `qrcode`) | pas d'échappement HTML visible des champs injectés (risque XSS si rendu hors contexte maîtrisé) |
| `generate-flight-ticket` | JWT + filtre explicite `.eq("user_id", user.id)` | ⚠️ **faux QR** — motif pseudo-aléatoire basé sur un hash de somme de caractères, pas scannable | pas d'échappement HTML des champs |
| `generate-invoice` | JWT + vérification explicite `booking.user_id !== user.id` → erreur | — | montant repris strictement de `booking.total_price` (jamais recalculé) ; numéro de facture via `Date.now()`+random, pas de garantie d'unicité cryptographique |
| `generate-subscription-receipt` | JWT requis **mais aucune vérification que `subscriptionRequestId` appartient à l'appelant** | vrai QR (`qrcode`) | ⚠️ **IDOR potentiel** — tout utilisateur authentifié connaissant/devinant l'UUID peut récupérer le reçu (nom, email, téléphone, montant) d'un autre client |
| `generate-ticket` | ⚠️ **aucune authentification**, utilise `service_role` directement sans contrôle d'appelant | — | orchestre l'envoi email du billet ; pièce jointe nommée `.pdf` alors que le contenu est du HTML encodé en base64 (incohérence de format) |

## 5. Communications sortantes (emails, SMS, notifications)

La majorité des fonctions `send-*` sont **déclenchées en interne** (service-to-service, via `service_role`) après un événement (paiement réussi, création de PNR, décision admin) et n'ont **aucune vérification de JWT** — la sécurité repose sur le fait que leur URL n'est pas censée être appelée directement par le frontend :

| Fonction | Autorisation | Constat |
|---|---|---|
| `send-booking-confirmation` | aucune (service_role direct) | XSS limité par `escapeHtml` ; IDOR potentiel par énumération de `bookingId` |
| `send-booking-pdf-email` | aucune | délègue la génération à `generate-booking-pdf` |
| `send-flight-confirmation` | aucune | ⚠️ inclut le **type/numéro de document d'identité des passagers** dans l'email (échappé HTML mais transmis en clair par email) |
| `send-invoice-email` | aucune | ⚠️ contenu de facture **entièrement fourni par l'appelant**, pas de relecture DB — si atteignable directement, permettrait de forger n'importe quel montant "au nom de Bossiz+" |
| `send-subscription-confirmation` | aucune | idem — fait confiance au contenu transmis par l'appelant interne |
| `send-pnr-confirmation` | aucune | — |
| `send-partner-application-confirmation` | aucune, mais contenu **relu depuis la DB par id** (pas fait confiance au client) | limite l'usurpation de contenu, pas l'abus de déclenchement (ID deviné) |
| `send-partner-application-rejection` | **JWT + rôle admin vérifié explicitement** | bon exemple de contrôle |
| `send-partner-approved` | **JWT + rôle admin** | contenu relu côté serveur |
| `send-partner-status-change` | **JWT + rôle admin** | `is_active` relu côté serveur, pas fait confiance au client |
| `send-rebrand-announcement` | **JWT + rôle admin**, mode `send` exige en plus `confirm:true` explicite | diffusion en masse (pagination 200/appel, délai 250ms) — bon garde-fou |
| `send-support-email` | aucune | pas de validation stricte malgré l'existence de `validateSupportMessage` (non utilisée ici) ; pas de rate limit |
| `send-contact-message` | aucune | idem |
| `newsletter-subscribe` | aucune | pas de validation de format email, pas de rate limit |
| `send-password-reset` | aucune (public par nature) | ✅ **bonne pratique** : réponse toujours `{success:true}` (anti-énumération de comptes), rate limit IP + par email, allowlist de redirection anti-open-redirect |
| `send-otp` | aucune (pré-auth) | ✅ code jamais stocké en clair (hash SHA-256 salé), rate limit IP + cooldown par destination |
| `send-push-notification` | aucune, service_role direct, **aucun contrôle que l'appelant a le droit de notifier `userId`** | désactivation auto des abonnements expirés (404/410) |

## 6. Assistant IA

### ai-travel-advisor / travel-chatbot
- **Autorisation** : **aucune** — endpoints publics.
- **Dépendances** : API Anthropic directe (`api.anthropic.com/v1/messages`, modèle `claude-sonnet-5`), clé `ANTHROPIC_API_KEY`.
- **Sécurité** : ni `ai-travel-advisor` ni `travel-chatbot` n'utilisent le rate-limiter partagé, alors qu'un préréglage `RATE_LIMITS.AI` (10/min) existe dans `_shared/rate-limiter.ts` — risque d'abus de coût API par des appels anonymes répétés. Bonne pratique commune : pas de fallback fictif si la clé API est absente (erreur honnête retournée).

### check-price-alerts (cron supposé)
1. **Objectif** : vérifie périodiquement les alertes de prix actives et notifie par push si le prix a baissé.
4. **Autorisation** : **aucune vérification applicative** de JWT/rôle dans le code — utilise directement `SUPABASE_SERVICE_ROLE_KEY` sans jamais lire l'en-tête `Authorization` entrant. La protection repose entièrement sur la configuration réseau/du scheduler Supabase.
9. **Sécurité** : endpoint sensible (itère sur tous les utilisateurs, service_role) sans contrôle d'accès applicatif — risque de déclenchement arbitraire (DoS potentiel sur les APIs de recherche tierces) si exposé publiquement sans restriction au niveau plateforme.

## 7. Modules partagés (`_shared/`)

| Module | Rôle |
|---|---|
| [cinetpayRefund.ts](../../supabase/functions/_shared/cinetpayRefund.ts) | `refundBookingPayment()` — remboursement complet (vérif booking/payment, appel API CinetPay, mise à jour DB). ⚠️ jamais testé en conditions réelles selon commentaire du code. |
| [cities-data.ts](../../supabase/functions/_shared/cities-data.ts) | Dataset statique (~200 villes) avec prix indicatifs, pour l'autocomplétion sans appel réseau. |
| [emailTemplates.ts](../../supabase/functions/_shared/emailTemplates.ts) | `renderEmailTemplate()` — lit un modèle actif dans `email_templates`, substitue les variables (échappées HTML par défaut). |
| [integrations.ts](../../supabase/functions/_shared/integrations.ts) | Point central : `sendEmail` (Resend/SMTP), `sendSms` (Twilio/Orange/Sendexa/Africa's Talking), `sendWhatsapp` (Twilio/Sendexa), `getActivePaymentProvider`, `getCinetPayCredentials`. Résolution des identifiants via `integration_credentials` (RLS admin-only) avec repli sur variables d'environnement. |
| [jeko.ts](../../supabase/functions/_shared/jeko.ts) | Intégration Jèko : création de lien de paiement, vérification de signature webhook HMAC. |
| [notify.ts](../../supabase/functions/_shared/notify.ts) | Notifications téléphoniques best-effort (WhatsApp puis repli SMS) : `notifyCompanyApprovers`, `notifyBookingOwner`. |
| [otp.ts](../../supabase/functions/_shared/otp.ts) | `generateOtpCode()`, `hashOtpCode()` (SHA-256 salé), template email OTP. |
| [postPaymentSuccess.ts](../../supabase/functions/_shared/postPaymentSuccess.ts) | `handlePaymentSuccess()` — logique commune post-paiement (CinetPay/Jèko) : active abonnement ou confirme booking, calcule/insère commission agence (idempotent), déclenche confirmations/facture/PNR. |
| [priceSignature.ts](../../supabase/functions/_shared/priceSignature.ts) | `signOffer()`/`verifyOfferSignature()` — HMAC-SHA256, secret `PRICE_SIGNING_SECRET` dédié (distinct de service_role). |
| [pricing.ts](../../supabase/functions/_shared/pricing.ts) | `applyMarkup()` (8% retail), `convertToXOF()` (taux figés) — un bug historique de sous-facturation (~656×) est mentionné comme corrigé par cette conversion. |
| [rate-limiter.ts](../../supabase/functions/_shared/rate-limiter.ts) | Rate limiting en mémoire par IP (fenêtre glissante, reset au cold start) : préréglages SEARCH (30/min), AI (10/min), AUTOCOMPLETE (60/min), BOOKING (5/min), PAYMENT (3/min). |
| [smtp.ts](../../supabase/functions/_shared/smtp.ts) | `sendEmailViaSmtp()` via `nodemailer`, alternative à Resend. |
| [validation.ts](../../supabase/functions/_shared/validation.ts) | Validation "maison" (sans zod) : `validateEmail`, `validatePhone`, `validateSupportMessage`, etc. — semble une version historique, partiellement non branchée. |
| [zodValidation.ts](../../supabase/functions/_shared/zodValidation.ts) | Schémas Zod stricts : `flightSearchSchema`, `hotelSearchSchema`, `carRentalSchema`, `paymentProcessSchema`. Ce dernier est défini mais **non importé par `process-payment`** (validation manuelle à la place) — schéma potentiellement orphelin. |

## 8. Constats transverses (synthèse sécurité, détail dans [11-securite.md](11-securite.md))

- **CORS** : `Access-Control-Allow-Origin: '*'` sur toutes les fonctions analysées, sans restriction de domaine.
- **Rate limiting inégal** : `_shared/rate-limiter.ts` n'est utilisé que par une minorité de fonctions (`car-rental`, `checkout`, `delete-account`, `jeko-webhook`, `search-flights`, `search-hotels`, `payment-callback`, `process-payment`, `refund-payment`, `send-otp`, `send-password-reset`) — la plupart des endpoints publics de recherche/autocomplétion et **les deux endpoints IA** (`ai-travel-advisor`, `travel-chatbot`) n'en ont aucun malgré l'existence d'un préréglage dédié.
- **Endpoints sensibles sans authentification applicative** : `check-price-alerts` (cron supposé) et `generate-ticket` (utilise `service_role` sans contrôle d'appelant) — protection reposant uniquement sur la non-divulgation de l'URL.
- **IDOR potentiel confirmé** : `generate-subscription-receipt` (aucune vérification de propriété du `subscriptionRequestId`).
- **Intégrité des prix — point fort de l'architecture** : le pipeline `search-hotels`/`car-rental` → `create-booking` (et `prebook` → `checkout` → `create-booking` pour les vols) repose systématiquement sur une signature HMAC-SHA256 (`PRICE_SIGNING_SECRET`, secret dédié distinct de `SUPABASE_SERVICE_ROLE_KEY`), avec recalcul serveur systématique — architecture cohérente et documentée par des commentaires explicites empêchant la falsification du prix côté client. Exception notable : `search-flight-hotel-packages` et `search-trains` n'ont pas cette protection.
- **QR codes incohérents** : `generate-booking-pdf`/`generate-subscription-receipt` génèrent de vrais QR codes scannables (librairie `qrcode`), `generate-flight-ticket` génère un motif SVG factice non scannable.
- **Environnement Amadeus de test en production** : `create-pnr` et `search-flights` pointent vers `test.api.amadeus.com`, pas l'environnement de production Amadeus.
- **Bug répété** : re-lecture de `req.json()` dans un bloc `catch` après consommation du body (`airport-info`, `get-weather`, probablement `travel-recommendations`) — casse le fallback en cas d'erreur tardive.
- **Incohérence "données fictives"** : politique "pas de fallback inventé" respectée par la majorité des fonctions de recherche et les deux endpoints IA, mais violée par `travel-recommendations` (mock présenté comme réel) et partiellement par `airport-info`/`get-weather`/`hotel-autocomplete`.
