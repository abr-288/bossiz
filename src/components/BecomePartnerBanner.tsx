import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Handshake } from "lucide-react";
import { useTranslation } from "react-i18next";

const BecomePartnerBanner = () => {
  const { t } = useTranslation();

  return (
    <section className="py-10 md:py-14 w-full">
      <div className="site-container">
        <div className="rounded-2xl bg-[#192443] px-6 py-10 md:px-12 md:py-12 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#00F59B]/15 flex items-center justify-center flex-shrink-0">
              <Handshake className="w-7 h-7 text-[#00F59B]" strokeWidth={2.2} />
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
            className="bg-[#00F59B] text-[#192443] hover:bg-[#00F59B]/90 font-semibold flex-shrink-0"
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
