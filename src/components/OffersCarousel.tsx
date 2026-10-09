import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, Briefcase, ChevronLeft, ChevronRight, Clock, Compass, MapPin, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LazyImage } from "@/components/ui/lazy-image";
import { Skeleton } from "@/components/ui/skeleton";
import { Price } from "@/components/ui/price";
import { BookingDialog } from "@/components/BookingDialog";
import { cn } from "@/lib/utils";

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

interface Promotion {
  id: string;
  name: string;
  location: string;
  image_url: string | null;
  discount: number;
  original_price: number;
  currency: string;
  expires_at: string | null;
  rating: number;
}

type BookableService = {
  id: string;
  name: string;
  price_per_unit: number;
  currency: string;
  type: string;
  location: string;
};

const daysUntil = (expiresAt: string | null) => {
  if (!expiresAt) return 7;
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.max(1, Math.ceil(diff / 86_400_000));
};

// Cartes de même gabarit pour tous les types de contenu
const SLIDE_CLASS =
  "flex w-[85%] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm sm:w-[calc((100%-1.5rem)/2)] lg:w-[calc((100%-3rem)/3)]";

/**
 * « Offres du moment » : publicités (admin), promotions et entrées éditoriales
 * réunies dans un seul carrousel (avant : trois blocs empilés aux styles
 * différents). Défilement au doigt ou par les flèches, sans défilement
 * automatique.
 */
const OffersCarousel = () => {
  const { t } = useTranslation();
  const trackRef = useRef<HTMLUListElement>(null);
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<BookableService | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      supabase
        .from("advertisements")
        .select("*")
        .eq("is_active", true)
        .eq("position", "homepage_before_subscriptions")
        .order("sort_order", { ascending: true }),
      supabase.from("promotions").select("*").eq("is_active", true).order("created_at", { ascending: false }).limit(6),
    ]).then(([adsRes, promoRes]) => {
      if (cancelled) return;
      if (!adsRes.error && adsRes.data) setAds(adsRes.data as Advertisement[]);
      if (!promoRes.error && promoRes.data) setPromotions(promoRes.data as Promotion[]);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const scrollBy = (direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * track.clientWidth * 0.9, behavior: "smooth" });
  };

  return (
    <section aria-labelledby="offers-title" className="w-full py-10 md:py-14">
      {selectedService && <BookingDialog open={dialogOpen} onOpenChange={setDialogOpen} service={selectedService} />}
      <div className="site-container">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 id="offers-title" className="text-xl font-bold text-foreground md:text-2xl">
              {t("ux.home.offersTitle")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("offers.subtitle")}</p>
          </div>
          <div className="hidden gap-2 md:flex">
            <Button variant="outline" size="icon" onClick={() => scrollBy(-1)} aria-label={t("ux.offers.previous")}>
              <ChevronLeft />
            </Button>
            <Button variant="outline" size="icon" onClick={() => scrollBy(1)} aria-label={t("ux.offers.next")}>
              <ChevronRight />
            </Button>
          </div>
        </div>

        <ul
          ref={trackRef}
          aria-roledescription={t("ux.offers.carousel")}
          className="-mx-4 flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-px-4 px-4 pb-2 hide-scrollbar"
        >
          {loading &&
            Array.from({ length: 3 }, (_, i) => (
              <li key={`s-${i}`} className={SLIDE_CLASS} aria-hidden="true">
                <Skeleton className="h-40 w-full rounded-none" />
                <div className="space-y-3 p-5">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-10 w-full rounded-full" />
                </div>
              </li>
            ))}

          {/* Publicités saisies dans l'admin (couleurs choisies par l'annonceur) */}
          {ads.map((ad) => (
            <li
              key={`ad-${ad.id}`}
              className={SLIDE_CLASS}
              style={{ backgroundColor: ad.background_color || undefined, color: ad.text_color || undefined }}
            >
              {ad.image_url && <LazyImage src={ad.image_url} alt="" className="h-40 w-full object-cover" />}
              <div className="flex flex-1 flex-col p-5">
                <Badge variant="outline" className="mb-2 w-fit border-current text-current">
                  {t("ux.offers.sponsored")}
                </Badge>
                <h3 className="text-lg font-bold">{ad.title}</h3>
                {ad.description && <p className="mt-1 text-sm opacity-90">{ad.description}</p>}
                {ad.link_url && (
                  <Button asChild className="mt-auto w-full bg-white text-brand hover:bg-white/90">
                    <Link to={ad.link_url} className="mt-4">
                      {ad.link_text || t("common.learnMore")}
                      <ArrowRight />
                    </Link>
                  </Button>
                )}
              </div>
            </li>
          ))}

          {/* Promotions */}
          {promotions.map((promo) => {
            const discounted = Number(promo.original_price) * (1 - promo.discount / 100);
            return (
              <li key={`promo-${promo.id}`} className={SLIDE_CLASS}>
                <div className="relative h-40">
                  <LazyImage src={promo.image_url || "/placeholder.svg"} alt="" className="h-full w-full object-cover" />
                  <Badge className="absolute right-3 top-3 border-0 bg-gold text-gold-foreground text-sm">-{promo.discount}%</Badge>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="line-clamp-2 text-lg font-bold text-foreground">{promo.name}</h3>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" aria-hidden="true" />
                    {promo.location}
                  </p>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1 font-semibold">
                      <Star className="h-4 w-4 fill-gold text-gold" aria-hidden="true" />
                      {Number(promo.rating || 0).toFixed(1)}
                    </span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-4 w-4" aria-hidden="true" />
                      {t("ux.offers.daysLeft", { count: daysUntil(promo.expires_at) })}
                    </span>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="t-price text-xl text-foreground">
                      <Price amount={discounted} fromCurrency={promo.currency} showLoader />
                    </span>
                    <span className="text-sm text-muted-foreground line-through">
                      <Price amount={Number(promo.original_price)} fromCurrency={promo.currency} />
                    </span>
                  </div>
                  <Button
                    className="mt-auto w-full"
                    onClick={() => {
                      setSelectedService({
                        id: promo.id,
                        name: promo.name,
                        price_per_unit: discounted,
                        currency: promo.currency,
                        type: "hotel",
                        location: promo.location,
                      });
                      setDialogOpen(true);
                    }}
                  >
                    {t("offers.bookNow")}
                    <ArrowRight />
                  </Button>
                </div>
              </li>
            );
          })}

          {/* Entrées éditoriales (pas de prix : jamais de tarif inventé) */}
          {!loading && (
            <>
              <li className={cn(SLIDE_CLASS, "border-0 bg-brand text-brand-foreground")}>
                <Link to="/destinations" className="group flex flex-1 flex-col justify-end p-6">
                  <Compass className="mb-auto h-8 w-8 text-gold" aria-hidden="true" />
                  <span className="mt-8 text-xs font-semibold uppercase tracking-wide text-white/75">
                    {t("ux.editorial.destinationEyebrow")}
                  </span>
                  <h3 className="mt-1 text-xl font-bold">{t("ux.editorial.destinationTitle")}</h3>
                  <p className="mt-1 text-sm text-white/85">{t("ux.editorial.destinationSubtitle")}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold">
                    {t("ux.editorial.destinationCta")}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </span>
                </Link>
              </li>
              <li className={cn(SLIDE_CLASS, "border-0 bg-secondary text-secondary-foreground")}>
                <Link to="/entreprises" className="group flex flex-1 flex-col justify-end p-6">
                  <Briefcase className="mb-auto h-8 w-8 opacity-80" aria-hidden="true" />
                  <span className="mt-8 text-xs font-semibold uppercase tracking-wide opacity-80">
                    {t("ux.editorial.businessEyebrow")}
                  </span>
                  <h3 className="mt-1 text-xl font-bold">{t("ux.editorial.businessTitle")}</h3>
                  <p className="mt-1 text-sm opacity-90">{t("ux.editorial.businessSubtitle")}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold">
                    {t("ux.editorial.businessCta")}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </span>
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </section>
  );
};

export default OffersCarousel;
