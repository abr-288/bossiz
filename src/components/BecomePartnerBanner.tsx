import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Handshake } from "lucide-react";
import { useTranslation } from "react-i18next";
import bannerHotels from "@/assets/banner-hotels.jpg";

const BecomePartnerBanner = () => {
  const { t } = useTranslation();

  return (
    <section className="py-10 md:py-14 w-full">
      <div className="site-container">
        <div className="relative overflow-hidden rounded-2xl px-6 py-10 md:px-12 md:py-12 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <img
            src={bannerHotels}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/90 to-primary/70" />
          <div className="relative flex flex-col md:flex-row items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gold/20 flex items-center justify-center flex-shrink-0">
              <Handshake className="w-7 h-7 text-gold-light" strokeWidth={2.2} />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-white">
                {t("pages.index.becomePartnerTitle", "Vous gérez un hôtel ?")}
              </h2>
              <p className="text-sm md:text-base text-white/80 mt-1">
                {t(
                  "pages.index.becomePartnerSubtitle",
                  "Listez-le sur B-Reserve et touchez de nouveaux clients, sans commission cachée."
                )}
              </p>
            </div>
          </div>
          <Button
            asChild
            size="lg"
            className="relative bg-gold text-gold-foreground hover:bg-gold/90 font-semibold flex-shrink-0"
          >
            <Link to="/devenir-partenaire">
              {t("pages.index.becomePartnerCta", "Devenir partenaire")}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default BecomePartnerBanner;
