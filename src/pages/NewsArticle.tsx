import { useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NewsCard, NewsCover } from "@/components/news/NewsCard";
import { parseArticle, readingMinutes } from "@/lib/culture";
import { formatNewsDate, isNewsPostLive, isSafeNewsLink, newsCategory, useNewsPosts } from "@/lib/news";
import { ChevronRight, Clock } from "lucide-react";

// Article d'actualité (/actualites/:slug) : couverture, chapô, texte avec
// intertitres, bouton d'action éventuel et autres actualités récentes.
export default function NewsArticle() {
  const { slug } = useParams<{ slug: string }>();
  const { data: posts, isLoading } = useNewsPosts();

  const live = useMemo(() => (posts ?? []).filter((p) => isNewsPostLive(p)), [posts]);
  const post = live.find((p) => p.slug === slug);
  const related = useMemo(() => live.filter((p) => p.id !== post?.id).slice(0, 3), [live, post]);

  useEffect(() => {
    if (post) document.title = `${post.title} – Actualités | Bossiz+`;
    window.scrollTo({ top: 0 });
  }, [post]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col pt-16">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-10 max-w-3xl space-y-4">
          <div className="h-8 w-2/3 rounded bg-muted animate-pulse" />
          <div className="aspect-[16/9] rounded-2xl bg-muted animate-pulse" />
          <div className="h-4 w-full rounded bg-muted animate-pulse" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex flex-col pt-16">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-2">Article introuvable</h1>
          <p className="text-muted-foreground mb-6">Cet article n'existe pas ou n'est plus publié.</p>
          <Button asChild>
            <Link to="/actualites">Toutes les actualités</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const blocks = parseArticle(post.content);
  const cta = post.cta_label && post.cta_url && isSafeNewsLink(post.cta_url) ? post : null;
  const external = cta?.cta_url?.startsWith("https://");

  return (
    <div className="min-h-screen bg-background flex flex-col pt-16">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8 md:py-12 max-w-3xl">
        <nav className="flex items-center gap-1 text-xs text-muted-foreground mb-6" aria-label="Fil d'Ariane">
          <Link to="/" className="hover:underline">
            Accueil
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link to="/actualites" className="hover:underline">
            Actualités
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground line-clamp-1">{post.title}</span>
        </nav>

        <article>
          <Badge variant="secondary" className="mb-3">
            {newsCategory(post.category).label}
          </Badge>
          <h1 className="text-3xl md:text-5xl font-bold leading-tight">{post.title}</h1>
          <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <time dateTime={post.published_at}>{formatNewsDate(post.published_at)}</time>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {readingMinutes({ summary: post.excerpt, content: post.content })} min de lecture
            </span>
          </p>

          {post.cover_image_url && (
            <figure className="mt-6">
              <div className="aspect-[16/9] overflow-hidden rounded-2xl bg-muted">
                <NewsCover post={post} />
              </div>
              {post.cover_caption && (
                <figcaption className="mt-2 text-xs text-muted-foreground">{post.cover_caption}</figcaption>
              )}
            </figure>
          )}

          <p className="mt-8 text-lg md:text-xl leading-relaxed font-medium">{post.excerpt}</p>
          <div className="mt-6 space-y-5 text-base leading-relaxed">
            {blocks.map((block, i) =>
              block.kind === "heading" ? (
                <h2 key={i} className="text-2xl font-bold pt-4">
                  {block.text}
                </h2>
              ) : block.kind === "list" ? (
                <ul key={i} className="list-disc pl-6 space-y-1.5">
                  {block.items.map((item, j) => (
                    <li key={j}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p key={i} className="whitespace-pre-line">
                  {block.text}
                </p>
              ),
            )}
          </div>

          {cta && (
            <div className="mt-10">
              <Button asChild size="lg">
                {external ? (
                  <a href={cta.cta_url!} target="_blank" rel="noopener noreferrer">
                    {cta.cta_label}
                  </a>
                ) : (
                  <Link to={cta.cta_url!}>{cta.cta_label}</Link>
                )}
              </Button>
            </div>
          )}
        </article>

        {related.length > 0 && (
          <section className="mt-16 space-y-6">
            <h2 className="text-2xl font-bold">Autres actualités</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <NewsCard key={p.id} post={p} />
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
