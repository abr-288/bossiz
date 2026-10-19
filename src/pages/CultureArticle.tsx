import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { CultureEntryCard, CultureEntryVisual, PhotoCredit } from "@/components/culture/CultureEntryCard";
import {
  cultureCategory,
  parseArticle,
  readingMinutes,
  useCultureEntries,
  type CulturePhoto,
} from "@/lib/culture";
import { CalendarDays, ChevronLeft, ChevronRight, Clock, Compass, ExternalLink, MapPin } from "lucide-react";

// Article d'une entrée culturelle (/culture/:slug) : photo principale
// créditée, chapô, texte avec intertitres, encadré pratique, galerie et
// suggestions de la même catégorie.
export default function CultureArticle() {
  const { slug } = useParams<{ slug: string }>();
  const { data: entries, isLoading } = useCultureEntries();
  const [photoIndex, setPhotoIndex] = useState<number | null>(null);

  const published = useMemo(() => (entries ?? []).filter((e) => e.published), [entries]);
  const entry = published.find((e) => e.slug === slug);

  const photos: CulturePhoto[] = useMemo(() => {
    if (!entry) return [];
    const main = entry.image_url
      ? [{ url: entry.image_url, caption: entry.image_caption ?? undefined, credit: entry.image_credit ?? undefined, sourceUrl: entry.image_source_url ?? undefined }]
      : [];
    return [...main, ...(entry.gallery ?? [])].filter((p) => p.url);
  }, [entry]);

  const related = useMemo(() => {
    if (!entry) return [];
    const sameCategory = published.filter((e) => e.id !== entry.id && e.category === entry.category);
    const others = published.filter((e) => e.id !== entry.id && e.category !== entry.category && e.featured);
    return [...sameCategory, ...others].slice(0, 3);
  }, [entry, published]);

  useEffect(() => {
    if (entry) document.title = `${entry.title} – Culture | Bossiz+`;
    window.scrollTo({ top: 0 });
  }, [entry]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col pt-16">
        <Navbar />
        <div className="h-[50vh] bg-muted animate-pulse" />
        <main className="flex-1 container mx-auto px-4 py-10 max-w-3xl space-y-4">
          <div className="h-8 w-2/3 rounded bg-muted animate-pulse" />
          <div className="h-4 w-full rounded bg-muted animate-pulse" />
          <div className="h-4 w-5/6 rounded bg-muted animate-pulse" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="min-h-screen bg-background flex flex-col pt-16">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-2">Article introuvable</h1>
          <p className="text-muted-foreground mb-6">Cet article n'existe pas ou n'est plus publié.</p>
          <Button asChild><Link to="/culture">Voir toute la culture</Link></Button>
        </main>
        <Footer />
      </div>
    );
  }

  const category = cultureCategory(entry.category);
  const blocks = parseArticle(entry.content);
  const gallery = photos.slice(1);
  const current = photoIndex !== null ? photos[photoIndex] : null;

  return (
    <div className="min-h-screen bg-background flex flex-col pt-16">
      <Navbar />

      {/* Photo principale */}
      <figure className="relative">
        <div className="relative h-[45vh] md:h-[65vh] overflow-hidden bg-muted">
          <button type="button" className="block w-full h-full" onClick={() => photos.length && setPhotoIndex(0)} aria-label="Agrandir la photo">
            <CultureEntryVisual entry={entry} />
          </button>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0">
            <div className="container mx-auto px-4 pb-8 md:pb-12 max-w-4xl text-white">
              <Badge className="mb-3 bg-white/15 text-white border-white/30 backdrop-blur">{category.label}</Badge>
              <h1 className="text-3xl md:text-5xl font-bold leading-tight drop-shadow-lg">{entry.title}</h1>
            </div>
          </div>
        </div>
        {(entry.image_caption || entry.image_credit) && (
          <figcaption className="container mx-auto px-4 max-w-4xl pt-2 text-xs text-muted-foreground">
            {entry.image_caption}
            {entry.image_caption && entry.image_credit ? " · " : ""}
            <PhotoCredit credit={entry.image_credit} sourceUrl={entry.image_source_url} />
          </figcaption>
        )}
      </figure>

      <main className="flex-1 container mx-auto px-4 py-8 md:py-12 max-w-4xl">
        <nav className="flex items-center gap-1 text-xs text-muted-foreground mb-6" aria-label="Fil d'Ariane">
          <Link to="/" className="hover:underline">Accueil</Link>
          <ChevronRight className="h-3 w-3" />
          <Link to="/culture" className="hover:underline">Culture</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground line-clamp-1">{entry.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_16rem] gap-10">
          <article className="min-w-0">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
              <Clock className="h-3.5 w-3.5" />{readingMinutes(entry)} min de lecture
            </p>
            <p className="text-lg md:text-xl leading-relaxed font-medium mb-8">{entry.summary}</p>
            <div className="space-y-5 text-base leading-relaxed">
              {blocks.map((block, i) =>
                block.kind === "heading" ? (
                  <h2 key={i} className="text-2xl font-bold pt-4">{block.text}</h2>
                ) : block.kind === "list" ? (
                  <ul key={i} className="list-disc pl-6 space-y-1.5">
                    {block.items.map((item, j) => <li key={j}>{item}</li>)}
                  </ul>
                ) : (
                  <p key={i} className="whitespace-pre-line">{block.text}</p>
                ),
              )}
            </div>

            {gallery.length > 0 && (
              <section className="mt-12 space-y-4">
                <h2 className="text-2xl font-bold">En images</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {gallery.map((photo, i) => (
                    <figure key={photo.url} className={gallery.length % 2 === 1 && i === 0 ? "sm:col-span-2" : undefined}>
                      <button
                        type="button"
                        onClick={() => setPhotoIndex(i + 1)}
                        className="block w-full overflow-hidden rounded-xl bg-muted aspect-[4/3] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        aria-label={`Agrandir : ${photo.caption || entry.title}`}
                      >
                        <img src={photo.url} alt={photo.caption || entry.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
                      </button>
                      <figcaption className="mt-1.5 text-xs text-muted-foreground">
                        {photo.caption}
                        {photo.caption && photo.credit ? " · " : ""}
                        <PhotoCredit credit={photo.credit} sourceUrl={photo.sourceUrl} />
                      </figcaption>
                    </figure>
                  ))}
                </div>
              </section>
            )}
          </article>

          {/* Encadré pratique */}
          <aside className="lg:sticky lg:top-24 h-fit space-y-4">
            <div className="rounded-2xl border bg-muted/30 p-5 space-y-4 text-sm">
              <p className="font-semibold">Infos pratiques</p>
              {entry.location && (
                <p className="flex gap-2"><MapPin className="h-4 w-4 flex-shrink-0 mt-0.5 text-primary" /><span>{entry.location}</span></p>
              )}
              {entry.period && (
                <p className="flex gap-2"><CalendarDays className="h-4 w-4 flex-shrink-0 mt-0.5 text-primary" /><span>{entry.period}</span></p>
              )}
              {entry.link_url && (
                <Button asChild variant="outline" size="sm" className="w-full">
                  <a href={entry.link_url} target="_blank" rel="noopener noreferrer">En savoir plus <ExternalLink className="h-3.5 w-3.5 ml-1.5" /></a>
                </Button>
              )}
            </div>
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 space-y-3 text-sm">
              <Compass className="h-6 w-6 text-primary" />
              <p className="font-semibold">Vivez-la sur place</p>
              <p className="text-muted-foreground">Visites guidées et activités avec nos partenaires.</p>
              <div className="flex flex-col gap-2">
                <Button asChild size="sm"><Link to="/tours">Visites guidées</Link></Button>
                <Button asChild size="sm" variant="outline"><Link to="/hotels-partenaires">Où dormir</Link></Button>
              </div>
            </div>
          </aside>
        </div>

        {related.length > 0 && (
          <section className="mt-16 space-y-6">
            <h2 className="text-2xl font-bold">À découvrir aussi</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {related.map((e) => <CultureEntryCard key={e.id} entry={e} />)}
            </div>
          </section>
        )}
      </main>

      {/* Visionneuse */}
      <Dialog open={current !== null} onOpenChange={(open) => { if (!open) setPhotoIndex(null); }}>
        <DialogContent className="max-w-5xl p-2 sm:p-4 bg-background">
          <DialogTitle className="sr-only">{current?.caption || entry.title}</DialogTitle>
          {current && (
            <figure className="space-y-2">
              <div className="relative flex items-center justify-center bg-black rounded-lg overflow-hidden">
                <img src={current.url} alt={current.caption || entry.title} className="max-h-[75vh] w-auto object-contain" />
                {photos.length > 1 && (
                  <>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full"
                      aria-label="Photo précédente"
                      onClick={() => setPhotoIndex(((photoIndex ?? 0) - 1 + photos.length) % photos.length)}
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full"
                      aria-label="Photo suivante"
                      onClick={() => setPhotoIndex(((photoIndex ?? 0) + 1) % photos.length)}
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </>
                )}
              </div>
              <figcaption className="text-xs text-muted-foreground px-1">
                {current.caption}
                {current.caption && current.credit ? " · " : ""}
                <PhotoCredit credit={current.credit} sourceUrl={current.sourceUrl} />
              </figcaption>
            </figure>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
