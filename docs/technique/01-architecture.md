# 01 — Architecture générale

> Statut des sources : les éléments marqués **[constaté]** proviennent directement de la lecture du code (chemin de fichier cité). Les éléments marqués **[déduction]** sont une interprétation raisonnable qui n'est pas littéralement écrite dans le code.

## 1. Vue d'ensemble

B-Reserve (marque commerciale **Bossiz+ / app.bossiz.com**) est une **application web monopage (SPA)** React, packagée pour le mobile via **Capacitor**, adossée à un backend **Supabase** (BaaS : PostgreSQL managé + Auth + Storage + Edge Functions serverless Deno). Il n'existe **pas de serveur applicatif Node/Express custom** : toute la logique serveur constatée réside dans les 72 fonctions Edge de [supabase/functions/](../../supabase/functions/).

- **Frontend** : React 18 + TypeScript, build Vite, UI shadcn/ui + Tailwind CSS — [package.json](../../package.json)
- **Mobile** : le même code web est empaqueté nativement via Capacitor pour Android ([android/](../../android/)) et iOS ([ios/](../../ios/))
- **Backend** : Supabase (projet cloud managé) — base PostgreSQL, authentification, stockage de fichiers, 72 fonctions Edge Deno — [supabase/config.toml](../../supabase/config.toml)
- **Déploiement web** : build statique servi par un conteneur `nginx:alpine`, dont le contenu (`dist/`) est mis à jour par un script shell manuel depuis un poste de développement — [deploy-vps/redeploy.sh](../../deploy-vps/redeploy.sh). Le TLS est terminé en amont par un reverse-proxy **Caddy** (mentionné en commentaire dans [deploy-vps/nginx.conf:41-42](../../deploy-vps/nginx.conf)) qui n'est pas présent dans ce dépôt — **[déduction]** Caddy est probablement configuré directement sur le VPS, hors du dépôt de code.
- **Intégrations tierces** : paiement (CinetPay, Jèko), recherche voyage (Amadeus, RapidAPI/Aerodatabox/Travel Advisor/Flight Fare Search, TravelPayouts), communication (Resend, SMTP générique, Twilio, Orange SMS API, Sendexa, Africa's Talking), IA (Anthropic Claude), notifications push web (VAPID), widgets tiers (Stay22 pour hôtels, TravelPayouts pour vols) — détail en [09-integrations.md](09-integrations.md).

## 2. Diagramme des composants

```mermaid
flowchart TB
    subgraph Clients["Clients"]
        Browser["Navigateur web\n(SPA React/Vite)"]
        AndroidApp["App Android\n(Capacitor)"]
        iOSApp["App iOS\n(Capacitor)"]
    end

    subgraph Edge["Périmètre VPS app.bossiz.com"]
        Caddy["Caddy\n(reverse proxy, TLS)\n[déduction : hors dépôt]"]
        Nginx["Conteneur nginx:alpine\nsert dist/ (SPA statique)\ndeploy-vps/nginx.conf"]
    end

    subgraph Supabase["Supabase (BaaS cloud managé)"]
        Auth["Supabase Auth"]
        Postgres["PostgreSQL\n63+ tables, RLS"]
        Storage["Supabase Storage"]
        Functions["72 Edge Functions (Deno)\nsupabase/functions/"]
    end

    subgraph Tiers["Services tiers"]
        Pay["CinetPay / Jèko\n(paiement, webhooks)"]
        Travel["Amadeus / RapidAPI / TravelPayouts\n(recherche vols, hôtels, activités)"]
        Comm["Resend / SMTP / Twilio / Orange /\nSendexa / Africa's Talking\n(email, SMS, WhatsApp)"]
        AI["Anthropic Claude\n(ai-travel-advisor, travel-chatbot)"]
        Widgets["Stay22 / TravelPayouts\n(widgets embarqués)"]
    end

    Browser -- HTTPS --> Caddy
    AndroidApp -- HTTPS --> Caddy
    iOSApp -- HTTPS --> Caddy
    Caddy --> Nginx
    Nginx -- "fichiers statiques\n(SPA fallback)" --> Browser

    Browser -- "REST/Auth/Realtime\n(clé anon, JS SDK)" --> Auth
    Browser -- "REST (RLS)\n(clé anon)" --> Postgres
    Browser -- upload/download --> Storage
    Browser -- "fetch() HTTPS\n(JWT utilisateur)" --> Functions

    Functions --> Postgres
    Functions --> Storage
    Functions --> Pay
    Functions --> Travel
    Functions --> Comm
    Functions --> AI
    Browser -.script/iframe embarqué.-> Widgets

    Pay -- webhook --> Functions
```

**Constats sur ce diagramme :**
- Le navigateur communique **directement** avec Supabase (Auth, Postgres via RLS, Storage) en utilisant la clé publique *anon* — [src/integrations/supabase/client.ts](../../src/integrations/supabase/client.ts). Il n'y a pas de couche API intermédiaire pour les opérations CRUD standard : la sécurité repose donc sur les politiques **Row Level Security** de PostgreSQL (voir [04-base-de-donnees.md](04-base-de-donnees.md) et [11-securite.md](11-securite.md)).
- Les Edge Functions sont utilisées pour tout ce qui nécessite un secret serveur (clé API tierce, clé `service_role`), une orchestration multi-étapes (réservation, paiement) ou l'envoi de communications.

## 3. Flux de données — cas d'usage type (recherche + réservation)

```mermaid
sequenceDiagram
    participant U as Utilisateur (navigateur/app)
    participant FE as SPA React
    participant EF as Edge Function
    participant DB as PostgreSQL (Supabase)
    participant Ext as API tierce (ex. Amadeus, CinetPay)

    U->>FE: Recherche (ex. vol Abidjan → Paris)
    FE->>EF: fetch('search-flights', params)
    EF->>Ext: Appel API externe (clé API secrète côté serveur)
    Ext-->>EF: Résultats bruts
    EF-->>FE: Résultats normalisés (JSON)
    FE-->>U: Affichage des résultats

    U->>FE: Sélection + passagers + validation
    FE->>EF: fetch('prebook' / 'create-booking')
    EF->>DB: INSERT booking (statut initial)
    EF-->>FE: booking_id, montant à payer

    FE->>EF: fetch('checkout' / 'process-payment')
    EF->>Ext: Initialisation paiement (CinetPay/Jèko)
    Ext-->>EF: URL de paiement / référence transaction
    EF-->>FE: Redirection vers la page de paiement du PSP
    U->>Ext: Paiement (carte, mobile money…)
    Ext->>EF: Webhook (payment-callback / jeko-webhook)
    EF->>DB: UPDATE booking.status, payments
    EF->>FE: (via polling/redirect) confirmation
```

Le détail exact de cette séquence, les statuts réellement observés dans la table `bookings` et les fonctions serveur impliquées sont documentés dans [08-flux-critiques.md](08-flux-critiques.md), après vérification ligne à ligne du code des fonctions concernées.

## 4. Frontières de responsabilité

| Couche | Responsabilité constatée | Où |
|---|---|---|
| SPA React | UI, routage, appels Supabase JS SDK, appels `fetch` aux Edge Functions | [src/](../../src/) |
| Supabase Auth | Authentification (email/mot de passe a minima), sessions JWT | [src/integrations/supabase/client.ts](../../src/integrations/supabase/client.ts) |
| PostgreSQL + RLS | Autorisation fine au niveau ligne pour les accès directs du frontend | [supabase/migrations/](../../supabase/migrations/) |
| Edge Functions | Logique métier nécessitant des secrets, orchestration paiement/réservation, communications sortantes, génération de documents | [supabase/functions/](../../supabase/functions/) |
| nginx (VPS) | Service des fichiers statiques, en-têtes de sécurité, CSP | [deploy-vps/nginx.conf](../../deploy-vps/nginx.conf) |
| Caddy | Terminaison TLS (certificat, HTTPS) | **[déduction]** hors dépôt |

## 5. Points d'architecture à clarifier (à approfondir dans les sections suivantes)

- Deux jeux de fichiers Docker/nginx coexistent : ceux à la racine du dépôt ([Dockerfile](../../Dockerfile), [docker-compose.yml](../../docker-compose.yml), [nginx.conf](../../nginx.conf)) semblent être un **template générique non aligné** avec le déploiement réel (ils référencent un utilisateur `nextjs`, `npm run preview` en process de prod, des services `postgres`/`redis` locaux — alors que la base réelle est Supabase Cloud managé et qu'aucun code Next.js n'existe dans le dépôt). Le déploiement réellement utilisé pour app.bossiz.com est celui de [deploy-vps/](../../deploy-vps/) (nginx statique + Caddy en frontal), confirmé par vous en phase 1. Détail en [10-deploiement-exploitation.md](10-deploiement-exploitation.md).
- Le pipeline CI/CD GitHub Actions ([.github/workflows/ci-cd.yml](../../.github/workflows/ci-cd.yml)) contient des jobs de déploiement (`deploy-staging`, `deploy-production`) qui ne sont **pas implémentés** (commandes `echo` uniquement) — le déploiement réel passe par l'exécution manuelle de `deploy-vps/redeploy.sh` depuis un poste de développeur.
