import { useState, useEffect } from "react";
import { X, ArrowRight, Percent, Clock, Plane, Hotel, Car, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import bannerFlights from "@/assets/banner-flights.jpg";
import bannerHotels from "@/assets/banner-hotels.jpg";
import bannerCars from "@/assets/banner-cars.jpg";
import bannerFlightHotel from "@/assets/banner-flight-hotel.jpg";

interface PromoBannerData {
  id: string;
  icon: React.ReactNode;
  link: string;
  image: string;
  gradient: string;
}

// Dégradés composés uniquement des couleurs Golden Hour (marine / jade / or)
// - fini le vert-orange-violet arc-en-ciel qui ne correspondait à aucune
// des couleurs de marque.
const promoBanners: PromoBannerData[] = [
  {
    id: "flights",
    icon: <Plane className="w-4 h-4 text-white" />,
    link: "https://vols.bossiz.com/",
    image: bannerFlights,
    gradient: "from-primary/95 via-primary/85 to-secondary/80"
  },
  {
    id: "hotels",
    icon: <Hotel className="w-4 h-4 text-white" />,
    link: "/hotels-partenaires",
    image: bannerHotels,
    gradient: "from-secondary/95 via-secondary/85 to-primary/80"
  },
  {
    id: "cars",
    icon: <Car className="w-4 h-4 text-white" />,
    link: "/cars",
    image: bannerCars,
    gradient: "from-gold-dark/95 via-gold/80 to-primary/80"
  },
  {
    id: "pack",
    icon: <Gift className="w-4 h-4 text-white" />,
    link: "/flight-hotel",
    image: bannerFlightHotel,
    gradient: "from-primary/95 via-primary/85 to-gold/75"
  }
];

const PromoBanner = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!isVisible) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % promoBanners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  const currentBanner = promoBanners[currentIndex];

  return (
    <div className="relative overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentBanner.id}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.3 }}
          className="relative"
        >
          {/* Photo de fond propre à chaque offre, assombrie par un dégradé
              aux couleurs Golden Hour pour garder le texte blanc lisible. */}
          <div className="absolute inset-0">
            <img
              src={currentBanner.image}
              alt=""
              aria-hidden="true"
              className="w-full h-full object-cover"
            />
            <div className={`absolute inset-0 bg-gradient-to-r ${currentBanner.gradient}`} />
          </div>

          <div className="site-container relative">
            <div className="flex items-center justify-between py-2 sm:py-2.5 gap-2 sm:gap-4">
              {/* Content */}
              <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                {/* Icon badge */}
                <div className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm shrink-0">
                  {currentBanner.icon}
                </div>

                {/* Text */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-3 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-white/20 text-[10px] sm:text-xs font-bold text-white uppercase tracking-wide shrink-0">
                      {t(`promoBanner.${currentBanner.id}.badge`)}
                    </span>
                    <span className="text-white font-semibold text-xs sm:text-sm truncate">
                      {t(`promoBanner.${currentBanner.id}.title`)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-white/80">
                    <Clock className="w-3 h-3 shrink-0" />
                    <span className="text-[10px] sm:text-xs truncate">
                      {t(`promoBanner.${currentBanner.id}.subtitle`)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Dots indicator */}
              <div className="hidden md:flex items-center gap-1">
                {promoBanners.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      index === currentIndex
                        ? "bg-white w-3"
                        : "bg-white/40 hover:bg-white/60"
                    }`}
                    aria-label={`${t('promoBanner.bannerLabel')} ${index + 1}`}
                  />
                ))}
              </div>

              {/* CTA Button */}
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  if (currentBanner.link.startsWith("http")) {
                    window.location.href = currentBanner.link;
                  } else {
                    navigate(currentBanner.link);
                  }
                }}
                className="shrink-0 h-7 sm:h-8 px-2.5 sm:px-4 text-[10px] sm:text-xs font-semibold bg-white text-primary hover:bg-white/90 shadow-lg"
              >
                <span className="hidden sm:inline">{t(`promoBanner.${currentBanner.id}.ctaText`)}</span>
                <span className="sm:hidden">{t('promoBanner.viewShort')}</span>
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>

              {/* Close button */}
              <button
                onClick={() => setIsVisible(false)}
                className="shrink-0 p-1 rounded-full hover:bg-white/10 transition-colors"
                aria-label={t('promoBanner.close')}
              >
                <X className="w-4 h-4 text-white/70 hover:text-white" />
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default PromoBanner;
