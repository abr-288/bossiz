import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LazyImage } from "@/components/ui/lazy-image";
import { CardGridSkeleton } from "@/components/ui/card-grid-skeleton";
import { EventCard } from "@/components/events/EventCard";
import { supabase } from "@/integrations/supabase/client";
import {
  EVENT_CATEGORIES,
  EVENT_LIST_COLUMNS,
  countryFlag,
  countryName,
  isoDate,
  useEventCountries,
  type EventCategory,
  type EventItem,
} from "@/lib/events";
import bannerEvents from "@/assets/banner-events.webp";
import { CalendarDays, Search, ShieldCheck, Sparkles, Ticket, Headphones } from "lucide-react";

const PAGE_SIZE = 24;

type Period = "all" | "weekend" | "month" | "3months";

const PERIODS: { value: Period; label: string }[] = [
  { value: "all", label: "Toutes les dates" },
  { value: "weekend", label: "Ce week-end" },
  { value: "month", label: "Dans les 30 jours" },
  { value: "3months", label: "Dans les 3 mois" },
];

function periodRange(period: Period): [string, string | null] {
  const today = new Date();
  const start = isoDate(today);
  if (period === "weekend") {
    const day = today.getDay(); // 0 = dimanche, 6 = samedi
    if (day === 0) return [start, start];
    const saturday = new Date(today);
    saturday.setDate(today.getDate() + (6 - day));
    const sunday = new Date(saturday);
    sunday.setDate(saturday.getDate() + 1);
    return [isoDate(saturday), isoDate(sunday)];
  }
  if (period === "month") return [start, isoDate(new Date(today.getTime() + 30 * 86_400_000))];
  if (period === "3months") return [start, isoDate(new Date(today.getTime() + 91 * 86_400_000))];
  return [start, null];
}

// Événements du monde entier (catalogue public.events, mis à jour chaque
// nuit) : recherche, filtres, sélection à la une, et achat des billets par la
// conciergerie depuis chaque fiche (/events/:slug).
const Events = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [debounced, setDebounced] = useState(query);
  const category = (searchParams.get("categorie") as EventCategory | null) ?? null;
  const country = searchParams.get("pays") ?? "all";
  const period = (searchParams.get("quand") as Period | null) ?? "all";
  const { data: countries = [] } = useEventCountries();

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 350);
    return () => clearTimeout(t);
  }, [query]);

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    setParam("q", debounced || null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const filtersActive = !!(debounced || category || country !== "all" || period !== "all");

  const featuredQuery = useQuery({
    queryKey: ["events", "featured"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select(EVENT_LIST_COLUMNS)
        .eq("is_featured", true)
        .eq("is_published", true)
        .gte("local_date", isoDate(new Date()))
        .neq("status", "cancelled")
        .order("highlight_score", { ascending: false, nullsFirst: false })
        .order("local_date")
        .limit(6);
      if (error) throw error;
      return (data || []) as unknown as EventItem[];
    },
    staleTime: 10 * 60_000,
  });

  const listQuery = useInfiniteQuery({
    queryKey: ["events", "list", debounced, category, country, period],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const [from, to] = periodRange(period);
      let q = supabase
        .from("events")
        .select(EVENT_LIST_COLUMNS, { count: "exact" })
        .eq("is_published", true)
        .gte("local_date", from)
        .order("local_date")
        .order("highlight_score", { ascending: false, nullsFirst: false })
        .range(pageParam * PAGE_SIZE, pageParam * PAGE_SIZE + PAGE_SIZE - 1);
      if (to) q = q.lte("local_date", to);
      if (category) q = q.eq("category", category);
      if (country !== "all") q = q.eq("country_code", country);
      if (debounced) {
        const term = debounced.replace(/[%,()]/g, " ").trim();
        q = q.or(`name.ilike.%${term}%,city.ilike.%${term}%,venue_name.ilike.%${term}%`);
      }
      const { data, error, count } = await q;
      if (error) throw error;
      return { rows: (data || []) as unknown as EventItem[], count: count ?? 0, page: pageParam };
    },
    getNextPageParam: (last) => ((last.page + 1) * PAGE_SIZE < last.count ? last.page + 1 : undefined),
  });

  const events = useMemo(() => listQuery.data?.pages.flatMap((p) => p.rows) ?? [], [listQuery.data]);
  const total = listQuery.data?.pages[0]?.count ?? 0;
  const featured = featuredQuery.data ?? [];

  return (
    <div className="min-h-screen flex flex-col pt-16 bg-background">
      <Navbar />

      <main className="flex-1">
        {/* En-tête et recherche */}
        <div className="relative min-h-[48vh] flex items-center justify-center overflow-hidden">
          <LazyImage src={bannerEvents} alt="Événements" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-brand/80 via-brand/60 to-background" />
          <div className="relative z-10 container mx-auto px-4 py-12">
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-6xl font-bold mb-4 text-white drop-shadow-lg">
                Les événements du monde entier
              </h1>
              <p className="text-lg md:text-xl text-white/95 drop-shadow-md max-w-2xl mx-auto">
                Concerts, matchs, spectacles et festivals : notre conciergerie achète vos billets auprès des vendeurs
                officiels.
              </p>
            </div>
            <div className="mx-auto max-w-4xl rounded-2xl bg-background/95 p-3 shadow-xl grid grid-cols-1 md:grid-cols-[1fr_12rem_12rem] gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Artiste, équipe, salle, ville…"
                  className="pl-9 h-11"
                  aria-label="Rechercher un événement"
                />
              </div>
              <Select value={country} onValueChange={(v) => setParam("pays", v === "all" ? null : v)}>
                <SelectTrigger className="h-11" aria-label="Pays">
                  <SelectValue placeholder="Tous les pays" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les pays</SelectItem>
                  {countries.map((code) => (
                    <SelectItem key={code} value={code}>
                      {countryFlag(code)} {countryName(code)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={period} onValueChange={(v) => setParam("quand", v === "all" ? null : v)}>
                <SelectTrigger className="h-11" aria-label="Quand">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIODS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-10 space-y-12">
          {/* Catégories */}
          <div
            className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap md:justify-center"
            role="tablist"
            aria-label="Catégories"
          >
            <Button
              size="sm"
              variant={!category ? "default" : "outline"}
              className="rounded-full flex-shrink-0"
              onClick={() => setParam("categorie", null)}
            >
              Tout
            </Button>
            {EVENT_CATEGORIES.map((c) => {
              const Icon = c.icon;
              return (
                <Button
                  key={c.value}
                  size="sm"
                  variant={category === c.value ? "default" : "outline"}
                  className="rounded-full flex-shrink-0"
                  onClick={() => setParam("categorie", category === c.value ? null : c.value)}
                >
                  <Icon className="h-4 w-4 mr-1.5" />
                  {c.label}
                </Button>
              );
            })}
          </div>

          {/* À la une */}
          {!filtersActive && featured.length > 0 && (
            <section className="space-y-5">
              <h2 className="flex items-center gap-2 text-2xl md:text-3xl font-bold">
                <Sparkles className="h-6 w-6 text-gold" />À ne pas manquer
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {featured.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </section>
          )}

          {/* Tous les événements */}
          <section className="space-y-5">
            <div className="flex items-end justify-between gap-4">
              <h2 className="text-2xl md:text-3xl font-bold">{filtersActive ? "Résultats" : "Tous les événements"}</h2>
              {!listQuery.isLoading && (
                <p className="text-sm text-muted-foreground">
                  {total.toLocaleString("fr-FR")} événement{total > 1 ? "s" : ""}
                </p>
              )}
            </div>
            {listQuery.isLoading ? (
              <CardGridSkeleton />
            ) : listQuery.isError ? (
              <p className="text-center text-destructive py-10">
                Impossible de charger les événements. Réessayez dans un instant.
              </p>
            ) : events.length === 0 ? (
              <div className="rounded-2xl border p-10 text-center text-muted-foreground">
                <CalendarDays className="h-10 w-10 mx-auto mb-3 opacity-50" />
                {filtersActive
                  ? "Aucun événement ne correspond à votre recherche. Essayez une autre date ou un autre pays."
                  : "Le catalogue est en cours de mise à jour. Revenez dans quelques heures."}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {events.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
                {listQuery.hasNextPage && (
                  <div className="flex justify-center">
                    <Button
                      variant="outline"
                      onClick={() => listQuery.fetchNextPage()}
                      disabled={listQuery.isFetchingNextPage}
                    >
                      {listQuery.isFetchingNextPage ? "Chargement…" : "Voir plus d'événements"}
                    </Button>
                  </div>
                )}
              </>
            )}
          </section>

          {/* Comment ça marche */}
          <section className="rounded-2xl bg-muted/40 p-6 md:p-10">
            <h2 className="text-2xl font-bold text-center mb-8">Vos billets, sans les tracas</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="space-y-2">
                <Ticket className="h-10 w-10 mx-auto text-primary" />
                <p className="font-semibold">Vous choisissez et payez en FCFA</p>
                <p className="text-sm text-muted-foreground">
                  Mobile Money ou carte, sans carte bancaire internationale.
                </p>
              </div>
              <div className="space-y-2">
                <ShieldCheck className="h-10 w-10 mx-auto text-primary" />
                <p className="font-semibold">Billets officiels uniquement</p>
                <p className="text-sm text-muted-foreground">
                  Notre équipe achète auprès du vendeur officiel, jamais au marché noir.
                </p>
              </div>
              <div className="space-y-2">
                <Headphones className="h-10 w-10 mx-auto text-primary" />
                <p className="font-semibold">Remboursé si indisponible</p>
                <p className="text-sm text-muted-foreground">
                  Billets envoyés sous 48 h en général, ou remboursement intégral.
                </p>
              </div>
            </div>
          </section>

          <p className="text-center text-xs text-muted-foreground">
            Données d'événements : Ticketmaster. Mise à jour chaque nuit.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Events;
