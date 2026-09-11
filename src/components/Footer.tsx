import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Facebook, Twitter, Instagram, Youtube, Mail, Linkedin, Download } from "lucide-react";
import Logo from "./Logo";
import { useState } from "react";
import { useNewsletterSubscribe } from "@/hooks/useNewsletterSubscribe";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useSiteConfigContext } from "@/contexts/SiteConfigContext";

const Footer = () => {
  const { config } = useSiteConfigContext();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const { subscribe, loading } = useNewsletterSubscribe();

  // Fonction pour installer l'app depuis le footer (compatible tous appareils)
  const handleAppInstall = () => {
    const appStoreUrl = "https://apps.apple.com/app/b-reserve/id123456789";
    const playStoreUrl = "https://play.google.com/store/apps/details?id=com.breserve.app";
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    if (isIOS) {
      window.open(appStoreUrl, '_blank');
      setTimeout(() => {
        alert('Redirection vers l\'App Store en cours...');
      }, 500);
    } else if (isAndroid) {
      window.open(playStoreUrl, '_blank');
      setTimeout(() => {
        alert('Redirection vers Google Play en cours...');
      }, 500);
    } else {
      // Pour desktop, rediriger vers la page d'installation
      window.location.href = '/install';
    }
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error(t("footer.newsletter.emailRequired"));
      return;
    }

    const result = await subscribe(email);
    
    if (result) {
      toast.success(result.message || t("footer.newsletter.subscribeSuccess"));
      setEmail("");
    } else {
      toast.error(t("footer.newsletter.subscribeError"));
    }
  };

  // Fond marine fixe : bg-primary/border-primary-light basculeraient vers le vert
  // accent en mode sombre, ce footer doit garder la même identité dans les deux modes.
  return (
    <footer className="bg-[hsl(225,45%,18%)] border-t border-[hsl(225,45%,28%)] w-full">
      <div className="site-container py-8 md:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mb-6 md:mb-8">
          {/* Brand Section */}
          <div className="space-y-3 md:space-y-4 text-center sm:text-left">
            <div className="flex items-center gap-2 md:gap-3 justify-center sm:justify-start">
              {config.branding.logoLight ? (
                <img
                  src={config.branding.logoLight}
                  alt={`${config.branding.siteName} Logo`}
                  className="h-10 md:h-12 w-auto"
                  loading="lazy"
                />
              ) : (
                <Logo variant="light" showWordmark={false} className="h-10 md:h-12 w-auto" />
              )}
              <span className="text-xl md:text-2xl font-bold text-white">
                {config.branding.siteName}
              </span>
            </div>
            <p className="text-white/80 text-sm">
              {config.branding.tagline || t("footer.description")}
            </p>
            <div className="flex gap-2 md:gap-3 justify-center sm:justify-start">
              {config.social.facebook && (
                <a href={config.social.facebook} target="_blank" rel="noopener noreferrer">
                  <Button size="icon" variant="outline" className="rounded-full h-8 w-8 md:h-10 md:w-10 bg-transparent text-white border-white/20 hover:bg-white hover:text-primary transition-colors">
                    <Facebook className="w-3 h-3 md:w-4 md:h-4" />
                  </Button>
                </a>
              )}
              {config.social.twitter && (
                <a href={config.social.twitter} target="_blank" rel="noopener noreferrer">
                  <Button size="icon" variant="outline" className="rounded-full h-8 w-8 md:h-10 md:w-10 bg-transparent text-white border-white/20 hover:bg-white hover:text-primary transition-colors">
                    <Twitter className="w-3 h-3 md:w-4 md:h-4" />
                  </Button>
                </a>
              )}
              {config.social.instagram && (
                <a href={config.social.instagram} target="_blank" rel="noopener noreferrer">
                  <Button size="icon" variant="outline" className="rounded-full h-8 w-8 md:h-10 md:w-10 bg-transparent text-white border-white/20 hover:bg-white hover:text-primary transition-colors">
                    <Instagram className="w-3 h-3 md:w-4 md:h-4" />
                  </Button>
                </a>
              )}
              {config.social.youtube && (
                <a href={config.social.youtube} target="_blank" rel="noopener noreferrer">
                  <Button size="icon" variant="outline" className="rounded-full h-8 w-8 md:h-10 md:w-10 bg-transparent text-white border-white/20 hover:bg-white hover:text-primary transition-colors">
                    <Youtube className="w-3 h-3 md:w-4 md:h-4" />
                  </Button>
                </a>
              )}
              {config.social.linkedin && (
                <a href={config.social.linkedin} target="_blank" rel="noopener noreferrer">
                  <Button size="icon" variant="outline" className="rounded-full h-8 w-8 md:h-10 md:w-10 bg-transparent text-white border-white/20 hover:bg-white hover:text-primary transition-colors">
                    <Linkedin className="w-3 h-3 md:w-4 md:h-4" />
                  </Button>
                </a>
              )}
            </div>
          </div>

          {/* Services */}
          <div className="text-center sm:text-left">
            <h3 className="font-bold text-white mb-3 md:mb-4 text-sm md:text-base">{t("footer.services")}</h3>
            <ul className="space-y-2 md:space-y-3 text-sm">
              <li>
                <a href="https://vols.bossiz.com/" target="_blank" rel="noopener noreferrer" className="text-white/80 hover:text-secondary transition-smooth">
                  {t("footer.flights")}
                </a>
              </li>
              <li>
                <Link to="/hotels-partenaires" className="text-white/80 hover:text-secondary transition-smooth">
                  {t("footer.hotels")}
                </Link>
              </li>
              <li>
                <Link to="/flight-hotel" className="text-white/80 hover:text-secondary transition-smooth">
                  {t("footer.flightHotel")}
                </Link>
              </li>
              <li>
                <Link to="/cars" className="text-white/80 hover:text-secondary transition-smooth">
                  {t("footer.cars")}
                </Link>
              </li>
              <li>
                <Link to="/stays" className="text-white/80 hover:text-secondary transition-smooth">
                  {t("footer.stays")}
                </Link>
              </li>
              <li>
                <Link to="/activities" className="text-white/80 hover:text-secondary transition-smooth">
                  {t("footer.activities")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="text-center sm:text-left">
            <h3 className="font-bold text-white mb-3 md:mb-4 text-sm md:text-base">{t("footer.support")}</h3>
            <ul className="space-y-2 md:space-y-3 text-sm">
              <li>
                <Link to="/help" className="text-white/80 hover:text-secondary transition-smooth">
                  {t("footer.help")}
                </Link>
              </li>
              <li>
                <Link to="/help" className="text-white/80 hover:text-secondary transition-smooth">
                  {t("footer.faq")}
                </Link>
              </li>
              <li>
                <Link to="/support" className="text-white/80 hover:text-secondary transition-smooth">
                  {t("nav.support")}
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-white/80 hover:text-secondary transition-smooth">
                  {t("footer.contact")}
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-white/80 hover:text-secondary transition-smooth">
                  Tableau de bord
                </Link>
              </li>
              <li>
                <Link to="/compatibility" className="text-white/80 hover:text-secondary transition-smooth">
                  Compatibilité
                </Link>
              </li>
              <li>
                <Link to="/partenaires/voitures" className="text-white/80 hover:text-secondary transition-smooth">
                  Devenir partenaire voiture
                </Link>
              </li>
              <li>
                <Link to="/entreprises" className="text-white/80 hover:text-secondary transition-smooth">
                  Espace Entreprises
                </Link>
              </li>
              <li>
                <Link to="/artisans" className="text-white/80 hover:text-secondary transition-smooth">
                  Artisans locaux
                </Link>
              </li>
              <li>
                <Button
                  onClick={handleAppInstall}
                  className="bg-gradient-to-r from-black to-gray-900 text-white hover:from-gray-800 hover:to-gray-700 transition-colors duration-300 shadow-lg font-bold py-3 px-4 border-2 border-white hover:border-gray-200 rounded-lg text-sm"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {t("common.install")}
                </Button>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          {config.footer.showNewsletter && (
            <div className="text-center sm:text-left">
              <h3 className="font-bold text-white mb-3 md:mb-4 text-sm md:text-base">
                {config.footer.newsletterTitle || t("footer.newsletter.title")}
              </h3>
              <p className="text-white/80 text-xs md:text-sm mb-3 md:mb-4">
                {t("footer.newsletter.description")}
              </p>
              <form onSubmit={handleNewsletterSubmit} className="space-y-2">
                <div className="flex gap-2">
                  <Input 
                    placeholder={t("footer.newsletter.placeholder")}
                    type="email" 
                    className="flex-1 text-sm"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                  <Button type="submit" className="bg-secondary hover:bg-secondary/90 text-primary h-9 md:h-10" disabled={loading}>
                    <Mail className="w-3 h-3 md:w-4 md:h-4" />
                  </Button>
                </div>
                <p className="text-xs text-white/70">
                  {t("footer.privacy")}
                </p>
              </form>
            </div>
          )}
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-primary-light flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <p className="text-white/80 text-sm">
            {config.footer.copyright || `© ${new Date().getFullYear()} ${config.branding.siteName}. ${t("footer.rights")}.`}
          </p>
          <div className="flex flex-wrap justify-center gap-4 md:gap-6 text-sm">
            <Link to="/support" className="text-white/80 hover:text-secondary transition-smooth">
              {t("footer.about")}
            </Link>
            <Link to="/terms" className="text-white/80 hover:text-secondary transition-smooth">
              {t("footer.terms")}
            </Link>
            <Link to="/privacy" className="text-white/80 hover:text-secondary transition-smooth">
              {t("footer.privacy")}
            </Link>
            <Link to="/help" className="text-white/80 hover:text-secondary transition-smooth">
              {t("footer.help")}
            </Link>
            <Link to="/install" className="text-secondary hover:text-secondary/80 transition-smooth font-semibold">
              📱 {t("common.install")}
            </Link>
            <Link to="/bossiz-portal" className="text-white/80 hover:text-secondary transition-smooth">
              {t("footer.bossizGroup")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
