# Évaluation financière — B-Reserve / Bossiz+ (app.bossiz.com)

> **Nature de ce document** : il s'agit d'une **estimation du coût de reconstruction technique** (« replacement cost » / coût à neuf) de la plateforme, construite bottom-up à partir de l'inventaire réel du code ([docs/technique/](technique/), [cahier-des-charges.md](cahier-des-charges.md), [etat-avancement.md](etat-avancement.md)). **Ce n'est pas une valorisation d'entreprise** (pas de DCF, pas de méthode par comparables, pas de projection de revenus, pas de valorisation de la marque, du portefeuille clients, des contrats partenaires ou de la donnée). Elle répond à une question précise : *combien coûterait-il de reconstruire ce qui existe, et combien coûtera-t-il de finaliser la plateforme à 100% ?* Toute estimation en jours-homme (j-h) est marquée **[déduction]** et doit être validée par un chiffrage d'ingénierie formel avant engagement contractuel.

## Méthodologie

1. **Découpage bottom-up par bloc fonctionnel/technique**, cohérent avec l'inventaire de [etat-avancement.md](etat-avancement.md), en s'appuyant sur des indicateurs objectifs et vérifiables : nombre de fonctions serveur, de pages, de tables, de migrations, de lignes de code par couche (métriques calculées en Phase 1 — voir historique de ce document).
2. **Estimation en jours-homme (j-h)** de l'effort qu'il faudrait à une équipe de développement conventionnelle (sans les outils de génération de code assistée par IA utilisés pour ce projet) pour reproduire, à qualité équivalente, chaque bloc.
   - ⚠️ **Ce projet a été développé à ~94% par un outil de génération de code par IA** (890 commits sur 944 attribués à `gpt-engineer-app[bot]`, 1 développeur humain en supervision/correction, sur une période d'environ 11 mois, 2025-10-27 → 2026-09-21). Le coût de reconstruction estimé ici est donc **supérieur** au coût historique réellement engagé — c'est la nature même d'une estimation « coût de remplacement conventionnel », standard en évaluation d'actifs technologiques, et pertinente pour un investisseur qui évalue ce qu'il faudrait dépenser pour reconstruire l'actif sans disposer du même outillage.
3. **Application de taux journaliers moyens (TJM)** à 3 niveaux de marché, pour couvrir différents scénarios de recrutement (équipe locale ivoirienne, équipe régionale/nearshore, équipe internationale) — voir §3.
4. **Conversion** en Franc CFA (XOF, devise de référence de la plateforme) et en Euro (parité fixe 1 EUR = 655,957 XOF).

## Partie A — Valorisation du travail déjà réalisé

### A.1 Détail par bloc

| Bloc | Effort estimé (j-h) | Preuves (volume constaté) |
|---|---|---|
| Recherche & agrégation multi-fournisseurs (vols, hôtels, voitures, trains, packages, destinations, autocomplétion, devises) | 35 – 50 | 12 fonctions serveur, agrégation jusqu'à 6 fournisseurs simultanés, validation Zod, signature de prix HMAC — [technique/06](technique/06-fonctions-serveur.md) §2 |
| Moteur de réservation (prebook, checkout, création, émission PNR, génération de documents) | 50 – 70 | 8 fonctions serveur, machine à états multi-statuts, recalcul serveur systématique du prix — [technique/08](technique/08-flux-critiques.md) |
| Paiement & intégrations CinetPay/Jèko (initiation, webhooks, remboursement, commissions) | 30 – 40 | 5 fonctions serveur, verrou atomique anti double-paiement, vérification de signature webhook — [technique/08](technique/08-flux-critiques.md) §3-4 |
| Comptes, authentification, OTP, conformité RGPD | 15 – 20 | Supabase Auth, hash OTP salé, anonymisation/droit à l'effacement — [cahier-des-charges](cahier-des-charges.md) §4.4 |
| Espace utilisateur (dashboard, historique, compte, alertes de prix, notifications push) | 15 – 20 | 6 pages dédiées, abonnements VAPID — [technique/05](technique/05-routes-et-pages.md) |
| Back-office administrateur | 40 – 55 | 23 pages, configuration des intégrations, modération des avis — [technique/05](technique/05-routes-et-pages.md) §2 |
| Espace agence, partenariats, plans commerciaux voitures | 20 – 25 | 9 pages agence, workflow de candidature partenaire, table de plans commerciaux — [cahier-des-charges](cahier-des-charges.md) §4.7 |
| Business Travel (entreprises, membres, politique de voyage, workflow d'approbation) | 15 – 20 | `companies`, `company_members`, `travel_policies`, fonction `review-booking-approval` — [cahier-des-charges](cahier-des-charges.md) §4.8 |
| Marketplace locale (restaurants, artisans, bien-être) | 20 – 25 | 3 sous-modules, catalogue + réservation/commande + commission — [cahier-des-charges](cahier-des-charges.md) §4.9 |
| Assistant IA (conseiller de voyage + chatbot) | 10 – 15 | 2 fonctions serveur, intégration Anthropic Claude, widget conversationnel — [technique/09](technique/09-integrations.md) §4 |
| Abonnements & facturation récurrente | 20 – 25 | Plans, tarification par cycle, `billing_periods`, verrouillage SQL des statuts — [cahier-des-charges](cahier-des-charges.md) §4.11 |
| CMS, contenu multi-sites (Bossiz CI/SN), configuration homepage | 25 – 30 | 12 tables, éditeur de contenu admin — [technique/04](technique/04-base-de-donnees.md) §2.7 |
| Notifications multi-canal (email/SMS/WhatsApp/push) | 20 – 25 | 6 fournisseurs intégrés (Resend, SMTP, Twilio, Orange, Sendexa, Africa's Talking) — [technique/09](technique/09-integrations.md) §3 |
| PWA & applications mobiles (Capacitor Android/iOS) | 10 – 15 | Service worker, manifest, empaquetage natif — [cahier-des-charges](cahier-des-charges.md) §4.14 |
| Modélisation base de données & sécurité RLS | 30 – 40 | 63+ tables actives, 74 migrations, policies RLS sur la quasi-totalité des tables, triggers de verrouillage de champs sensibles — [technique/04](technique/04-base-de-donnees.md) |
| Infrastructure & déploiement (Docker, nginx, CI/CD, scripts VPS) | 15 – 20 | Pipeline GitHub Actions (2 workflows), configuration nginx/CSP durcie, scripts de déploiement — [technique/10](technique/10-deploiement-exploitation.md) |
| Design system, internationalisation (3 langues), SEO | 20 – 25 | shadcn/ui + Tailwind, 2169 clés de traduction ×3 langues, meta-tags par page — [technique/02](technique/02-stack-et-dependances.md) |
| **Total** | **≈ 390 – 520 j-h** | |

**Note de cadrage** : un module a été développé puis intégralement retiré de la base de données (conciergerie « Majestic », supprimée le 2026-08-05 — voir [technique/04](technique/04-base-de-donnees.md) §2.5). L'effort correspondant (**estimé 15-20 j-h [déduction]**) constitue un **investissement non valorisable dans le produit actuel** et n'est pas comptabilisé dans le total ci-dessus.

### A.2 Volume de code sous-jacent (vérification de cohérence)

| Couche | Lignes de code | Fichiers |
|---|---|---|
| Frontend (React/TypeScript) | 76 383 | 374 (276 pages/composants .tsx + 98 .ts) |
| Fonctions serveur (Deno/TypeScript) | 15 597 | 72 (60 fonctions + 12 modules partagés) |
| Migrations SQL | 6 452 | 74 |
| **Total** | **98 432 lignes** | **520 fichiers** |

96 pages, 172 composants, 50 hooks personnalisés, 108 routes, 63+ tables actives, 3 langues à parité de traduction.

### A.3 Valorisation selon 3 scénarios de taux journalier moyen (TJM)

| Scénario | TJM retenu | Justification |
|---|---|---|
| **A — Marché local (Abidjan)** | 120 000 XOF/j (≈ 183 EUR) | Développeur senior full-stack, freelance/agence locale |
| **B — Régional / nearshore** | 250 000 XOF/j (≈ 381 EUR) | Équipe outsourcée régionale (Afrique de l'Ouest/Maghreb) ou agence structurée |
| **C — International (référence Europe)** | 450 000 XOF/j (≈ 686 EUR) | Benchmark agence web/mobile en Europe francophone |

| Scénario | Valorisation basse (390 j-h) | Valorisation haute (520 j-h) |
|---|---|---|
| **A — Local** | 46 800 000 XOF (≈ 71 300 EUR) | 62 400 000 XOF (≈ 95 100 EUR) |
| **B — Régional** | 97 500 000 XOF (≈ 148 600 EUR) | 130 000 000 XOF (≈ 198 200 EUR) |
| **C — International** | 175 500 000 XOF (≈ 267 500 EUR) | 234 000 000 XOF (≈ 356 700 EUR) |

## Partie B — Coût pour atteindre 100% de fonctionnalité

### B.1 Détail — reprise du tableau de dette technique et modules incomplets

Reprise intégrale des estimations j-h établies module par module dans [etat-avancement.md](etat-avancement.md) (méthode, preuves et détail de ce qui manque disponibles dans ce document — non reproduits ici pour éviter la duplication) :

| Catégorie | Effort estimé (j-h) |
|---|---|
| Modules produit incomplets (recherche trains, packages, réservation vol/PNR, remboursement, génération de documents, alertes prix, Business Travel, marketplace locale, IA, abonnements) | **≈ 78 – 120** |
| Application mobile — pipeline de build/signature de production | 10 – 20 |
| Déploiement / CI-CD — automatisation avec porte de validation | 10 – 15 |
| Sauvegardes — mécanisme automatisé et testé | 8 – 12 |
| Monitoring / alerting — mise en place | 10 – 15 |
| Sécurité — correctifs P0/P1 (voir [technique/11](technique/11-securite.md)) | 20 – 30 |
| Ajustements mineurs (back-office, intégrations, comptes, CMS, notifications — maintenance/finitions) | ≈ 9 – 14 |
| **Total** | **≈ 145 – 226 j-h** |

*(Détail exhaustif ligne par ligne — 30 modules — disponible dans le tableau de [etat-avancement.md](etat-avancement.md) ; les catégories ci-dessus en sont un regroupement pour la lecture financière. Léger chevauchement possible entre la ligne « Sécurité P0/P1 » et certains correctifs déjà comptés dans les modules concernés — de l'ordre de 1 à 2 j-h, non matériel à l'échelle du total.)*

**Le module « Conciergerie / Majestic »** est exclu de ce total : sa remise en service dépend d'une **décision produit préalable** (relancer le module supprimé, poursuivre son remplacement partiel « Eden Circle », ou l'abandonner définitivement) — non chiffrable tant que cette décision n'est pas prise. Si la décision est de reconstruire un module de conciergerie complet, prévoir **15 à 30 j-h [déduction]** supplémentaires selon le périmètre retenu.

### B.2 Coût de complétion selon les 3 scénarios de TJM

| Scénario | Coût bas (145 j-h) | Coût haut (226 j-h) |
|---|---|---|
| **A — Local** | 17 400 000 XOF (≈ 26 500 EUR) | 27 120 000 XOF (≈ 41 300 EUR) |
| **B — Régional** | 36 250 000 XOF (≈ 55 300 EUR) | 56 500 000 XOF (≈ 86 100 EUR) |
| **C — International** | 65 250 000 XOF (≈ 99 500 EUR) | 101 700 000 XOF (≈ 155 000 EUR) |

**Équivalent en durée d'équipe** (146-226 j-h) : environ **2 à 3,5 mois** avec une équipe de 3 développeurs à temps plein, ou **7 à 11 mois** en développeur unique — ordres de grandeur à ajuster selon la disponibilité réelle et le degré de parallélisation possible entre modules indépendants (recherche, sécurité, infrastructure peuvent avancer en parallèle).

## Partie C — Synthèse financière globale

| | Scénario A (Local) | Scénario B (Régional) | Scénario C (International) |
|---|---|---|---|
| **Valeur du travail déjà réalisé** | 46,8 – 62,4 M XOF (71 300 – 95 100 EUR) | 97,5 – 130 M XOF (148 600 – 198 200 EUR) | 175,5 – 234 M XOF (267 500 – 356 700 EUR) |
| **Investissement restant pour 100%** | 17,4 – 27,1 M XOF (26 500 – 41 300 EUR) | 36,3 – 56,5 M XOF (55 300 – 86 100 EUR) | 65,3 – 101,7 M XOF (99 500 – 155 000 EUR) |
| **Valeur totale plateforme à 100%** | **64,2 – 89,5 M XOF (97 800 – 136 400 EUR)** | **133,8 – 186,5 M XOF (203 900 – 284 300 EUR)** | **240,8 – 335,7 M XOF (367 000 – 511 700 EUR)** |

**Lecture recommandée pour une levée de fonds** : le scénario **B (régional/nearshore)** offre généralement le point de référence le plus crédible pour un investisseur international évaluant un projet basé en Côte d'Ivoire avec une ambition de croissance régionale — le scénario A reflète le coût réel de recrutement local, le scénario C sert de borne haute de comparaison avec le marché européen.

## Limites de cette évaluation

- Cette estimation **ne couvre que le coût de reconstruction technique**. Elle n'intègre pas : la valeur de la marque Bossiz+, le portefeuille de partenaires/agences déjà signés, les données utilisateurs et l'historique de réservations, la position de marché, ni aucune projection de revenus futurs — éléments indispensables à une valorisation d'entreprise complète (à établir séparément, par exemple via une méthode DCF ou par comparables sectoriels, hors périmètre de cette analyse technique).
- Les estimations en j-h sont des **ordres de grandeur déduits de la complexité du code**, pas un chiffrage négocié avec une équipe d'ingénierie réelle — à affiner par des devis effectifs avant tout engagement budgétaire.
- Les TJM utilisés sont des repères de marché généraux, non issus d'une étude de rémunération formelle actualisée — à ajuster selon les conditions de recrutement réelles au moment de l'engagement.
- Le fait que ~94% du code ait été produit par un outil d'IA générative signifie que le **coût historique réellement dépensé pour construire cette version de la plateforme est probablement inférieur** aux montants de la Partie A — cette partie répond à la question « combien coûterait-il de reconstruire ceci conventionnellement », pas « combien a coûté sa construction réelle ».
- Les 12 constats de sécurité de criticité Critique/Élevée détaillés dans [technique/11-securite.md](technique/11-securite.md) représentent un **risque financier contingent** (fraude, abus de coût API, incident de conformité) non chiffré ici en valeur d'exposition — seul le coût de leur correction est inclus (Partie B).
