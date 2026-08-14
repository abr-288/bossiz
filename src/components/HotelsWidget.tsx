import { ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Widget de recherche d'hôtels Stay22 (données réelles pour Abidjan).
// Remplace la recherche via useHotelSearch (RapidAPI), qui ne renvoyait que
// des données mock faute de clés API fiables. Stay22 est un widget
// d'affiliation, pas un moteur de réservation : le disclaimer ci-dessous
// est volontaire pour que le client ne s'attende pas à finaliser sur
// B-Reserve.
const HotelsWidget = () => {
  return (
    <Card className="w-full max-w-4xl mx-auto border border-gray-200 shadow-sm rounded-3xl overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">Trouvez votre hôtel à Abidjan</CardTitle>
        <CardDescription className="flex items-center gap-1.5">
          <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
          En partenariat avec Stay22 — la réservation se finalise sur le site de nos partenaires (Booking.com, Expedia, etc.).
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 pb-4 md:px-6 md:pb-6">
        <iframe
          id="stay22-widget"
          title="Recherche d'hôtels à Abidjan"
          width="100%"
          height="428"
          src="https://stay22.com/embed/6a7e4e46ef221c981e3e57a4"
          frameBorder="0"
          loading="lazy"
          style={{ border: "none", borderRadius: "12px" }}
        />
      </CardContent>
    </Card>
  );
};

export default HotelsWidget;
