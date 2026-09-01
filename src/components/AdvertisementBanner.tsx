import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

interface Advertisement {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  link_url: string | null;
  link_text: string | null;
  background_color: string | null;
  text_color: string | null;
}

export function AdvertisementBanner() {
  const { t } = useTranslation();
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAds = async () => {
      const { data, error } = await supabase
        .from("advertisements")
        .select("*")
        .eq("is_active", true)
        .eq("position", "homepage_before_subscriptions")
        .order("sort_order", { ascending: true });

      if (!error && data && data.length > 0) {
        setAds(data);
      }
      setLoading(false);
    };

    fetchAds();
  }, []);

  useEffect(() => {
    if (ads.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ads.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [ads.length]);

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + ads.length) % ads.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % ads.length);
  };

  if (loading || ads.length === 0) return null;

  const currentAd = ads[currentIndex];
  const bgColor = currentAd.background_color || "#1e3a5f";
  const textColor = currentAd.text_color || "#ffffff";

  return (
    <section className="w-full py-6 md:py-10">
      <div className="site-container">
        <div 
          className="relative rounded-2xl overflow-hidden shadow-xl"
          style={{ backgroundColor: bgColor }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentAd.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col md:flex-row items-center"
            >
              {/* Image */}
              {currentAd.image_url && (
                <div className="w-full md:w-2/5 h-48 md:h-64 overflow-hidden">
                  <img
                    src={currentAd.image_url}
                    alt={currentAd.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              )}
              
              {/* Content */}
              <div 
                className="flex-1 p-6 md:p-10 text-center md:text-left"
                style={{ color: textColor }}
              >
                <h3 className="text-2xl md:text-3xl font-bold mb-3">
                  {currentAd.title}
                </h3>
                {currentAd.description && (
                  <p className="text-base md:text-lg opacity-90 mb-5">
                    {currentAd.description}
                  </p>
                )}
                {currentAd.link_url && (
                  <Button
                    asChild
                    size="lg"
                    className="bg-white text-gray-900 hover:bg-gray-100"
                  >
                    <Link to={currentAd.link_url}>
                      {currentAd.link_text || t('common.learnMore')}
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation arrows */}
          {ads.length > 1 && (
            <>
              <button
                onClick={goToPrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                style={{ color: textColor }}
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                style={{ color: textColor }}
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          {/* Dots indicator */}
          {ads.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {ads.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    index === currentIndex
                      ? "bg-white w-6"
                      : "bg-white/40 hover:bg-white/60"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default AdvertisementBanner;
