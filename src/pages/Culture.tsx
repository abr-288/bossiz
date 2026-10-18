import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { LazyImage } from "@/components/ui/lazy-image";
import { CardGridSkeleton } from "@/components/ui/card-grid-skeleton";
import { CultureEntryCard, CultureEntryDialog, CultureEntryVisual } from "@/components/culture/CultureEntryCard";
import { CULTURE_CATEGORIES, cultureCategory, useCultureEntries, useCulturePage, type CultureCategory, type CultureEntry } from "@/lib/culture";
import bannerFallback from "@/assets/hero-slide-1.webp";
import { Compass, MapPin } from "lucide-react";

// Page éditoriale « Culture » : en-tête, introduction, sélection à la une,
// puis toutes les entrées publiées filtrables par catégorie. Contenu géré
// dans /admin/culture.
export default function Culture() {
  const { data: settings } = useCulturePage();
  const { data: allEntries, isLoading } = useCultureEntries();
  const [category, setCategory] = useState<CultureCategory | "all">("all");
  const [openEntry, setOpenEntry] = useState<CultureEntry | null>(null);

  // L'admin voit aussi les brouillons (RLS) : la page publique ne montre que le publié.
  const entries = useMemo(() => (allEntries ?? []).filter((e) => e.published), [allEntries]);
  const featured = entries.filter((e) => e.featured).slice(0, 3);
  const visible = category === "all" ? entries : entries.filter((e) => e.category === category);
  const usedCategories = CULTURE_CATEGORIES.filter((c) => entries.some((e) => e.category === c.value));

  return (
    <div className="min-h-screen bg-background flex flex-col pt-16">
      <Navbar />

      <div className="relative min-h-[45vh] md:min-h-[55vh] flex items-center justify-center overflow-hidden">
        <LazyImage
          src={settings?.heroImage || bannerFallback}
          alt={settings?.title || "Culture"}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-brand/80 via-brand/60 to-background" />
        <div className="relative z-10 container mx-auto px-4 py-12 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">{settings?.title || "Culture"}</h1>
          {settings?.subtitle && (
            <p className="text-lg md:text-xl text-white/95 max-w-2xl mx-auto drop-shadow-md">{settings.subtitle}</p>
          )}
        </div>
      </div>

      <main className="flex-1 container mx-auto px-4 py-10 md:py-14 space-y-14">
        {settings?.intro && (
          <p className="max-w-3xl mx-auto text-center text-base md:text-lg leading-relaxed text-muted-foreground whitespace-pre-line">
            {settings.intro}
          </p>
        )}

        {isLoading ? (
          <CardGridSkeleton />
        ) : entries.length === 0 ? (
          <p className="text-center text-muted-foreground">Notre sélection culturelle arrive bientôt.</p>
        ) : (
          <>
            {featured.length > 0 && (
              <section className="space-y-6">
                <h2 className="text-2xl md:text-3xl font-bold">À ne pas manquer</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                  {featured.map((entry, index) => (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => setOpenEntry(entry)}
                      className={`group relative overflow-hidden rounded-2xl text-left min-h-[16rem] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                        index === 0 ? "md:col-span-2 md:row-span-2 md:min-h-[26rem]" : ""
                      }`}
                    >
                      <div className="absolute inset-0">
                        <CultureEntryVisual entry={entry} className="transition-transform duration-500 group-hover:scale-105" />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 p-5 text-white space-y-1.5">
                        <span className="text-xs font-semibold uppercase tracking-wide text-white/80">
                          {cultureCategory(entry.category).label}
                        </span>
                        <h3 className={`font-bold leading-tight ${index === 0 ? "text-2xl md:text-3xl" : "text-xl"}`}>{entry.title}</h3>
                        {entry.location && (
                          <p className="flex items-center gap-1.5 text-sm text-white/85"><MapPin className="h-4 w-4" />{entry.location}</p>
                        )}
                        {index === 0 && <p className="hidden md:block text-sm text-white/90 max-w-xl">{entry.summary}</p>}
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}

            <section className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <h2 className="text-2xl md:text-3xl font-bold">Explorer</h2>
                <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0" role="tablist" aria-label="Catégories">
                  <Button
                    size="sm"
                    variant={category === "all" ? "default" : "outline"}
                    className="rounded-full flex-shrink-0"
                    onClick={() => setCategory("all")}
                    role="tab"
                    aria-selected={category === "all"}
                  >
                    Tout
                  </Button>
                  {usedCategories.map((c) => {
                    const Icon = c.icon;
                    return (
                      <Button
                        key={c.value}
                        size="sm"
                        variant={category === c.value ? "default" : "outline"}
                        className="rounded-full flex-shrink-0"
                        onClick={() => setCategory(c.value)}
                        role="tab"
                        aria-selected={category === c.value}
                      >
                        <Icon className="h-4 w-4 mr-1.5" />
                        {c.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {visible.map((entry) => (
                  <CultureEntryCard key={entry.id} entry={entry} onOpen={setOpenEntry} />
                ))}
              </div>
            </section>
          </>
        )}

        <section className="rounded-2xl bg-primary/5 border border-primary/20 p-6 md:p-10 text-center space-y-4">
          <Compass className="h-10 w-10 mx-auto text-primary" />
          <h2 className="text-2xl font-bold">Vivez-la sur place</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Visites guidées, activités et événements : réservez votre découverte avec nos partenaires.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild><Link to="/tours">Visites guidées</Link></Button>
            <Button asChild variant="outline"><Link to="/activities">Activités</Link></Button>
            <Button asChild variant="outline"><Link to="/events">Événements</Link></Button>
          </div>
        </section>
      </main>

      <CultureEntryDialog entry={openEntry} onClose={() => setOpenEntry(null)} />
      <Footer />
    </div>
  );
}
