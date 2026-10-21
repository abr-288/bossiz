import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { LazyImage } from "@/components/ui/lazy-image";
import { MapPin } from "lucide-react";
import { EVENT_STATUS_LABEL, countryFlag, countryName, eventCategory, formatFcfa, type EventItem } from "@/lib/events";

type CardEvent = Pick<
  EventItem,
  | "slug"
  | "name"
  | "category"
  | "status"
  | "local_date"
  | "local_time"
  | "venue_name"
  | "city"
  | "country"
  | "country_code"
  | "image_url"
  | "price_min_xof"
  | "ai_tags"
>;

export function EventCard({ event }: { event: CardEvent }) {
  const category = eventCategory(event.category);
  const Icon = category.icon;
  const date = new Date(`${event.local_date}T00:00:00`);
  const status = EVENT_STATUS_LABEL[event.status];
  return (
    <Link
      to={`/events/${event.slug}`}
      className="group flex flex-col rounded-2xl border bg-card overflow-hidden shadow-sm hover:shadow-lg transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <div className="relative h-44 overflow-hidden bg-muted">
        {event.image_url ? (
          <LazyImage
            src={event.image_url}
            alt={event.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand to-primary">
            <Icon className="h-12 w-12 text-white/80" />
          </div>
        )}
        <div className="absolute top-3 left-3 rounded-lg bg-background/95 px-2.5 py-1 text-center shadow">
          <p className="text-lg font-bold leading-none">{date.getDate()}</p>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {date.toLocaleDateString("fr-FR", { month: "short" }).replace(".", "")}
          </p>
        </div>
        <Badge className="absolute top-3 right-3 bg-background/90 text-foreground border">
          <Icon className="h-3 w-3 mr-1" />
          {category.label}
        </Badge>
        {status && (
          <Badge variant="destructive" className="absolute bottom-3 left-3">
            {status}
          </Badge>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4 gap-2">
        <h3 className="font-semibold leading-snug line-clamp-2">{event.name}</h3>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="line-clamp-1">
            {[event.venue_name, event.city].filter(Boolean).join(" · ")} {countryFlag(event.country_code)}{" "}
            {countryName(event.country_code, event.country)}
          </span>
        </p>
        <p className="text-xs text-muted-foreground">
          {date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          {event.local_time ? ` · ${event.local_time}` : ""}
        </p>
        <div className="mt-auto pt-2 flex items-end justify-between gap-2">
          {event.price_min_xof ? (
            <p className="text-sm">
              <span className="text-xs text-muted-foreground">dès </span>
              <span className="font-bold text-primary">{formatFcfa(event.price_min_xof)}</span>
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">Prix sur demande</p>
          )}
          <span className="text-xs font-medium text-primary">Voir →</span>
        </div>
      </div>
    </Link>
  );
}
