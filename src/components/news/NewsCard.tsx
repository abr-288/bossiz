import { Link } from "react-router-dom";
import { Newspaper } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { LazyImage } from "@/components/ui/lazy-image";
import { formatNewsDate, newsCategory, newsPostPath, type NewsPost } from "@/lib/news";
import { cn } from "@/lib/utils";

// Image de couverture, ou à défaut un aplat avec l'icône de la catégorie.
export function NewsCover({ post, className }: { post: NewsPost; className?: string }) {
  const Icon = newsCategory(post.category).icon ?? Newspaper;
  return post.cover_image_url ? (
    <LazyImage src={post.cover_image_url} alt={post.title} className={cn("h-full w-full object-cover", className)} />
  ) : (
    <div className={cn("flex h-full w-full items-center justify-center bg-primary/10", className)}>
      <Icon className="h-12 w-12 text-primary/60" aria-hidden="true" />
    </div>
  );
}

export function NewsCard({ post }: { post: NewsPost }) {
  return (
    <Link
      to={newsPostPath(post)}
      className="group block h-full rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <Card className="h-full overflow-hidden transition-shadow hover:shadow-lg">
        <div className="aspect-[16/9] overflow-hidden bg-muted">
          <NewsCover post={post} className="transition-transform duration-500 group-hover:scale-105" />
        </div>
        <CardContent className="space-y-2 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            {newsCategory(post.category).label} ·{" "}
            <time dateTime={post.published_at}>{formatNewsDate(post.published_at)}</time>
          </p>
          <h3 className="text-lg font-bold leading-snug group-hover:underline">{post.title}</h3>
          <p className="line-clamp-3 text-sm text-muted-foreground">{post.excerpt}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
