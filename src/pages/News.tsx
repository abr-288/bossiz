import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { CardGridSkeleton } from "@/components/ui/card-grid-skeleton";
import { NewsCard, NewsCover } from "@/components/news/NewsCard";
import {
  NEWS_CATEGORIES,
  formatNewsDate,
  isNewsPostLive,
  newsCategory,
  newsPostPath,
  useNewsPage,
  useNewsPosts,
  type NewsCategory,
} from "@/lib/news";
import { Newspaper } from "lucide-react";

// Actualités Bossiz (/actualites) : l'article à la une, puis tous les
// articles publiés, du plus récent au plus ancien, filtrables par catégorie.
// Contenu géré dans /admin/actualites.
export default function News() {
  const { data: settings } = useNewsPage();
  const { data: allPosts, isLoading } = useNewsPosts();
  const [category, setCategory] = useState<NewsCategory | "all">("all");

  useEffect(() => {
    document.title = `${settings?.title || "Actualités"} | Bossiz+`;
  }, [settings?.title]);

  // L'admin reçoit aussi les brouillons (RLS) : on n'affiche que le publié.
  const posts = useMemo(() => (allPosts ?? []).filter((p) => isNewsPostLive(p)), [allPosts]);
  const lead = posts.find((p) => p.pinned) ?? posts[0];
  const rest = posts.filter((p) => p.id !== lead?.id);
  const visible = category === "all" ? rest : rest.filter((p) => p.category === category);
  const usedCategories = NEWS_CATEGORIES.filter((c) => rest.some((p) => p.category === c.value));

  return (
    <div className="min-h-screen bg-background flex flex-col pt-16">
      <Navbar />

      <header className="border-b bg-primary/5">
        <div className="container mx-auto px-4 py-10 md:py-14">
          <h1 className="text-3xl md:text-5xl font-bold">{settings?.title || "Actualités"}</h1>
          {settings?.subtitle && (
            <p className="mt-3 max-w-2xl text-base md:text-lg text-muted-foreground">{settings.subtitle}</p>
          )}
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-10 md:py-14 space-y-12">
        {isLoading ? (
          <CardGridSkeleton />
        ) : !lead ? (
          <div className="py-16 text-center text-muted-foreground">
            <Newspaper className="mx-auto mb-3 h-10 w-10 opacity-60" />
            <p>Les premières actualités arrivent bientôt.</p>
          </div>
        ) : (
          <>
            <Link
              to={newsPostPath(lead)}
              className="group grid overflow-hidden rounded-2xl border bg-card md:grid-cols-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <div className="aspect-[16/10] overflow-hidden bg-muted md:aspect-auto md:min-h-[20rem]">
                <NewsCover post={lead} className="transition-transform duration-500 group-hover:scale-105" />
              </div>
              <div className="flex flex-col justify-center gap-3 p-6 md:p-10">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                  {lead.pinned ? "À la une · " : ""}
                  {newsCategory(lead.category).label} ·{" "}
                  <time dateTime={lead.published_at}>{formatNewsDate(lead.published_at)}</time>
                </p>
                <h2 className="text-2xl md:text-4xl font-bold leading-tight group-hover:underline">{lead.title}</h2>
                <p className="text-muted-foreground md:text-lg">{lead.excerpt}</p>
                <span className="text-sm font-semibold text-primary">Lire l'article →</span>
              </div>
            </Link>

            {rest.length > 0 && (
              <section className="space-y-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <h2 className="text-2xl md:text-3xl font-bold">Toute l'actualité</h2>
                  {usedCategories.length > 1 && (
                    <div
                      className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0"
                      role="tablist"
                      aria-label="Catégories"
                    >
                      <Button
                        size="sm"
                        variant={category === "all" ? "default" : "outline"}
                        className="flex-shrink-0 rounded-full"
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
                            className="flex-shrink-0 rounded-full"
                            onClick={() => setCategory(c.value)}
                            role="tab"
                            aria-selected={category === c.value}
                          >
                            <Icon className="mr-1.5 h-4 w-4" />
                            {c.label}
                          </Button>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {visible.map((post) => (
                    <NewsCard key={post.id} post={post} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
