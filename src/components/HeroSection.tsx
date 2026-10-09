import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Hotel, Car, Plane, Train, Compass, ChevronDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import heroSlide1 from "@/assets/hero-slide-1.jpg";
import heroSlide2 from "@/assets/hero-slide-2.jpg";
import heroSlide3 from "@/assets/hero-slide-3.jpg";
import heroSlide4 from "@/assets/hero-slide-4.jpg";
import heroSlide5 from "@/assets/hero-slide-5.jpg";
import { FlightSearchForm } from "./FlightSearchForm";
import { HotelSearchForm } from "./HotelSearchForm";
import { FlightHotelSearchForm } from "./FlightHotelSearchForm";
import { CarSearchForm } from "./CarSearchForm";
import { TrainSearchForm } from "./TrainSearchForm";
import { StaySearchForm } from "./StaySearchForm";
import { useSiteConfigContext } from "@/contexts/SiteConfigContext";

const DEFAULT_SLIDES = [heroSlide1, heroSlide2, heroSlide3, heroSlide4, heroSlide5];

const SEARCH_TABS = [
  { value: "flight", labelKey: "nav.flights", icons: [Plane] },
  { value: "hotel", labelKey: "nav.hotels", icons: [Hotel] },
  { value: "flight-hotel", labelKey: "nav.flightHotel", icons: [Plane, Hotel] },
  { value: "car", labelKey: "nav.carRental", icons: [Car] },
  { value: "train", labelKey: "nav.trains", icons: [Train] },
  { value: "stays", labelKey: "nav.stays", icons: [Compass] },
] as const;

// Sur mobile, 3 onglets visibles + « Plus » (avant : 6 onglets dans une
// barre défilante sans barre de défilement, Trains et Séjours invisibles).
const MOBILE_VISIBLE_TABS = 3;
const MORE_TABS = SEARCH_TABS.slice(MOBILE_VISIBLE_TABS);

const TAB_TRIGGER_CLASS =
  "min-h-11 flex-1 sm:flex-none gap-1.5 py-2.5 px-2 sm:px-4 rounded-none border-b-2 border-transparent data-[state=active]:border-secondary data-[state=active]:bg-card data-[state=active]:text-secondary flex-shrink-0 scroll-snap-item text-sm font-medium";

/**
 * HeroSection - Clean, modern hero inspired by Upjunoo
 * Prominent search card with subtle background
 */
const HeroSection = () => {
  const { t, i18n } = useTranslation();
  // Le texte saisi dans l'admin est rédigé en français : dans les autres langues,
  // on affiche la traduction intégrée.
  const isFrench = i18n.language.startsWith("fr");
  const { config } = useSiteConfigContext();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeTab, setActiveTab] = useState("flight");
  const activeMoreTab = MORE_TABS.find((tab) => tab.value === activeTab);

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
      {/* Fond photo : hauteur dictée par le contenu (avant 60-75vh, la recherche
          passait sous la ligne de flottaison sur petit écran) */}
      <div className="relative flex items-center justify-center pt-10 pb-40 sm:pt-14 sm:pb-44 md:pt-20 md:pb-56">
        {heroSlides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 motion-reduce:!transition-none ${
              index === currentSlide ? "opacity-100 scale-105" : "opacity-0 scale-100"
            }`}
            style={{ transition: "opacity 1.2s ease, transform 6s ease-out" }}
            aria-hidden={index !== currentSlide}
          >
            <img
              src={slide}
              alt=""
              className="w-full h-full object-cover"
              loading={index === 0 ? "eager" : "lazy"}
            />
          </div>
        ))}
        {/* Golden Hour overlay: navy gradient + signature gold glow + horizon
            line over the real photo, instead of a generic black scrim. */}
        <div className="absolute inset-0 bg-gradient-to-b from-brand/75 via-brand/35 to-background/10" />
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(120% 90% at 15% 0%, hsl(var(--gold) / 0.28), transparent 55%)" }}
        />
        <div
          className="absolute left-0 right-0 h-px opacity-70"
          style={{ top: "60%", background: "linear-gradient(90deg, transparent, hsl(var(--gold) / 0.7), transparent)" }}
        />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-brand/85 via-brand/15 to-transparent" />
        
        <div className="relative z-10 container mx-auto px-4 text-center">
          <h1 className="font-display text-3xl sm:text-4xl md:text-6xl font-extrabold text-white mb-3 md:mb-5 drop-shadow-2xl tracking-tight text-balance animate-slide-up-fade">
            {(isFrench && config.hero.title) || t('hero.title')}
          </h1>
          <p className="text-base md:text-xl text-white/90 max-w-2xl mx-auto drop-shadow-lg font-medium leading-relaxed animate-slide-up-fade" style={{ animationDelay: '0.2s' }}>
            {(isFrench && config.hero.subtitle) || t('hero.subtitle')}
          </p>
        </div>

        {/* Slide indicators - More subtle */}
        <div className="absolute bottom-[7.5rem] sm:bottom-[8.5rem] md:bottom-[10.5rem] left-1/2 -translate-x-1/2 z-10 flex gap-1">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setCurrentSlide(index)}
              className="group flex h-6 items-center px-1"
              aria-label={`Image ${index + 1}`}
              aria-current={index === currentSlide}
            >
              <span
                className={`block h-1 rounded-full transition-all duration-slow ease-standard ${
                  index === currentSlide ? "w-10 bg-secondary" : "w-2 bg-white/50 group-hover:bg-white/80"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Search Card - Beautifully Floating */}
      <div className="container relative z-20 -mt-28 sm:-mt-32 md:-mt-40 pb-8 px-4">
        <div className="max-w-4xl mx-auto bg-card text-card-foreground rounded-2xl sm:rounded-3xl shadow-xl border border-border overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full h-auto p-0 bg-muted/50 flex justify-start overflow-x-auto rounded-none gap-0 scroll-snap-x border-b border-border">
              {SEARCH_TABS.map(({ value, labelKey, icons }, index) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className={cn(TAB_TRIGGER_CLASS, index >= MOBILE_VISIBLE_TABS && "hidden sm:inline-flex")}
                >
                  {icons.map((Icon, i) => (
                    <Icon key={i} className={icons.length > 1 ? "w-3.5 h-3.5" : "w-4 h-4"} aria-hidden="true" />
                  ))}
                  <span className="whitespace-nowrap">{t(labelKey)}</span>
                </TabsTrigger>
              ))}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      TAB_TRIGGER_CLASS,
                      "inline-flex items-center justify-center sm:hidden",
                      activeMoreTab && "border-secondary bg-card text-secondary",
                    )}
                    aria-label={t("hero.moreSearches", "Autres recherches")}
                  >
                    <span className="whitespace-nowrap">{activeMoreTab ? t(activeMoreTab.labelKey) : t("hero.more", "Plus")}</span>
                    <ChevronDown className="w-4 h-4" aria-hidden="true" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {MORE_TABS.map(({ value, labelKey, icons }) => (
                    <DropdownMenuItem key={value} onSelect={() => setActiveTab(value)} className="min-h-11 gap-2">
                      {icons.map((Icon, i) => (
                        <Icon key={i} className="w-4 h-4" aria-hidden="true" />
                      ))}
                      {t(labelKey)}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
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
            <TabsContent value="train" className="p-3 md:p-5">
              <TrainSearchForm />
            </TabsContent>
            <TabsContent value="stays" className="p-3 md:p-5">
              <StaySearchForm />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
