import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { LazyImage } from "@/components/ui/lazy-image";
import { Clock, MapPin } from "lucide-react";
import { cultureCategory, cultureEntryPath, readingMinutes, type CultureEntry } from "@/lib/culture";

// Visuel d'une entrée : sa photo, sinon (entrée sans photo saisie depuis
// l'admin) un fond aux couleurs de sa catégorie.
export function CultureEntryVisual({ entry, className = "" }: { entry: CultureEntry; className?: string }) {
  const category = cultureCategory(entry.category);
  if (entry.image_url) {
    return (
      <LazyImage
        src={entry.image_url}
        alt={entry.image_caption || entry.title}
        className={`w-full h-full object-cover ${className}`}
      />
    );
  }
  const Icon = category.icon;
  return (
    <div
      className={`w-full h-full bg-gradient-to-br ${category.gradient} flex items-center justify-center ${className}`}
    >
      <Icon className="h-12 w-12 text-white/80" aria-hidden="true" />
    </div>
  );
}

// Crédit d'une photo sous licence libre : auteur, licence et lien vers sa page source.
export function PhotoCredit({
  credit,
  sourceUrl,
  className = "",
}: {
  credit?: string | null;
  sourceUrl?: string | null;
  className?: string;
}) {
  if (!credit) return null;
  return sourceUrl ? (
    <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className={`hover:underline ${className}`}>
      {credit}
    </a>
  ) : (
    <span className={className}>{credit}</span>
  );
}

export function CultureEntryCard({ entry }: { entry: CultureEntry }) {
  const category = cultureCategory(entry.category);
  const path = cultureEntryPath(entry);
  const body = (
    <>
      <div className="relative h-48 overflow-hidden">
        <CultureEntryVisual entry={entry} className="transition-transform duration-500 group-hover:scale-105" />
        <Badge className="absolute top-3 left-3 bg-background/90 text-foreground border">{category.label}</Badge>
      </div>
      <div className="p-4 space-y-2 flex-1 flex flex-col">
        <h3 className="font-semibold text-lg leading-snug">{entry.title}</h3>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {entry.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
              {entry.location.split(",")[0]}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {readingMinutes(entry)} min de lecture
          </span>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-3 flex-1">{entry.summary}</p>
        {path && <span className="inline-block text-sm font-medium text-primary">Lire l'article →</span>}
      </div>
    </>
  );
  const className =
    "group text-left rounded-2xl border bg-card overflow-hidden shadow-sm hover:shadow-lg transition-shadow flex flex-col focus:outline-none focus-visible:ring-2 focus-visible:ring-primary";
  return path ? (
    <Link to={path} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}
