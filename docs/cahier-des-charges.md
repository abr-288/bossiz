# Cahier des charges reconstitué — B-Reserve / Bossiz+ (app.bossiz.com)

> **Méthode** : ce document est une **rétro-ingénierie** du cahier des charges à partir du code source réel du dépôt (`d:/telechargement/B-reserve/traversee-connect`), et non un document de spécification préexistant. Chaque besoin fonctionnel est déduit de l'implémentation constatée (pages, Edge Functions, tables, migrations) — les critères d'acceptation reflètent donc **ce que le système fait actuellement**, pas une exigence négociée en amont. Le détail technique complet (fichiers, lignes, citations) est disponible dans [docs/technique/](technique/). Voir aussi [etat-avancement.md](etat-avancement.md) pour le statut de complétude de chaque module.

## 1. Contexte et présentation du projet

**B-Reserve**, commercialisé sous la marque **Bossiz+** (app.bossiz.com), est une plateforme de réservation et de services de voyage opérant depuis la Côte d'Ivoire (et, dans une moindre mesure, le Sénégal — voir micro-sites Bossiz CI/SN), couvrant : vols, hôtels, location de voitures, circuits/activités, trains, événements, restaurants, artisans locaux, bien-être/beauté, ainsi qu'un volet **voyage d'affaires (Business Travel)** et une offre en évolution de **conciergerie**.

La plateforme est développée en très grande majorité (890 commits sur 944, soit ~94%) par l'outil de génération de code assisté par IA **Lovable/gpt-engineer** ([source : `git shortlog`](../.git)), avec un développeur humain identifié (« B-Reserve Developer », 55 commits) supervisant et corrigeant le code généré — notamment sur les sujets de sécurité et de conformité, comme en témoignent plusieurs migrations correctives récentes (suppression d'une backdoor admin, verrouillage de champs financiers contre l'auto-modification). **[déduction]** Ce mode de développement explique probablement le rythme d'itération très soutenu (74 migrations de base de données en moins d'un an) et certaines incohérences résiduelles documentées dans ce cahier des charges et dans l'audit de sécurité.

## 2. Objectifs et périmètre

**Objectif produit constaté** : offrir un point d'entrée unique pour réserver l'ensemble des services liés à un voyage ou à un déplacement professionnel en Afrique de l'Ouest, avec paiement local (CinetPay, Jèko — mobile money et carte), en trois langues (français, anglais, chinois), accessible en web et en application mobile native (Android/iOS via Capacitor).

**Dans le périmètre constaté** :
- Recherche et réservation multi-services (vols, hôtels, voitures, trains, activités, événements, séjours)
- Paiement local et international
- Gestion des partenaires (agences sous-traitantes, commission)
- Voyage d'affaires avec workflow d'approbation d'entreprise
- Marketplace de services locaux (restaurants, artisans, bien-être) gérée par des agences partenaires
- Assistant IA de conseil voyage
- Back-office d'administration complet

**Hors périmètre actuel (constaté absent, voir §7 Exigences V2)** : parcours de conciergerie de luxe complet (module « Majestic » supprimé de la base le 2026-08-05), émission de titres de transport ferroviaire réelle (trains actuellement en recherche seule), paiement récurrent automatisé des abonnements (aucun mécanisme de relance automatique identifié).

## 3. Acteurs et rôles

Voir détail complet dans [technique/07-roles-permissions.md](technique/07-roles-permissions.md). Synthèse :

| Acteur | Rôle système | Périmètre d'action constaté |
|---|---|---|
| **Visiteur** | aucun (non connecté) | Recherche, consultation catalogue, contenu marketing |
| **Client (Utilisateur)** | `user` (rôle par défaut) | Réservation, paiement, gestion de compte, historique, alertes de prix |
| **Agence partenaire** | `sub_agency` | Gestion de son propre catalogue (services, activités, séjours, restaurants, artisans, bien-être), suivi de ses commissions |
| **Employé d'entreprise** | `company_members.role = employee` | Soumission de réservations "Business Travel" au nom de son entreprise |
| **Approbateur d'entreprise** | `company_members.role = approver` | Validation/rejet des réservations soumises par les employés |
| **Administrateur d'entreprise** | `company_members.role = admin` | Gestion des membres et de la politique de voyage de son entreprise |
| **Administrateur plateforme** | `admin` | Accès complet : configuration, utilisateurs, agences, paiements, contenu, intégrations |

## 4. Besoins fonctionnels par module

> Numérotation `EF-xxx` par module. Statut d'implémentation détaillé dans [etat-avancement.md](etat-avancement.md).

### 4.1 Recherche voyage (EF-010 à EF-019)

- **EF-010 — Recherche de vols.** Le système agrège les résultats de 5 fournisseurs (Amadeus, Kiwi, Sky-Scrapper, Travelpayouts, Kayak via RapidAPI). *Règle métier* : validation stricte des paramètres (dates futures, codes IATA valides, plages de passagers) via schéma Zod. *Critère d'acceptation constaté* : recherche fonctionnelle sans authentification, rate-limitée à 30 requêtes/min par IP. Preuve : [search-flights](../supabase/functions/search-flights).
- **EF-011 — Recherche d'hôtels.** Agrégation de 6 fournisseurs + hôtels partenaires internes, avec application d'une marge commerciale de 8% et signature cryptographique de chaque offre (validité 30 min). Preuve : [search-hotels](../supabase/functions/search-hotels).
- **EF-012 — Recherche de voitures de location.** Depuis le 2026-09-10, limitée aux seules annonces d'agences partenaires internes (agrégateur tiers retiré). Preuve : [car-rental](../supabase/functions/car-rental).
- **EF-013 — Recherche de trains.** Couverture Inde (IRCTC) et France (SNCF Open Data) uniquement — pas de couverture Eurostar/Allemagne/autres réseaux (assumé explicitement par le code, pas de données fictives). Preuve : [search-trains](../supabase/functions/search-trains).
- **EF-014 — Recherche d'événements et de destinations.** Via TripAdvisor/Real-Time Events Search (RapidAPI), avec mise en cache 1h pour les destinations. Preuve : [search-destinations](../supabase/functions/search-destinations), [search-events](../supabase/functions/search-events).
- **EF-015 — Recherche de packages vol+hôtel.** Recherche combinée, ⚠️ sans application de marge ni signature de prix (contrairement à EF-010/EF-011). Preuve : [search-flight-hotel-packages](../supabase/functions/search-flight-hotel-packages).
- **EF-016 — Autocomplétion.** Suggestions d'aéroports, villes, lieux d'événements/location voiture — dataset statique local (~200 villes), pas d'appel réseau. Preuve : [_shared/cities-data.ts](../supabase/functions/_shared/cities-data.ts).
- **EF-017 — Conversion de devises pour affichage.** Taux en temps réel via API publique, **distinct** du taux fixe utilisé pour les calculs transactionnels (EF-030). Preuve : [currency-exchange](../supabase/functions/currency-exchange).

### 4.2 Réservation (EF-020 à EF-029)

- **EF-020 — Pré-réservation de vol avec verrouillage tarifaire.** Le prix est recalculé et figé côté serveur (taxes 12%, frais de service 5%), signé cryptographiquement, valide 10 minutes. *Règle métier* : la disponibilité réelle n'est pas vérifiée auprès du fournisseur à cette étape (valeur simulée dans le code actuel). Preuve : [prebook](../supabase/functions/prebook).
- **EF-021 — Validation de pré-réservation (checkout).** Revérification de la signature de prix avant autorisation de paiement, avec codes d'erreur structurés (expiré, déjà payé, signature invalide). Preuve : [checkout](../supabase/functions/checkout).
- **EF-022 — Création de réservation.** *Règle métier fondamentale* : le prix transmis par le client n'est **jamais** utilisé tel quel — recalcul serveur systématique quel que soit le type de service. *Critère d'acceptation* : une réservation ne peut être créée qu'avec un prix vérifié (signature HMAC ou source de vérité serveur). Preuve : [create-booking](../supabase/functions/create-booking).
- **EF-023 — Émission de titre de transport (PNR).** Appel réel au GDS Amadeus après paiement confirmé ; remboursement automatique si l'émission échoue (pas de confirmation mensongère). ⚠️ Pointe actuellement vers l'environnement de test Amadeus. Preuve : [create-pnr](../supabase/functions/create-pnr).
- **EF-024 — Génération de documents de voyage.** Billets, factures, reçus au format HTML avec QR code (réel pour billet hôtel/reçu abonnement, factice/non scannable pour billet de vol). Preuve : [technique/06-fonctions-serveur.md](technique/06-fonctions-serveur.md) §4.
- **EF-025 — Machine à états de réservation.** Statuts `pending → processing → paid/failed → confirmed/cancelled → completed`, avec verrouillage SQL empêchant un client de s'auto-attribuer un statut privilégié. Preuve : [technique/08-flux-critiques.md](technique/08-flux-critiques.md) §7.

### 4.3 Paiement (EF-030 à EF-039)

- **EF-030 — Paiement multi-prestataire.** CinetPay et Jèko, sélection dynamique du prestataire actif configurable par un administrateur. *Règle métier* : le montant facturé est toujours relu depuis la source de vérité serveur (jamais transmis par le client), avec verrou atomique anti double-paiement. Preuve : [process-payment](../supabase/functions/process-payment).
- **EF-031 — Confirmation de paiement (webhooks).** CinetPay : re-vérification serveur-à-serveur systématique du statut réel (pas de confiance au webhook seul). Jèko : vérification de signature HMAC-SHA256 du webhook. Les deux sont idempotents. Preuve : [payment-callback](../supabase/functions/payment-callback), [jeko-webhook](../supabase/functions/jeko-webhook).
- **EF-032 — Remboursement.** Déclenchable par le client (sa propre réservation) ou un administrateur, appel réel à l'API CinetPay refund. ⚠️ Cette API n'a jamais été testée en conditions réelles selon un commentaire explicite du code. Preuve : [refund-payment](../supabase/functions/refund-payment).
- **EF-033 — Facturation entreprise (Business Travel).** Une réservation liée à une entreprise (`company_id`) ne peut être payée qu'après approbation explicite par un `approver` de l'entreprise (`approval_status='approved'`). Preuve : [08-flux-critiques.md](technique/08-flux-critiques.md) §6.
- **EF-034 — Commissions agence.** Calcul et enregistrement automatique et idempotent d'une commission pour l'agence propriétaire du service, sur chaque paiement confirmé (extension récente aux restaurants/bien-être/artisans). Preuve : [_shared/postPaymentSuccess.ts](../supabase/functions/_shared/postPaymentSuccess.ts).

### 4.4 Comptes et authentification (EF-040 à EF-049)

- **EF-040 — Inscription / connexion.** Via Supabase Auth (email/mot de passe a minima). Attribution automatique du rôle `user` par défaut à l'inscription.
- **EF-041 — Récupération de mot de passe.** Envoi de lien par email avec protection anti-énumération de comptes (réponse toujours positive) et allowlist de redirection anti-open-redirect. Preuve : [send-password-reset](../supabase/functions/send-password-reset).
- **EF-042 — Vérification par code OTP.** Génération et envoi de code à 6 chiffres par email ou SMS, jamais stocké en clair (hash salé), expiration 10 minutes. Preuve : [send-otp](../supabase/functions/send-otp).
- **EF-043 — Droit à l'effacement (RGPD).** Anonymisation des données personnelles et bannissement du compte en self-service, avec conservation minimale des données transactionnelles pour obligations comptables. Preuve : [delete-account](../supabase/functions/delete-account).

### 4.5 Espace utilisateur (EF-050 à EF-059)

- **EF-050 — Tableau de bord utilisateur, historique de réservations, gestion de compte.** Pages protégées par vérification de session au montage. Preuve : [technique/05-routes-et-pages.md](technique/05-routes-et-pages.md).
- **EF-051 — Alertes de prix.** Création d'alertes suivies périodiquement (mécanisme de vérification supposé cron, aucun contrôle d'accès applicatif constaté sur la fonction de vérification), notification push si le prix cible est atteint. Preuve : [check-price-alerts](../supabase/functions/check-price-alerts).
- **EF-052 — Notifications push web.** Abonnement navigateur (VAPID), désactivation automatique des abonnements expirés.

### 4.6 Back-office administrateur (EF-060 à EF-069)

- **EF-060 — Gestion complète de la plateforme.** 23 pages d'administration : réservations, services, utilisateurs, abonnements, promotions, agences, candidatures partenaires, commissions, plans voitures, publicités, paiements, avis, newsletter, destinations, micro-sites Bossiz, intégrations, configuration homepage. Preuve : [technique/05-routes-et-pages.md](technique/05-routes-et-pages.md) §2.
- **EF-061 — Gestion des intégrations tierces.** Configuration centralisée des identifiants prestataires (paiement, email, SMS/WhatsApp) sans exposition des secrets. Preuve : [technique/09-integrations.md](technique/09-integrations.md).
- **EF-062 — Modération des avis clients.** Workflow de statut (approuvé/rejeté) avec verrouillage empêchant un client de s'auto-approuver. Preuve : migration [20260910200000_review_moderation.sql](../supabase/migrations/20260910200000_review_moderation.sql).
- **EF-063 — Diffusion d'annonces en masse.** Envoi paginé à l'ensemble des comptes, avec modes preview/test/send et confirmation explicite requise. Preuve : [send-rebrand-announcement](../supabase/functions/send-rebrand-announcement).

### 4.7 Agences et partenaires (EF-070 à EF-079)

- **EF-070 — Espace agence.** Gestion autonome du catalogue de services propres (hôtels, activités, séjours, restaurants, artisans, bien-être) sous condition d'agence active. Preuve : [technique/05-routes-et-pages.md](technique/05-routes-et-pages.md) — `AgencyLayout`.
- **EF-071 — Candidature partenaire.** Formulaire public, avec upload de logo non authentifié (garde-fous : taille/format/nom aléatoire), traitement par un administrateur (approbation/rejet avec email automatique). Preuve : [technique/06-fonctions-serveur.md](technique/06-fonctions-serveur.md) §5.
- **EF-072 — Plans partenaires voitures.** Offres commerciales à plusieurs paliers pour les partenaires de location de voiture, avec taux de commission et quotas associés. Preuve : table `car_partner_plans`.

### 4.8 Entreprises / Business Travel (EF-080 à EF-089)

- **EF-080 — Création/adhésion à une entreprise.** Via code d'invitation, RPC dédiée `create_company`. Preuve : migration [20260910230000_create_companies.sql](../supabase/migrations/20260910230000_create_companies.sql).
- **EF-081 — Politique de voyage d'entreprise.** Table `travel_policies`, consultable par les membres, gérée par les administrateurs d'entreprise.
- **EF-082 — Workflow d'approbation.** Voir EF-033 — notification best-effort par SMS/WhatsApp à chaque étape (soumission, décision).

### 4.9 Marketplace de services locaux (EF-090 à EF-099)

- **EF-090 — Restaurants, artisans, bien-être/beauté.** Catalogue géré par les agences propriétaires (modèle identique à EF-070), réservation/commande par les clients, commission calculée automatiquement. Modules ajoutés entre le 2026-09-10 et le 2026-09-17 — les plus récents du dépôt. Preuve : migrations `20260910220000`, `20260910240000`, `20260917010000`, `20260917030000`.

### 4.10 Assistant IA (EF-100 à EF-109)

- **EF-100 — Conseiller de voyage IA.** Recommandations personnalisées (destination, intérêts, budget, durée) via Anthropic Claude, sans fallback fictif si le service est indisponible. Preuve : [ai-travel-advisor](../supabase/functions/ai-travel-advisor).
- **EF-101 — Chatbot conversationnel.** Assistant multi-tour intégré à l'UI ([ChatWidget.tsx](../src/components/ChatWidget.tsx)), même moteur IA, sans persistance de conversation constatée. Preuve : [travel-chatbot](../supabase/functions/travel-chatbot).

### 4.11 Abonnements (EF-110 à EF-119)

- **EF-110 — Souscription à un plan.** Plans et tarifs configurables par cycle de facturation, paiement via EF-030, activation automatique du statut à la confirmation du paiement (verrouillé contre auto-activation cliente). Preuve : tables `subscription_plans`, `subscription_pricing`, `user_subscriptions`.
- **EF-111 — Facturation par cycle.** Table `billing_periods` — ⚠️ aucun mécanisme de relance/renouvellement automatique identifié dans le code analysé (voir §7).

### 4.12 CMS / Contenu (EF-120 à EF-129)

- **EF-120 — Gestion de contenu de la page d'accueil et des sections de site.** 12 tables dédiées, lecture publique / écriture admin uniquement, incluant la configuration multi-sites Bossiz (CI/SN). Preuve : [technique/04-base-de-donnees.md](technique/04-base-de-donnees.md) §2.7.

### 4.13 Notifications et communications (EF-130 à EF-139)

- **EF-130 — Emails transactionnels.** Confirmations de réservation, factures, PNR, abonnement — via Resend ou SMTP générique selon configuration admin.
- **EF-131 — SMS et WhatsApp.** 4 fournisseurs possibles (Twilio, Orange, Sendexa, Africa's Talking), configuration centralisée.
- **EF-132 — Newsletter.** Inscription publique, envoi via le même pipeline email.

### 4.14 Mobile et PWA (EF-140 à EF-149)

- **EF-140 — Application installable (PWA).** Service worker, manifest, pages d'installation guidée dédiées par plateforme (Android/iOS).
- **EF-141 — Applications natives.** Empaquetage Capacitor du même code web pour Android et iOS ; build CI constaté uniquement en mode **debug** pour Android (pas de pipeline de signature/publication identifié).

## 5. Besoins non fonctionnels

### 5.1 Performance
- Lazy loading de toutes les routes (code splitting par page), compression gzip côté nginx, cache long (1 an) des assets hashés. Preuve : [technique/01-architecture.md](technique/01-architecture.md), [deploy-vps/nginx.conf](../deploy-vps/nginx.conf).
- Lighthouse CI configuré dans le pipeline qualité (mesure automatisée), mais **non bloquant** pour le déploiement (qui est manuel, voir §6).

### 5.2 Sécurité
- Signature cryptographique systématique des prix pour empêcher la falsification côté client (hôtels, voitures, vols).
- Row Level Security PostgreSQL sur la totalité des tables, complétée par des triggers de verrouillage de champs sensibles.
- **Points non conformes identifiés** (détail complet et priorisation dans [technique/11-securite.md](technique/11-securite.md)) : CORS non restreint sur l'ensemble des fonctions serveur, plusieurs endpoints sensibles sans authentification ni limitation de débit, une IDOR confirmée, des vulnérabilités de dépendances npm non corrigées. Ces écarts doivent être traités avant toute certification de sécurité ou audit externe formel.

### 5.3 Disponibilité
- Aucun objectif de disponibilité (SLA) formalisé n'a été trouvé dans le dépôt.
- Aucune redondance d'infrastructure constatée (un seul VPS, un seul conteneur nginx) — **point de défaillance unique** pour la couche de service statique. La base de données et l'authentification dépendent de la disponibilité de Supabase Cloud (hors contrôle direct du projet).
- Pas de monitoring actif ni d'alerting constaté (voir [technique/10-deploiement-exploitation.md](technique/10-deploiement-exploitation.md) §7) — une indisponibilité ne serait probablement détectée que par signalement utilisateur ou vérification manuelle.

### 5.4 Multilingue
- 3 langues supportées à parité de volume de traduction : français, anglais, chinois (2169 clés chacune, [src/i18n/locales/](../src/i18n/locales/)).
- Pas de détection automatique de langue par géolocalisation constatée (à vérifier dans le code d'initialisation i18next si besoin d'approfondissement).

### 5.5 PWA et mobile
- Voir EF-140/EF-141. Couverture mobile réelle limitée par l'absence de pipeline de build/signature de production identifié pour les stores (Google Play, App Store) — seul un APK debug est généré en CI.

### 5.6 Conformité aux données personnelles (Côte d'Ivoire — ARTCI, loi n°2013-450)
- **Droit à l'effacement implémenté** (EF-043), avec anonymisation plutôt que suppression physique des données transactionnelles — cohérent avec une obligation de conservation comptable, mais la durée précise de conservation légale n'est pas documentée dans le code.
- **Aucune mention explicite de déclaration ARTCI, de politique de confidentialité alignée sur la loi ivoirienne de protection des données personnelles, ni de registre de traitement n'a été trouvée dans le code** — une page `/privacy` (PrivacyPolicy.tsx) existe mais son contenu texte n'a pas été audité dans le cadre de cette documentation technique. **[déduction]** Une revue juridique dédiée de cette page et des pratiques de traitement de données (finalité, base légale, durée de conservation par table) est recommandée avant toute certification de conformité formelle.
- Logging : une charte de logging sécurisé existe ([SECURE_LOGGING_GUIDELINES.md](../SECURE_LOGGING_GUIDELINES.md)) interdisant explicitement la journalisation de données personnelles — bonne pratique déclarée, non vérifiée techniquement (voir [technique/10-deploiement-exploitation.md](technique/10-deploiement-exploitation.md) §6).

## 6. Contraintes techniques et intégrations

- **Stack imposée par le choix initial** : React/Vite/TypeScript + Supabase (PostgreSQL/Auth/Storage/Edge Functions Deno) — architecture BaaS sans serveur applicatif custom, détail en [technique/01-architecture.md](technique/01-architecture.md) et [02-stack-et-dependances.md](technique/02-stack-et-dependances.md).
- **Intégrations de paiement locales obligatoires** : CinetPay et Jèko, spécifiques au marché ouest-africain (pas de Stripe/PayPal constaté).
- **Multiplicité de fournisseurs de recherche voyage** (Amadeus, 8+ API RapidAPI, Travelpayouts) — dépendance à la disponibilité et aux quotas de nombreux tiers, sans fournisseur unique de repli identifié pour chaque type de recherche.
- **Hébergement VPS auto-géré** (pas de plateforme managée type Vercel/Netlify pour la production réelle), avec Caddy en reverse-proxy TLS non versionné dans ce dépôt.
- Détail complet des variables de configuration requises dans [technique/03-configuration.md](technique/03-configuration.md).

## 7. Exigences V2 — prévu ou nécessaire mais non réalisé

Cette section liste les besoins déduits comme **nécessaires à la maturité du produit** mais dont l'implémentation est absente, partielle, ou en contradiction interne dans le code actuel :

- **EF-V2-01 — Environnement Amadeus de production.** Le code de réservation de vol pointe actuellement vers l'environnement de test Amadeus (`create-pnr`, `search-flights`) — bloquant pour une mise en production réelle du flux vol avec émission de PNR.
- **EF-V2-02 — Renouvellement automatique des abonnements.** Aucun mécanisme de relance/facturation récurrente automatisée identifié malgré l'existence d'un scheduler `pg_cron` activé en base.
- **EF-V2-03 — Vraie génération de PDF.** Les documents de réservation (billets, factures) sont actuellement du HTML, pas des fichiers PDF binaires réels.
- **EF-V2-04 — QR code scannable pour billet d'avion.** Le QR actuel de `generate-flight-ticket` est un motif factice non exploitable pour un contrôle d'embarquement réel.
- **EF-V2-05 — Pipeline de build et signature d'application mobile de production.** Seul un APK Android debug est généré en CI ; aucun processus de publication sur les stores identifié.
- **EF-V2-06 — Déploiement automatisé avec porte de validation.** Le déploiement production est actuellement 100% manuel (voir [technique/10-deploiement-exploitation.md](technique/10-deploiement-exploitation.md)).
- **EF-V2-07 — Sauvegarde automatisée et testée de la base de données transactionnelle**, au-delà de ce que Supabase Cloud fournit nativement selon le plan souscrit (non vérifié).
- **EF-V2-08 — Monitoring applicatif et alerting de production.**
- **EF-V2-09 — Résolution des écarts de sécurité P0/P1** listés dans [technique/11-securite.md](technique/11-securite.md) (CORS, endpoints non authentifiés, IDOR, dépendances vulnérables).
- **EF-V2-10 — Resynchronisation du schéma TypeScript généré (`types.ts`)** avec l'état réel de la base de données (18 tables obsolètes encore présentes, 9 tables récentes manquantes).
- **EF-V2-11 — Décision produit sur le module Conciergerie/Majestic.** Le module a été supprimé de la base le 2026-08-05 ; un module de remplacement partiel (« Eden Circle », `luxe_properties`/`concierge_services`) existe mais son périmètre fonctionnel cible n'est pas documenté dans le code — à clarifier avec les parties prenantes produit.
- **EF-V2-12 — Politique cohérente sur les données de repli (fallback).** Certaines fonctions renvoient honnêtement une absence de résultat si un fournisseur externe est indisponible, d'autres génèrent des données fictives présentées comme réelles (`travel-recommendations` notamment) — à uniformiser.

## 8. Glossaire

| Terme | Définition |
|---|---|
| **BaaS** | Backend-as-a-Service — plateforme fournissant base de données, authentification, stockage et fonctions serveur sans gestion d'infrastructure dédiée (ici : Supabase) |
| **Edge Function** | Fonction serveur exécutée par Supabase, à la demande, en environnement Deno (équivalent d'un microservice serverless) |
| **RLS (Row Level Security)** | Mécanisme PostgreSQL restreignant l'accès aux lignes d'une table selon des règles définies au niveau base de données, indépendamment de l'application |
| **PNR** | Passenger Name Record — dossier de réservation officiel émis par un système de distribution de billets d'avion (GDS) |
| **GDS** | Global Distribution System — système central utilisé par les compagnies aériennes pour la distribution de billets (ici : Amadeus) |
| **HMAC** | Hash-based Message Authentication Code — mécanisme cryptographique utilisé ici pour signer les prix et vérifier l'authenticité des webhooks |
| **IDOR** | Insecure Direct Object Reference — faille de sécurité permettant d'accéder à une ressource d'un autre utilisateur en devinant/énumérant son identifiant |
| **RGPD** | Règlement Général sur la Protection des Données (cadre européen, cité ici par analogie/référence bien que le marché principal soit ivoirien) |
| **ARTCI** | Autorité de Régulation des Télécommunications/TIC de Côte d'Ivoire, en charge notamment de la protection des données personnelles |
| **PWA** | Progressive Web App — application web installable, avec fonctionnement partiellement hors-ligne via service worker |
| **Capacitor** | Framework permettant d'empaqueter une application web en application mobile native (Android/iOS) |
| **XOF** | Franc CFA (BCEAO) — devise de référence pour les calculs transactionnels de la plateforme |
| **Sub-agency (`sub_agency`)** | Rôle plateforme désignant une agence partenaire gérant son propre catalogue de services |
| **Business Travel** | Volet voyage d'affaires de la plateforme, avec gestion d'entreprise, politique de voyage et workflow d'approbation |
