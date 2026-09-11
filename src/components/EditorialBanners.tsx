import { Link } from "react-router-dom";
import { Compass, Briefcase, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";

/**
 * Bannières éditoriales de la proposition "Golden Hour" : dégradés signature
 * (or/terracotta/marine pour les destinations, jade pour le voyage
 * d'affaires) plutôt que des photos de banque d'images. Aucun prix ni
 * destination précise n'est affiché ici - ce sont des points d'entrée
 * éditoriaux, pas des offres, pour ne jamais afficher un tarif inventé.
 */
const EditorialBanners = () => {
  const { t } = useTranslation();

  return (
    <section className="py-8 md:py-12 w-full">
      <div className="site-container">
        <div className="grid grid-cols-1 md:grid-cols-[1.3fr_1fr] gap-4 md:gap-6">
          <Link
            to="/destinations"
            className="group relative overflow-hidden rounded-2xl min-h-[200px] md:min-h-[240px] flex items-end p-6 md:p-8 shadow-lg"
            style={{
              background: "linear-gradient(135deg, hsl(var(--gold)) 0%, hsl(6 62% 47%) 45%, hsl(var(--primary)) 100%)",
            }}
          >
            <div className="relative z-10 text-white">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-white/80 mb-2">
                <Compass className="w-3.5 h-3.5" />
                {t("editorialBanners.destination.eyebrow", "À découvrir")}
              </span>
              <h3 className="text-xl md:text-2xl font-bold mb-1">
                {t("editorialBanners.destination.title", "Explorez nos destinations")}
              </h3>
              <p className="text-sm text-white/85 max-w-md mb-4">
                {t(
                  "editorialBanners.destination.subtitle",
                  "Vols, hôtels et activités vérifiés, ville par ville."
                )}
              </p>
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold border-b border-white/40 group-hover:border-white transition-colors">
                {t("editorialBanners.destination.cta", "Voir les destinations")}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </div>
          </Link>

          <Link
            to="/entreprises"
            className="group relative overflow-hidden rounded-2xl min-h-[200px] md:min-h-[240px] flex flex-col justify-center p-6 md:p-8 shadow-lg"
            style={{
              background: "radial-gradient(140% 160% at 100% 0%, hsl(162 50% 46%) 0%, hsl(var(--secondary)) 45%, hsl(var(--primary)) 100%)",
            }}
          >
            <Briefcase className="w-6 h-6 text-white/70 mb-3" />
            <span className="text-xs font-semibold uppercase tracking-wide text-white/70 mb-1">
              {t("editorialBanners.business.eyebrow", "Voyages d'affaires")}
            </span>
            <h3 className="text-xl md:text-2xl font-bold text-white mb-1">
              {t("editorialBanners.business.title", "Bossiz Business Travel")}
            </h3>
            <p className="text-sm text-white/85 mb-4">
              {t(
                "editorialBanners.business.subtitle",
                "Facturation centralisée, validation en un clic."
              )}
            </p>
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-white border-b border-white/40 group-hover:border-white transition-colors w-fit">
              {t("editorialBanners.business.cta", "Découvrir l'offre entreprises")}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default EditorialBanners;
