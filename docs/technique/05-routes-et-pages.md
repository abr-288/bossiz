# 05 — Routes et pages

> Source : lecture intégrale de [src/components/AnimatedRoutes.tsx](../../src/components/AnimatedRoutes.tsx) (routeur principal, toutes les routes déclarées à plat), [src/App.tsx](../../src/App.tsx) et des fichiers de page/layout cités en preuve.

## 1. Constat structurel important

Il n'existe **aucun composant de garde au niveau du routeur** (pas de `<ProtectedRoute>`, `<AdminRoute>`, `<AgencyRoute>`, `<RequireAuth>` etc. — recherche exhaustive sur `src/` : 0 résultat). Les **108 déclarations `<Route>`** de [AnimatedRoutes.tsx:132-230](../../src/components/AnimatedRoutes.tsx) sont toutes enveloppées uniquement dans `<PageTransition>` (animation, pas de contrôle d'accès).

Le contrôle d'accès réel est implémenté **à l'intérieur de chaque page ou layout englobant** :
- **`AdminLayout`** ([src/components/admin/AdminLayout.tsx](../../src/components/admin/AdminLayout.tsx)) — englobe la plupart des pages `/admin/*`
- **`AgencyLayout`** ([src/components/agency/AgencyLayout.tsx](../../src/components/agency/AgencyLayout.tsx)) — englobe les pages `/agency/*`
- Vérifications ponctuelles `useEffect` + `supabase.auth.getUser()/getSession()` directement dans certaines pages (dashboard utilisateur, compte, historique, paiement)

## 2. Tableau complet des routes

| Chemin | Page | Fichier | Garde d'accès | Rôle requis |
|---|---|---|---|---|
| `/`, `/home` | Index | [src/pages/Index.tsx](../../src/pages/Index.tsx) | aucune | — |
| `/bossiz-portal` | BossizPortal | [src/pages/BossizPortal.tsx](../../src/pages/BossizPortal.tsx) | aucune | — |
| `/bossiz-conciergerie-ci`, `/services`, `/a-propos`, `/formules` | Bossiz CI (4 pages) | [src/pages/bossiz/ci/](../../src/pages/bossiz/ci/) | aucune | — |
| `/bossiz-conciergerie-sn`, `/services`, `/a-propos`, `/formules` | Bossiz SN (4 pages) | [src/pages/bossiz/sn/](../../src/pages/bossiz/sn/) | aucune | — |
| `/flights` | Flights | [src/pages/Flights.tsx](../../src/pages/Flights.tsx) | aucune | — |
| `/hotels` | Hotels | [src/pages/Hotels.tsx](../../src/pages/Hotels.tsx) | aucune | — |
| `/hotels-partenaires` | HotelsPartners | [src/pages/HotelsPartners.tsx](../../src/pages/HotelsPartners.tsx) | aucune | — |
| `/cars` | Cars | [src/pages/Cars.tsx](../../src/pages/Cars.tsx) | aucune | — |
| `/tours` | Tours | [src/pages/Tours.tsx](../../src/pages/Tours.tsx) | aucune | — |
| `/restaurants` | Restaurants | [src/pages/Restaurants.tsx](../../src/pages/Restaurants.tsx) | aucune | — |
| `/artisans` | Artisans | [src/pages/Artisans.tsx](../../src/pages/Artisans.tsx) | aucune | — |
| `/bien-etre-beaute` | WellnessBeauty | [src/pages/WellnessBeauty.tsx](../../src/pages/WellnessBeauty.tsx) | aucune | — |
| `/entreprises` | Companies | [src/pages/Companies.tsx](../../src/pages/Companies.tsx) | contrôle inline seulement sur les actions "créer/rejoindre" (`Companies.tsx:48-87`) | connecté (partiel) |
| `/company/dashboard` | CompanyDashboard | [src/pages/company/CompanyDashboard.tsx](../../src/pages/company/CompanyDashboard.tsx) | `useCompany` redirige vers `/entreprises` si pas de société (`CompanyDashboard.tsx:78-82`) | membre d'une `company` |
| `/destinations`, `/destinations/:id` | Destinations, DestinationDetail | [src/pages/Destinations.tsx](../../src/pages/Destinations.tsx), [DestinationDetail.tsx](../../src/pages/DestinationDetail.tsx) | aucune | — |
| `/activities` | Activities | [src/pages/Activities.tsx](../../src/pages/Activities.tsx) | aucune | — |
| `/stays` | Stays | [src/pages/Stays.tsx](../../src/pages/Stays.tsx) | aucune | — |
| `/events` | Events | [src/pages/Events.tsx](../../src/pages/Events.tsx) | aucune | — |
| `/trains` | Trains | [src/pages/Trains.tsx](../../src/pages/Trains.tsx) | aucune | — |
| `/flight-hotel` | FlightHotel | [src/pages/FlightHotel.tsx](../../src/pages/FlightHotel.tsx) | aucune | — |
| `/flight-hotel/booking` | FlightHotelBookingProcess | [FlightHotelBookingProcess.tsx](../../src/pages/FlightHotelBookingProcess.tsx) | `navigate('/auth')` seulement à la confirmation (`:206`) | connecté (à la confirmation) |
| `/auth` | Auth | [src/pages/Auth.tsx](../../src/pages/Auth.tsx) | aucune | — |
| `/forgot-password` | ForgotPassword | [src/pages/ForgotPassword.tsx](../../src/pages/ForgotPassword.tsx) | aucune | — |
| `/reset-password` | ResetPassword | [src/pages/ResetPassword.tsx](../../src/pages/ResetPassword.tsx) | attend événement `PASSWORD_RECOVERY`/session valide (`:20-40`) | lien de récupération valide |
| `/dashboard` | UserDashboard | [src/pages/UserDashboard.tsx](../../src/pages/UserDashboard.tsx) | `getUser()` → `/auth` si absent (`:57-63`) | connecté |
| `/booking-history` | BookingHistory | [src/pages/BookingHistory.tsx](../../src/pages/BookingHistory.tsx) | `getSession()` → `/auth` (`:74-76`) | connecté |
| `/account` | Account | [src/pages/Account.tsx](../../src/pages/Account.tsx) | `getSession()` → `/auth` (`:85-89`) | connecté |
| `/price-alerts` | PriceAlerts | [src/pages/PriceAlerts.tsx](../../src/pages/PriceAlerts.tsx) | aucune | — |
| `/payment` | Payment | [src/pages/Payment.tsx](../../src/pages/Payment.tsx) | `getUser()` → `/auth` (`:64,71`) | connecté |
| `/confirmation` | Confirmation | [src/pages/Confirmation.tsx](../../src/pages/Confirmation.tsx) | aucune | — |
| `/flight-comparison` | FlightComparison | [src/pages/FlightComparison.tsx](../../src/pages/FlightComparison.tsx) | aucune | — |
| `/booking-process` | FlightBookingProcess | [src/pages/FlightBookingProcess.tsx](../../src/pages/FlightBookingProcess.tsx) | aucune | — |
| `/booking/:serviceType` | UnifiedBookingProcess | [src/pages/UnifiedBookingProcess.tsx](../../src/pages/UnifiedBookingProcess.tsx) | aucune | — |
| `/admin` | AdminOverview | [src/pages/admin/AdminOverview.tsx](../../src/pages/admin/AdminOverview.tsx) | `AdminLayout` | `admin` |
| `/admin/bookings`, `/services`, `/activities`, `/stays`, `/users`, `/subscriptions`, `/subscription-plans`, `/promotions`, `/configuration`, `/agencies`, `/partner-applications`, `/commissions`, `/car-partner-plans`, `/advertisements`, `/payments`, `/reviews`, `/newsletter`, `/destinations`, `/bossiz-microsites`, `/integrations`, `/homepage-config` (21 pages) | Admin* | [src/pages/admin/](../../src/pages/admin/) | `AdminLayout` | `admin` |
| `/admin/email-templates` | AdminEmailTemplates | [src/pages/AdminEmailTemplates.tsx](../../src/pages/AdminEmailTemplates.tsx) | `AdminLayout` **+** contrôle inline `useUserRole()` (`:15,26-38`) | `admin` |
| `/admin/users-list` | AdminUsers (racine, ≠ admin/AdminUsers.tsx) | [src/pages/AdminUsers.tsx](../../src/pages/AdminUsers.tsx) | ⚠️ **aucune garde détectée** | — |
| `/admin/content` | AdminContentManager | [src/pages/AdminContentManager.tsx](../../src/pages/AdminContentManager.tsx) | ⚠️ **aucune garde détectée** | — |
| `/agency`, `/services`, `/restaurants`, `/artisans`, `/wellness`, `/activities`, `/stays`, `/promotions`, `/settings` (9 pages) | Agency* | [src/pages/agency/](../../src/pages/agency/) | `AgencyLayout` | `sub_agency` |
| `/help` | Help | [src/pages/Help.tsx](../../src/pages/Help.tsx) | aucune | — |
| `/contact` | Contact | [src/pages/Contact.tsx](../../src/pages/Contact.tsx) | aucune | — |
| `/partenariat` | Partnership | [src/pages/Partnership.tsx](../../src/pages/Partnership.tsx) | aucune | — |
| `/devenir-partenaire` | BecomePartner | [src/pages/BecomePartner.tsx](../../src/pages/BecomePartner.tsx) | aucune | — |
| `/partenaires/voitures` | CarPartnerPlans | [src/pages/CarPartnerPlans.tsx](../../src/pages/CarPartnerPlans.tsx) | aucune | — |
| `/support`, `/support/:categoryId` | Support, SupportCategory | [src/pages/Support.tsx](../../src/pages/Support.tsx), [SupportCategory.tsx](../../src/pages/SupportCategory.tsx) | aucune | — |
| `/privacy`, `/privacy-policy` | PrivacyPolicy | [src/pages/PrivacyPolicy.tsx](../../src/pages/PrivacyPolicy.tsx) | aucune | — |
| `/terms`, `/terms-of-service` | TermsOfService | [src/pages/TermsOfService.tsx](../../src/pages/TermsOfService.tsx) | aucune | — |
| `/install`, `/install/android`, `/install/ios` | Install, InstallAndroid, InstalliOS | [src/pages/](../../src/pages/) | aucune | — |
| `/subscription-payment` | ModernSubscriptionPayment | [src/components/ModernSubscriptionPayment.tsx](../../src/components/ModernSubscriptionPayment.tsx) | contrôle ponctuel dans un handler (`:277`), pas au montage | — |
| `/order-summary` | OrderSummary | [src/pages/OrderSummary.tsx](../../src/pages/OrderSummary.tsx) | aucune | — |
| `/politique-cookies`, `/cookie-policy` | CookiePolicy | [src/pages/CookiePolicy.tsx](../../src/pages/CookiePolicy.tsx) | aucune | — |
| `/mentions-legales` | LegalNotice | [src/pages/LegalNotice.tsx](../../src/pages/LegalNotice.tsx) | aucune | — |
| `/documentation` | Documentation | [src/pages/Documentation.tsx](../../src/pages/Documentation.tsx) | aucune | — |
| `/documentations` | PlatformPresentation | [src/pages/PlatformPresentation.tsx](../../src/pages/PlatformPresentation.tsx) | aucune | — |
| `/compatibility` | Compatibility | [src/pages/Compatibility.tsx](../../src/pages/Compatibility.tsx) | aucune | — |
| `/admin/bossiz-sites` | *(redirection)* | `<Navigate to="/admin/bossiz-microsites" replace />` ([AnimatedRoutes.tsx:195](../../src/components/AnimatedRoutes.tsx)) | — | — |
| `*` | NotFound | [src/pages/NotFound.tsx](../../src/pages/NotFound.tsx) | aucune | — |

## 3. ⚠️ Anomalies d'accès constatées

Deux routes affichées comme routes « admin » (préfixe `/admin/...`) **ne comportent aucune vérification d'identité ni de rôle dans leur code** :

- **`/admin/users-list`** → [src/pages/AdminUsers.tsx](../../src/pages/AdminUsers.tsx) : ni `AdminLayout`, ni appel `supabase.auth`/`navigate` de contrôle.
- **`/admin/content`** → [src/pages/AdminContentManager.tsx](../../src/pages/AdminContentManager.tsx) : idem.

Ces deux pages ne fonctionneront correctement que si les opérations de lecture/écriture qu'elles déclenchent sont elles-mêmes protégées par les policies RLS côté base de données — mais l'**affichage de l'UI elle-même** (listes d'utilisateurs, gestion de contenu) n'est protégé par aucun contrôle applicatif frontend, contrairement au reste des pages admin. Détail des implications en [11-securite.md](11-securite.md).

## 4. Composants de garde détaillés

### `AdminLayout` — [src/components/admin/AdminLayout.tsx](../../src/components/admin/AdminLayout.tsx)
1. `supabase.auth.getUser()` (`:22`) ; si absent → `navigate("/auth")` (`:24-27`).
2. Sinon, requête `user_roles` filtrée `.eq("user_id", user.id).eq("role", "admin").maybeSingle()` (`:30-35`) ; si aucune ligne → toast « Accès refusé » + `navigate("/")` (`:37-45`).
3. Spinner plein écran tant que `loading` est vrai (`:58-64`), pour éviter tout flash de contenu admin non autorisé.

### `AgencyLayout` — [src/components/agency/AgencyLayout.tsx](../../src/components/agency/AgencyLayout.tsx)
1. `supabase.auth.getUser()` (`:24`) ; si absent → `navigate("/auth")` (`:26-29`).
2. Requête `user_roles` filtrée `.eq("role", "sub_agency").maybeSingle()` (`:32-37`) ; si absent → toast + `navigate("/")`.
3. Vérifie en plus que `agencies.owner_id = user.id` **et** `is_active` (`:50-64`) ; sinon toast « agence non active » + `navigate("/")`.

## 5. Providers globaux — [src/App.tsx](../../src/App.tsx)

Hiérarchie de montage (`:24-50`) : `ErrorBoundary` → `QueryClientProvider` → `ThemeProvider` → `SiteConfigProvider` → `BossizConfigProvider` → `HomepageConfigProvider` → `CurrencyProvider` → `TooltipProvider`/`Toaster`/`Sonner`/`NotificationPrompt` → `BrowserRouter` → `RouteSeo` + `AnimatedRoutes` + `ChatWidget` + `CookieConsentBanner`. Aucun de ces providers n'implémente de contrôle d'accès — ce sont des contextes fonctionnels (thème, configuration site, devise, cache réseau, UI globale).
