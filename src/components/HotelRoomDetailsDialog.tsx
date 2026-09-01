import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Wifi, UtensilsCrossed, Car } from "lucide-react";

interface HotelRoomDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hotel: {
    id: string;
    name: string;
    location: string;
    price: number;
    image?: string;
    rating?: number;
    reviews?: number;
    amenities?: string[];
    source?: string;
  };
  onBookNow: () => void;
}

export const HotelRoomDetailsDialog = ({ open, onOpenChange, hotel, onBookNow }: HotelRoomDetailsDialogProps) => {
  const amenities = hotel.amenities || ["Wi-Fi", "Petit-déjeuner", "Parking"];
  const hotelRating = hotel.rating || 4.7;
  const hotelReviews = hotel.reviews || 180;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{hotel.name}</DialogTitle>
          <DialogDescription>
            Détails de l’établissement et aperçu des chambres disponibles.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {hotel.image && (
            <img src={hotel.image} alt={hotel.name} className="h-48 w-full rounded-lg object-cover" />
          )}

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{hotel.location}</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 text-amber-500">
              {[...Array(5)].map((_, index) => (
                <Star key={index} className="h-4 w-4 fill-current" />
              ))}
            </div>
            <span className="font-semibold text-sm">{hotelRating.toFixed(1)}/5</span>
            <span className="text-sm text-muted-foreground">({hotelReviews} avis)</span>
            {hotel.source && <Badge variant="secondary">{hotel.source}</Badge>}
          </div>

          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="flex items-center gap-2 text-primary">
              <Star className="h-4 w-4" />
              <span className="font-semibold">Chambre standard</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Chambre confortable avec lit double, salle de bain privée, Wi‑Fi gratuit et accès aux équipements de l’hôtel.
            </p>
            <div className="mt-3 flex items-baseline justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">À partir de</p>
                <p className="text-2xl font-bold text-primary">{hotel.price.toLocaleString()} EUR</p>
              </div>
              <Button onClick={onBookNow}>Réserver maintenant</Button>
            </div>
          </div>

          <div>
            <h3 className="mb-2 font-semibold">Équipements</h3>
            <div className="flex flex-wrap gap-2">
              {amenities.slice(0, 6).map((amenity, index) => (
                <Badge key={index} variant="outline" className="gap-2">
                  {amenity.toLowerCase().includes("wifi") && <Wifi className="h-3 w-3" />}
                  {amenity.toLowerCase().includes("restaurant") && <UtensilsCrossed className="h-3 w-3" />}
                  {amenity.toLowerCase().includes("parking") && <Car className="h-3 w-3" />}
                  <span>{amenity}</span>
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
