import type { ReactNode } from "react";
import { LazyImage } from "@/components/ui/lazy-image";
import { cn } from "@/lib/utils";

interface PageHeroProps {
  image: string;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Contenu sous le sous-titre (recherche, boutons) */
  children?: ReactNode;
  className?: string;
}

/**
 * En-tête de page commun : photo, voile marine, titre et sous-titre centrés.
 * Même gabarit que les pages services (Vols, Hôtels, Restaurants…) pour que
 * toutes les pages paraissent appartenir au même site.
 */
export const PageHero = ({ image, title, subtitle, children, className }: PageHeroProps) => (
  <div className={cn("relative overflow-hidden bg-brand py-16 md:py-24", className)}>
    <LazyImage src={image} alt="" className="absolute inset-0 h-full w-full object-cover" />
    <div className="absolute inset-0 bg-gradient-to-b from-brand/75 via-brand/60 to-brand/80" />
    <div className="site-container relative z-10 text-center">
      <h1 className="mb-4 text-4xl font-bold text-white drop-shadow-lg md:text-6xl">{title}</h1>
      {subtitle && <p className="mx-auto max-w-2xl text-lg text-white/95 md:text-xl">{subtitle}</p>}
      {children && <div className="mt-8">{children}</div>}
    </div>
  </div>
);
