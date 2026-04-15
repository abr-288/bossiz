import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Hotel, Car, Plane } from "lucide-react";
import heroSlide1 from "@/assets/hero-slide-1.jpg";
import heroSlide2 from "@/assets/hero-slide-2.jpg";
import heroSlide3 from "@/assets/hero-slide-3.jpg";
import heroSlide4 from "@/assets/hero-slide-4.jpg";
import heroSlide5 from "@/assets/hero-slide-5.jpg";
import { FlightSearchForm } from "./FlightSearchForm";
import { HotelSearchForm } from "./HotelSearchForm";
import { FlightHotelSearchForm } from "./FlightHotelSearchForm";
import { CarSearchForm } from "./CarSearchForm";
import { useSiteConfigContext } from "@/contexts/SiteConfigContext";

const DEFAULT_SLIDES = [heroSlide1, heroSlide2, heroSlide3, heroSlide4, heroSlide5];

/**
 * HeroSection - Clean, modern hero inspired by Upjunoo
 * Prominent search card with subtle background
 */
const HeroSection = () => {
  const { t } = useTranslation();
  const { config } = useSiteConfigContext();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeTab, setActiveTab] = useState("flight");

  const heroSlides = useMemo(() => {
    if (config.hero.slides && config.hero.slides.length > 0) {
      return config.hero.slides.map(slide => slide.image);
    }
    return DEFAULT_SLIDES;
  }, [config.hero.slides]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [heroSlides.length]);

  return (
    <section className="relative w-full overflow-hidden">
      {/* Background - Tall & Immersive */}
      <div className="relative min-h-[60vh] md:min-h-[75vh] flex items-center justify-center">
        {heroSlides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1500 ${
              index === currentSlide ? "opacity-100 scale-105" : "opacity-0 scale-100"
            } transition-transform duration-[5s] ease-out`}
          >
            <img
              src={slide}
              alt={`Travel destination ${index + 1}`}
              className="w-full h-full object-cover"
              loading={index === 0 ? "eager" : "lazy"}
            />
          </div>
        ))}
        {/* Deep, Premium Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-background/20" />
        <div className="absolute inset-0 bg-primary/10 mix-blend-multiply" />
        
        {/* Hero text - Larger & More Impactful */}
        <div className="relative z-10 container mx-auto px-4 text-center mt-[-10vh]">
          <h1 className="text-4xl md:text-7xl font-black text-white mb-6 drop-shadow-2xl tracking-tighter animate-slide-up-fade">
            {config.hero.title || t('hero.title')}
          </h1>
          <p className="text-lg md:text-2xl text-white/90 max-w-2xl mx-auto drop-shadow-lg font-medium leading-relaxed animate-slide-up-fade" style={{ animationDelay: '0.2s' }}>
            {config.hero.subtitle || t('hero.subtitle')}
          </p>
        </div>

        {/* Slide indicators - More subtle */}
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-10 flex gap-2">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-1 rounded-full transition-all duration-500 ${
                index === currentSlide 
                  ? 'w-10 bg-secondary shadow-lg shadow-secondary/50' 
                  : 'w-2 bg-white/30 hover:bg-white/60'
              }`}
              aria-label={`Slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Search Card - Beautifully Floating */}
      <div className="container relative z-20 -mt-28 sm:-mt-32 md:-mt-40 pb-8 px-4">
        <div className="max-w-4xl mx-auto bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-white/20 overflow-hidden scale-[1.02] transition-transform">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full h-auto p-0 bg-muted/50 flex justify-start overflow-x-auto rounded-none gap-0 scroll-snap-x border-b border-border">
              <TabsTrigger 
                value="flight" 
                className="gap-1.5 py-2.5 px-4 rounded-none border-b-2 border-transparent data-[state=active]:border-secondary data-[state=active]:bg-background data-[state=active]:text-secondary flex-shrink-0 scroll-snap-item text-sm font-medium"
              >
                <Plane className="w-4 h-4" />
                <span className="whitespace-nowrap">{t('nav.flights')}</span>
              </TabsTrigger>
              <TabsTrigger 
                value="hotel" 
                className="gap-1.5 py-2.5 px-4 rounded-none border-b-2 border-transparent data-[state=active]:border-secondary data-[state=active]:bg-background data-[state=active]:text-secondary flex-shrink-0 scroll-snap-item text-sm font-medium"
              >
                <Hotel className="w-4 h-4" />
                <span className="whitespace-nowrap">{t('nav.hotels')}</span>
              </TabsTrigger>
              <TabsTrigger 
                value="flight-hotel" 
                className="gap-1.5 py-2.5 px-4 rounded-none border-b-2 border-transparent data-[state=active]:border-secondary data-[state=active]:bg-background data-[state=active]:text-secondary flex-shrink-0 scroll-snap-item text-sm font-medium"
              >
                <Plane className="w-3.5 h-3.5" />
                <Hotel className="w-3.5 h-3.5" />
                <span className="whitespace-nowrap">{t('nav.flightHotel')}</span>
              </TabsTrigger>
              <TabsTrigger 
                value="car" 
                className="gap-1.5 py-2.5 px-4 rounded-none border-b-2 border-transparent data-[state=active]:border-secondary data-[state=active]:bg-background data-[state=active]:text-secondary flex-shrink-0 scroll-snap-item text-sm font-medium"
              >
                <Car className="w-4 h-4" />
                <span className="whitespace-nowrap">{t('nav.carRental')}</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="flight" className="p-3 md:p-5">
              <FlightSearchForm />
            </TabsContent>
            <TabsContent value="hotel" className="p-3 md:p-5">
              <HotelSearchForm />
            </TabsContent>
            <TabsContent value="flight-hotel" className="p-3 md:p-5">
              <FlightHotelSearchForm onSearch={() => {}} />
            </TabsContent>
            <TabsContent value="car" className="p-3 md:p-5">
              <CarSearchForm />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
