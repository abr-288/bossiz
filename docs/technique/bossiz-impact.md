# Bossiz Impact et Bossiz Smiles

Campagne « Ensemble pour la croissance de Bossiz » : les Membres Impact soutiennent le développement de Bossiz par une
contribution volontaire et reçoivent des avantages commerciaux gérés par le programme de fidélité Bossiz Smiles.

- **Bossiz Impact** collecte (campagnes, formules, contributions, paiements).
- **Bossiz Smiles** récompense (points de fidélité existants + avantages attribués). Les Smiles ne sont ni de l'argent,
  ni un solde retirable, ni convertibles en espèces.

## Parcours

1. `/bossiz-impact` : page publique (objectif, montant confirmé, membres, formules, avantages, FAQ, conditions).
2. « Je contribue » : formule ou montant libre, nom, téléphone, acceptation des conditions.
3. `impact_start_contribution()` crée la contribution `pending` (montant, formule, plafonds, conditions vérifiés ; copie
   des conditions de la formule dans `offer_snapshot`).
4. `process-payment` (cible `impactContributionId`) relit le montant en base, réserve la contribution (`processing`) et
   crée le lien de paiement Jèko. Le client paie sur la page Jèko (opérateur au choix).
5. `jeko-webhook` vérifie la signature HMAC, le montant et la devise, puis `postPaymentSuccess` appelle
   `impact_confirm_contribution()` (service_role uniquement) : contribution `paid`, référence membre `MI-xxxxx`, avantages
   attribués et Smiles crédités **une seule fois** (verrou + contraintes d'unicité). E-mail de confirmation.
6. `/mon-impact` : statut suivi en direct jusqu'à la confirmation, avantages, conditions, expirations, historique.

Aucun écran ne présente une contribution comme réussie avant la confirmation du prestataire. Les montants publics et les
totaux ne comptent que les contributions `paid` (non remboursées).

## Administration (`/admin/impact`)

- **Vue d'ensemble** : objectif, confirmé, en attente, remboursé, membres, réussites/échecs, répartition par formule et par
  moyen de paiement, évolution, engagements restants (avantages ouverts, plafonds, Smiles attribués).
- **Campagne** : statut (brouillon / active / suspendue / terminée), dates, objectif, montants, présentation, utilisation
  des fonds, étapes, FAQ, moyens de paiement réellement activés, entité, contact, conditions (avec version).
- **Formules et avantages** : montants, Smiles, validité, disponibilité, plafond de membres, conditions ; avantages
  (type, valeur, plafond, utilisations, services, cumul, exclusions). Une formule ou un avantage déjà utilisé ne peut pas
  être supprimé : le désactiver.
- **Services éligibles** : tous désactivés au départ, à activer un par un.
- **Membres** : recherche, vérification d'éligibilité, application d'un avantage à une commande (plafond, service,
  utilisations restantes et unicité par commande vérifiés côté serveur), annulation d'une utilisation, retrait d'un
  avantage (motif obligatoire).
- **Transactions** : filtres, détail prestataire, enregistrement d'un remboursement.
- **Rapports et journal** : exports CSV (contributions, remboursements, membres, avantages, mouvements de Smiles) et
  journal d'audit.

Aucune action admin ne permet de marquer une contribution payée : seule la confirmation vérifiée du prestataire le fait.

## Remboursement

Le remboursement n'est **pas** déclenché depuis Bossiz : il est effectué chez le prestataire (tableau de bord Jèko), puis
enregistré dans `/admin/impact` avec sa référence et son motif. L'enregistrement :

- passe la contribution en `refunded` (déduite des totaux) ;
- retire les avantages encore attribués ;
- débite par écriture corrective (`impact_reversal`) les Smiles Impact encore disponibles ;
- signale les Smiles et avantages déjà utilisés, à traiter selon les conditions du programme.

## Données et sécurité

Migration `supabase/migrations/20261029000000_bossiz_impact.sql` (non destructive, rejouable).

- Tables : `impact_campaigns`, `impact_offers`, `impact_benefits`, `impact_eligible_services`, `impact_members`,
  `impact_contributions`, `impact_member_benefits`, `impact_benefit_uses`, `impact_audit_log` ;
  `payments.impact_contribution_id` ; `loyalty_transactions.expires_at`.
- RLS : chacun ne lit que ses données ; aucune écriture directe sur les contributions, attributions et utilisations
  (fonctions `SECURITY DEFINER` uniquement) ; configuration réservée aux admins ; page publique agrégée sans donnée
  personnelle.
- Historique : clés étrangères `RESTRICT`, suppression d'un compte → `SET NULL` (l'historique financier reste), corrections
  par écritures inverses, audit des modifications de configuration et des opérations.
- Smiles : nouveaux mouvements `impact` (avec date d'expiration propre, 24 mois par défaut) et `impact_reversal`.
  L'expiration quotidienne existante tient compte de ces dates ; les Smiles Impact ne font pas monter de niveau.
- Limitation : 5 contributions initiées par compte et par 10 minutes ; tentatives non payées expirées après 24 h (tâche
  `impact-expire-contributions`, toutes les heures).

Tests exécutés sur PGlite (scénarios fonctionnels et de sécurité : faux paiement, montant hors règles, webhook rejoué,
accès croisés, double utilisation, remboursement, expiration, non-régression des Smiles) et tests unitaires Vitest.

## Mise en préproduction

1. SQL Editor : exécuter `20261029000000_bossiz_impact.sql` (après les migrations précédentes).
2. Déployer les fonctions `process-payment`, `jeko-webhook` et celles qui utilisent `postPaymentSuccess`
   (`create-booking`, `create-hotel-booking`, `generate-invoice`, `payment-callback`, `send-event-order-emails`,
   `send-hotel-booking-emails`).
3. Déployer le site.
4. Dans `/admin/impact` (campagne en brouillon, invisible) : compléter conditions, entité, formules, Smiles, avantages,
   services, moyens de paiement réellement activés ; vérifier avec « Aperçu ».
5. Tester avec un petit montant réel sur un compte de test, puis vérifier la confirmation, l'e-mail, `/mon-impact` et le
   tableau de bord.
6. Passer la campagne en « Active ».

Aucune nouvelle variable d'environnement : identifiants Jèko (Admin > Intégrations), `SITE_URL` et fournisseur d'e-mail
existants.

## À valider avant le lancement

- **Juridique** : qualification de la collecte (contribution volontaire avec contreparties commerciales, sans rendement
  ni participation) au regard des règles applicables en Côte d'Ivoire et dans l'UEMOA (appel public à l'épargne,
  financement participatif, monnaie électronique) ; conditions générales du programme ; règles de remboursement et de
  réclamation ; mentions sur les données personnelles (ARTCI).
- **Comptable** : traitement des contributions et des avantages promis (engagements), définition du « net collecté ».
- **Direction** : formules définitives, nombre de Smiles et valeur d'utilisation (réglages Smiles existants), avantages,
  services éligibles, dates.
- **Prestataire** : opérateurs effectivement activés sur le compte Jèko ; procédure de remboursement Jèko.

## Limites connues

- La vérification du statut d'une transaction à la demande n'est pas disponible dans l'intégration Jèko actuelle : la
  confirmation repose sur le webhook signé (montant et devise contrôlés).
- Les avantages sont appliqués par l'équipe Bossiz depuis l'admin (vérification serveur), pas automatiquement au paiement
  d'une réservation. Les Smiles, eux, s'utilisent déjà au paiement via le programme Smiles existant.
- Remboursement total uniquement.
