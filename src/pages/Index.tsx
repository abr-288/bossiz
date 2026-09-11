import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import DestinationsSection from "@/components/DestinationsSection";
import FeaturesSection from "@/components/FeaturesSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import Footer from "@/components/Footer";
import { AITravelAdvisor } from "@/components/AITravelAdvisor";
import FeaturedSubscriptions from "@/components/FeaturedSubscriptions";
import SpecialOffers from "@/components/SpecialOffers";
import { SeasonalSuggestions } from "@/components/SeasonalSuggestions";
import PromoBanner from "@/components/PromoBanner";
import { AdvertisementBanner } from "@/components/AdvertisementBanner";
import IOSDownloadSection from "@/components/iOSDownloadSection";
import BecomePartnerBanner from "@/components/BecomePartnerBanner";
import EditorialBanners from "@/components/EditorialBanners";
import { useTranslation } from "react-i18next";

const Index = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-muted/30 overflow-x-hidden">
      <Navbar />
      <main>
        {/* Navbar spacer - single bar on mobile, double on desktop */}
        <div className="pt-14 lg:pt-24" />
        
        {/* Promo Banner */}
        <PromoBanner />

        {/* Hero with integrated search */}
        <HeroSection />

        {/* Trust signals - raised above the fold, right after the hero */}
        <FeaturesSection />

        {/* Destination / Business Travel editorial banners */}
        <EditorialBanners />

        {/* Advertisement Banner */}
        <AdvertisementBanner />

        {/* Subscriptions */}
        <FeaturedSubscriptions />
        
        {/* Seasonal Suggestions - Widget card style */}
        <section className="py-8 md:py-12 w-full">
          <div className="site-container">
            <div className="mb-5">
              <h2 className="text-xl md:text-2xl font-bold text-foreground">
                {t("pages.index.seasonalTitle", "Suggestions Saisonnières")}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {t("pages.index.seasonalSubtitle", "Découvrez les meilleures périodes pour voyager")}
              </p>
            </div>
            <SeasonalSuggestions />
          </div>
        </section>
        
        {/* Popular Destinations */}
        <DestinationsSection />
        
        {/* Mobile App Download Section */}
        <IOSDownloadSection />
        
        {/* Special Offers */}
        <SpecialOffers />
        
        {/* AI Travel Advisor - Widget card */}
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
        
        {/* Testimonials */}
        <TestimonialsSection />

        {/* Become a partner CTA */}
        <BecomePartnerBanner />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
