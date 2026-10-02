# Documentation B-Reserve / Bossiz+ (app.bossiz.com)

> Documentation technique, cahier des charges reconstitué et état d'avancement, produits par rétro-ingénierie du code source du dépôt `traversee-connect`, en 2026-09. Méthode et règles de rédaction détaillées dans chaque document (distinction systématique entre ce qui est **constaté** dans le code, avec référence de fichier, et ce qui est **déduit**).

## Sommaire

### Documentation technique ([technique/](technique/))

1. [Architecture générale](technique/01-architecture.md) — vue d'ensemble, diagramme des composants, flux de données, frontières de responsabilité
2. [Stack et dépendances](technique/02-stack-et-dependances.md) — langages, frameworks, licences, services tiers
3. [Configuration](technique/03-configuration.md) — matrice des variables d'environnement (noms et rôles, sans valeurs)
4. [Base de données](technique/04-base-de-donnees.md) — schéma complet, ERD, RLS, historique des 74 migrations
5. [Routes et pages](technique/05-routes-et-pages.md) — 108 routes, gardes d'accès, anomalies constatées
6. [Fonctions serveur](technique/06-fonctions-serveur.md) — 60 Edge Functions détaillées (entrées, autorisation, effets de bord)
7. [Rôles et permissions](technique/07-roles-permissions.md) — matrice utilisateur / agence / entreprise / admin
8. [Flux critiques](technique/08-flux-critiques.md) — réservation, paiement, webhooks, remboursement, abonnement, machine à états
9. [Intégrations](technique/09-integrations.md) — CinetPay, Jèko, SMS, WhatsApp, e-mails, IA, PDF
10. [Déploiement et exploitation](technique/10-deploiement-exploitation.md) — build, déploiement VPS, CI/CD, sauvegardes, monitoring (manques signalés)
11. [Sécurité](technique/11-securite.md) — constats classés par criticité (Critique/Élevée/Moyenne/Faible)

### Documents de synthèse

- [Cahier des charges reconstitué](cahier-des-charges.md) — contexte, objectifs, acteurs, besoins fonctionnels (EF-xxx) et non fonctionnels, exigences V2, glossaire
- [État d'avancement](etat-avancement.md) — statut par module, complexité restante, estimation en jours-homme, dette technique priorisée P0/P1/P2
- [Évaluation financière](evaluation-financiere.md) — valorisation du travail déjà réalisé et coût de complétion à 100%, en XOF/EUR, selon 3 scénarios de taux journalier — **document de référence pour le chiffrage d'une levée de fonds**

### Export

- [export/](export/) — versions .docx, si générées (voir note ci-dessous)

## Constats transversaux les plus importants

- Le module de conciergerie **« Majestic »** a été supprimé de la base de données le 2026-08-05 mais reste présent dans le fichier de types générés (`types.ts`), ce qui désynchronise la documentation apparente du code frontend et l'état réel de la base — corrigé dans cette documentation, à corriger aussi dans le code (régénération des types).
- Le déploiement de production (confirmé par le porteur du projet) passe par un script manuel ciblant un VPS ([deploy-vps/](../deploy-vps/)) — les configurations Docker/Netlify/FTP présentes ailleurs dans le dépôt ne sont **pas** utilisées en production actuelle.
- Un audit de sécurité détaillé ([technique/11-securite.md](technique/11-securite.md)) identifie plusieurs constats de criticité élevée à traiter avant une prochaine mise en production ou une diligence technique externe — voir aussi la dette technique priorisée dans [etat-avancement.md](etat-avancement.md).

## Portée et limites de cette documentation

- Produite par lecture exhaustive du code source (frontend, 72 Edge Functions, 74 migrations SQL, configuration de déploiement) au 2026-09-23.
- Aucune valeur de secret, clé API ou mot de passe n'est reproduite dans ces documents — uniquement les noms de variables et leur rôle.
- Cette documentation ne remplace pas un audit de sécurité externe formel ni une revue juridique de conformité — elle en pose les bases factuelles.
