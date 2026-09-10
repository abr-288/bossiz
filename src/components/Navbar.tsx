// Barre de navigation principale de l'application
// Gère la navigation, l'authentification et les menus responsive
import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Menu, User, LogOut, LayoutDashboard, Plane, Hotel, PlaneTakeoff,
  Train, Calendar, Car, HelpCircle, UserCircle2,
  MapPin, Compass, ChevronDown, Search, UtensilsCrossed, Hammer
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { usePWA } from "@/hooks/usePWA";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import Logo from "./Logo";
import LanguageSwitcher from "./LanguageSwitcher";
import DarkModeToggle from "./DarkModeToggle";
import { useSiteConfigContext } from "@/contexts/SiteConfigContext";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false); // État du menu mobile
  const [isLoggedIn, setIsLoggedIn] = useState(false); // État de connexion utilisateur
  const [isScrolled, setIsScrolled] = useState(false); // État du scroll pour l'effet d'ombre
  const { isAdmin, loading: roleLoading } = useUserRole(); // Rôle de l'utilisateur
  const { isInstallable, isInstalled, install } = usePWA(); // État PWA
  const { config } = useSiteConfigContext(); // Configuration du site
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  // Vérifie si le chemin actuel correspond au chemin donné
  const isActive = (path: string) => location.pathname === path;

  // Lien interne (SPA) ou externe (nouvel onglet) selon la cible
  const ServiceLink = ({ to, className, onClick, children }: {
    to: string; className?: string; onClick?: () => void; children: React.ReactNode;
  }) => {
    if (to.startsWith("http")) {
      return (
        <a href={to} target="_blank" rel="noopener noreferrer" onClick={onClick} className={className}>
          {children}
        </a>
      );
    }
    return (
      <Link to={to} onClick={onClick} className={className}>
        {children}
      </Link>
    );
  };

  // Liens vers les services de l'application
  const serviceLinks = [
    { to: "https://vols.bossiz.com/", icon: Plane, label: t("nav.flights") },
    { to: "/hotels-partenaires", icon: Hotel, label: t("nav.hotels") },
    { to: "/flight-hotel", icon: PlaneTakeoff, label: t("nav.flightHotel") },
    { to: "/cars", icon: Car, label: t("nav.carRental") },
    { to: "/trains", icon: Train, label: t("nav.trains") },
    { to: "/events", icon: Calendar, label: t("nav.events") },
    { to: "/destinations", icon: MapPin, label: t("nav.destinations") },
    { to: "/stays", icon: Compass, label: t("nav.stays") },
    { to: "/restaurants", icon: UtensilsCrossed, label: t("nav.restaurants") },
    { to: "/artisans", icon: Hammer, label: t("nav.artisans") },
  ];

  // Verticaux principaux affichés directement, le reste regroupé sous "Autres"
  // pour éviter une rangée plate de 8 items dans la barre de navigation.
  const primaryServiceLinks = serviceLinks.slice(0, 4);
  const moreServiceLinks = serviceLinks.slice(4);

  // Effet pour détecter le scroll et ajouter l'ombre
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fermer le menu mobile lors de la navigation
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  // Vérifier l'état de connexion utilisateur
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setIsLoggedIn(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Gérer la déconnexion de l'utilisateur
  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success(t("nav.logoutSuccess"));
    navigate("/");
    setIsMenuOpen(false);
  };

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
      isScrolled ? "shadow-md" : "shadow-sm"
    )}>
      {/* Main Bar - Upjunoo style: clean white with centered search */}
      <div className="bg-background border-b border-border">
        <div className="max-w-[1200px] mx-auto px-4">
          <div className="flex items-center justify-between h-14 gap-4">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 flex-shrink-0">
              {config.branding.logoDark ? (
                <img
                  src={config.branding.logoDark}
                  alt={`${config.branding.siteName} Logo`}
                  className="h-9 w-auto dark:hidden"
                />
              ) : (
                <Logo variant="dark" showWordmark={false} className="h-9 w-auto dark:hidden" />
              )}
              {config.branding.logoLight ? (
                <img
                  src={config.branding.logoLight}
                  alt={`${config.branding.siteName} Logo`}
                  className="h-9 w-auto hidden dark:block"
                />
              ) : (
                <Logo variant="light" showWordmark={false} className="h-9 w-auto hidden dark:block" />
              )}
              <span className="font-bold text-lg text-foreground hidden sm:inline">
                {config.branding.siteName}
              </span>
            </Link>

            {/* Central Search Bar - Upjunoo style */}
            <div className="hidden md:flex flex-1 max-w-lg mx-4">
              <div className="relative w-full group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={t('hero.searchPlaceholder', 'Recherchez vols, hôtels, destinations...')}
                  className="w-full h-9 pl-9 pr-20 rounded-full bg-muted/60 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all"
                  onFocus={() => { window.location.href = 'https://vols.bossiz.com/'; }}
                  readOnly
                />
                <Button
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/90 text-xs px-3 font-medium"
                  onClick={() => { window.location.href = 'https://vols.bossiz.com/'; }}
                >
                  {t('common.search', 'Rechercher')}
                </Button>
              </div>
            </div>

            {/* Right Actions */}
            <div className="hidden lg:flex items-center gap-1">
              {/* Support */}
              <Link to="/support">
                <Button variant="ghost" size="sm" aria-label={t("nav.support")} className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg">
                  <HelpCircle className="w-4 h-4" />
                </Button>
              </Link>

              {/* Account */}
              {isLoggedIn ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
                    >
                      <UserCircle2 className="w-5 h-5" />
                      <span className="hidden xl:inline text-sm">{t("nav.myAccount")}</span>
                      <ChevronDown className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52 z-50">
                    <DropdownMenuLabel>{t("nav.myAccount")}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="flex items-center gap-2 cursor-pointer">
                          <LayoutDashboard className="w-4 h-4" />
                          {t("nav.admin")}
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                      <Link to="/account" className="flex items-center gap-2 cursor-pointer">
                        <UserCircle2 className="w-4 h-4" />
                        {t("nav.profile")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard" className="flex items-center gap-2 cursor-pointer">
                        <LayoutDashboard className="w-4 h-4" />
                        {t("nav.dashboard")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
                    >
                      <LogOut className="w-4 h-4" />
                      {t("nav.logout")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link to="/auth">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 rounded-full border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground text-sm font-medium"
                  >
                    <User className="w-4 h-4" />
                    {t("nav.login")}
                  </Button>
                </Link>
              )}

              {/* Theme & Language */}
              <div className="flex items-center gap-0.5 pl-1.5 ml-1 border-l border-border">
                <DarkModeToggle variant="compact" className="text-muted-foreground hover:bg-muted" />
                <LanguageSwitcher />
              </div>
            </div>

            {/* Mobile */}
            <div className="lg:hidden flex items-center gap-1">
              <DarkModeToggle variant="compact" className="text-muted-foreground" />
              <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <SheetTrigger asChild>
                  <button className="p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors" aria-label="Menu">
                    <Menu className="w-5 h-5" />
                  </button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80 p-0 overflow-y-auto">
                  <SheetHeader className="p-4 border-b border-border">
                    <SheetTitle className="text-left">{config.branding.siteName}</SheetTitle>
                  </SheetHeader>

                  <div className="p-4 space-y-6">
                    {isLoggedIn ? (
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                          {t("nav.myAccount")}
                        </p>
                        <Link to="/account" onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                          <UserCircle2 className="w-5 h-5 text-muted-foreground" />
                          <span className="font-medium">{t("nav.profile")}</span>
                        </Link>
                        <Link to="/dashboard" onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                          <LayoutDashboard className="w-5 h-5 text-muted-foreground" />
                          <span className="font-medium">{t("nav.dashboard")}</span>
                        </Link>
                        {isAdmin && (
                          <Link to="/admin" onClick={() => setIsMenuOpen(false)}
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                            <LayoutDashboard className="w-5 h-5 text-primary" />
                            <span className="font-medium text-primary">{t("nav.admin")}</span>
                          </Link>
                        )}
                      </div>
                    ) : (
                      <Link to="/auth" onClick={() => setIsMenuOpen(false)}>
                        <Button className="w-full gap-2 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/90">
                          <User className="w-4 h-4" />
                          {t("nav.login")} / {t("nav.register")}
                        </Button>
                      </Link>
                    )}

                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        Nos Services
                      </p>
                      {serviceLinks.map(({ to, icon: Icon, label }) => (
                        <ServiceLink
                          key={to}
                          to={to}
                          onClick={() => setIsMenuOpen(false)}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg transition-colors",
                            isActive(to)
                              ? "bg-secondary/10 text-secondary font-medium"
                              : "hover:bg-muted text-foreground"
                          )}
                        >
                          <Icon className="w-5 h-5" />
                          <span>{label}</span>
                        </ServiceLink>
                      ))}
                    </div>

                    <Link to="/support" onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                      <HelpCircle className="w-5 h-5 text-muted-foreground" />
                      <span className="font-medium">{t("nav.support")}</span>
                    </Link>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <span className="text-sm font-medium">Langue</span>
                      <LanguageSwitcher />
                    </div>

                    {isLoggedIn && (
                      <Button
                        variant="outline"
                        className="w-full gap-2 text-destructive border-destructive/30 hover:bg-destructive/10 rounded-lg"
                        onClick={handleLogout}
                      >
                        <LogOut className="w-4 h-4" />
                        {t("nav.logout")}
                      </Button>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>

      {/* Second Level: Service Tabs - Upjunoo category style */}
      <div className="hidden lg:block bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-[1200px] mx-auto px-4">
          <div className="flex items-center gap-0.5 h-10 overflow-x-auto">
            {primaryServiceLinks.map(({ to, icon: Icon, label }) => (
              <ServiceLink
                key={to}
                to={to}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200",
                  isActive(to)
                    ? "bg-secondary/15 text-secondary border border-secondary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </ServiceLink>
            ))}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200",
                    moreServiceLinks.some(({ to }) => isActive(to))
                      ? "bg-secondary/15 text-secondary border border-secondary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {t("nav.others")}
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="z-50">
                {moreServiceLinks.map(({ to, icon: Icon, label }) => (
                  <DropdownMenuItem key={to} asChild>
                    <ServiceLink to={to} className="flex items-center gap-2 cursor-pointer">
                      <Icon className="w-4 h-4" />
                      {label}
                    </ServiceLink>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
