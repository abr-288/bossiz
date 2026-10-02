# 08 — Flux critiques

> Reconstitué à partir de la lecture des Edge Functions ([06-fonctions-serveur.md](06-fonctions-serveur.md)) et des triggers/policies SQL ([04-base-de-donnees.md](04-base-de-donnees.md)). Les statuts indiqués sont ceux réellement observés dans le code (colonnes `bookings.status`/`payment_status`, `flight_prebookings.status`, `payments.status`).

## 1. Réservation d'un vol (flux le plus complexe — 4 étapes serveur)

```mermaid
sequenceDiagram
    participant U as Utilisateur
    participant FE as SPA React
    participant Prebook as prebook
    participant Checkout as checkout
    participant CreateBooking as create-booking
    participant Pay as process-payment
    participant CB as payment-callback / jeko-webhook
    participant PNR as create-pnr
    participant DB as PostgreSQL

    U->>FE: Recherche vol (search-flights, agrégation 5 fournisseurs)
    U->>FE: Sélection + saisie passagers
    FE->>Prebook: POST /prebook (JWT requis)
    Prebook->>Prebook: Recalcul prix serveur (taxes 12%, frais 5%), conversion XOF
    Prebook->>DB: INSERT flight_prebookings (signature HMAC, expire 10 min)
    Prebook-->>FE: prebooking_id, price_signature

    FE->>Checkout: POST /checkout (prebooking_id)
    Checkout->>DB: vérifie signature + non expiré
    Checkout->>DB: UPDATE flight_prebookings.status = PENDING_PAYMENT
    Checkout-->>FE: checkout_signature, price_breakdown

    FE->>CreateBooking: POST /create-booking
    CreateBooking->>DB: relit flight_prebookings (statut PENDING_PAYMENT, non expiré)
    CreateBooking->>DB: INSERT services (si besoin), bookings (status=pending), passengers
    CreateBooking-->>FE: booking_id

    FE->>Pay: POST /process-payment (bookingId, paymentMethod)
    Pay->>DB: relit bookings.total_price (jamais le client)
    Pay->>DB: UPDATE payments (status=pending), claim atomique bookings.payment_status
    Pay->>CB: Initie paiement CinetPay/Jèko
    Pay-->>FE: payment_url (redirection PSP)

    U->>CB: Paiement effectué sur la page du PSP
    CB->>CB: (CinetPay) re-vérification serveur-à-serveur du statut réel<br/>(Jèko) vérification signature HMAC webhook
    CB->>DB: UPDATE payments.status=completed, bookings.payment_status=paid
    CB->>DB: INSERT commissions (agence, idempotent)
    CB->>PNR: invoke create-pnr (fetch interne)

    PNR->>PNR: Appel Amadeus (⚠️ environnement test.api.amadeus.com)
    alt PNR émis avec succès
        PNR->>DB: UPDATE bookings.external_ref=PNR, status=confirmed
        PNR->>PNR: invoke send-flight-confirmation, generate-invoice (async)
    else Échec émission PNR
        PNR->>DB: remboursement automatique (refundBookingPayment)
        PNR->>DB: UPDATE bookings.status=cancelled
    end
```

**Statuts observés** :
- `flight_prebookings.status` : `PREBOOKED` → `PENDING_PAYMENT` → (`EXPIRED` si non payé sous 10 min)
- `bookings.status` : `pending` → `confirmed` (PNR émis) ou `cancelled` (échec PNR, remboursé)
- `bookings.payment_status` : `pending` → `processing` (verrou atomique anti double-paiement) → `paid` / `failed`

**Point notable** : `create-pnr` refuse explicitement de fabriquer un faux PNR si Amadeus échoue — il déclenche un remboursement automatique plutôt qu'une confirmation mensongère (comportement constaté par commentaire de code explicite). L'URL Amadeus utilisée pointe vers l'environnement de **test**, pas production — à vérifier avant mise en production réelle du flux vol.

## 2. Réservation hôtel / voiture / activité (flux simplifié, sans prebook)

```mermaid
sequenceDiagram
    participant U as Utilisateur
    participant FE as SPA React
    participant Search as search-hotels / car-rental
    participant CreateBooking as create-booking
    participant Pay as process-payment
    participant CB as payment-callback / jeko-webhook
    participant DB as PostgreSQL

    U->>FE: Recherche (hôtel/voiture)
    FE->>Search: POST recherche
    Search->>Search: markup 8% + signature HMAC de chaque offre (30 min)
    Search-->>FE: offres signées

    U->>FE: Sélection + validation
    FE->>CreateBooking: POST /create-booking (offer_signature)
    CreateBooking->>CreateBooking: vérifie signature HMAC (jamais le prix client)
    CreateBooking->>DB: INSERT services (si besoin), bookings (status=pending)
    CreateBooking-->>FE: booking_id

    FE->>Pay: POST /process-payment
    Pay->>DB: relit total_price, claim atomique
    Pay->>CB: Initie paiement
    CB->>DB: UPDATE payments/bookings, commission agence
    CB->>DB: bookings.status = confirmed (pas de PNR pour ce type de service)
```

**Différence clé avec le flux vol** : pas d'étape `prebook`/`checkout` séparée ni d'appel GDS — le booking passe directement à `confirmed` après paiement réussi (via `handlePaymentSuccess` dans `_shared/postPaymentSuccess.ts`). **Exception notable** : `search-flight-hotel-packages` et `search-trains` n'appliquent **pas** de signature d'offre, contrairement à `search-hotels`/`car-rental` — leur intégrité de prix au moment de la réservation n'est donc pas garantie par le même mécanisme (à vérifier/documenter séparément).

## 3. Paiement — détail des deux prestataires

### CinetPay ([payment-callback](../../supabase/functions/payment-callback/index.ts))
- Webhook **sans vérification de signature cryptographique** du body reçu.
- Protection réelle : re-vérification serveur-à-serveur systématique via `POST https://api-checkout.cinetpay.com/v2/payment/check` avec la clé API secrète du marchand — le statut du body du webhook n'est **jamais** utilisé directement pour valider un paiement.
- Idempotent par `transaction_id`.

### Jèko ([jeko-webhook](../../supabase/functions/jeko-webhook/index.ts))
- Webhook **avec vérification de signature HMAC-SHA256** (header `Jeko-Signature`), comparaison à temps constant, calculée sur le corps brut avant parsing JSON.
- Secret stocké dans `integration_credentials` (admin-only RLS).
- Idempotent par `transaction_id` + `payment_provider='jeko'`.

Les deux chemins convergent vers `handlePaymentSuccess()` ([_shared/postPaymentSuccess.ts](../../supabase/functions/_shared/postPaymentSuccess.ts)), qui : active l'abonnement OU confirme la réservation (statut `pending` si vol, en attendant `create-pnr`), calcule et insère la commission agence de façon idempotente, puis déclenche en asynchrone les confirmations (email, facture, PNR).

## 4. Remboursement ([refund-payment](../../supabase/functions/refund-payment/index.ts))

- Déclenché par le propriétaire du booking ou un admin (RPC `has_role`).
- Appelle l'API CinetPay refund (`https://api-checkout.cinetpay.com/v2/payment/refund/add`).
- ⚠️ **Le module partagé [_shared/cinetpayRefund.ts](../../supabase/functions/_shared/cinetpayRefund.ts) indique lui-même en commentaire que cette API n'a jamais été testée en conditions réelles** — à valider en sandbox avant de considérer ce flux comme fiable en production.
- Sur succès : `bookings.status='cancelled'`, `payments.status`/`bookings.payment_status='refunded'`.
- Également déclenché automatiquement par `create-pnr` en cas d'échec d'émission du PNR (voir §1).

## 5. Abonnements (Business/Conciergerie)

```mermaid
sequenceDiagram
    participant U as Utilisateur
    participant FE as SPA React
    participant Pay as process-payment
    participant CB as payment-callback / jeko-webhook
    participant DB as PostgreSQL

    U->>FE: Choix d'un plan (subscription_plans/subscription_pricing)
    FE->>Pay: POST /process-payment (subscriptionId)
    Pay->>DB: relit user_subscriptions.amount_paid (jamais le client)
    Pay->>CB: Initie paiement
    CB->>DB: handlePaymentSuccess → active user_subscriptions (status=active)
    CB->>DB: send-subscription-confirmation (email)
```

- `user_subscriptions.status`/`amount_paid` sont verrouillés par un trigger (`enforce_user_subscription_status`, [20260916000001](../../supabase/migrations/20260916000001_lock_user_subscriptions_status.sql)) empêchant un utilisateur non-admin de s'auto-activer ou de modifier le montant payé — seul un flux serveur (`service_role`) ou un admin peut le faire.
- Facturation récurrente : `billing_periods` (cycles), mais **aucun mécanisme de relance/renouvellement automatique n'a été identifié dans les Edge Functions analysées** — à vérifier plus avant (cron `pg_cron` activé dans [20260104183657](../../supabase/migrations/20260104183657_2151ab23.sql), mais aucune tâche planifiée n'a été localisée dans ce dépôt pour le renouvellement d'abonnement).

## 6. Business Travel — workflow d'approbation entreprise

```mermaid
sequenceDiagram
    participant E as Employé
    participant CreateBooking as create-booking
    participant A as Approbateur (company)
    participant Review as review-booking-approval
    participant Pay as process-payment
    participant DB as PostgreSQL

    E->>CreateBooking: POST /create-booking (company_id fourni)
    CreateBooking->>DB: INSERT bookings (company_id, approval_status implicite)
    CreateBooking->>A: notifyCompanyApprovers (SMS/WhatsApp best-effort)

    A->>Review: POST /review-booking-approval ({bookingId, decision})
    Review->>DB: UPDATE bookings.approval_status (via RLS "Company approvers can review")
    Review->>E: notifyBookingOwner (SMS/WhatsApp best-effort)

    alt approved
        E->>Pay: POST /process-payment
        Pay->>DB: vérifie approval_status='approved' avant d'autoriser le paiement
    else rejected
        Note over E: Réservation non payable
    end
```

**Point notable** : `review-booking-approval` ne fait **aucun contrôle de rôle explicite dans son propre code** — l'autorisation repose entièrement sur la policy RLS "Company approvers can review their company bookings" : si la RLS refuse, l'`UPDATE` ne matche simplement aucune ligne. C'est un choix d'architecture valide (délégation à la base) mais qui rend ce flux plus difficile à auditer/tester unitairement sans accès direct aux policies SQL.

## 7. Machine à états — réservation (`bookings`)

```mermaid
stateDiagram-v2
    [*] --> pending: create-booking
    pending --> processing: process-payment (verrou atomique)
    processing --> paid: paiement confirmé (callback/webhook)
    processing --> failed: paiement refusé/expiré
    paid --> confirmed: create-pnr réussi (vols) / immédiat (autres services)
    paid --> cancelled: échec create-pnr → remboursement automatique
    confirmed --> cancelled: refund-payment (utilisateur/admin)
    cancelled --> [*]
    completed --> [*]
    confirmed --> completed: (transition non localisée dans le code analysé — probablement manuelle/admin)
```

**Note méthodologique** : cette machine à états combine les colonnes `bookings.status` (`pending`/`confirmed`/`cancelled`/`completed`, enum `booking_status`) et `bookings.payment_status` (`pending`/`processing`/`paid`/`refunded`/`failed`, enum `payment_status`), qui évoluent en partie indépendamment dans le code. La transition `confirmed → completed` n'a été localisée dans aucune Edge Function analysée — **[déduction]** elle est probablement déclenchée manuellement par un admin (page `/admin/bookings`) plutôt que par une automatisation, mais ceci n'a pas été vérifié directement dans le code de cette page.
