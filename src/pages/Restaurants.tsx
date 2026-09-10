import { useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Star, UtensilsCrossed, Loader2, Phone } from "lucide-react";
import { useRestaurants } from "@/hooks/useRestaurants";
import { RestaurantReservationDialog } from "@/components/restaurants/RestaurantReservationDialog";

const Restaurants = () => {
  const { restaurants, loading, error } = useRestaurants();
  const [locationFilter, setLocationFilter] = useState("");
  const [priceFilter, setPriceFilter] = useState("all");
  const [selectedRestaurant, setSelectedRestaurant] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const filteredRestaurants = useMemo(() => {
    let result = restaurants;
    if (locationFilter) {
      const search = locationFilter.toLowerCase();
      result = result.filter(r =>
        r.location.toLowerCase().includes(search) ||
        r.name.toLowerCase().includes(search) ||
        (r.cuisine_type || "").toLowerCase().includes(search)
      );
    }
    if (priceFilter !== "all") {
      result = result.filter(r => r.price_range === priceFilter);
    }
    return result;
  }, [restaurants, locationFilter, priceFilter]);

  return (
    <div className="min-h-screen bg-background flex flex-col pt-16">
      <Navbar />

      <div className="relative py-16 md:py-24 overflow-hidden bg-gradient-to-br from-primary via-primary to-secondary">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        <div className="relative z-10 container mx-auto px-4 text-center">
          <UtensilsCrossed className="w-12 h-12 text-white mx-auto mb-4" />
          <h1 className="text-4xl md:text-6xl font-bold mb-4 text-white drop-shadow-lg">
            Restaurants
          </h1>
          <p className="text-lg md:text-xl text-white/95 max-w-2xl mx-auto">
            Réservez votre table en ligne, sans appel, sans attente
          </p>
        </div>
      </div>

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1">
            <Input
              placeholder="Rechercher un restaurant, une ville, une cuisine..."
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
            />
          </div>
          <Select value={priceFilter} onValueChange={setPriceFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Gamme de prix" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les gammes</SelectItem>
              <SelectItem value="€">€ - Abordable</SelectItem>
              <SelectItem value="€€">€€ - Modéré</SelectItem>
              <SelectItem value="€€€">€€€ - Élevé</SelectItem>
              <SelectItem value="€€€€">€€€€ - Luxe</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <Card className="p-12 text-center text-muted-foreground">
            Impossible de charger les restaurants pour le moment.
          </Card>
        ) : filteredRestaurants.length === 0 ? (
          <Card className="p-12 text-center">
            <UtensilsCrossed className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-lg font-medium mb-2">Aucun restaurant disponible pour le moment</p>
            <p className="text-muted-foreground mb-6">Nos partenaires ajoutent bientôt leurs établissements. Revenez vite !</p>
            <Button variant="outline" asChild>
              <a href="/devenir-partenaire">Vous gérez un restaurant ? Rejoignez-nous</a>
            </Button>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRestaurants.map((restaurant) => (
              <Card key={restaurant.id} className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
                <img
                  src={restaurant.image_url || "/placeholder.svg"}
                  alt={restaurant.name}
                  className="w-full h-44 object-cover"
                  loading="lazy"
                />
                <CardContent className="p-5 flex-1 flex flex-col">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-lg font-semibold">{restaurant.name}</h3>
                    <span className="text-sm text-muted-foreground whitespace-nowrap">{restaurant.price_range}</span>
                  </div>

                  {restaurant.cuisine_type && (
                    <p className="text-sm text-muted-foreground mb-2">{restaurant.cuisine_type}</p>
                  )}

                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm truncate">{restaurant.address || restaurant.location}</span>
                  </div>

                  {restaurant.total_reviews > 0 && (
                    <div className="flex items-center gap-1 mb-3">
                      <Star className="w-4 h-4 fill-accent text-accent" />
                      <span className="text-sm text-muted-foreground">
                        {restaurant.rating} ({restaurant.total_reviews} avis)
                      </span>
                    </div>
                  )}

                  {restaurant.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{restaurant.description}</p>
                  )}

                  <div className="mt-auto pt-3 flex items-center justify-between gap-3">
                    {restaurant.phone && (
                      <a href={`tel:${restaurant.phone}`} className="text-sm text-muted-foreground flex items-center gap-1 hover:text-primary">
                        <Phone className="w-3.5 h-3.5" />
                        {restaurant.phone}
                      </a>
                    )}
                    <Button
                      className="ml-auto"
                      onClick={() => {
                        setSelectedRestaurant(restaurant);
                        setDialogOpen(true);
                      }}
                    >
                      Réserver une table
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {selectedRestaurant && (
        <RestaurantReservationDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          restaurant={selectedRestaurant}
        />
      )}

      <Footer />
    </div>
  );
};

export default Restaurants;
