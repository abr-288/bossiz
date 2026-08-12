# B-Reserve / Bossiz — Documentation du fonctionnement du site

Dernière mise à jour : 2026-08-05

## 1. Vue d'ensemble

B-Reserve (marque **Bossiz**) est une plateforme de réservation de voyages pour la
Côte d'Ivoire et l'Afrique de l'Ouest : vols, hôtels, voitures, activités/tours,
trains, événements, packages vol+hôtel.

> **2026-08-05 — Module Majestic Club retiré.** Le programme VIP/conciergerie
> "Majestic Club" (pages, composants, routes, nav, données) a été
> intégralement supprimé du site pour recentrer l'expérience sur un parcours
> de réservation classique façon OTA (Opodo-like) : recherche multi-onglets
> en page d'accueil, offres, destinations populaires — sans contenu VIP.
> Détails en section 8.

- **Site public** : https://app.bossiz.com
- **Frontend** : React 18 + Vite + TypeScript + Tailwind + shadcn/ui
- **Backend** : Supabase (Postgres + Auth + Edge Functions + Storage), projet `Bossiz` (ref `gpwlzhegvjsbgbaepfjz`, région eu-west-1)
- **Paiement** : CinetPay (mobile money / carte, Afrique de l'Ouest)
- **Mobile** : PWA installable (Android/iOS) + projet Capacitor natif (`android/`, `ios/`)
- **i18n** : français (par défaut), anglais, chinois (`src/i18n/locales/{fr,en,zh}.json`)

## 2. Comptes et rôles

Le rôle d'un utilisateur est stocké dans la table `user_roles` (colonne `role`,
enum `app_role` : `admin` | `user` | `sub_agency`). Un utilisateur sans ligne
dans `user_roles` est traité comme `user` par défaut.

| Rôle | Accès | Interface |
|---|---|---|
| `user` | Réservations, dashboard personnel, abonnements standard optionnels | `/dashboard`, `/account` |
| `sub_agency` | Gestion des offres d'une agence (séjours, activités, promotions, services) | `/agency/*` |
| `admin` | Administration complète de la plateforme (utilisateurs, agences, contenu, paiements, config) | `/admin/*` |

### Comptes démo

Créés le 2026-08-05 directement sur le projet Supabase de production via l'API
admin (script `deploy-vps/seed-demo-accounts.mjs`, idempotent — relançable
sans dupliquer). Mot de passe identique pour les comptes :

| Compte | Email | Rôle | Particularité |
|---|---|---|---|
| Admin | `demo.admin@bossiz.com` | `admin` | Accès complet `/admin/*` |
| Client | `demo.client@bossiz.com` | `user` | Compte client standard |
| Agence | `demo.agence@bossiz.com` | `sub_agency` | Possède une ligne dans `agencies` ("Agence Démo Voyages"), accès `/agency/*` |

**Mot de passe : `DemoBossiz#2026`**

Un 4ᵉ compte démo (`demo.majestic@bossiz.com`) avait été créé pour tester le
module Majestic Club ; son abonnement a été supprimé avec le reste des
données Majestic (section 8). Le compte reste utilisable comme simple `user`.

Pour régénérer/rafraîchir ces comptes (ex. après une réinitialisation de la
base), relancer depuis la racine du projet :

```bash
SUPABASE_URL="https://gpwlzhegvjsbgbaepfjz.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="<service_role_key>" \
node deploy-vps/seed-demo-accounts.mjs
```

La clé `service_role` se récupère avec `npx supabase projects api-keys
--project-ref gpwlzhegvjsbgbaepfjz` (CLI déjà authentifié sur ce poste) —
**ne jamais la committer ni la coller en clair dans un fichier suivi par git**.

## 3. Parcours fonctionnels principaux

- **Recherche & réservation** (`/flights`, `/hotels`, `/cars`, `/tours`,
  `/trains`, `/events`, `/stays`, `/flight-hotel`) : formulaires de recherche
  dédiés par service (`src/components/*SearchForm.tsx`), résultats filtrables,
  puis dialogue de réservation (`*BookingDialog.tsx`) ou flow multi-étapes
  (`src/components/booking-steps/` : options, passagers, bagages, préférences,
  récapitulatif) aboutissant à `/payment` puis `/confirmation`.
- **Paiement** : intégration CinetPay via les edge functions `checkout`,
  `process-payment`, `payment-callback`, `refund-payment`. Un secret dédié
  (`PRICE_SIGNING_SECRET`) signe les prix entre le prebook et le checkout pour
  empêcher la falsification côté client.
- **Comparateur de vols** (`/flight-comparison`) et **alertes de prix**
  (`/price-alerts`) via `check-price-alerts`.
- **Espace client** (`/dashboard`, `/account`, `/booking-history`) : historique
  de réservations, calendrier, notifications, gestion du profil.
- **Espace agence** (`/agency/*`) : gestion des séjours, activités, promotions
  et services proposés par l'agence (table `agencies`, propriétaire = `owner_id`).
- **Espace admin** (`/admin/*`) : utilisateurs, agences, réservations, contenu
  du site (destinations, publicités, promotions), configuration de la page
  d'accueil, modèles d'emails, abonnements, paiements, avis.
- **Conciergerie Bossiz CI/SN** (`/bossiz-conciergerie-ci`,
  `/bossiz-conciergerie-sn` + sous-pages) : pages vitrines par pays.
- **Support & conformité** : `/support`, `/help`, `/privacy`, `/terms`.
- **Installation mobile (PWA)** : `/install` (page générique, fonctionnelle
  pour iOS et Android), `/install/android`, `/install/ios` — voir section 6.

## 4. Architecture technique

```
src/
  components/        UI + formulaires de recherche + dialogues de réservation
  components/admin/  Layout et widgets de l'espace admin
  components/agency/ Layout et widgets de l'espace agence
  components/majestic-club/  Composants du club VIP
  components/booking-steps/  Étapes du tunnel de réservation
  pages/             Une page par route (voir AnimatedRoutes.tsx pour la liste)
  hooks/             Logique réutilisable (auth, PWA, rôle, notifications push...)
  contexts/          Contexts React (thème, etc.)
  integrations/supabase/  Client Supabase + types générés (types.ts)
  i18n/locales/      Traductions fr/en/zh

supabase/
  functions/         Edge Functions Deno (paiement, recherche, emails, PDF...)
  migrations/         Migrations SQL (schéma, RLS, seed de référence)

android/, ios/        Projets natifs Capacitor (appId com.breserve.app)
deploy-vps/            Scripts et config de déploiement VPS (voir section 5)
```

- **Auth** : Supabase Auth (email/mot de passe). Rôle vérifié côté client via
  `useUserRole`/`user_roles`, et **protégé côté serveur par les policies RLS**
  sur chaque table (le rôle affiché côté client n'est qu'un affichage — la
  sécurité réelle vient de Postgres RLS + des edge functions qui utilisent la
  clé `service_role` pour les opérations privilégiées).
- **Edge Functions** (`supabase/functions/*`) : recherche fournisseurs
  (vols/hôtels/trains/voitures via RapidAPI/Amadeus/TravelPayouts...), paiement
  CinetPay, génération de PDF/billets/factures, emails transactionnels (Resend/SMTP),
  notifications push (VAPID), chatbot IA de voyage.
- **PWA** : `vite-plugin-pwa` génère `sw.js` + `workbox-*.js` au build
  (precache ~320 fichiers). Installable nativement sur Android/Chrome via
  l'événement `beforeinstallprompt` (hook `usePWA`), et manuellement sur iOS/Safari
  (pas de prompt natif — Apple ne l'implémente pas) via Partager → Sur l'écran d'accueil.

## 5. Déploiement (production)

Le site tourne sur un **VPS Contabo** (`169.58.93.234`, utilisateur SSH `ubuntu`,
sudo sans mot de passe, Docker + Docker Compose déjà installés) :

- **Reverse proxy** : Caddy (conteneur `caddy`, `/srv/proxy/`), TLS
  automatique (Let's Encrypt), route `app.bossiz.com` → conteneur applicatif
  sur le réseau Docker externe `proxy`.
- **Application** : conteneur `bossiz-app` (nginx:alpine), sert le dossier
  `dist/` (build Vite) en fichiers statiques avec fallback SPA
  (`try_files $uri /index.html`), sur `/srv/projects/traversee-connect/`.
- **Config du projet déployé** : `deploy-vps/docker-compose.yml` +
  `deploy-vps/nginx.conf` (copiés une fois sur le VPS ; ne changent quasiment
  jamais — un redéploiement classique ne touche que `dist/`).

### Redéployer une nouvelle version

```bash
bash deploy-vps/redeploy.sh
```

Ce script : build (`npm run build`) → envoi de `dist/` vers un dossier
temporaire sur le VPS → **synchronisation du contenu par `rsync --delete`
dans le dossier `dist/` existant** (jamais un remplacement du dossier
lui-même) → vérification HTTP.

⚠️ **Piège connu** : le dossier `dist/` sur le VPS est monté (*bind mount*)
dans le conteneur `bossiz-app`. Le remplacer avec `mv`/`rm+mkdir` casse le
montage (le conteneur continue de voir l'ancien dossier, maintenant orphelin
→ erreur 500 "internal redirection cycle"). C'est pour ça que le script ne
synchronise que le **contenu**, jamais le dossier. Si ça arrive quand même,
le seul correctif est `sudo docker restart bossiz-app` sur le VPS.

### Mettre à jour la configuration Caddy (rare)

```bash
ssh ubuntu@169.58.93.234
sudo nano /srv/proxy/Caddyfile
sudo docker exec caddy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile
```

### Autres méthodes de déploiement présentes dans le repo (non utilisées actuellement)

- `netlify.toml` — déploiement Netlify (build automatique sur push si le repo
  est connecté à Netlify)
- `vercel.json` — déploiement Vercel
- `deploy-ftp.js` — upload FTP du dossier `dist/` (nécessite un `.env.deploy`
  non versionné avec `FTP_HOST`/`FTP_USER`/`FTP_PASSWORD`)
- `Dockerfile` / `docker-compose.yml` (racine du repo) — image Docker
  générique orientée développement (Postgres/Redis locaux), différente de la
  config de prod minimaliste dans `deploy-vps/`

## 6. Disponibilité mobile (Android / iOS)

**Statut actuel : disponible en PWA, pas en app native store.**

- Il n'existe **aucune fiche Play Store ni App Store publiée** pour cette
  application. Les pages `/install/android` et `/install/ios` contenaient
  des liens morts vers une URL interne inexistante et vers des fiches
  Play Store / App Store fictives (ID placeholder) — **corrigé le 2026-08-05** :
  elles utilisent maintenant le vrai mécanisme d'installation PWA
  (`usePWA`/`beforeinstallprompt`) et renvoient vers `/install` (instructions
  manuelles pas-à-pas) en fallback.
- **Android** : installable directement depuis Chrome (prompt natif "Ajouter
  à l'écran d'accueil" / "Installer l'application"), fonctionnel dès
  aujourd'hui sur https://app.bossiz.com.
- **iOS** : installable manuellement depuis Safari (Partager → Sur l'écran
  d'accueil) — Apple ne propose pas de prompt d'installation automatique pour
  les PWA, ce comportement est normal et déjà bien géré par la page `/install`.
- **Build natif (Capacitor)** : les projets `android/` et `ios/` existent et
  sont configurés (`capacitor.config.ts`, appId `com.breserve.app`), et un job
  `build-android` existe déjà dans `.github/workflows/ci-cd.yml` (build APK
  debug via GitHub Actions à chaque push sur `prod`). **Aucun build APK/IPA
  n'est actuellement produit ni distribué** — ce poste de développement
  (Windows, sans Android SDK ni Xcode/macOS) ne permet pas de compiler l'APK ou
  l'IPA localement. Pour distribuer un vrai `.apk` :
  1. Laisser tourner le job CI existant et récupérer l'artefact
     `android-apk` depuis l'onglet Actions de GitHub après un push sur `prod`, ou
  2. Builder depuis une machine avec Android Studio/SDK installé
     (`npx cap sync android && cd android && ./gradlew assembleRelease`, avec
     signature de release à configurer — le job CI actuel ne fait qu'un build
     `debug` non signé).
  - iOS nécessite un Mac avec Xcode et un compte Apple Developer — non traité
    ici (priorité basse, confirmé avec l'utilisateur).

## 7. Variables d'environnement clés

Voir `.env.example` pour la liste complète. Catégories principales :

- **Supabase** : `VITE_SUPABASE_URL`, `VITE_SUPABASE_PROJECT_ID`, `VITE_SUPABASE_PUBLISHABLE_KEY`
- **Paiement** : `PRICE_SIGNING_SECRET` (signature HMAC prebook/checkout — jamais réutiliser la clé service_role pour ça), secrets CinetPay stockés uniquement côté Supabase Edge Functions
- **APIs voyage** : RapidAPI (Amadeus, AeroDataBox, Travel Advisor, Kiwi, Skyscanner...), TravelPayouts
- **Email** : Resend et/ou SMTP
- **Push** : clés VAPID

Les secrets serveur (`SUPABASE_SERVICE_ROLE_KEY`, clés API tierces) ne sont
**jamais** dans le `.env` frontend — ils vivent dans les secrets des Edge
Functions Supabase (`supabase secrets set ...`), à part le cas ponctuel du
script de seed (section 2) exécuté manuellement en local.

## 8. Suppression du module Majestic Club (2026-08-05)

À la demande du propriétaire du site, le programme VIP/conciergerie
"Majestic Club" a été entièrement retiré pour recentrer la plateforme sur un
parcours OTA classique (façon Opodo) : recherche multi-onglets en page
d'accueil, offres, destinations — sans contenu VIP séparé.

**Code retiré** : `src/components/majestic-club/` (composants), pages
`MajesticClub.tsx` / `MajesticAccess.tsx` / `MajesticDashboard.tsx`, hook
`useMajesticSubscription.ts`, routes `/majestic-club` `/majestic-access`
`/majestic-dashboard`, lien de navigation "Premium" (Navbar, sidebar
dashboard), entrées majestic dans `Documentation.tsx`, `Dashboard.tsx`,
`OrderSummary.tsx`, `ModernSubscriptionPayment.tsx`,
`admin/SubscriptionManagement.tsx`, `middleware/auth.ts` (fichier mort,
boilerplate Next.js jamais utilisé dans ce projet Vite), palette CSS/Tailwind
`majestic-*`, clés i18n `majesticAccess`/`majesticClub` (fr/en/zh), fichier
orphelin `src/types/supabase-types.ts`.

**Page d'accueil** (`src/pages/Index.tsx`) : retrait de la section "Bossiz
Portal" (cartes VIP Bossiz CI/SN mises en avant sur la home) pour un flux
plus proche d'un site de réservation classique — les pages
`/bossiz-conciergerie-ci`, `/bossiz-conciergerie-sn` et `/bossiz-portal`
restent accessibles, seule leur mise en avant sur la home a été retirée. Le
hero de recherche multi-onglets (`HeroSection.tsx`, déjà de style
Opodo — onglets Vols/Hôtels/Vol+Hôtel/Voiture/Train/Séjours) et la navigation
à deux niveaux (`Navbar.tsx`, déjà orientée OTA) n'ont pas nécessité de refonte
profonde, seulement le retrait du lien Majestic.

**Base de données** : toutes les lignes des 18 tables liées à Majestic
(`majestic_bookings`, `majestic_documents`, `majestic_itineraries`,
`majestic_messages`, `majestic_notifications`, `majestic_payments`,
`majestic_properties`, `majestic_service_requests`, `majestic_services`,
`majestic_subscriptions`, `majestic_transactions`, `concierge_requests`,
`concierge_staff`, `vip_events`, `vip_event_registrations`,
`exclusive_services`, `service_bookings`, `assistance_logs`) ont été
sauvegardées en JSON (`deploy-vps/backups/majestic_2026-08-05/`, non versionné
— voir `.gitignore`) puis purgées (`deploy-vps/purge-majestic-data.mjs`). Les
lignes "majestic" dans les tables partagées (`subscription_plans`,
`subscription_pricing`, `user_subscriptions`) ont aussi été supprimées.

⚠️ **Suppression des tables (DROP TABLE) non appliquée.** Le CLI Supabase
échoue sur ce projet avec `42501: permission denied to alter role` lors de
toute opération nécessitant une connexion Postgres directe (`db query
--linked`, `db push`) — un problème côté plateforme Supabase, indépendant du
code. Les 18 tables existent donc toujours, vides. La migration prête à
l'emploi est dans `supabase/migrations/20260805000000_drop_majestic_club.sql`
— à exécuter manuellement dans le SQL Editor du dashboard Supabase, ou via
`supabase db push` une fois le problème de permission résolu côté Supabase
(vérifier les paramètres réseau/rôles du projet, ou contacter le support
Supabase avec le message d'erreur exact).
