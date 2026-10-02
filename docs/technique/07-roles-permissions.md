# 07 — Rôles et permissions

> Source : [src/hooks/useUserRole.ts](../../src/hooks/useUserRole.ts), [src/hooks/useCompany.ts](../../src/hooks/useCompany.ts), [src/components/admin/AdminLayout.tsx](../../src/components/admin/AdminLayout.tsx), [src/components/agency/AgencyLayout.tsx](../../src/components/agency/AgencyLayout.tsx), et les migrations SQL définissant `app_role`, `has_role()` et les policies RLS.

## 1. Deux systèmes de rôles distincts, stockés dans la même table

Il n'existe **pas un système de rôles unifié**, mais deux mécanismes indépendants qui s'appuient tous deux sur la table `user_roles` :

### a) Rôles de plateforme — enum `app_role`
Défini par [20251028001846](../../supabase/migrations/20251028001846_c50f055f-2b42-456c-9aa3-77ed9fed018f.sql) (`admin`, `user`), étendu par [20251218143103](../../supabase/migrations/20251218143103_06f38a9b-da89-462b-b0e3-20e90eb0cd29.sql) (`sub_agency`). Un utilisateur peut avoir **plusieurs lignes** dans `user_roles` (ex. `user` par défaut à l'inscription + `admin` accordé plus tard) — la résolution du rôle effectif se fait par priorité :

```
admin (le plus privilégié) > sub_agency > user (par défaut)
```

Cette hiérarchie est implémentée à deux endroits légèrement différents :
- **Frontend** ([src/hooks/useUserRole.ts:29-36](../../src/hooks/useUserRole.ts)) : ne connaît que `admin`/`user` (ne gère pas `sub_agency` dans son typage).
- **Base de données** (trigger dans [20260805010000_fix_default_role_trigger.sql:41-50](../../supabase/migrations/20260805010000_fix_default_role_trigger.sql)) : `CASE role WHEN 'admin' THEN 3 WHEN 'sub_agency' THEN 2 ELSE 1 END` — logique complète des 3 rôles.

Fonction SQL `has_role(_user_id uuid, _role app_role)` (`SECURITY DEFINER`, [20251028001846:17-22](../../supabase/migrations/20251028001846_c50f055f-2b42-456c-9aa3-77ed9fed018f.sql)) utilisée dans la quasi-totalité des policies RLS et de plusieurs Edge Functions (`create-pnr`, `refund-payment`) pour vérifier un rôle exact.

### b) Rôles d'entreprise (Business Travel) — type `CompanyRole`
Défini côté frontend uniquement ([src/hooks/useCompany.ts:14](../../src/hooks/useCompany.ts)) : `'admin' | 'approver' | 'employee'`, stockés dans la table `company_members.role` (distincte de `user_roles`). Un utilisateur peut appartenir à une entreprise avec l'un de ces 3 rôles, indépendamment de son rôle de plateforme. **Limitation constatée** : le code prévoit qu'un utilisateur puisse en théorie rejoindre plusieurs entreprises (aucune contrainte DB ne l'empêche), mais [useCompany.ts:31-37](../../src/hooks/useCompany.ts) ne récupère et n'expose que la **première** adhésion trouvée (`.limit(1)`) — comportement à corriger si le multi-entreprise doit être supporté.

## 2. Matrice des rôles

| Rôle | Où défini | Accès plateforme | Accès UI dédiée | Contrôle serveur (Edge Functions) |
|---|---|---|---|---|
| **Visiteur (non connecté)** | — | Pages publiques (catalogue, recherche, contenu marketing) | — | Endpoints de recherche/autocomplétion publics, sans authentification |
| **Utilisateur (`user`)** | `user_roles`, valeur par défaut à l'inscription | Réservation, paiement, historique, compte, alertes de prix | `/dashboard`, `/account`, `/booking-history`, `/price-alerts` | JWT requis pour réserver/payer ; RLS limite l'accès à ses propres données |
| **Sous-agence (`sub_agency`)** | `user_roles`, attribué manuellement | Gestion de son propre catalogue (services, activités, séjours, restaurants, artisans, bien-être) et de ses commissions | `/agency/*` (9 pages, via `AgencyLayout`) | RLS `has_role('sub_agency') AND is_agency_owner(...)` sur les tables de catalogue ; agence doit être `is_active` |
| **Administrateur (`admin`)** | `user_roles`, attribué manuellement (voir §3) | Accès complet à toutes les données et à la configuration de la plateforme | `/admin/*` (23 pages, via `AdminLayout`) | Vérification explicite du rôle admin dans les Edge Functions sensibles (ex. `admin-create-partner-account`, `send-partner-approved`, `create-pnr`, `refund-payment`) ; RLS admin-only sur les tables de configuration/paiement |
| **Membre d'entreprise — `employee`** | `company_members.role` | Peut soumettre des réservations "Business Travel" au nom de son entreprise | `/company/dashboard` | RLS INSERT `bookings` conditionnée à `company_id IS NULL OR is_company_member(...)` |
| **Membre d'entreprise — `approver`** | `company_members.role` | Approuve/rejette les réservations soumises par les employés de son entreprise | `/company/dashboard` | Fonction `review-booking-approval` — **aucun contrôle de rôle explicite dans le code**, entièrement délégué à la policy RLS "Company approvers can review their company bookings" |
| **Membre d'entreprise — `admin` (company)** | `company_members.role` | Gère les membres et la politique de voyage (`travel_policies`) de son entreprise | `/company/dashboard` | RPC `create_company` ([20260910231000](../../supabase/migrations/20260910231000_fix_company_policies_and_rpc.sql)) |

## 3. Attribution des rôles — historique et état actuel

- **Attribution par défaut** : un trigger (`handle_new_user_role`, créé par [20251028190141](../../supabase/migrations/20251028190141_a3a4ac4f.sql), corrigé 2 fois ensuite) attribue automatiquement le rôle `user` à toute nouvelle inscription.
- **Promotion admin/sub_agency** : se fait manuellement (via la page `/admin/users` ou une requête `INSERT` directe sur `user_roles`).
- **⚠️ Faille historique corrigée** : [20260916000000_remove_admin_email_backdoor.sql](../../supabase/migrations/20260916000000_remove_admin_email_backdoor.sql) documente et supprime une ancienne logique qui accordait **automatiquement le rôle admin** à tout compte s'inscrivant avec l'adresse email exacte `admin@bossiz.com`. Si ce compte avait été un jour libéré ou recréé en environnement de test, n'importe qui aurait pu s'inscrire avec cet email et obtenir le rôle admin sans validation humaine. **Corrigé**, mais à garder en tête comme antécédent de sécurité pour la revue des autres triggers `SECURITY DEFINER`.

## 4. Anomalies constatées

- **Deux routes `/admin/*` sans aucune garde** : `/admin/users-list` ([src/pages/AdminUsers.tsx](../../src/pages/AdminUsers.tsx)) et `/admin/content` ([src/pages/AdminContentManager.tsx](../../src/pages/AdminContentManager.tsx)) ne sont protégées par aucun contrôle applicatif frontend (ni `AdminLayout`, ni vérification inline) — voir [05-routes-et-pages.md](05-routes-et-pages.md) §3. Leur sécurité effective dépend entièrement des policies RLS des tables qu'elles manipulent.
- **La garde `AdminLayout`/`AgencyLayout` est un contrôle d'affichage, pas la barrière de sécurité réelle** : elle interroge `user_roles` via le client `supabase-js` standard (clé `anon` + session), donc elle-même soumise aux RLS. La vraie barrière pour les opérations privilégiées est le contrôle explicite refait côté Edge Function (ex. `admin-create-partner-account`) ou la policy RLS de la table cible — pas le `if` React, qui peut être contourné pour le rendu initial (sans donner accès aux données pour autant, si les RLS sont correctement posées).
- **Incohérence de typage frontend/backend** : `useUserRole.ts` ne modélise que 2 rôles (`admin`/`user`) alors que la base en gère 3 (`app_role` inclut `sub_agency`) — ce hook n'est donc pas fiable pour détecter une sous-agence ; c'est `AgencyLayout` qui fait sa propre requête dédiée.

Détail des implications de sécurité en [11-securite.md](11-securite.md).
