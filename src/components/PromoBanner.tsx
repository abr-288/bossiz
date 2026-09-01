import { useState, useEffect } from "react";
import { X, ArrowRight, Percent, Clock, Plane, Hotel, Car, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface PromoBannerData {
  id: string;
  icon: React.ReactNode;
  link: string;
  gradient: string;
}

const promoBanners: PromoBannerData[] = [
  {
    id: "flights",
    icon: <Plane className="w-4 h-4 text-white" />,
    link: "https://vols.bossiz.com/",
    gradient: "from-secondary via-secondary/90 to-primary"
  },
  {
    id: "hotels",
    icon: <Hotel className="w-4 h-4 text-white" />,
    link: "/hotels-partenaires",
    gradient: "from-emerald-600 via-emerald-500 to-teal-500"
  },
  {
    id: "cars",
    icon: <Car className="w-4 h-4 text-white" />,
    link: "/cars",
    gradient: "from-orange-600 via-orange-500 to-amber-500"
  },
  {
    id: "pack",
    icon: <Gift className="w-4 h-4 text-white" />,
    link: "/flight-hotel",
    gradient: "from-purple-600 via-purple-500 to-pink-500"
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
          className={`relative bg-gradient-to-r ${currentBanner.gradient}`}
        >
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }} />
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
