# Audit de l'assistante virtuelle (chat) — app.bossiz.com

*Audit réalisé le 15 octobre 2026 sur le code de la branche `prod` (commit `b5a88c2`) et sur les données publiques de la base de production. Aucune modification n'a été faite pour cet audit.*

Légende : ✅ présent et correct · ⚠️ partiel ou à améliorer · ❌ absent

---

## Résumé

L'assistante actuelle est un **chat IA généraliste de conseil voyage**. Elle converse correctement, ne dévoile aucune donnée et sa clé API est bien protégée. En revanche, elle **ne remplit aucun des deux rôles demandés** :

- **Support client** : elle ne connaît ni le parcours de réservation et de paiement, ni les statuts, ni les politiques. Elle ne voit pas les réservations du client et ne peut pas passer la main à un humain.
- **Conciergerie** : elle ignore les services de la Conciergerie Bossiz (Côte d'Ivoire et Sénégal), ses formules et ses conditions.

L'audit relève aussi des **coordonnées fictives affichées aux clients** et des **données de test visibles dans le catalogue public**. Ces problèmes dépassent le chat, mais l'assistante ne peut pas orienter correctement les clients tant qu'ils ne sont pas corrigés.

**Question de positionnement à trancher.** Le brief présente le site comme « Conciergerie Bossiz, Abidjan ». Le code est plus large : **Bossiz+** est une plateforme de réservation (vols, hôtels, voitures, activités, restaurants…) en Côte d'Ivoire et au Sénégal, et la **Conciergerie Bossiz** n'en est qu'une partie (`/bossiz-conciergerie-ci`, `/bossiz-conciergerie-sn`). L'assistante doit-elle couvrir toute la plateforme, ou seulement la conciergerie d'Abidjan ?

---

## Étape 1 — Fichiers liés au chat

| Fichier | Rôle |
|---|---|
| [src/components/ChatWidget.tsx](../../src/components/ChatWidget.tsx) | Widget front : bulle flottante, en-tête, messages, boutons de démarrage rapide, boutons vers les pages du site, historique local. Masqué sur `/payment`, `/booking-history`, `/booking-process`, `/flight-hotel/booking` et `/admin`. |
| [src/App.tsx](../../src/App.tsx) | Monte le widget sur toutes les pages. |
| [src/hooks/useTravelChatbot.ts](../../src/hooks/useTravelChatbot.ts) | Appelle la fonction serveur `travel-chatbot` et remonte les erreurs au widget. |
| [supabase/functions/travel-chatbot/index.ts](../../supabase/functions/travel-chatbot/index.ts) | Fonction serveur (Supabase Edge Function) : **contient le prompt système** (constante `SYSTEM_PROMPT`), appelle l'API Anthropic (modèle `claude-sonnet-5`), limite le débit par IP, borne l'historique. |
| [supabase/functions/_shared/rate-limiter.ts](../../supabase/functions/_shared/rate-limiter.ts) | Limitation de débit par IP, en mémoire. |
| [src/i18n/locales/fr.json](../../src/i18n/locales/fr.json), `en.json`, `zh.json` (bloc `ux.chat`) | Textes du widget : accueil, erreurs, boutons rapides, noms des pages. |
| Secret Supabase `ANTHROPIC_API_KEY` | Clé de l'API IA, stockée côté serveur dans les secrets des Edge Functions. Absente du `.env` du front (vérifié). |
| [src/data/helpFaqData.ts](../../src/data/helpFaqData.ts) | FAQ du centre d'aide (316 questions). **Non utilisée par le chat.** Voir les écarts plus bas. |
| [supabase/functions/send-support-email/index.ts](../../supabase/functions/send-support-email/index.ts), [src/pages/Support.tsx](../../src/pages/Support.tsx) | Formulaire de support existant (email vers `SUPPORT_INBOX_EMAIL`). **Non relié au chat**, mais réutilisable pour l'escalade. |
| Base de données | **Aucune table de chat.** Pas de conversations ni de tickets. L'historique n'existe que dans le navigateur (`localStorage`, clé `b_reserve_chat_messages`). |

Fonctions IA voisines, hors du chat : `ai-travel-advisor` (conseiller voyage de la page d'accueil) et `translate-content` (traduction des contenus admin).

---

## Étape 2 — Audit

### Connaissance du site

| Point | Statut | Constat |
|---|---|---|
| Toutes les pages | ⚠️ | Le prompt liste 27 pages publiques avec leur rôle, et le widget les transforme en boutons. Il manque `/forgot-password` (mot de passe oublié), `/dashboard`, les sous-pages de la conciergerie (`/services`, `/formules`, `/a-propos`) et les pages légales (CGU, confidentialité). |
| Tous les services | ❌ | Le prompt cite les catégories de recherche, sans détail. Les 6 pôles de la conciergerie (Voyage & Tourisme, Immobilier & Patrimoine, Transport Premium, Événements, Hôtellerie & Restauration, Services VIP) sont absents. |
| Prix | ⚠️ | L'assistante n'a pas accès au catalogue et refuse correctement de donner un prix précis : elle donne des ordres de grandeur. C'est voulu, mais elle ne peut donner aucun tarif réel, même ceux des formules publiées. |
| Conditions | ❌ | Rien sur les conditions de réservation, l'acompte, les frais de service ou la devise. |
| Parcours inscription → réservation → paiement → suivi | ❌ | Absent. L'assistante ne sait pas expliquer comment se connecter, réserver, payer ni où suivre sa réservation. |
| Statuts de réservation | ❌ | Absents. Les statuts réels dans le code sont : réservation `pending` / `confirmed` / `cancelled` ; paiement `pending` / `processing` / `paid` / `partially_paid` (acompte) / `refunded` ; approbation entreprise `pending_approval` / `approved` / `rejected`. |
| Moyens de paiement | ❌ | Absents. Dans le code : liens de paiement **Jèko** (Mobile Money et carte bancaire), montants en XOF, minimum 100 XOF, confirmation par notification de Jèko. |
| Compte et connexion | ❌ | Absents. Dans le code : connexion par email et mot de passe, ou par code à usage unique envoyé par email ; mot de passe oublié sur `/forgot-password` ; suppression de compte depuis le compte. |
| Informations à jour par rapport au code et à la base | ⚠️ | Les 27 pages du prompt existent bien. Les écarts du site lui-même sont listés plus bas. |

**Politiques — ce qui existe** (CGU, [TermsOfService.tsx](../../src/pages/TermsOfService.tsx), sections 3 à 5) :
- réservation confirmée seulement après paiement complet ; PNR généré après paiement pour les vols ;
- moyens de paiement : carte, Mobile Money ; prix en XOF ; frais de service éventuels affichés avant paiement ;
- annulation selon le prestataire : vols selon la compagnie, hôtels « généralement 24 à 48 h avant l'arrivée », voitures selon le loueur ;
- remboursement via le support, sur le même moyen de paiement, sous 5 à 30 jours ouvrables ;
- dans le code, depuis le 14 octobre : remboursement en libre-service possible tant que la réservation n'est pas émise chez le fournisseur et que la date de prestation n'est pas arrivée ; après, il passe par un admin.

**Politiques à compléter par l'équipe** (rien dans le code ni dans la base ; je n'invente rien) :
1. Conditions et tarifs de la **Conciergerie** (Côte d'Ivoire et Sénégal) : formules, prix, délais d'intervention, zones couvertes.
2. Politique d'annulation propre aux **activités, circuits, séjours, restaurants, bien-être, artisans et événements**.
3. **Frais de service** : montant ou pourcentage.
4. **Délais de traitement** du support et horaires d'ouverture.
5. Vrais **canaux de contact** : téléphone, WhatsApp, email du support (voir les numéros fictifs plus bas).
6. Règles de l'**acompte** : quels services, quel pourcentage, solde payé sur place.
7. Ce qui se passe si un **paiement est débité sans confirmation de réservation**.

### Personnalité et comportement

| Point | Statut | Constat |
|---|---|---|
| Prénom | ⚠️ | « Bozi » est en ligne depuis le 15 octobre ; vous avez demandé de mettre ce point de côté. |
| Ton jovial et professionnel, accueil | ⚠️ | Accueil chaleureux en une phrase, vouvoiement, emojis rares, une question à la fois. Le registre « français d'Afrique de l'Ouest soigné » n'est pas demandé explicitement. |
| Empathie face aux clients mécontents | ❌ | Aucune consigne : ni reconnaissance du problème, ni excuse, ni passage de relais. |
| Refus d'inventer prix, disponibilités, politiques | ⚠️ | Correct pour les prix et les disponibilités. Rien n'interdit d'inventer une **politique** (annulation, délai, remboursement). |
| Refus de demander mot de passe, OTP, PIN, numéro de carte | ❌ | Aucune consigne. Le risque immédiat est faible (l'assistante ne fait rien de ces données), mais un client pourrait les envoyer dans le chat, et elles resteraient dans l'historique de son navigateur. |
| Recentrage sur les questions hors sujet | ❌ | Aucune consigne. |
| Français / anglais | ⚠️ | Elle répond dans la langue du client. La langue choisie sur le site (FR / EN / ZH) ne lui est pas transmise. |

### Fonctionnalités

| Point | Statut | Constat |
|---|---|---|
| Escalade vers un humain (ticket, WhatsApp, email) avec résumé | ❌ | Aucune. Le formulaire `/support` existe et envoie un email au support : il peut servir de base. |
| Consultation des réservations du client connecté | ❌ | Aucune. L'assistante ne sait pas qui est connecté. Possible en lecture seule avec le jeton du client : la base limite déjà chaque client à ses propres réservations. |
| Boutons de démarrage rapide | ⚠️ | 3 boutons (« Aide IA », « Destinations », « Mon compte »), orientés conseil voyage. Rien pour le paiement, le suivi de réservation, la conciergerie ou « parler à un conseiller ». |
| Historique des conversations en base | ❌ | Uniquement dans le navigateur. Il n'est **pas effacé à la déconnexion** : sur un ordinateur partagé, la personne suivante voit la conversation. |
| Mobile / responsive | ⚠️ | Plein écran sur mobile, bulle sur ordinateur. Mais le chat est **masqué sur les pages paiement et réservations**, là où un client a le plus besoin d'aide. |
| Charte graphique Bossiz | ✅ | Utilise les couleurs et composants du thème du site. |

### Sécurité et robustesse

| Point | Statut | Constat |
|---|---|---|
| Clé API uniquement côté serveur | ✅ | Secret Supabase, absent du front et du `.env`. |
| Limitation de débit | ⚠️ | 60 messages par heure par IP, mais en mémoire : chaque instance du serveur a son propre compteur, donc la limite réelle est plus haute sous forte charge. |
| Validation des entrées | ✅ | 20 derniers messages au plus, 2 000 caractères par message, rôles forcés à « client » ou « assistant ». |
| Protection contre l'injection de prompt | ⚠️ | Pas de consigne dédiée. L'historique est fourni par le navigateur : un utilisateur peut forger de fausses réponses de l'assistante pour l'influencer. L'impact reste limité tant qu'elle n'a accès à aucune donnée ni action. **Il deviendra critique** dès qu'on lui donnera accès aux réservations ou à l'escalade. |
| Gestion des erreurs | ⚠️ | Message aimable en cas de panne (corrigé le 14 octobre). Mais **aucun délai maximal** sur l'appel à l'API : si celle-ci tarde, le client attend sans fin le message « … écrit ». |
| Pas de fuite de données d'autres clients | ✅ | Aucune possible aujourd'hui : l'assistante n'a accès à aucune donnée. À reverrouiller lors de l'ajout de la consultation des réservations. |

---

## Écarts relevés sur le site (hors chat, mais bloquants pour l'assistante)

1. **Coordonnées fictives affichées aux clients** :
   - page `/contact` : téléphone « +225 27 20 00 00 00 » et WhatsApp « +225 07 00 00 00 00 » ([Contact.tsx:47-54](../../src/pages/Contact.tsx#L47-L54)) ;
   - valeurs par défaut « +225 00 00 00 00 » ([useSiteConfig.ts:75-77](../../src/hooks/useSiteConfig.ts#L75-L77)) et « +225 07 00 00 00 00 » ([useFooterSettings.ts:37](../../src/hooks/useFooterSettings.ts#L37)) ;
   - lien WhatsApp `wa.me/2250700000000` ([FeaturedSubscriptions.tsx](../../src/components/FeaturedSubscriptions.tsx)) ;
   - fiche Conciergerie Côte d'Ivoire en base : téléphone « +225 XX XX XX XX ».

   Le seul numéro d'apparence réelle est « +225 07 01 67 60 09 ».
2. **Données de test visibles dans le catalogue public** : « Hôtel Test (Compte Partenaire) », « Véhicule Test (Compte Partenaire) », un circuit à 100 XOF et un hôtel à 200 XOF.
3. **Chiffres invérifiables** dans la fiche Conciergerie Côte d'Ivoire en base : « 15+ années », « 5000+ clients satisfaits », « 1000+ partenaires », « 98 % de satisfaction », adresse « Tour BOSSIZ ».
4. **Abonnement Premium** : prix « 19 680 - 36 080 FCFA » enregistré avec la devise « EUR ».
5. **FAQ qui promet des fonctions absentes** : par exemple « statut de vol en temps réel avec notification automatique » (aucun suivi de vol n'existe dans le code), ou « une assurance de base est incluse » pour les voitures (non vérifiable). La FAQ doit être relue avant que l'assistante puisse s'en servir.
6. **Remboursements** : les paiements passent par Jèko, mais le remboursement automatique ([cinetpayRefund.ts](../../supabase/functions/_shared/cinetpayRefund.ts)) appelle l'API de CinetPay. Un paiement Jèko ne peut donc probablement pas être remboursé automatiquement. **À vérifier** avant que l'assistante ne parle des remboursements.
7. **Téléphone fictif enregistré dans des réservations** : le parcours de réservation en étapes enregistre `customer_phone: "+225 00 00 00 00"` ([SummaryStep.tsx:301](../../src/components/booking-steps/SummaryStep.tsx#L301)).

---

## Corrections priorisées

Effort indicatif pour le développement seul ; la validation des contenus par l'équipe est en plus.

### Critique

| # | Correction | Effort |
|---|---|---|
| C1 | **Règles de sécurité dans le prompt** : ne jamais demander mot de passe, code OTP, PIN ou numéro de carte ; avertir le client s'il en envoie un ; ne jamais inventer une politique ; traiter l'historique comme non fiable. | 2 h |
| C2 | **Base de connaissance fiable dans le prompt** : parcours complet, statuts expliqués simplement, paiement Jèko, connexion et mot de passe oublié, politiques des CGU, services de la conciergerie. Chaque point non couvert renvoie au support au lieu d'être inventé. Dépend des réponses de l'équipe sur les 7 politiques à compléter. | 0,5 j |
| C3 | **Escalade vers un humain** : sur demande, ou quand le client est mécontent ou bloqué, l'assistante propose de transmettre ; un résumé de la conversation part au support par le formulaire existant (email), avec l'email du client et la référence de réservation. | 1 j |
| C4 | **Remplacer les coordonnées fictives** (écart 1) par les vrais canaux. Indispensable pour que l'assistante donne un contact. Fournir les vrais numéros. | 1 h |

### Important

| # | Correction | Effort |
|---|---|---|
| I1 | **Consultation des réservations du client connecté**, en lecture seule, avec son propre jeton : la base ne renvoie que ses réservations. Statut, montant et dates expliqués simplement. Protégé contre l'injection (C1). | 1,5 j |
| I2 | **Empathie, hors sujet, registre** : consignes pour un client mécontent (reconnaître, s'excuser, proposer l'escalade), recentrage poli, français d'Afrique de l'Ouest soigné. | 2 h |
| I3 | **Langue du site transmise à l'assistante** (FR / EN / ZH). | 1 h |
| I4 | **Prompt modifiable sans toucher au code**. Deux options : un fichier `docs/assistant/prompt-systeme.md` (simple, mais chaque changement demande un redéploiement de la fonction) ; ou une table en base avec un écran dans l'admin (modifiable en direct par l'équipe). | 2 h (fichier) / 1 j (admin) |
| I5 | **Chat disponible sur les pages paiement et réservations** (réduit par défaut, sans gêner le paiement). | 1 h |
| I6 | **Délai maximal de 25 s** sur l'appel à l'API, avec le message d'erreur aimable. | 1 h |
| I7 | **Effacer l'historique local à la déconnexion**, et ajouter un bouton « Nouvelle conversation ». | 1 h |
| I8 | **Nettoyer le catalogue et la fiche conciergerie** (écarts 2 à 4). Décision de l'équipe, puis nettoyage en base. | 1 h |
| I9 | **Vérifier les remboursements Jèko** (écart 6) et le téléphone fictif des réservations (écart 7). | 0,5 j |

### Confort

| # | Correction | Effort |
|---|---|---|
| K1 | **Boutons rapides orientés support et conciergerie** : « Suivre ma réservation », « Problème de paiement », « Services de conciergerie », « Parler à un conseiller ». | 1 h |
| K2 | **Historique des conversations en base** (table protégée, durée de conservation à définir), utile pour le suivi qualité. | 1 j |
| K3 | **Limitation de débit partagée entre instances** (en base). | 0,5 j |
| K4 | **Réponses affichées au fil de l'eau** (streaming) au lieu d'attendre la réponse complète. | 0,5 j |
| K5 | **Relecture de la FAQ** (écart 5), puis utilisation comme base de connaissance de l'assistante. | 1 j + relecture équipe |
| K6 | **Prénom** de l'assistante (en attente de votre décision). | 15 min |

**Total indicatif :** Critique ≈ 2 j · Important ≈ 4 à 5 j · Confort ≈ 4 j.

---

## Questions pour valider l'audit

1. **Périmètre** : toute la plateforme Bossiz+, ou seulement la Conciergerie Bossiz d'Abidjan ?
2. **Politiques à compléter** : pouvez-vous fournir les 7 éléments listés plus haut, ou dois-je les marquer « contactez le support » en attendant ?
3. **Canal d'escalade** : email au support (déjà en place), WhatsApp, ou les deux ? Avec quels numéro et adresse réels ?
4. **Prompt modifiable** : fichier dans le dépôt (redéploiement à chaque changement) ou écran dans l'admin ?
5. **Langues** : français et anglais seulement, ou aussi le chinois, déjà proposé sur le site ?

Avant toute modification à l'étape 3, je rédigerai les 20 scénarios de test de l'étape 4 et j'enregistrerai les réponses de la version actuelle, pour la comparaison avant / après.

---

## État après corrections (15 octobre 2026)

Choix appliqués en l'absence de réponse aux questions ci-dessus :
- périmètre : toute la plateforme Bossiz+, conciergerie comprise ;
- politiques manquantes : renvoi vers un conseiller, rien n'est inventé ;
- escalade : par email au support ;
- prompt : fichier Markdown ;
- langues : français, anglais et chinois.

| # | Correction | État |
|---|---|---|
| C1 | Règles de sécurité (données sensibles, manipulation, rien d'inventé) | ✅ Fait. Les numéros de carte sont aussi masqués avant d'être gardés ou envoyés. |
| C2 | Base de connaissance (parcours, statuts, paiement Jèko, compte, politiques, conciergerie) | ✅ Fait. Les 7 politiques manquantes renvoient vers un conseiller. Les services et formules de la conciergerie sont relus en base. |
| C3 | Escalade vers un humain avec résumé | ✅ Fait : bouton « Transmettre à un conseiller » et email au support avec résumé, conversation et coordonnées (fonction `chat-handoff`). Testé de bout en bout le 15 octobre. |
| C4 | Coordonnées fictives | ⚠️ Les numéros fictifs ne sont plus affichés : page Contact et bouton WhatsApp des abonnements. **Reste à saisir les vrais numéros** dans Admin › Configuration › Contact : ils apparaîtront alors sur le site et dans les réponses de l'assistante. |
| I1 | Réservations du client connecté | ✅ Fait (5 dernières, lues avec son propre jeton). **Non testé avec un compte connecté** : à vérifier à la main. |
| I2 | Empathie, hors sujet, registre | ✅ Fait. |
| I3 | Langue du site transmise | ✅ Fait. |
| I4 | Prompt modifiable sans code | ✅ Fichier [prompt-systeme.md](../../supabase/functions/travel-chatbot/prompt-systeme.md) (voir [README.md](README.md)). L'écran dans l'admin n'est pas fait. |
| I5 | Chat sur les pages réservations et paiement | ⚠️ Visible sur « Mes réservations ». Volontairement toujours masqué sur les pages de paiement et de saisie de réservation : sur mobile, le bouton recouvrirait l'action principale. |
| I6 | Délai maximal | ✅ 25 secondes, puis message aimable. |
| I7 | Effacement à la déconnexion, nouvelle conversation | ✅ Fait. |
| I8 | Nettoyage du catalogue et de la fiche conciergerie | ❌ **Votre décision** : je n'ai supprimé aucune donnée en production. |
| I9 | Remboursements Jèko | ❌ **Confirmé par le code, non corrigé** : [cinetpayRefund.ts](../../supabase/functions/_shared/cinetpayRefund.ts) appelle toujours l'API CinetPay, quel que soit le prestataire. Les paiements étant faits par Jèko, toute annulation d'une réservation payée échoue, y compris le remboursement automatique de create-pnr. Il faut brancher l'API de remboursement de Jèko : c'est un chantier paiement à part. En attendant, l'assistante ne promet aucun remboursement automatique et renvoie vers un conseiller. |
| K1 | Boutons rapides support et conciergerie | ✅ « Suivre ma réservation », « Problème de paiement », « Conciergerie », « Parler à un conseiller ». |
| K2 | Historique des conversations en base | ❌ Non fait. Les transmissions arrivent par email. |
| K3 | Limitation de débit partagée | ❌ Non fait. |
| K4 | Réponses en streaming | ❌ Non fait. |
| K5 | Relecture de la FAQ | ❌ Non fait. L'assistante n'utilise pas la FAQ. |
| K6 | Prénom | En attente de votre décision : « Bozi » reste affiché. |

Restent aussi hors chat : les données de test du catalogue (écart 2), les chiffres de la fiche conciergerie (écart 3), le prix de l'abonnement Premium (écart 4) et le téléphone fictif enregistré dans les réservations (écart 7).

Résultats des tests : [tests-avant.md](tests-avant.md) et [tests-apres.md](tests-apres.md).
