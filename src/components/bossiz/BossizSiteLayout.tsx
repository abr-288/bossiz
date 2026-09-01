import { useState, ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Home, Phone, Mail, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import Logo from "@/components/Logo";

export type BossizCountry = "ci" | "sn";

interface BossizSiteLayoutProps {
  country: BossizCountry;
  activePage: "accueil" | "services" | "a-propos" | "formules";
  /** Sous-titre affiché sous le nom de marque ; éditable depuis l'admin
   * (site_config, clé bossiz_{country}_content). Retombe sur le texte par
   * défaut si le contenu n'est pas encore chargé. */
  tagline?: string;
  children: ReactNode;
}

// Identité visuelle distincte par pays : CI = vert fort + blanc + or,
// SN = palette bossiz.com (teal + navy + or). Toutes les classes sont
// écrites en toutes lettres pour que Tailwind les détecte statiquement.
const COUNTRY_ACCENT = {
  ci: {
    text: "text-bossiz-ci-green",
    textHover: "hover:text-bossiz-ci-green",
    bg: "bg-bossiz-ci-green",
    bgHover: "hover:bg-bossiz-ci-green-light",
    darkSection: "bg-bossiz-ci-green",
    paleSection: "bg-bossiz-ci-green-pale",
    border: "border-bossiz-ci-green",
    activeText: "text-bossiz-ci-green",
  },
  sn: {
    text: "text-bossiz-teal-dark",
    textHover: "hover:text-bossiz-teal-dark",
    bg: "bg-bossiz-teal-dark",
    bgHover: "hover:bg-bossiz-teal",
    darkSection: "bg-bossiz-navy-dark",
    paleSection: "bg-bossiz-cream-mint",
    border: "border-bossiz-teal-dark",
    activeText: "text-bossiz-teal-dark",
  },
} as const;

export function BossizSiteLayout({ country, activePage, tagline, children }: BossizSiteLayoutProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const basePath = `/bossiz-conciergerie-${country}`;
  const accent = COUNTRY_ACCENT[country];

  const brandName = t(`bossizSite.brandNameByCountry.${country}`);

  const NAV_ITEMS = [
    { id: "accueil", label: t("bossizSite.nav.home"), path: "" },
    { id: "services", label: t("bossizSite.nav.services"), path: "/services" },
    { id: "a-propos", label: t("bossizSite.nav.about"), path: "/a-propos" },
    { id: "formules", label: t("bossizSite.nav.plans"), path: "/formules" },
  ] as const;

  return (
    <div className="min-h-screen bg-white font-sans text-bossiz-navy-dark">
      {/* Header */}
      <header className="sticky top-0 w-full z-50 bg-white/95 backdrop-blur-sm border-b border-bossiz-cream-taupe/40">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="flex items-center justify-between h-20">
            <Link to={basePath} className="flex items-center gap-3 text-left">
              {/* Logo dans un badge blanc pour garantir sa visibilité quel que soit le fond */}
              <div className="w-12 h-12 rounded-xl bg-white border border-bossiz-cream-taupe/50 shadow-sm flex items-center justify-center p-1.5 flex-shrink-0">
                <Logo variant="dark" showWordmark={false} className="w-full h-full" />
              </div>
              <div>
                <span className={`font-bold text-xl tracking-tight ${accent.text}`}>{brandName}</span>
                <span className="block text-[10px] tracking-[0.2em] uppercase text-bossiz-gold-dark">
                  {tagline ?? t("bossizSite.tagline")}
                </span>
              </div>
            </Link>

            <nav className="hidden lg:flex items-center gap-8">
              <button
                onClick={() => navigate("/")}
                className={`flex items-center gap-1.5 text-sm font-medium text-bossiz-navy-dark/60 ${accent.textHover} transition-colors`}
              >
                <Home className="w-3.5 h-3.5" /> {t("bossizSite.back")}
              </button>
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.id}
                  to={`${basePath}${item.path}`}
                  className={`text-sm font-medium transition-colors ${accent.textHover} ${
                    activePage === item.id ? accent.activeText : "text-bossiz-navy-dark/70"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="hidden lg:block">
              <Button
                className={`rounded-full ${accent.bg} text-white ${accent.bgHover} font-semibold text-sm px-6`}
                onClick={() => navigate("/support")}
              >
                {t("bossizSite.book")}
              </Button>
            </div>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 text-bossiz-navy-dark"
              aria-label={t("common.menu")}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {isMenuOpen && (
            <div className="lg:hidden py-6 border-t border-bossiz-cream-taupe/40">
              <nav className="flex flex-col gap-1">
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    navigate("/");
                  }}
                  className={`flex items-center gap-2 text-left px-2 py-3 text-sm font-medium text-bossiz-navy-dark/70 ${accent.textHover}`}
                >
                  <Home className="w-4 h-4" /> {t("bossizSite.backToPortal")}
                </button>
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.id}
                    to={`${basePath}${item.path}`}
                    onClick={() => setIsMenuOpen(false)}
                    className={`text-left px-2 py-3 text-sm font-medium ${accent.textHover} ${
                      activePage === item.id ? accent.activeText : "text-bossiz-navy-dark/70"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
                <Button
                  className={`mt-3 rounded-full ${accent.bg} text-white ${accent.bgHover} font-semibold text-sm`}
                  onClick={() => navigate("/support")}
                >
                  {t("bossizSite.book")}
                </Button>
              </nav>
            </div>
          )}
        </div>
      </header>

      <main>{children}</main>

      {/* Footer */}
      <footer className={`${accent.darkSection} text-white/70 py-16 border-t border-white/10`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center p-1 flex-shrink-0">
                  <Logo variant="dark" showWordmark={false} className="w-full h-full" />
                </div>
                <span className="font-bold text-xl text-bossiz-gold-light">{brandName}</span>
              </div>
              <p className="text-sm text-white/50">{tagline ?? t("bossizSite.tagline")}</p>
            </div>
            <div>
              <h4 className="text-xs uppercase tracking-widest text-white/40 mb-4">{t("bossizSite.footer.siteLabel")}</h4>
              <ul className="space-y-2 text-sm">
                {NAV_ITEMS.map((item) => (
                  <li key={item.id}>
                    <Link to={`${basePath}${item.path}`} className="hover:text-white">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs uppercase tracking-widest text-white/40 mb-4">{t("bossizSite.footer.companyLabel")}</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <button onClick={() => navigate("/")} className="hover:text-white">
                    {t("bossizSite.backToPortalBossiz")}
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs uppercase tracking-widest text-white/40 mb-4">{t("bossizPortal.nav.contact")}</h4>
              <ul className="space-y-2 text-sm">
                {country === "ci" ? (
                  <>
                    <li className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5" /> +225 07 01 67 60 09
                    </li>
                    <li className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5" /> contact@bossiz.com
                    </li>
                    <li className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5" /> Cocody Riviera, Abidjan
                    </li>
                  </>
                ) : (
                  <>
                    <li className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5" /> contact@bossiz.com
                    </li>
                    <li className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5" /> Dakar, Sénégal
                    </li>
                  </>
                )}
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-white/40">
              &copy; 2026 {brandName}. {t("bossizPortal.footer.allRightsReserved")}
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-xs text-white/40">
              <a href="/privacy" className="hover:text-white">{t("bossizPortal.footer.privacyPolicy")}</a>
              <a href="/terms" className="hover:text-white">{t("bossizPortal.footer.termsOfUse")}</a>
              <a href="/support" className="hover:text-white">{t("nav.support")}</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
