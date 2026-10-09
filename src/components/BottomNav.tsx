import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Bell, Compass, Home, Luggage, UserCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

// Navigation basse mobile (PWA et apps Android/iOS) : les destinations
// principales à portée de pouce au lieu du seul menu hamburger.
// Masquée dans les espaces métier (qui ont leur sidebar) et dans les étapes
// où une barre d'action collante occupe déjà le bas de l'écran.
const HIDDEN_PREFIXES = [
  "/admin",
  "/agency",
  "/company",
  "/bossiz",
  "/booking",
  "/flight-hotel/booking",
  "/payment",
  "/subscription-payment",
  "/order-summary",
  "/auth",
  "/forgot-password",
  "/reset-password",
];

const BOTTOM_NAV_HEIGHT = "4rem";

const BottomNav = () => {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setIsLoggedIn(!!session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => setIsLoggedIn(!!session));
    return () => subscription.unsubscribe();
  }, []);

  const hidden = HIDDEN_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`) || pathname.startsWith(`${prefix}-`));

  // Les éléments fixés en bas (chat, invites) lisent cette variable pour se
  // placer au-dessus de la barre ; le contenu de la page réserve sa hauteur.
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--bottom-nav-h", hidden ? "0px" : BOTTOM_NAV_HEIGHT);
    root.classList.toggle("has-bottom-nav", !hidden);
    return () => {
      root.style.setProperty("--bottom-nav-h", "0px");
      root.classList.remove("has-bottom-nav");
    };
  }, [hidden]);

  if (hidden) return null;

  const items = [
    { to: "/", label: t("bottomNav.home", "Accueil"), icon: Home, end: true },
    { to: "/destinations", label: t("bottomNav.explore", "Explorer"), icon: Compass },
    { to: isLoggedIn ? "/booking-history" : "/auth", label: t("bottomNav.trips", "Voyages"), icon: Luggage },
    { to: isLoggedIn ? "/price-alerts" : "/auth", label: t("bottomNav.alerts", "Alertes"), icon: Bell },
    { to: isLoggedIn ? "/account" : "/auth", label: t("bottomNav.account", "Compte"), icon: UserCircle2 },
  ];

  return (
    <nav
      aria-label={t("bottomNav.label", "Navigation principale")}
      className="fixed inset-x-0 bottom-0 z-bottom-nav border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <ul className="mx-auto grid h-16 max-w-lg grid-cols-5">
        {items.map(({ to, label, icon: Icon, end }) => (
          <li key={label}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex h-full flex-col items-center justify-center gap-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                  isActive ? "text-secondary" : "text-muted-foreground hover:text-foreground",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={cn("h-5 w-5", isActive && "stroke-[2.4]")} aria-hidden="true" />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default BottomNav;
