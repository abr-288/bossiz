import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import DestinationsSection from "@/components/DestinationsSection";
import FeaturesSection from "@/components/FeaturesSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import Footer from "@/components/Footer";
import { AITravelAdvisor } from "@/components/AITravelAdvisor";
import { Boss } from "@/components/Boss";
import FeaturedSubscriptions from "@/components/FeaturedSubscriptions";
import SpecialOffers from "@/components/SpecialOffers";
import { SeasonalSuggestions } from "@/components/SeasonalSuggestions";
import PromoBanner from "@/components/PromoBanner";
import { AdvertisementBanner } from "@/components/AdvertisementBanner";
import iOSDownloadSection from "@/components/iOSDownloadSection";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Globe, 
  MapPin, 
  ArrowRight,
  Crown,
  Anchor,
  Sparkles
} from "lucide-react";
import { useBossizConfigContext } from "@/contexts/BossizConfigContext";

const Index = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { sites, globalConfig, loading: bossizLoading } = useBossizConfigContext();
  
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
        
        {/* Advertisement Banner */}
        <AdvertisementBanner />

        {/* Features - Card widget style */}
        <FeaturesSection />
        
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
        
        {/* Bossiz Portal Section - Dynamique */}
        <section className="py-12 md:py-16 bg-gradient-to-br from-blue-50 via-white to-green-50">
          <div className="site-container">
            <div className="text-center mb-8">
              <Badge className="mb-4 bg-blue-100 text-blue-800 border-blue-200">
                <Sparkles className="w-4 h-4 mr-2" />
                Services Premium
              </Badge>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                {globalConfig.hero.title || 'BOSSIZ Conciergerie'}
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                {globalConfig.hero.description || 'Découvrez nos services de conciergerie premium en Côte d\'Ivoire et au Sénégal'}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {sites.map((site) => (
                <Card 
                  key={site.id}
                  className={`${site.bgColor} ${site.borderColor} hover:shadow-lg transition-all`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`w-12 h-12 bg-gradient-to-br ${site.color} rounded-xl flex items-center justify-center text-white flex-shrink-0`}>
                        {site.id === 'cote-d-ivoire' ? <Crown className="w-6 h-6" /> : <Anchor className="w-6 h-6" />}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-foreground mb-2">{site.title}</h3>
                        <p className="text-muted-foreground text-sm mb-3">
                          {site.subtitle}
                        </p>
                        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-3">
                          <MapPin className="w-4 h-4" />
                          <span>{site.location}</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="text-sm text-muted-foreground">Services:</div>
                      <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                        {site.features.slice(0, 4).map((feature, index) => (
                          <div key={index}>· {feature}</div>
                        ))}
                      </div>
                    </div>
                    <Button 
                      className={`w-full bg-gradient-to-r ${site.color} text-white hover:shadow-lg transition-all`}
                      onClick={() => navigate(site.route)}
                    >
                      Visiter {site.id === 'cote-d-ivoire' ? 'Bossiz CI' : 'Bossiz SN'}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="text-center">
              <Button 
                variant="outline"
                className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50"
                onClick={() => navigate('/bossiz-portal')}
              >
                <Globe className="w-4 h-4 mr-2" />
                Voir le Portail Complet
              </Button>
            </div>
          </div>
        </section>
        
        {/* Popular Destinations */}
        <DestinationsSection />
        
        {/* Mobile App Download Section */}
        <iOSDownloadSection />
        
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
      </main>
      <Footer />
      <Boss />
    </div>
  );
};

export default Index;
