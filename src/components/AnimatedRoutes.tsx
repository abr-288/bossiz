import { Suspense, lazy } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import PageTransition from "./PageTransition";

// Lazy load route components for code splitting
const Index = lazy(() => import("@/pages/Index"));
const Flights = lazy(() => import("@/pages/Flights"));
const Hotels = lazy(() => import("@/pages/Hotels"));
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
const AdminSubscriptions = lazy(() => import("@/pages/admin/AdminSubscriptions"));
const AdminSubscriptionPlans = lazy(() => import("@/pages/admin/AdminSubscriptionPlans"));
const AdminPromotions = lazy(() => import("@/pages/admin/AdminPromotions"));
const AdminEmailTemplates = lazy(() => import("@/pages/AdminEmailTemplates"));
const AdminConfiguration = lazy(() => import("@/pages/admin/AdminConfiguration"));
const AdminAgencies = lazy(() => import("@/pages/admin/AdminAgencies"));
const AdminCommissions = lazy(() => import("@/pages/admin/AdminCommissions"));
const AdminAdvertisements = lazy(() => import("@/pages/admin/AdminAdvertisements"));
const AdminPayments = lazy(() => import("@/pages/admin/AdminPayments"));
const AdminReviews = lazy(() => import("@/pages/admin/AdminReviews"));
const AdminNewsletter = lazy(() => import("@/pages/admin/AdminNewsletter"));
const AdminDestinations = lazy(() => import("@/pages/admin/AdminDestinations"));
const AdminContentManager = lazy(() => import("@/pages/AdminContentManager"));
const AgencyDashboard = lazy(() => import("@/pages/agency/AgencyDashboard"));
const AgencyServices = lazy(() => import("@/pages/agency/AgencyServices"));
const AgencyActivities = lazy(() => import("@/pages/agency/AgencyActivities"));
const AgencyStays = lazy(() => import("@/pages/agency/AgencyStays"));
const AgencyPromotions = lazy(() => import("@/pages/agency/AgencyPromotions"));
const AgencySettings = lazy(() => import("@/pages/agency/AgencySettings"));
const Help = lazy(() => import("@/pages/Help"));
const Support = lazy(() => import("@/pages/Support"));
const Install = lazy(() => import("@/pages/Install"));
const PriceAlerts = lazy(() => import("@/pages/PriceAlerts"));
const Subscriptions = lazy(() => import("@/pages/NewSubscriptions"));
const SubscriptionPaymentComponent = lazy(() => import("@/components/ModernSubscriptionPayment"));
const PaymentTest = lazy(() => import("@/pages/PaymentTest"));
const CinetPayTest = lazy(() => import("@/pages/ModernCinetPayTest"));
const PlansDebug = lazy(() => import("@/pages/PlansDebug"));
const SubscriptionsDebug = lazy(() => import("@/debug/subscriptions-debug"));
const MajesticPlansDebug = lazy(() => import("@/debug/majestic-plans-debug"));
const SupabaseAuthDebug = lazy(() => import("@/debug/supabase-auth-debug"));
const PrivacyPolicy = lazy(() => import("@/pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("@/pages/TermsOfService"));
const MajesticClub = lazy(() => import("@/pages/MajesticClub"));
const MajesticDashboard = lazy(() => import("@/pages/MajesticDashboard"));
const MajesticSubscriptionPage = lazy(() => import("@/pages/MajesticSubscriptionPage"));
const MajesticSubscriptionSuccess = lazy(() => import("@/pages/MajesticSubscriptionSuccess"));
const Documentation = lazy(() => import("@/pages/Documentation"));
const NotFound = lazy(() => import("@/pages/NotFound"));

// Loading fallback component
const PageLoader = () => (
  <div className="loader-container">
    <div className="loader-logo-wrapper">
      <div className="loader-ring"></div>
      <div className="loader-ring"></div>
      <img src="https://storage.googleapis.com/gpt-engineer-file-uploads/eELbhqThzPVCUnExIw7dfxcDOAj2/uploads/1761678567741-new_logo_bossizG.png" alt="B-Reserve Logo" className="loader-logo" />
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
          <Route path="/flights" element={<PageTransition><Flights /></PageTransition>} />
          <Route path="/hotels" element={<PageTransition><Hotels /></PageTransition>} />
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
          <Route path="/admin/subscriptions" element={<PageTransition><AdminSubscriptions /></PageTransition>} />
          <Route path="/admin/subscription-plans" element={<PageTransition><AdminSubscriptionPlans /></PageTransition>} />
          <Route path="/admin/promotions" element={<PageTransition><AdminPromotions /></PageTransition>} />
          <Route path="/admin/email-templates" element={<PageTransition><AdminEmailTemplates /></PageTransition>} />
          <Route path="/admin/configuration" element={<PageTransition><AdminConfiguration /></PageTransition>} />
          <Route path="/admin/agencies" element={<PageTransition><AdminAgencies /></PageTransition>} />
          <Route path="/admin/commissions" element={<PageTransition><AdminCommissions /></PageTransition>} />
          <Route path="/admin/advertisements" element={<PageTransition><AdminAdvertisements /></PageTransition>} />
          <Route path="/admin/payments" element={<PageTransition><AdminPayments /></PageTransition>} />
          <Route path="/admin/reviews" element={<PageTransition><AdminReviews /></PageTransition>} />
          <Route path="/admin/newsletter" element={<PageTransition><AdminNewsletter /></PageTransition>} />
          <Route path="/admin/destinations" element={<PageTransition><AdminDestinations /></PageTransition>} />
          <Route path="/admin/content" element={<PageTransition><AdminContentManager /></PageTransition>} />
          <Route path="/agency" element={<PageTransition><AgencyDashboard /></PageTransition>} />
          <Route path="/agency/services" element={<PageTransition><AgencyServices /></PageTransition>} />
          <Route path="/agency/activities" element={<PageTransition><AgencyActivities /></PageTransition>} />
          <Route path="/agency/stays" element={<PageTransition><AgencyStays /></PageTransition>} />
          <Route path="/agency/promotions" element={<PageTransition><AgencyPromotions /></PageTransition>} />
          <Route path="/agency/settings" element={<PageTransition><AgencySettings /></PageTransition>} />
          <Route path="/help" element={<PageTransition><Help /></PageTransition>} />
          <Route path="/support" element={<PageTransition><Support /></PageTransition>} />
          <Route path="/install" element={<PageTransition><Install /></PageTransition>} />
          <Route path="/price-alerts" element={<PageTransition><PriceAlerts /></PageTransition>} />
          <Route path="/subscriptions" element={<PageTransition><Subscriptions /></PageTransition>} />
          <Route path="/subscription-payment" element={<PageTransition><SubscriptionPaymentComponent /></PageTransition>} />
          <Route path="/payment-test" element={<PageTransition><PaymentTest /></PageTransition>} />
          <Route path="/cinetpay-test" element={<PageTransition><CinetPayTest /></PageTransition>} />
          <Route path="/plans-debug" element={<PageTransition><PlansDebug /></PageTransition>} />
          <Route path="/subscriptions-debug" element={<PageTransition><SubscriptionsDebug /></PageTransition>} />
          <Route path="/majestic-plans-debug" element={<PageTransition><MajesticPlansDebug /></PageTransition>} />
          <Route path="/supabase-auth-debug" element={<PageTransition><SupabaseAuthDebug /></PageTransition>} />
          <Route path="/privacy" element={<PageTransition><PrivacyPolicy /></PageTransition>} />
          <Route path="/terms" element={<PageTransition><TermsOfService /></PageTransition>} />
          <Route path="/majestic-club" element={<PageTransition><MajesticClub /></PageTransition>} />
          <Route path="/majestic-dashboard" element={<PageTransition><MajesticDashboard /></PageTransition>} />
          <Route path="/majestic-subscription" element={<PageTransition><MajesticSubscriptionPage /></PageTransition>} />
          <Route path="/majestic-subscription-success" element={<PageTransition><MajesticSubscriptionSuccess /></PageTransition>} />
          <Route path="/documentation" element={<PageTransition><Documentation /></PageTransition>} />
          <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
};

export default AnimatedRoutes;
