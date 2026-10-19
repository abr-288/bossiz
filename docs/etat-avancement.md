# État d'avancement — B-Reserve / Bossiz+

> Document destiné à informer le chiffrage d'une levée de fonds. Statuts et estimations établis à partir de l'analyse du code réel (voir [docs/technique/](technique/) et [cahier-des-charges.md](cahier-des-charges.md)) au 2026-09-23. Les estimations en jours-homme sont des ordres de grandeur **[déduction]** basés sur la complexité du code existant et le volume de travail restant identifié, pas un chiffrage d'ingénierie formel négocié avec une équipe.

## Légende
- **Statut** : Terminé (fonctionnel de bout en bout, testé manuellement au niveau code) / Partiel (fonctionne mais avec limitations ou incohérences significatives) / Absent (non implémenté ou supprimé)
- **Complexité restante** : Faible (< 3 j-h) / Moyenne (3-15 j-h) / Élevée (> 15 j-h)

## Tableau par module

| Module | Statut | Preuves | Ce qui manque | Complexité restante | Estimation (j-h) |
|---|---|---|---|---|---|
| **Recherche vols** | Partiel | [search-flights](../supabase/functions/search-flights), 5 fournisseurs agrégés | Environnement Amadeus en mode test (pas prod), code mort (`searchFlightFare` jamais appelé), pas de rate limit sur l'IA associée | Moyenne | 5-8 |
| **Recherche hôtels** | Terminé | [search-hotels](../supabase/functions/search-hotels), 6 fournisseurs + partenaires, prix signés | — | Faible | 1-2 (maintenance) |
| **Recherche voitures** | Terminé | [car-rental](../supabase/functions/car-rental), partenaires internes uniquement, prix signés | Couverture limitée aux seules annonces partenaires (choix produit assumé, pas un manque technique) | Faible | 1-2 |
| **Recherche trains** | Partiel | [search-trains](../supabase/functions/search-trains) | Couverture géographique limitée à Inde/France ; pas de signature de prix (contrairement aux autres recherches) | Moyenne | 5-10 (extension couverture) |
| **Packages vol+hôtel** | Partiel | [search-flight-hotel-packages](../supabase/functions/search-flight-hotel-packages) | Aucun markup ni signature de prix appliqués — intégrité de prix non garantie au moment de la réservation | Moyenne | 3-5 |
| **Réservation vol (prebook/checkout/booking/PNR)** | Partiel | [prebook](../supabase/functions/prebook), [checkout](../supabase/functions/checkout), [create-booking](../supabase/functions/create-booking), [create-pnr](../supabase/functions/create-pnr) | Vérification de disponibilité simulée (pas de vrai appel temps réel), environnement Amadeus test | Élevée | 15-25 |
| **Réservation hôtel/voiture/activité** | Terminé | [create-booking](../supabase/functions/create-booking), recalcul serveur systématique du prix | — | Faible | 1-3 |
| **Paiement (CinetPay/Jèko)** | Terminé | [process-payment](../supabase/functions/process-payment), verrou atomique anti double-paiement | Signature webhook CinetPay absente (mitigée par re-vérification serveur) | Faible | 2-4 |
| **Remboursement** | Partiel | [refund-payment](../supabase/functions/refund-payment) | API CinetPay refund jamais testée en conditions réelles selon le code lui-même | Moyenne | 3-6 (tests + validation sandbox) |
| **Génération de documents (billets/factures)** | Partiel | [06-fonctions-serveur.md](technique/06-fonctions-serveur.md) §4 | Pas de vrai PDF binaire (HTML seulement), QR code de billet d'avion non scannable, IDOR sur reçu d'abonnement | Moyenne | 8-12 |
| **Comptes / authentification / OTP** | Terminé | Supabase Auth, [send-otp](../supabase/functions/send-otp), [send-password-reset](../supabase/functions/send-password-reset) | — | Faible | 1-2 |
| **Droit à l'effacement (RGPD)** | Terminé | [delete-account](../supabase/functions/delete-account) | Revue juridique de la durée de conservation non constatée dans le code | Faible | 2-3 (juridique, pas technique) |
| **Espace utilisateur (dashboard, historique, compte)** | Terminé | [technique/05-routes-et-pages.md](technique/05-routes-et-pages.md) | — | Faible | 1-2 |
| **Alertes de prix** | Partiel | [check-price-alerts](../supabase/functions/check-price-alerts) | Aucun contrôle d'accès applicatif sur la fonction de vérification (dépend de la config plateforme) | Faible | 2-3 |
| **Back-office administrateur** | Partiel | 23 pages [src/pages/admin/](../src/pages/admin/) | 2 pages sans garde d'accès frontend (`/admin/users-list`, `/admin/content`) | Faible | 1-2 |
| **Gestion des intégrations (admin)** | Terminé | [AdminIntegrations.tsx](../src/pages/admin/AdminIntegrations.tsx), table `integration_credentials` | — | Faible | 1-2 |
| **Modération des avis** | Terminé | migration [20260910200000](../supabase/migrations/20260910200000_review_moderation.sql) | — | Faible | — |
| **Espace agence** | Terminé | [technique/05-routes-et-pages.md](technique/05-routes-et-pages.md), `AgencyLayout` | — | Faible | 1-2 |
| **Candidature et gestion partenaires** | Terminé | [technique/06-fonctions-serveur.md](technique/06-fonctions-serveur.md) §5 | — | Faible | 1-2 |
| **Plans partenaires voitures** | Terminé | table `car_partner_plans` | — | Faible | — |
| **Entreprises / Business Travel** | Partiel | `companies`, `company_members`, `travel_policies` (créées 2026-09-10/11, très récent) | Module jeune, pas de multi-entreprise réellement supporté malgré un modèle de données qui l'autoriserait en théorie ([useCompany.ts](../src/hooks/useCompany.ts) ne prend que la 1ʳᵉ adhésion) | Moyenne | 8-15 |
| **Marketplace locale (restaurants, artisans, bien-être)** | Partiel | migrations `20260910220000` à `20260917030000` (module le plus récent du dépôt, développé jusqu'au 2026-09-17) | Modules très jeunes (moins de 2 semaines d'existence au moment de l'audit) — maturité fonctionnelle et tests utilisateurs probablement limités | Moyenne | 10-20 (durcissement + tests) |
| **Assistant IA (conseiller + chatbot)** | Partiel | [ai-travel-advisor](../supabase/functions/ai-travel-advisor), [travel-chatbot](../supabase/functions/travel-chatbot) | Aucune authentification ni rate limiting — exposition à un abus de coût API | Faible | 2-4 |
| **Abonnements** | Partiel | `subscription_plans`, `user_subscriptions`, `billing_periods` | Aucun renouvellement/relance automatique identifié malgré `pg_cron` activé en base | Élevée | 10-15 |
| **CMS / contenu du site** | Terminé | 12 tables, [technique/04-base-de-donnees.md](technique/04-base-de-donnees.md) §2.7 | — | Faible | 1-2 |
| **Notifications (email/SMS/WhatsApp/push)** | Terminé | [technique/09-integrations.md](technique/09-integrations.md) | Cohérence de validation d'entrée à renforcer sur certains formulaires publics | Faible | 2-3 |
| **PWA** | Terminé | `vite-plugin-pwa`, service worker, pages d'installation | — | Faible | — |
| **Application mobile native (Android/iOS)** | Partiel | Capacitor configuré, build APK **debug** en CI | Pas de pipeline de build/signature de production ni de publication sur les stores identifié | Élevée | 10-20 (setup CI release + procédures store) |
| **Conciergerie / Majestic** | Absent | module supprimé de la base le [2026-08-05](../supabase/migrations/20260805000000_drop_majestic_club.sql) | Remplacement partiel « Eden Circle » (`luxe_properties`) au périmètre fonctionnel non clarifié | Élevée | à définir selon décision produit |
| **Déploiement / CI-CD** | Partiel | [technique/10-deploiement-exploitation.md](technique/10-deploiement-exploitation.md) | Déploiement production 100% manuel, jobs de déploiement CI non implémentés (stubs), flag de test incompatible (Jest sur Vitest) | Élevée | 10-15 |
| **Sauvegardes** | Absent (applicatif) | script manuel partiel limité au module Majestic (supprimé) | Aucun mécanisme de sauvegarde automatisée et testée de l'ensemble des données transactionnelles constaté dans le code | Élevée | 8-12 |
| **Monitoring / alerting** | Absent | recherche exhaustive sans résultat (Sentry, Datadog, etc.) | Suivi d'erreurs production, APM, alerting sur incident | Élevée | 10-15 |
| **Sécurité — écarts identifiés (P0/P1)** | Partiel | [technique/11-securite.md](technique/11-securite.md) | Voir synthèse dette technique ci-dessous | Élevée | 20-30 (ensemble des correctifs P0/P1) |

## Synthèse des risques techniques

1. **Risque de disponibilité — point de défaillance unique.** L'infrastructure de production repose sur un seul VPS et un seul conteneur nginx, sans redondance ni monitoring actif. Une panne matérielle ou un incident de déploiement non détecté immédiatement impacterait l'ensemble du trafic sans alerte automatique.
2. **Risque financier — remboursement non validé.** L'intégration de remboursement CinetPay n'a, selon le code lui-même, jamais été testée en conditions réelles. Un incident de remboursement en production (client non remboursé après une transaction confirmée) constitue un risque réputationnel et potentiellement réglementaire direct.
3. **Risque de sécurité — surface d'exposition large.** CORS non restreint sur 72 fonctions serveur, plusieurs endpoints sensibles (SMS, génération de documents, vérification d'alertes de prix) sans authentification applicative, une IDOR confirmée sur les reçus d'abonnement. Combinés, ces éléments représentent une exposition à l'abus (coût, fuite de données limitée) qui devrait être investiguée en priorité par un audit de sécurité externe avant toute levée de fonds ou passage à l'échelle.
4. **Risque de dépendance à un environnement de test en production.** Le flux de réservation de vol avec émission de PNR utilise l'environnement de test Amadeus — un déploiement en l'état ne permettrait pas d'émettre de vrais billets, ce qui est un **bloquant produit**, pas seulement technique.
5. **Risque de dérive du schéma de données.** Le fichier de types générés (`types.ts`) n'est plus synchronisé avec la base réelle (18 tables obsolètes encore référencées, 9 tables récentes absentes) — source d'erreurs de développement futures si non corrigé rapidement (les développeurs peuvent coder contre un schéma qui n'existe plus, ou ignorer des tables réelles).
6. **Risque de continuité — absence de sauvegarde applicative vérifiée.** Bien que Supabase Cloud propose des sauvegardes selon le plan souscrit, aucune vérification ni procédure de restauration documentée n'a été trouvée dans le dépôt — un incident de perte de données ne serait couvert que par la garantie du fournisseur cloud, non testée par l'équipe elle-même.
7. **Risque de maturité produit sur les modules récents.** Les modules Business Travel et marketplace locale (restaurants/artisans/bien-être) ont moins de deux semaines d'existence au moment de cet audit — probabilité plus élevée de bugs non découverts et de règles métier incomplètes que sur les modules plus anciens et éprouvés (vols, hôtels, paiement).

## Dette technique priorisée

### P0 — à traiter avant toute prochaine mise en production ou levée de fonds
- Restreindre le CORS (`Access-Control-Allow-Origin`) au domaine de production sur l'ensemble des Edge Functions.
- Sécuriser `send-sms` (authentification + rate limiting) — risque de fraude directe.
- Ajouter une garde d'accès (`AdminLayout`) aux pages `/admin/users-list` et `/admin/content`.
- Corriger l'IDOR sur `generate-subscription-receipt`.
- Corriger la policy de stockage `site-assets` (vérification de rôle manquante malgré le nommage).
- Traiter les 2 vulnérabilités npm critiques (`tar`, `vitest`) et vérifier l'exposition réelle de la vulnérabilité `react-router-dom` en production.
- Basculer l'intégration Amadeus vers l'environnement de production (bloquant fonctionnel pour la vente réelle de billets).

### P1 — à traiter à court/moyen terme
- Ajouter un rate limiting sur `check-price-alerts`, `ai-travel-advisor`, `travel-chatbot`, `create-booking`, `newsletter-subscribe`, `send-contact-message`, `send-support-email`.
- Vérifier et documenter la configuration `verify_jwt` de chaque fonction directement sur le dashboard Supabase.
- Régénérer `types.ts` pour resynchroniser le typage frontend avec le schéma réel de la base.
- Supprimer ou archiver les fichiers de déploiement non utilisés (Dockerfile racine, docker-compose.yml racine, config FTP) pour éviter toute confusion opérationnelle.
- Tester en sandbox le remboursement CinetPay avant de considérer ce flux comme fiable.
- Mettre en place un monitoring applicatif minimal (suivi d'erreurs production) et une alerte de disponibilité basique.
- Corriger le flag `--watchAll` incompatible Vitest dans le pipeline CI de qualité de code.
- Purger l'historique Git de l'ancien fichier `.env` commité (si le dépôt doit devenir public ou être partagé largement).

### P2 — améliorations de fond, non bloquantes
- Uniformiser la politique de « pas de données fictives » sur l'ensemble des fonctions de recherche (actuellement incohérente entre fonctions).
- Corriger le bug de re-lecture de `req.json()` dans les blocs `catch` (`airport-info`, `get-weather`).
- Renforcer `sanitizeString` (protection XSS actuellement partielle, ne filtre que `<`/`>`).
- Unifier `validation.ts` et `zodValidation.ts` (doublons partiels, schéma `paymentProcessSchema` orphelin).
- Implémenter la génération de vrais fichiers PDF binaires et un QR code scannable pour le billet d'avion.
- Clarifier le périmètre produit du module « Eden Circle » en remplacement de la conciergerie Majestic supprimée.
- Mettre en place un pipeline de build/signature mobile de production et une stratégie de renouvellement automatique des abonnements.
