import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LazyImage } from "@/components/ui/lazy-image";
import { CalendarDays, ExternalLink, MapPin } from "lucide-react";
import { cultureCategory, type CultureEntry } from "@/lib/culture";

// Visuel d'une entrée : sa photo, sinon un dégradé à l'icône de sa catégorie.
export function CultureEntryVisual({ entry, className = "" }: { entry: CultureEntry; className?: string }) {
  const category = cultureCategory(entry.category);
  if (entry.image_url) {
    return <LazyImage src={entry.image_url} alt={entry.title} className={`w-full h-full object-cover ${className}`} />;
  }
  const Icon = category.icon;
  return (
    <div className={`w-full h-full bg-gradient-to-br ${category.gradient} flex items-center justify-center ${className}`}>
      <Icon className="h-12 w-12 text-white/80" aria-hidden="true" />
    </div>
  );
}

export function CultureEntryCard({ entry, onOpen }: { entry: CultureEntry; onOpen: (entry: CultureEntry) => void }) {
  const category = cultureCategory(entry.category);
  return (
    <button
      type="button"
      onClick={() => onOpen(entry)}
      className="group text-left rounded-2xl border bg-card overflow-hidden shadow-sm hover:shadow-lg transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <div className="relative h-44 overflow-hidden">
        <CultureEntryVisual entry={entry} className="transition-transform duration-500 group-hover:scale-105" />
        <Badge className="absolute top-3 left-3 bg-background/90 text-foreground border">{category.label}</Badge>
      </div>
      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-lg leading-snug">{entry.title}</h3>
        {entry.location && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
            {entry.location}
          </p>
        )}
        <p className="text-sm text-muted-foreground line-clamp-3">{entry.summary}</p>
        <span className="inline-block text-sm font-medium text-primary">Lire la suite →</span>
      </div>
    </button>
  );
}

export function CultureEntryDialog({ entry, onClose }: { entry: CultureEntry | null; onClose: () => void }) {
  return (
    <Dialog open={!!entry} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        {entry && (
          <>
            <div className="h-56 md:h-72 overflow-hidden">
              <CultureEntryVisual entry={entry} />
            </div>
            <div className="p-6 space-y-4">
              <DialogHeader className="text-left space-y-2">
                <Badge variant="outline" className="w-fit">{cultureCategory(entry.category).label}</Badge>
                <DialogTitle className="text-2xl">{entry.title}</DialogTitle>
                <DialogDescription className="text-base text-foreground">{entry.summary}</DialogDescription>
              </DialogHeader>
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                {entry.location && (
                  <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{entry.location}</span>
                )}
                {entry.period && (
                  <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />{entry.period}</span>
                )}
              </div>
              {entry.content && <p className="text-sm leading-relaxed whitespace-pre-line">{entry.content}</p>}
              {entry.link_url && (
                <Button asChild variant="outline">
                  <a href={entry.link_url} target="_blank" rel="noopener noreferrer">
                    En savoir plus <ExternalLink className="h-4 w-4 ml-2" />
                  </a>
                </Button>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
