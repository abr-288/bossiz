import { Capacitor } from "@capacitor/core";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import DestinationsSection from "@/components/DestinationsSection";
import FeaturesSection from "@/components/FeaturesSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import Footer from "@/components/Footer";
import { AITravelAdvisor } from "@/components/AITravelAdvisor";
import FeaturedSubscriptions from "@/components/FeaturedSubscriptions";
import IOSDownloadSection from "@/components/iOSDownloadSection";
import OffersCarousel from "@/components/OffersCarousel";
import { usePWA } from "@/hooks/usePWA";
import { useTranslation } from "react-i18next";

// Accueil en 8 sections (audit UI/UX) : recherche, réassurance, offres du
// moment (bandeau promo + publicités + promotions + éditorial regroupés), destinations, abonnements,
// conseiller IA, témoignages, application. Les suggestions saisonnières sont
// retirées de l'accueil ; « Devenir partenaire » reste accessible depuis le
// pied de page.
const Index = () => {
  const { t } = useTranslation();
  const { isInstalled } = usePWA();
  // Inutile de proposer l'application à qui l'utilise déjà (PWA installée ou app native).
  const showAppSection = !isInstalled && !Capacitor.isNativePlatform();

  return (
    <div className="min-h-screen bg-muted/30 overflow-x-hidden">
      <Navbar />
      <main>
        {/* Navbar spacer - single bar on mobile, double on desktop */}
        <div className="pt-14 lg:pt-24" />


        {/* 1. Recherche */}
        <HeroSection />

        {/* 2. Réassurance */}
        <FeaturesSection />

        {/* 3. Offres du moment : publicités, promotions, offres de service et éditorial dans un seul carrousel */}
        <OffersCarousel />

        {/* 4. Destinations populaires */}
        <DestinationsSection />

        {/* 5. Abonnements */}
        <FeaturedSubscriptions />

        {/* 6. Conseiller IA */}
        <section className="py-8 md:py-12 w-full">
          <div className="site-container max-w-4xl">
            <div className="mb-5">
              <h2 className="text-xl md:text-2xl font-bold text-foreground">
                {t("pages.index.aiTitle")}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {t("pages.index.aiSubtitle")}
              </p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4 md:p-6 shadow-sm">
              <AITravelAdvisor />
            </div>
          </div>
        </section>

        {/* 7. Témoignages */}
        <TestimonialsSection />

        {/* 8. Application mobile (masquée si déjà installée) */}
        {showAppSection && <IOSDownloadSection />}
      </main>
      <Footer />
    </div>
  );
};

export default Index;
