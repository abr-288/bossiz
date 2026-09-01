import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LazyImage } from "@/components/ui/lazy-image";
import { MapPin, Star, Loader2, Users, Calendar, Wifi, Coffee, Utensils, Waves, Mountain, Building2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useDestinations } from "@/hooks/useDestinations";
import { Price } from "@/components/ui/price";


const DestinationsSection = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: destinations, isLoading } = useDestinations();

  const getDestinationIcon = (name: string) => {
    const nameLower = name.toLowerCase();
    if (nameLower.includes('plage') || nameLower.includes('beach') || nameLower.includes('mer')) return Waves;
    if (nameLower.includes('montagne') || nameLower.includes('mountain')) return Mountain;
    if (nameLower.includes('ville') || nameLower.includes('city')) return Building2;
    return MapPin;
  };

  const getAmenityIcon = (amenity: string) => {
    const amenityLower = amenity.toLowerCase();
    if (amenityLower.includes('wifi')) return Wifi;
    if (amenityLower.includes('restaurant') || amenityLower.includes('repas')) return Utensils;
    if (amenityLower.includes('café') || amenityLower.includes('coffee')) return Coffee;
    return Star;
  };

  return (
    <section className="py-10 sm:py-16 md:py-20 lg:py-24 bg-gradient-to-b from-muted/20 via-background to-muted/30 relative overflow-hidden w-full">
      {/* Decorative background */}
      <div className="absolute inset-0 gradient-mesh opacity-30" />
      <div className="absolute top-20 right-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-10 w-80 h-80 bg-secondary/5 rounded-full blur-3xl" />
      
      <div className="site-container relative z-10">
        <div className="text-center mb-12 md:mb-16 animate-slide-up-fade">
          <div className="inline-block mb-4">
            <span className="px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold">
              🌍 Découvrez le Monde
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gradient mb-4 md:mb-6 px-4">
            {t('destinations.title')}
          </h2>
          <p className="text-sm sm:text-base md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            {t('destinations.subtitle')}
          </p>
          
          {/* Decorative line */}
          <div className="flex justify-center gap-2 mt-6">
            <div className="w-16 h-1 bg-gradient-primary rounded-full" />
            <div className="w-8 h-1 bg-primary/50 rounded-full" />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 lg:gap-10">
            {destinations?.slice(0, 9).map((destination, index) => {
              const DestinationIcon = getDestinationIcon(destination.name);
              
              return (
              <Card
                key={destination.id}
                className="group overflow-hidden border-2 border-border/50 hover:border-primary/50 shadow-xl hover:shadow-2xl transition-all duration-500 cursor-pointer animate-slide-up-fade hover-lift rounded-2xl relative bg-gradient-card"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Shimmer effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-10">
                  <div className="absolute inset-0 animate-shimmer" />
                </div>
                
                <div className="relative h-48 md:h-56 lg:h-64 overflow-hidden">
                  <LazyImage
                    src={destination.image}
                    alt={`Destination ${destination.name} - ${destination.location}`}
                    className="w-full h-full object-cover transition-smooth group-hover:scale-110"
                  />
                  
                  {/* Gradient overlay pour meilleure lisibilité */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  
                  {/* Badge catégorie */}
                  <div className="absolute top-4 left-4 z-10">
                    <Badge className="bg-primary/90 backdrop-blur-sm text-primary-foreground gap-1.5 px-3 py-1.5">
                      <DestinationIcon className="w-3.5 h-3.5" />
                      {destination.category || 'Séjour'}
                    </Badge>
                  </div>
                  
                  {/* Rating */}
                  <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1.5 z-10">
                    <Star className="w-4 h-4 fill-secondary text-secondary" />
                    <span className="font-semibold text-sm">{destination.rating}</span>
                    <span className="text-xs text-muted-foreground">({destination.reviews})</span>
                  </div>
                  
                  {/* Info en bas de l'image */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
                    <div className="flex items-center gap-2 text-white">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm font-medium">{destination.location}</span>
                    </div>
                  </div>
                </div>

                <CardContent className="p-6 space-y-4">
                  {/* Titre et Prix */}
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-smooth flex-1">
                      {destination.name}
                    </h3>
                    <div className="text-right flex-shrink-0">
                      <p className="text-2xl font-bold text-primary whitespace-nowrap">
                        <Price amount={typeof destination.price === 'number' ? destination.price : parseFloat(String(destination.price).replace(/\s/g, '')) || 0} fromCurrency="EUR" showLoader />
                      </p>
                      <p className="text-xs text-muted-foreground whitespace-nowrap">/ {t('destinations.perNight')}</p>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed">
                    {destination.description}
                  </p>

                  {/* Équipements/Commodités */}
                  {destination.amenities && destination.amenities.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Équipements
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {destination.amenities.slice(0, 4).map((amenity: string, idx: number) => {
                          const AmenityIcon = getAmenityIcon(amenity);
                          return (
                            <Badge 
                              key={idx} 
                              variant="outline" 
                              className="gap-1.5 text-xs bg-muted/50 hover:bg-muted"
                            >
                              <AmenityIcon className="w-3 h-3" />
                              {amenity}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Points forts */}
                  {destination.highlights && destination.highlights.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Points forts
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {destination.highlights.slice(0, 3).map((highlight: string, idx: number) => (
                          <Badge 
                            key={idx} 
                            variant="secondary"
                            className="text-xs"
                          >
                            ✓ {highlight}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Informations supplémentaires */}
                  <div className="flex items-center gap-4 pt-2 border-t border-border/50">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span className="text-xs">{t('destinationsSection.upToPersons', { count: 4 })}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span className="text-xs">{t('destinationsSection.flexibleCancellation')}</span>
                    </div>
                  </div>

                  {/* Boutons d'action */}
                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline"
                      className="flex-1 hover:bg-primary/5 hover:text-primary hover:border-primary transition-all"
                      onClick={() => navigate(`/destinations/${destination.id}`)}
                    >
                      Voir détails
                    </Button>
                    <Button 
                      className="flex-1 gradient-primary shadow-primary hover:shadow-xl transition-all"
                      onClick={() => {
                      const priceStr = typeof destination.price === 'number' ? String(destination.price) : String(destination.price).replace(/\s/g, '');
                      const params = new URLSearchParams({
                        type: 'stay',
                        name: destination.name,
                        price: priceStr,
                        currency: 'EUR',
                        location: destination.location,
                        serviceId: destination.id,
                      });
                        navigate(`/booking/stay?${params.toString()}`);
                      }}
                    >
                      {t('destinations.book')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )})}
          </div>
        )}

        <div className="text-center mt-12">
          <Button 
            variant="outline" 
            size="lg" 
            className="gap-2"
            onClick={() => navigate('/destinations')}
          >
            {t('destinations.viewAll')}
          </Button>
        </div>
      </div>
    </section>
  );
};

export default DestinationsSection;
