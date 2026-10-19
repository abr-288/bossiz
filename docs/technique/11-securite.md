# 11 — Sécurité

> Synthèse de tous les constats de sécurité relevés lors de la lecture du code (frontend, 72 Edge Functions, migrations SQL, configuration nginx/CI) et d'un balayage dédié (`npm audit`, grep de secrets, historique Git). Classement par criticité : **Critique** (exploitation directe probable, impact fort) → **Élevée** → **Moyenne** → **Faible/Info** (bonne pratique ou point mineur). Chaque constat cite son fichier source.

## Critique

### C1 — CORS `Access-Control-Allow-Origin: '*'` sur la totalité des 72 Edge Functions
Aucune fonction ne restreint l'origine au domaine officiel (`https://app.bossiz.com`, visible dans [supabase/config.toml:154](../../supabase/config.toml)). Combiné aux endpoints sans authentification stricte (voir C2, É1-É3), cela élargit la surface d'attaque de type CSRF depuis n'importe quel site tiers pour tout endpoint qui ne s'appuie que sur la clé `anon` publique. **Recommandation** : restreindre `Access-Control-Allow-Origin` au(x) domaine(s) de production.

### C2 — `send-sms` sans authentification ni rate limiting
[supabase/functions/send-sms/index.ts](../../supabase/functions/send-sms/index.ts) accepte `{to, message}` et envoie un SMS via un client `service_role`, sans vérification de JWT ni limite de débit. Si l'endpoint est atteignable publiquement (dépend du réglage `verify_jwt` au niveau plateforme, non vérifiable depuis le dépôt — voir É7), c'est un **relais SMS ouvert** exploitable pour de la fraude au coût ("SMS pumping").

### C3 — Deux routes `/admin/*` sans aucune garde d'accès frontend
`/admin/users-list` ([src/pages/AdminUsers.tsx](../../src/pages/AdminUsers.tsx)) et `/admin/content` ([src/pages/AdminContentManager.tsx](../../src/pages/AdminContentManager.tsx)) ne sont protégées par aucun `AdminLayout` ni vérification inline, contrairement aux 21 autres pages admin. Leur sécurité dépend entièrement des policies RLS des tables qu'elles affichent/modifient — un défaut de garde côté UI expose au minimum la structure de l'interface admin à un utilisateur non autorisé, et au pire les données elles-mêmes si une RLS sous-jacente est insuffisante (non auditée table par table dans ce document). **Recommandation** : ajouter `AdminLayout` à ces deux pages en priorité.

### C4 — `generate-ticket` sans authentification, utilise `service_role`
[supabase/functions/generate-ticket/index.ts](../../supabase/functions/generate-ticket/index.ts) lit n'importe quelle réservation par `bookingId` avec `service_role` et déclenche l'envoi d'un email contenant le billet vers l'adresse enregistrée du booking, sans contrôle d'appelant. Un `bookingId` deviné/énuméré permettrait de déclencher un envoi non sollicité (fuite d'information limitée sur l'existence d'une réservation, abus d'envoi).

## Élevée

### É1 — IDOR confirmé sur `generate-subscription-receipt`
[supabase/functions/generate-subscription-receipt/index.ts:403-407](../../supabase/functions/generate-subscription-receipt/index.ts) filtre uniquement par `id`, sans vérifier que le `subscriptionRequestId` appartient à l'utilisateur authentifié appelant. Tout utilisateur connecté connaissant/devinant un UUID peut récupérer le reçu (nom, email, téléphone, entreprise, montant payé) d'un autre client. **Recommandation** : ajouter un filtre `user_id`/email de contact correspondant à l'appelant.

### É2 — `check-price-alerts` sans contrôle d'accès applicatif
[supabase/functions/check-price-alerts/index.ts](../../supabase/functions/check-price-alerts/index.ts) (probablement destiné à un déclenchement cron) utilise directement `SUPABASE_SERVICE_ROLE_KEY` sans jamais lire ni valider l'en-tête `Authorization` entrant. Itère sur tous les utilisateurs et appelle des APIs de recherche tierces — un déclenchement arbitraire répété pourrait constituer un abus de coût/DoS sur les fournisseurs externes si l'endpoint est exposé sans restriction réseau.

### É3 — Rate limiting inégal, y compris sur les endpoints IA
`_shared/rate-limiter.ts` n'est utilisé que par ~13 fonctions (`car-rental`, `checkout`, `delete-account`, `jeko-webhook`, `payment-callback`, `process-payment`, `refund-payment`, `search-flights`, `search-hotels`, `send-otp`, `send-password-reset`, `verify-otp`). La majorité des endpoints publics de recherche/autocomplétion n'en ont aucun, de même que `ai-travel-advisor` et `travel-chatbot` malgré l'existence d'un préréglage dédié `RATE_LIMITS.AI` (10/min) — risque d'abus de coût sur l'API Anthropic par des appels anonymes répétés. `create-booking`, `newsletter-subscribe`, `send-contact-message`, `send-support-email` sont également sans limite.

### É4 — 2 vulnérabilités npm critiques, 20 élevées
`npm audit --json` (exécuté sur le dépôt) : **2 Critical, 20 High, 12 Moderate, 2 Low**. Notables :
- `tar` (Critical) — traversal de chemin via hardlink/symlink, écriture/lecture arbitraire de fichiers.
- `vitest`/`@vitest/mocker` (Critical) — lecture/exécution de fichier arbitraire via le serveur UI Vitest — **probablement dev-only**, impact limité à l'environnement de développement.
- `react-router-dom`/`@remix-run/router` (High) — XSS via open redirect, redirection externe non fiable, injection de constructeur arbitraire via `deserializeErrors()` en hydration SSR. **Impact potentiel en production** car `react-router-dom` est le routeur de l'application (dépendance de production, pas de dev).
- `vite`, `postcss`, `rollup`, `esbuild` (High/Moderate) — majoritairement outillage de build, probablement dev-only (n'affecte pas le build statique livré).
**Recommandation** : `npm audit fix`, puis vérifier spécifiquement l'exposition réelle de `react-router-dom` en production.

### É5 — Bucket de stockage `site-assets` : policies mal nommées
[supabase/migrations/20260120085817_fe5794d1.sql:11-21](../../supabase/migrations/20260120085817_fe5794d1.sql) — les policies d'upload/update/delete du bucket public `site-assets` ne vérifient en réalité que `bucket_id = 'site-assets'`, **pas le rôle admin/sub_agency** malgré leur nom laissant penser le contraire. Tout utilisateur authentifié pourrait potentiellement écrire dans ce bucket. **Recommandation** : corriger la condition de la policy pour inclure `has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'sub_agency')`.

### É6 — Ancien fichier `.env` présent dans l'historique Git
Le fichier `.env` a été commité 3 fois dans l'historique (commit `28e1b08`, puis supprimé/réajouté), exposant `VITE_SUPABASE_PROJECT_ID`, `VITE_SUPABASE_PUBLISHABLE_KEY` et `VITE_SUPABASE_URL` d'un **ancien projet Supabase** (`jcjfjyvmtfvmrplonxrg`, différent du projet actuel `gpwlzhegvjsbgbaepfjz`). Sévérité limitée par le fait que la clé exposée est la clé publique `anon` (conçue pour être publique) et que le projet semble obsolète/migré — mais si cet ancien projet Supabase existe encore, son URL est exposée publiquement dans l'historique du dépôt. **Recommandation** : confirmer que l'ancien projet est bien désactivé, envisager un nettoyage de l'historique Git si le dépôt devient public.

### É7 — Configuration `verify_jwt` non vérifiable depuis le dépôt
[supabase/config.toml](../../supabase/config.toml) ne contient aucune section `[functions.<nom>]` ni clé `verify_jwt` — ce réglage (activé par défaut côté Supabase) a pu être modifié via le dashboard ou en CLI au déploiement, hors du dépôt. **Impossible de confirmer depuis le code seul** si des fonctions comme `send-sms`, `payment-callback`, `jeko-webhook` sont réellement exposées sans JWT (nécessaire pour les webhooks) ou si elles sont protégées par la plateforme. **Action requise** : vérifier directement la configuration `verify_jwt` de chaque fonction sur le dashboard Supabase de production.

### É8 — Environnement Amadeus de test utilisé en production
`create-pnr` et `search-flights` appellent `test.api.amadeus.com`, pas l'environnement de production Amadeus — à corriger avant une mise en production réelle du flux de réservation de vols avec émission de PNR.

## Moyenne

### M1 — `payment-callback` sans vérification de signature cryptographique
Contrairement à `jeko-webhook`, le webhook CinetPay ne vérifie aucune signature HMAC sur le corps reçu. Le risque est mitigé par une re-vérification serveur-à-serveur systématique du statut réel via l'API CinetPay `check` avant toute confirmation de paiement — mais reste moins robuste qu'une vérification de signature en amont.

### M2 — Contrôle d'accès admin/agence côté frontend = affichage, pas barrière de sécurité
`AdminLayout`/`AgencyLayout` interrogent `user_roles` via le client `supabase-js` standard (clé `anon` + session), donc eux-mêmes soumis aux RLS — c'est un contrôle d'expérience utilisateur (éviter le flash de contenu), pas la barrière réelle. La vraie protection dépend des policies RLS de chaque table affichée, et du contrôle explicite refait côté Edge Function pour les opérations privilégiées (constaté correct pour `admin-create-partner-account`, `admin-list-users`, `send-partner-*`). Une revue exhaustive de toutes les policies RLS des tables affichées en admin (hors périmètre du temps imparti à cet audit) confirmerait l'absence de fuite de données pour les deux routes sans garde (C3).

### M3 — Validation d'entrée incomplète et incohérente
`_shared/validation.ts` (validation manuelle par regex) et `_shared/zodValidation.ts` (schémas Zod stricts) coexistent sans usage cohérent : `zodValidation.ts` n'est utilisé que par 3 fonctions (`search-flights`, `search-hotels`, `car-rental`) ; `paymentProcessSchema` y est défini mais **non importé par `process-payment`** (validation manuelle ad hoc à la place — schéma orphelin). `send-sms`, `send-contact-message`, `send-support-email` n'utilisent aucun des deux modules malgré l'existence de `validateSupportMessage` taillée pour ce cas d'usage. La fonction `sanitizeString` commune aux deux modules ne supprime que les caractères `<`/`>` — protection anti-XSS/injection très partielle (n'échappe ni quotes ni autres vecteurs).

### M4 — Rate limiter en mémoire, sans stockage partagé
[_shared/rate-limiter.ts:9-10](../../supabase/functions/_shared/rate-limiter.ts) utilise une `Map` en mémoire réinitialisée à chaque cold start de la fonction Edge — inefficace en environnement multi-instance (chaque instance a son propre compteur). L'identification du client IP ([_shared/rate-limiter.ts:45-67](../../supabase/functions/_shared/rate-limiter.ts)) lit plusieurs en-têtes potentiellement spoofables (`x-forwarded-for`, `x-real-ip`, etc.) sans confirmation qu'ils sont filtrés/normalisés par la plateforme en amont.

### M5 — Politique "pas de données fictives" appliquée de façon incohérente
`search-destinations`, `search-events`, `search-flights`, `ai-travel-advisor`, `travel-chatbot` renvoient honnêtement un résultat vide/erreur si la clé API est absente (comportement documenté par des commentaires explicites dans le code). Mais `travel-recommendations` génère encore des **données mock présentées comme réelles** (`getMockRecommendations`), et `airport-info`/`get-weather`/`hotel-autocomplete` ont des fallbacks similaires — incohérence de politique produit à trancher (uniformiser vers l'un ou l'autre comportement).

### M6 — Bug répété : re-lecture de `req.json()` après consommation du body
`airport-info` et `get-weather` (probablement aussi `travel-recommendations`) relisent `await req.json()` dans leur bloc `catch`, ce qui échoue car le body a déjà été consommé une première fois — casse le mécanisme de fallback en cas d'erreur survenant après le premier parsing.

### M7 — Données d'identité transmises en clair par email
`send-flight-confirmation` inclut le type et le numéro de document d'identité (passeport/CNI) des passagers dans le corps de l'email de confirmation (échappé HTML mais transmis en clair par email, canal non chiffré de bout en bout).

## Faible / Information

- **`generate-booking-pdf`** n'a pas de vérification explicite `booking.user_id === user.id` dans son code (contrairement à `generate-flight-ticket`/`generate-invoice` qui la font) — dépend entièrement des RLS de `bookings`.
- **QR code non scannable** dans `generate-flight-ticket` (motif SVG factice basé sur un hash) — incohérent avec `generate-booking-pdf`/`generate-subscription-receipt` qui utilisent une vraie librairie QR ; problème fonctionnel plus que sécurité, mais pertinent si ce billet sert de preuve d'embarquement.
- **Numéro de facture non garanti unique cryptographiquement** — généré via `Date.now()` + `Math.random().toString(36)` dans `generate-invoice`, sans contrainte `UNIQUE` visible côté code (dépend du schéma DB réel, non vérifié).
- **Bonnes pratiques constatées** (à mettre en avant pour la levée de fonds) :
  - Intégrité des prix par signature HMAC-SHA256 dédiée (`PRICE_SIGNING_SECRET`, distinct de `SUPABASE_SERVICE_ROLE_KEY`) sur l'ensemble du pipeline recherche → réservation → paiement pour hôtels/voitures/vols.
  - `create-booking` ne fait **jamais confiance** au prix envoyé par le client — recalcul systématique côté serveur.
  - `send-password-reset` : anti-énumération de comptes (réponse toujours `{success:true}`), rate limit IP + par email, allowlist de redirection anti-open-redirect.
  - `send-otp` : code jamais stocké en clair (hash SHA-256 salé), rate limit + cooldown.
  - `delete-account` : implémentation cohérente du droit à l'effacement RGPD (anonymisation + bannissement, conservation minimale pour obligations comptables).
  - Triggers SQL de verrouillage des champs sensibles (`enforce_booking_status`, `enforce_user_subscription_status`, `enforce_agency_protected_fields`, `enforce_review_status`) empêchant un utilisateur/agence de s'auto-attribuer un statut privilégié — défense en profondeur complémentaire aux Edge Functions.
  - Clé `service_role` jamais exposée côté frontend (grep exhaustif sur `src/` : 0 résultat).
  - **Faille historique déjà corrigée** : [20260916000000_remove_admin_email_backdoor.sql](../../supabase/migrations/20260916000000_remove_admin_email_backdoor.sql) a supprimé un trigger qui accordait automatiquement le rôle admin à l'inscription avec l'email exact `admin@bossiz.com` — remédiation constatée, bon signal de mûrissement de la sécurité du projet.
- **`_hardcoded_full.json`** (racine du dépôt) : ce fichier est en réalité un rapport d'audit **i18n** (chaînes UI non traduites), pas un audit de secrets malgré son nom — à ne pas confondre lors d'une revue future.

## Synthèse — priorités de remédiation

| Priorité | Constats |
|---|---|
| **P0 (à traiter avant toute prochaine mise en production)** | C1 (CORS wildcard), C2 (`send-sms` ouvert), C3 (routes admin sans garde), C4 (`generate-ticket` sans auth), É1 (IDOR reçu abonnement), É4 (vulnérabilités npm critiques), É5 (policy storage mal nommée) |
| **P1** | É2, É3, É6, É7, É8, M1, M2, M3 |
| **P2** | M4, M5, M6, M7, points Faible/Info |

Voir aussi [10-deploiement-exploitation.md](10-deploiement-exploitation.md) pour les constats liés à l'absence de monitoring/alerting, qui limitent la capacité de détection d'une exploitation de ces points en production.
