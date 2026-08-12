import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Star, MapPin, Globe, X } from "lucide-react";
import { Price } from "@/components/ui/price";

interface Hotel {
  id: string | number;
  name: string;
  location: string;
  price: number;
  rating: number;
  reviews: number;
  image: string;
  amenities: string[];
  source?: string;
}

interface HotelComparisonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hotels: Hotel[];
  onRemoveHotel: (hotelId: string | number) => void;
  onBookHotel: (hotel: Hotel) => void;
}

export function HotelComparisonDialog({
  open,
  onOpenChange,
  hotels,
  onRemoveHotel,
  onBookHotel,
}: HotelComparisonDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="text-2xl">
            Comparaison de {hotels.length} hôtel{hotels.length > 1 ? 's' : ''}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[calc(90vh-120px)]">
          <div className="p-6">
            {/* Table de comparaison */}
            <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${Math.min(hotels.length, 3)}, 1fr)` }}>
              {hotels.map((hotel) => (
                <div key={hotel.id} className="border rounded-lg overflow-hidden bg-card">
                  {/* Image */}
                  <div className="relative h-48">
                    <img
                      src={hotel.image}
                      alt={hotel.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800';
                      }}
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8"
                      onClick={() => onRemoveHotel(hotel.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    {hotel.source && (
                      <Badge className="absolute bottom-2 left-2 bg-background/90 text-foreground">
                        <Globe className="w-3 h-3 mr-1" />
                        {hotel.source}
                      </Badge>
                    )}
                  </div>

                  {/* Contenu */}
                  <div className="p-4 space-y-4">
                    {/* Nom */}
                    <div>
                      <h3 className="font-semibold text-lg mb-1 line-clamp-2">{hotel.name}</h3>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span className="line-clamp-1">{hotel.location}</span>
                      </div>
                    </div>

                    {/* Note */}
                    <div className="flex items-center justify-between py-2 border-t">
                      <span className="text-sm font-medium">Note</span>
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 fill-accent text-accent" />
                        <span className="font-semibold">{hotel.rating.toFixed(1)}</span>
                        <span className="text-xs text-muted-foreground">({hotel.reviews})</span>
                      </div>
                    </div>

                    {/* Prix */}
                    <div className="flex items-center justify-between py-2 border-t">
                      <span className="text-sm font-medium">Prix/nuit</span>
                      <div className="text-right">
                        <div className="font-bold text-lg text-primary">
                          <Price amount={hotel.price} fromCurrency="EUR" showLoader />
                        </div>
                      </div>
                    </div>

                    {/* Équipements */}
                    <div className="py-2 border-t">
                      <span className="text-sm font-medium block mb-2">Équipements</span>
                      <div className="flex flex-wrap gap-1">
                        {hotel.amenities.slice(0, 6).map((amenity, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {amenity}
                          </Badge>
                        ))}
                        {hotel.amenities.length > 6 && (
                          <Badge variant="outline" className="text-xs">
                            +{hotel.amenities.length - 6}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Bouton réserver */}
                    <Button
                      className="w-full mt-4"
                      onClick={() => {
                        onBookHotel(hotel);
                        onOpenChange(false);
                      }}
                    >
                      Réserver
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Message si trop d'hôtels */}
            {hotels.length > 3 && (
              <div className="mt-6 p-4 bg-muted rounded-lg text-center text-sm text-muted-foreground">
                Affichage des 3 premiers hôtels. Faites défiler pour voir les autres ou supprimez-en pour mieux comparer.
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
