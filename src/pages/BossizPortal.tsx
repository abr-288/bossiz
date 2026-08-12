import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  MapPin,
  Phone,
  Mail,
  Menu,
  X,
  ChevronRight,
  CheckCircle,
  Award,
  Users,
  Globe,
  Star,
  Shield,
  Zap,
  Heart,
  Headphones,
  Plane,
  Building,
  Car,
  Calendar,
  Utensils,
  Crown,
} from "lucide-react";
import { useBossizConfigContext } from "@/contexts/BossizConfigContext";
import { useTranslation } from "react-i18next";

const ICON_MAP: Record<string, React.ElementType> = {
  Award,
  Users,
  Globe,
  Star,
  Shield,
  Zap,
  Heart,
  Headphones,
};

const SERVICE_ICON_MAP: Record<string, React.ElementType> = {
  voyage: Plane,
  immobilier: Building,
  transport: Car,
  evenements: Calendar,
  hotellerie: Utensils,
  "services-vip": Crown,
};

const BossizPortal = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const NAV_LINKS = [
    { id: "sites", label: t("bossizPortal.nav.sites") },
    { id: "services", label: t("bossizPortal.nav.services") },
    { id: "values", label: t("bossizPortal.nav.values") },
    { id: "contact", label: t("bossizPortal.nav.contact") },
  ];
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { sites, globalConfig } = useBossizConfigContext();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    setIsMenuOpen(false);
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-bossiz-cream font-sans text-bossiz-navy-dark">
      {/* Header */}
      <header
        className={`fixed top-0 w-full z-50 transition-colors duration-300 ${
          scrolled ? "bg-bossiz-cream/95 backdrop-blur-sm shadow-sm" : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="flex items-center justify-between h-20">
            <button onClick={() => scrollToSection("sites")} className="text-left">
              <span className={`font-serif text-2xl tracking-wide ${scrolled ? "text-bossiz-teal-dark" : "text-white"}`}>
                BOSSIZ
              </span>
              <span
                className={`block text-[10px] tracking-[0.35em] uppercase ${
                  scrolled ? "text-bossiz-gold-dark" : "text-bossiz-gold-light"
                }`}
              >
                {t("bossizPortal.headerTagline")}
              </span>
            </button>

            <nav className="hidden lg:flex items-center gap-10">
              {NAV_LINKS.map((link) => (
                <button
                  key={link.id}
                  onClick={() => scrollToSection(link.id)}
                  className={`text-xs uppercase tracking-[0.2em] font-medium transition-colors hover:text-bossiz-gold ${
                    scrolled ? "text-bossiz-navy-dark" : "text-white/90"
                  }`}
                >
                  {link.label}
                </button>
              ))}
            </nav>

            <div className="hidden lg:block">
              <Button
                className="rounded-sm bg-bossiz-gold text-bossiz-navy-dark hover:bg-bossiz-gold-light font-semibold uppercase tracking-widest text-xs px-6 py-5"
                onClick={() => navigate("/")}
              >
                {t("bossizPortal.reservations")}
              </Button>
            </div>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`lg:hidden p-2 ${scrolled ? "text-bossiz-navy-dark" : "text-white"}`}
              aria-label={t("common.menu", "Menu")}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {isMenuOpen && (
            <div className="lg:hidden py-6 border-t border-bossiz-taupe/30 bg-bossiz-cream">
              <nav className="flex flex-col gap-1">
                {NAV_LINKS.map((link) => (
                  <button
                    key={link.id}
                    onClick={() => scrollToSection(link.id)}
                    className="text-left px-2 py-3 text-sm uppercase tracking-wider text-bossiz-navy-dark hover:text-bossiz-gold-dark"
                  >
                    {link.label}
                  </button>
                ))}
                <Button
                  className="mt-3 rounded-sm bg-bossiz-gold text-bossiz-navy-dark hover:bg-bossiz-gold-light font-semibold uppercase tracking-widest text-xs"
                  onClick={() => navigate("/")}
                >
                  Réservations
                </Button>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-b from-bossiz-navy-dark to-bossiz-teal-dark overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, rgb(255 255 255) 1px, transparent 1px)",
            backgroundSize: "36px 36px",
          }}
        />
        <div className="relative max-w-5xl mx-auto px-6 py-32 text-center">
          <p className="text-bossiz-gold-light text-xs md:text-sm uppercase tracking-[0.4em] mb-8">
            {t("bossizPortal.hero.eyebrow")}
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl md:text-7xl text-white leading-tight mb-6">
            {t("bossizPortal.hero.title", globalConfig.hero.title)}
            <span className="block text-bossiz-gold-light">{t("bossizPortal.hero.subtitle", globalConfig.hero.subtitle)}</span>
          </h1>
          <div className="w-16 h-px bg-bossiz-gold mx-auto mb-6" />
          <p className="text-lg md:text-xl text-white/70 italic mb-16 max-w-2xl mx-auto font-light">
            {t("bossizPortal.hero.description", globalConfig.hero.description)}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto mb-16">
            {globalConfig.globalStats.map((stat, index) => {
              const Icon = ICON_MAP[stat.icon] || Crown;
              return (
                <div key={index}>
                  <Icon className="w-5 h-5 text-bossiz-gold-light mx-auto mb-3" strokeWidth={1.25} />
                  <div className="font-serif text-2xl md:text-3xl text-bossiz-gold-light mb-1">{stat.value}</div>
                  <div className="text-white/50 text-[10px] uppercase tracking-[0.2em]">
                    {t(`bossizPortal.stats.${index}`, stat.label)}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="rounded-sm bg-bossiz-gold text-bossiz-navy-dark hover:bg-bossiz-gold-light font-semibold uppercase tracking-widest text-xs px-10 py-6"
              onClick={() => navigate("/bossiz-conciergerie-ci")}
            >
              <MapPin className="w-4 h-4 mr-2" />
              Bossiz Côte d'Ivoire
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-sm border-white/30 text-white hover:bg-white/10 font-semibold uppercase tracking-widest text-xs px-10 py-6"
              onClick={() => navigate("/bossiz-conciergerie-sn")}
            >
              <MapPin className="w-4 h-4 mr-2" />
              Bossiz Sénégal
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Sites */}
      <section id="sites" className="py-28 bg-bossiz-cream">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="text-center mb-20 max-w-3xl mx-auto">
            <p className="text-bossiz-gold-dark text-xs uppercase tracking-[0.35em] mb-4">{t("bossizPortal.sites.eyebrow")}</p>
            <h2 className="font-serif text-3xl md:text-5xl text-bossiz-navy-dark mb-6">
              {t("bossizPortal.sites.title")}
            </h2>
            <p className="text-bossiz-navy-dark/60 leading-relaxed">
              {t("bossizPortal.sites.subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {sites.map((site) => (
              <Card key={site.id} className="rounded-sm border-0 border-t-2 border-t-bossiz-gold shadow-md bg-white">
                <CardContent className="p-10">
                  <div className="w-14 h-14 rounded-full border border-bossiz-teal/30 flex items-center justify-center mb-6">
                    <MapPin className="w-6 h-6 text-bossiz-teal" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-serif text-2xl text-bossiz-navy-dark mb-1">{t(`bossizPortal.sites.${site.id}.title`, site.title)}</h3>
                  <p className="text-sm font-medium text-bossiz-gold-dark mb-3">{t(`bossizPortal.sites.${site.id}.subtitle`, site.subtitle)}</p>
                  <p className="text-sm text-bossiz-navy-dark/60 italic mb-4">"{t(`bossizPortal.sites.${site.id}.tagline`, site.tagline)}"</p>
                  <p className="text-sm text-bossiz-navy-dark/70 leading-relaxed mb-4">{t(`bossizPortal.sites.${site.id}.description`, site.description)}</p>
                  <div className="flex items-center gap-2 text-xs text-bossiz-navy-dark/60 mb-6">
                    <MapPin className="w-3.5 h-3.5" />
                    {t(`bossizPortal.sites.${site.id}.location`, site.location)}
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-6">
                    {site.features.slice(0, 6).map((feature, idx) => (
                      <div key={feature} className="flex items-start gap-2 text-xs text-bossiz-navy-dark/70">
                        <CheckCircle className="w-3.5 h-3.5 text-bossiz-gold-dark shrink-0 mt-0.5" />
                        {t(`bossizPortal.sites.${site.id}.features.${idx}`, feature)}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-4 gap-3 mb-8 pt-6 border-t border-bossiz-taupe/20">
                    {site.stats.map((stat, index) => {
                      const Icon = ICON_MAP[stat.icon] || Crown;
                      return (
                        <div key={index} className="text-center">
                          <Icon className="w-4 h-4 text-bossiz-teal mx-auto mb-1" strokeWidth={1.5} />
                          <div className="font-serif text-lg text-bossiz-navy-dark">{stat.value}</div>
                          <div className="text-[9px] text-bossiz-navy-dark/50 uppercase tracking-wide">
                            {t(`bossizPortal.sites.${site.id}.stats.${index}`, stat.label)}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <Button
                    className="w-full rounded-sm bg-bossiz-teal-dark text-white hover:bg-bossiz-teal font-semibold uppercase tracking-widest text-xs py-5"
                    onClick={() => navigate(site.route)}
                  >
                    {t("bossizPortal.visitSite")}
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Global services */}
      <section id="services" className="py-28 bg-bossiz-navy-dark">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="text-center mb-20 max-w-3xl mx-auto">
            <p className="text-bossiz-gold-light text-xs uppercase tracking-[0.35em] mb-4">{t("bossizPortal.nav.services")}</p>
            <h2 className="font-serif text-3xl md:text-5xl text-white mb-6">
              {t("bossizPortal.services.title")}
            </h2>
            <p className="text-white/60 leading-relaxed">
              {t("bossizPortal.services.subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {globalConfig.services.map((service) => {
              const Icon = SERVICE_ICON_MAP[service.id] || Crown;
              return (
                <Card key={service.id} className="rounded-sm border border-white/10 bg-white/[0.03]">
                  <CardContent className="p-8">
                    <div className="w-14 h-14 rounded-full border border-bossiz-gold/40 flex items-center justify-center mb-6">
                      <Icon className="w-6 h-6 text-bossiz-gold-light" strokeWidth={1.5} />
                    </div>
                    <h3 className="font-serif text-xl text-white mb-2">{t(`bossizPortal.services.${service.id}.title`, service.title)}</h3>
                    <p className="text-sm text-white/60 mb-5">{t(`bossizPortal.services.${service.id}.description`, service.description)}</p>
                    <ul className="space-y-2 mb-6">
                      {service.features.map((feature, idx) => (
                        <li key={feature} className="flex items-start gap-2 text-xs text-white/50">
                          <span className="mt-1.5 w-1 h-1 rounded-full bg-bossiz-gold shrink-0" />
                          {t(`bossizPortal.services.${service.id}.features.${idx}`, feature)}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => navigate("/support")}
                      className="text-xs font-semibold uppercase tracking-wider text-bossiz-gold-light hover:text-bossiz-gold inline-flex items-center gap-1"
                    >
                      {t("common.learnMore")} <ChevronRight className="w-3 h-3" />
                    </button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Values */}
      <section id="values" className="py-28 bg-bossiz-cream">
        <div className="max-w-6xl mx-auto px-6 lg:px-10">
          <div className="text-center mb-20 max-w-3xl mx-auto">
            <p className="text-bossiz-gold-dark text-xs uppercase tracking-[0.35em] mb-4">{t("bossizPortal.nav.values")}</p>
            <h2 className="font-serif text-3xl md:text-5xl text-bossiz-navy-dark mb-6">
              {t("bossizPortal.values.title")}
            </h2>
            <p className="text-bossiz-navy-dark/60 leading-relaxed">
              {t("bossizPortal.values.subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            {globalConfig.companyValues.map((value) => {
              const Icon = ICON_MAP[value.icon] || Crown;
              return (
                <div key={value.id} className="text-center">
                  <div className="w-16 h-16 rounded-full border border-bossiz-gold/40 flex items-center justify-center mx-auto mb-6">
                    <Icon className="w-7 h-7 text-bossiz-gold-dark" strokeWidth={1.25} />
                  </div>
                  <h3 className="font-serif text-xl text-bossiz-navy-dark mb-3">{t(`bossizPortal.values.${value.id}.title`, value.title)}</h3>
                  <p className="text-sm text-bossiz-navy-dark/60 leading-relaxed">{t(`bossizPortal.values.${value.id}.description`, value.description)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-28 bg-bossiz-teal-dark">
        <div className="max-w-6xl mx-auto px-6 lg:px-10">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <p className="text-bossiz-gold-light text-xs uppercase tracking-[0.35em] mb-4">{t("bossizPortal.nav.contact")}</p>
            <h2 className="font-serif text-3xl md:text-5xl text-white mb-6">
              {t("bossizPortal.contact.title")}
            </h2>
            <p className="text-white/60 leading-relaxed">
              {t("bossizPortal.contact.subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
            {sites.map((site) => (
              <Card key={site.id} className="rounded-sm border-0 bg-white">
                <CardContent className="p-8">
                  <h3 className="font-serif text-2xl text-bossiz-navy-dark mb-1">{t(`bossizPortal.sites.${site.id}.title`, site.title)}</h3>
                  <p className="text-sm text-bossiz-gold-dark font-medium mb-6">{t(`bossizPortal.sites.${site.id}.subtitle`, site.subtitle)}</p>
                  <div className="space-y-3 mb-8">
                    <div className="flex items-center gap-3 text-sm text-bossiz-navy-dark/80">
                      <Phone className="w-4 h-4 text-bossiz-teal shrink-0" /> {site.contact.phone}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-bossiz-navy-dark/80">
                      <Mail className="w-4 h-4 text-bossiz-teal shrink-0" /> {site.contact.email}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-bossiz-navy-dark/80">
                      <MapPin className="w-4 h-4 text-bossiz-teal shrink-0" /> {site.contact.address}
                    </div>
                  </div>
                  <Button
                    className="w-full rounded-sm bg-bossiz-navy-dark text-white hover:bg-bossiz-teal-dark font-semibold uppercase tracking-widest text-xs py-5"
                    onClick={() => navigate(site.route)}
                  >
                    {t("bossizPortal.visit")} {t(`bossizPortal.sites.${site.id}.title`, site.title)}
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center border border-white/10 rounded-sm p-10 max-w-3xl mx-auto">
            <h3 className="font-serif text-2xl text-white mb-4">{t("bossizPortal.quickAccess.title")}</h3>
            <p className="text-white/60 mb-8">
              {t("bossizPortal.quickAccess.subtitle")}
            </p>
            <Button
              size="lg"
              className="rounded-sm bg-bossiz-gold text-bossiz-navy-dark hover:bg-bossiz-gold-light font-semibold uppercase tracking-widest text-xs px-10 py-6"
              onClick={() => navigate("/")}
            >
              {t("bossizPortal.quickAccess.cta")}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-bossiz-navy-dark text-white/70 py-16 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            <div>
              <span className="font-serif text-2xl text-bossiz-gold-light">BOSSIZ</span>
              <p className="text-xs uppercase tracking-[0.3em] text-white/40 mb-4">{t("bossizPortal.footer.groupTagline")}</p>
              <p className="text-sm text-white/50">
                {t("bossizPortal.footer.description")}
              </p>
            </div>
            <div>
              <h4 className="text-xs uppercase tracking-widest text-white/40 mb-4">{t("bossizPortal.nav.sites")}</h4>
              <ul className="space-y-2 text-sm">
                {sites.map((site) => (
                  <li key={site.id}>
                    <button onClick={() => navigate(site.route)} className="hover:text-white">
                      {t(`bossizPortal.sites.${site.id}.title`, site.title)}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs uppercase tracking-widest text-white/40 mb-4">{t("bossizPortal.nav.services")}</h4>
              <ul className="space-y-2 text-sm">
                {globalConfig.services.slice(0, 4).map((service) => (
                  <li key={service.id}>{t(`bossizPortal.services.${service.id}.title`, service.title)}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs uppercase tracking-widest text-white/40 mb-4">{t("bossizPortal.footer.contactGroup")}</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> group@bossiz.com</li>
                <li className="flex items-center gap-2"><Globe className="w-3.5 h-3.5" /> www.bossiz.com</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-white/40">&copy; 2026 BOSSIZ Group. {t("bossizPortal.footer.allRightsReserved")}</p>
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
};

export default BossizPortal;
