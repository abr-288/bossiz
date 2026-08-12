import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Price } from "@/components/ui/price";

interface Event {
  id: string;
  name: string;
  description?: string;
  location: string;
  address?: string;
  date: string;
  endDate?: string;
  price: string;
  currency?: string;
  image?: string;
  category?: string;
  link?: string;
}

interface EventResultsProps {
  events: Event[];
  onBook?: (event: Event) => void;
}

export const EventResults = ({ events, onBook }: EventResultsProps) => {
  if (!events || events.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Aucun événement trouvé</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-8">
      <h2 className="text-2xl font-bold">
        {events.length} événement{events.length > 1 ? 's' : ''} trouvé{events.length > 1 ? 's' : ''}
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map((event) => (
          <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            {event.image && (
              <div className="aspect-video w-full overflow-hidden bg-muted">
                <img
                  src={event.image}
                  alt={event.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            )}
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-lg line-clamp-2">{event.name}</CardTitle>
                {event.category && (
                  <Badge variant="secondary" className="shrink-0">
                    {event.category}
                  </Badge>
                )}
              </div>
              <CardDescription className="line-clamp-2">
                {event.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {format(new Date(event.date), "PPP", { locale: fr })}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span className="line-clamp-1">
                    {event.address || event.location}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div>
                  <p className="text-sm text-muted-foreground">À partir de</p>
                  <p className="text-xl font-bold">
                    <Price amount={parseFloat(event.price) || 0} fromCurrency={event.currency || 'EUR'} showLoader />
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {onBook && (
                    <Button size="sm" onClick={() => onBook(event)}>
                      Réserver
                    </Button>
                  )}
                  {event.link && (
                    <Button asChild size="sm" variant={onBook ? "outline" : "default"}>
                      <a href={event.link} target="_blank" rel="noopener noreferrer">
                        Détails
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
