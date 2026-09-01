// Composant de routage avec animations
// Gère toutes les routes de l'application avec lazy loading et transitions
import { Suspense, lazy } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import PageTransition from "./PageTransition";
import Logo from "./Logo";

// Lazy loading des composants de route pour le code splitting
const BossizPortal = lazy(() => import("@/pages/BossizPortal"));
const BossizCIAccueil = lazy(() => import("@/pages/bossiz/ci/Accueil"));
const BossizCIServices = lazy(() => import("@/pages/bossiz/ci/Services"));
const BossizCIAPropos = lazy(() => import("@/pages/bossiz/ci/APropos"));
const BossizCIFormules = lazy(() => import("@/pages/bossiz/ci/Formules"));
const BossizSNAccueil = lazy(() => import("@/pages/bossiz/sn/Accueil"));
const BossizSNServices = lazy(() => import("@/pages/bossiz/sn/Services"));
const BossizSNAPropos = lazy(() => import("@/pages/bossiz/sn/APropos"));
const BossizSNFormules = lazy(() => import("@/pages/bossiz/sn/Formules"));
const Index = lazy(() => import("@/pages/Index"));
const Flights = lazy(() => import("@/pages/Flights"));
const Hotels = lazy(() => import("@/pages/Hotels"));
const HotelsPartners = lazy(() => import("@/pages/HotelsPartners"));
const Cars = lazy(() => import("@/pages/Cars"));
const Tours = lazy(() => import("@/pages/Tours"));
const Destinations = lazy(() => import("@/pages/Destinations"));
const DestinationDetail = lazy(() => import("@/pages/DestinationDetail"));
const Activities = lazy(() => import("@/pages/Activities"));
const Stays = lazy(() => import("@/pages/Stays"));
const Events = lazy(() => import("@/pages/Events"));
const Trains = lazy(() => import("@/pages/Trains"));
const FlightHotel = lazy(() => import("@/pages/FlightHotel"));
const Auth = lazy(() => import("@/pages/Auth"));
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const Dashboard = lazy(() => import("@/pages/UserDashboard"));
const BookingHistory = lazy(() => import("@/pages/BookingHistory"));
const Account = lazy(() => import("@/pages/Account"));
const Payment = lazy(() => import("@/pages/Payment"));
const Confirmation = lazy(() => import("@/pages/Confirmation"));
const FlightComparison = lazy(() => import("@/pages/FlightComparison"));
const FlightBookingProcess = lazy(() => import("@/pages/FlightBookingProcess"));
const UnifiedBookingProcess = lazy(() => import("@/pages/UnifiedBookingProcess"));
const FlightHotelBookingProcess = lazy(() => import("@/pages/FlightHotelBookingProcess"));
const AdminDashboard = lazy(() => import("@/pages/admin/AdminOverview"));
const AdminBookings = lazy(() => import("@/pages/admin/AdminBookings"));
const AdminServices = lazy(() => import("@/pages/admin/AdminServices"));
const AdminActivities = lazy(() => import("@/pages/admin/AdminActivities"));
const AdminStays = lazy(() => import("@/pages/admin/AdminStays"));
const AdminUsers = lazy(() => import("@/pages/admin/AdminUsers"));
const AdminUsersList = lazy(() => import("@/pages/AdminUsers"));
const AdminSubscriptions = lazy(() => import("@/pages/admin/AdminSubscriptions"));
const AdminSubscriptionPlans = lazy(() => import("@/pages/admin/AdminSubscriptionPlans"));
const AdminPromotions = lazy(() => import("@/pages/admin/AdminPromotions"));
const AdminEmailTemplates = lazy(() => import("@/pages/AdminEmailTemplates"));
const AdminConfiguration = lazy(() => import("@/pages/admin/AdminConfiguration"));
const AdminAgencies = lazy(() => import("@/pages/admin/AdminAgencies"));
const AdminPartnerApplications = lazy(() => import("@/pages/admin/AdminPartnerApplications"));
const AdminCommissions = lazy(() => import("@/pages/admin/AdminCommissions"));
const AdminAdvertisements = lazy(() => import("@/pages/admin/AdminAdvertisements"));
const AdminPayments = lazy(() => import("@/pages/admin/AdminPayments"));
const AdminReviews = lazy(() => import("@/pages/admin/AdminReviews"));
const AdminNewsletter = lazy(() => import("@/pages/admin/AdminNewsletter"));
const AdminIntegrations = lazy(() => import("@/pages/admin/AdminIntegrations"));
const AdminDestinations = lazy(() => import("@/pages/admin/AdminDestinations"));
const AdminContentManager = lazy(() => import("@/pages/AdminContentManager"));
const AdminBossizMicrosites = lazy(() => import("@/pages/admin/AdminBossizMicrosites"));
const AdminHomepageConfig = lazy(() => import("@/pages/admin/AdminHomepageConfig"));
const AgencyDashboard = lazy(() => import("@/pages/agency/AgencyDashboard"));
const AgencyServices = lazy(() => import("@/pages/agency/AgencyServices"));
const AgencyActivities = lazy(() => import("@/pages/agency/AgencyActivities"));
const AgencyStays = lazy(() => import("@/pages/agency/AgencyStays"));
const AgencyPromotions = lazy(() => import("@/pages/agency/AgencyPromotions"));
const AgencySettings = lazy(() => import("@/pages/agency/AgencySettings"));
const Help = lazy(() => import("@/pages/Help"));
const Contact = lazy(() => import("@/pages/Contact"));
const BecomePartner = lazy(() => import("@/pages/BecomePartner"));
const Support = lazy(() => import("@/pages/Support"));
const SupportCategory = lazy(() => import("@/pages/SupportCategory"));
const Install = lazy(() => import("@/pages/Install"));
const InstallAndroid = lazy(() => import("@/pages/InstallAndroid"));
const InstalliOS = lazy(() => import("@/pages/InstalliOS"));
const PriceAlerts = lazy(() => import("@/pages/PriceAlerts"));
const SubscriptionPaymentComponent = lazy(() => import("@/components/ModernSubscriptionPayment"));
const OrderSummary = lazy(() => import("@/pages/OrderSummary"));
const PrivacyPolicy = lazy(() => import("@/pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("@/pages/TermsOfService"));
const Documentation = lazy(() => import("@/pages/Documentation"));
const PlatformPresentation = lazy(() => import("@/pages/PlatformPresentation"));
const Compatibility = lazy(() => import("@/pages/Compatibility"));
const NotFound = lazy(() => import("@/pages/NotFound"));

// Composant de chargement affiché pendant le lazy loading
const PageLoader = () => (
  <div className="loader-container">
    <div className="loader-logo-wrapper">
      <div className="loader-ring"></div>
      <div className="loader-ring"></div>
      <Logo variant="light" showWordmark={false} className="loader-logo !w-20 !h-20" />
    </div>
    <div className="loader-text">B-RESERVE</div>
    <div className="loader-bar-bg">
      <div className="loader-bar"></div>
    </div>
  </div>
);

/**
 * AnimatedRoutes - Routes avec transitions Framer Motion
 * Utilise AnimatePresence pour animer les entrées/sorties de pages
 */
const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Suspense fallback={<PageLoader />}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageTransition><Index /></PageTransition>} />
          <Route path="/home" element={<PageTransition><Index /></PageTransition>} />
          <Route path="/bossiz-portal" element={<PageTransition><BossizPortal /></PageTransition>} />
          <Route path="/bossiz-conciergerie-ci" element={<PageTransition><BossizCIAccueil /></PageTransition>} />
          <Route path="/bossiz-conciergerie-ci/services" element={<PageTransition><BossizCIServices /></PageTransition>} />
          <Route path="/bossiz-conciergerie-ci/a-propos" element={<PageTransition><BossizCIAPropos /></PageTransition>} />
          <Route path="/bossiz-conciergerie-ci/formules" element={<PageTransition><BossizCIFormules /></PageTransition>} />
          <Route path="/bossiz-conciergerie-sn" element={<PageTransition><BossizSNAccueil /></PageTransition>} />
          <Route path="/bossiz-conciergerie-sn/services" element={<PageTransition><BossizSNServices /></PageTransition>} />
          <Route path="/bossiz-conciergerie-sn/a-propos" element={<PageTransition><BossizSNAPropos /></PageTransition>} />
          <Route path="/bossiz-conciergerie-sn/formules" element={<PageTransition><BossizSNFormules /></PageTransition>} />
          <Route path="/flights" element={<PageTransition><Flights /></PageTransition>} />
          <Route path="/hotels" element={<PageTransition><Hotels /></PageTransition>} />
          <Route path="/hotels-partenaires" element={<PageTransition><HotelsPartners /></PageTransition>} />
          <Route path="/cars" element={<PageTransition><Cars /></PageTransition>} />
          <Route path="/tours" element={<PageTransition><Tours /></PageTransition>} />
          <Route path="/destinations" element={<PageTransition><Destinations /></PageTransition>} />
          <Route path="/destinations/:id" element={<PageTransition><DestinationDetail /></PageTransition>} />
          <Route path="/activities" element={<PageTransition><Activities /></PageTransition>} />
          <Route path="/stays" element={<PageTransition><Stays /></PageTransition>} />
          <Route path="/events" element={<PageTransition><Events /></PageTransition>} />
          <Route path="/trains" element={<PageTransition><Trains /></PageTransition>} />
          <Route path="/flight-hotel" element={<PageTransition><FlightHotel /></PageTransition>} />
          <Route path="/flight-hotel/booking" element={<PageTransition><FlightHotelBookingProcess /></PageTransition>} />
          <Route path="/auth" element={<PageTransition><Auth /></PageTransition>} />
          <Route path="/forgot-password" element={<PageTransition><ForgotPassword /></PageTransition>} />
          <Route path="/reset-password" element={<PageTransition><ResetPassword /></PageTransition>} />
          <Route path="/dashboard" element={<PageTransition><Dashboard /></PageTransition>} />
          <Route path="/booking-history" element={<PageTransition><BookingHistory /></PageTransition>} />
          <Route path="/account" element={<PageTransition><Account /></PageTransition>} />
          <Route path="/price-alerts" element={<PageTransition><PriceAlerts /></PageTransition>} />
          <Route path="/payment" element={<PageTransition><Payment /></PageTransition>} />
          <Route path="/confirmation" element={<PageTransition><Confirmation /></PageTransition>} />
          <Route path="/flight-comparison" element={<PageTransition><FlightComparison /></PageTransition>} />
          <Route path="/booking-process" element={<PageTransition><FlightBookingProcess /></PageTransition>} />
          <Route path="/booking/:serviceType" element={<PageTransition><UnifiedBookingProcess /></PageTransition>} />
          <Route path="/admin" element={<PageTransition><AdminDashboard /></PageTransition>} />
          <Route path="/admin/bookings" element={<PageTransition><AdminBookings /></PageTransition>} />
          <Route path="/admin/services" element={<PageTransition><AdminServices /></PageTransition>} />
          <Route path="/admin/activities" element={<PageTransition><AdminActivities /></PageTransition>} />
          <Route path="/admin/stays" element={<PageTransition><AdminStays /></PageTransition>} />
          <Route path="/admin/users" element={<PageTransition><AdminUsers /></PageTransition>} />
          <Route path="/admin/users-list" element={<PageTransition><AdminUsersList /></PageTransition>} />
          <Route path="/admin/subscriptions" element={<PageTransition><AdminSubscriptions /></PageTransition>} />
          <Route path="/admin/subscription-plans" element={<PageTransition><AdminSubscriptionPlans /></PageTransition>} />
          <Route path="/admin/promotions" element={<PageTransition><AdminPromotions /></PageTransition>} />
          <Route path="/admin/email-templates" element={<PageTransition><AdminEmailTemplates /></PageTransition>} />
          <Route path="/admin/configuration" element={<PageTransition><AdminConfiguration /></PageTransition>} />
          <Route path="/admin/agencies" element={<PageTransition><AdminAgencies /></PageTransition>} />
          <Route path="/admin/partner-applications" element={<PageTransition><AdminPartnerApplications /></PageTransition>} />
          <Route path="/admin/commissions" element={<PageTransition><AdminCommissions /></PageTransition>} />
          <Route path="/admin/advertisements" element={<PageTransition><AdminAdvertisements /></PageTransition>} />
          <Route path="/admin/payments" element={<PageTransition><AdminPayments /></PageTransition>} />
          <Route path="/admin/reviews" element={<PageTransition><AdminReviews /></PageTransition>} />
          <Route path="/admin/newsletter" element={<PageTransition><AdminNewsletter /></PageTransition>} />
          <Route path="/admin/destinations" element={<PageTransition><AdminDestinations /></PageTransition>} />
          <Route path="/admin/content" element={<PageTransition><AdminContentManager /></PageTransition>} />
          <Route path="/admin/bossiz-sites" element={<Navigate to="/admin/bossiz-microsites" replace />} />
          <Route path="/admin/bossiz-microsites" element={<PageTransition><AdminBossizMicrosites /></PageTransition>} />
          <Route path="/admin/integrations" element={<PageTransition><AdminIntegrations /></PageTransition>} />
          <Route path="/admin/homepage-config" element={<PageTransition><AdminHomepageConfig /></PageTransition>} />
          <Route path="/agency" element={<PageTransition><AgencyDashboard /></PageTransition>} />
          <Route path="/agency/services" element={<PageTransition><AgencyServices /></PageTransition>} />
          <Route path="/agency/activities" element={<PageTransition><AgencyActivities /></PageTransition>} />
          <Route path="/agency/stays" element={<PageTransition><AgencyStays /></PageTransition>} />
          <Route path="/agency/promotions" element={<PageTransition><AgencyPromotions /></PageTransition>} />
          <Route path="/agency/settings" element={<PageTransition><AgencySettings /></PageTransition>} />
          <Route path="/help" element={<PageTransition><Help /></PageTransition>} />
          <Route path="/contact" element={<PageTransition><Contact /></PageTransition>} />
          <Route path="/devenir-partenaire" element={<PageTransition><BecomePartner /></PageTransition>} />
          <Route path="/support" element={<PageTransition><Support /></PageTransition>} />
          <Route path="/support/:categoryId" element={<PageTransition><SupportCategory /></PageTransition>} />
          <Route path="/privacy" element={<PageTransition><PrivacyPolicy /></PageTransition>} />
          <Route path="/terms" element={<PageTransition><TermsOfService /></PageTransition>} />
          <Route path="/install" element={<PageTransition><Install /></PageTransition>} />
          <Route path="/install/android" element={<PageTransition><InstallAndroid /></PageTransition>} />
          <Route path="/install/ios" element={<PageTransition><InstalliOS /></PageTransition>} />
          <Route path="/subscription-payment" element={<PageTransition><SubscriptionPaymentComponent /></PageTransition>} />
          <Route path="/order-summary" element={<PageTransition><OrderSummary /></PageTransition>} />
          <Route path="/privacy-policy" element={<PageTransition><PrivacyPolicy /></PageTransition>} />
          <Route path="/terms-of-service" element={<PageTransition><TermsOfService /></PageTransition>} />
          <Route path="/documentation" element={<PageTransition><Documentation /></PageTransition>} />
          <Route path="/documentations" element={<PageTransition><PlatformPresentation /></PageTransition>} />
          <Route path="/compatibility" element={<PageTransition><Compatibility /></PageTransition>} />
          <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
};

export default AnimatedRoutes;
