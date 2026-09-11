import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  MapPin, Star, ArrowLeft, Clock,
  Mountain, ThermometerSun
} from "lucide-react";
import { useState, useEffect } from "react";
import { useDestinations } from "@/hooks/useDestinations";
import { useWeather, WeatherData } from "@/hooks/useWeather";
import { Price } from "@/components/ui/price";

// Destination-specific gallery images as fallback
const destinationGalleryMap: Record<string, string[]> = {
  'Paris': ['https://images.unsplash.com/photo-1549144511-f099e773c147?w=800&q=80','https://images.unsplash.com/photo-1431274172761-fca41d930114?w=800&q=80','https://images.unsplash.com/photo-1478391679764-b2d8b3cd1e94?w=800&q=80'],
  'Dubaï': ['https://images.unsplash.com/photo-1518684079-3c830dcef090?w=800&q=80','https://images.unsplash.com/photo-1580674684081-7617fbf3d745?w=800&q=80','https://images.unsplash.com/photo-1546412414-e1885259563a?w=800&q=80'],
  'Maldives': ['https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=800&q=80','https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=800&q=80','https://images.unsplash.com/photo-1578922746465-3a80a228f223?w=800&q=80'],
  'Tokyo': ['https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&q=80','https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800&q=80','https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&q=80'],
  'Bali': ['https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=800&q=80','https://images.unsplash.com/photo-1573790387438-4da905039392?w=800&q=80','https://images.unsplash.com/photo-1539367628448-4bc5c9d171c8?w=800&q=80'],
  'New York': ['https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800&q=80','https://images.unsplash.com/photo-1522083165195-3424ed129620?w=800&q=80','https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?w=800&q=80'],
  'Santorini': ['https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&q=80','https://images.unsplash.com/photo-1571406252241-db0280bd36cd?w=800&q=80','https://images.unsplash.com/photo-1560703650-ef3e0f254ae0?w=800&q=80'],
  'Marrakech': ['https://images.unsplash.com/photo-1587974928442-77dc3e0748b1?w=800&q=80','https://images.unsplash.com/photo-1509735579945-1d10071d0cb4?w=800&q=80','https://images.unsplash.com/photo-1548820492-2c9fadb873c3?w=800&q=80'],
  'Barcelona': ['https://images.unsplash.com/photo-1562883676-8c7feb83f09b?w=800&q=80','https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=800&q=80','https://images.unsplash.com/photo-1529551739587-e242c564f727?w=800&q=80'],
};

function getDestinationGalleryImages(name: string): string[] {
  return destinationGalleryMap[name] || [
    'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80',
    'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80',
    'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80',
  ];
}

const DestinationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [selectedImage, setSelectedImage] = useState(0);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const { data: destinations } = useDestinations();
  const { getWeather } = useWeather();
  const destination = destinations?.find(d => d.id === id);

  useEffect(() => {
    if (destination?.name) {
      getWeather(destination.name).then(data => {
        if (data) setWeather(data);
      });
    }
  }, [destination?.name]);

  if (!destination) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Destination non trouvée</h2>
          <Button onClick={() => navigate("/")}>Retour à l'accueil</Button>
        </div>
      </div>
    );
  }

  // Use destination's own images for gallery, deduplicate
  const rawImages = [destination.image, ...(destination.images || [])];
  const uniqueImages = [...new Set(rawImages)].filter(Boolean);
  const galleryImages = uniqueImages.length >= 2 ? uniqueImages : [
    destination.image,
    ...getDestinationGalleryImages(destination.name),
  ];


  return (
    <div className="min-h-screen bg-background pt-16">
      {/* Header */}
      <div className="bg-gradient-to-b from-primary/10 to-background border-b">
        <div className="container mx-auto px-4 py-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </div>
      </div>

      {/* Gallery Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Main Image */}
            <div className="space-y-4">
              <div className="relative h-96 rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src={galleryImages[selectedImage]}
                  alt={destination.name}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Thumbnail Gallery */}
              <div className="grid grid-cols-4 gap-4">
                {galleryImages.map((img, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`relative h-24 rounded-lg overflow-hidden cursor-pointer transition-all ${
                      selectedImage === idx ? "ring-4 ring-primary" : "opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                ))}
              </div>
            </div>

            {/* Info Section */}
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <MapPin className="w-4 h-4" />
                  <span>{destination.location}</span>
                </div>
                <h1 className="text-4xl font-bold mb-4">{destination.name}</h1>
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 fill-secondary text-secondary" />
                    <span className="font-semibold">{destination.rating}</span>
                    <span className="text-muted-foreground">({destination.reviews} avis)</span>
                  </div>
                </div>
                <p className="text-lg text-muted-foreground">{destination.description}</p>
              </div>

              {/* Weather Widget */}
              {weather && (
                <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Météo actuelle</h3>
                        <div className="flex items-center gap-4">
                          <ThermometerSun className="w-8 h-8 text-orange-500" />
                          <div>
                            <p className="text-3xl font-bold">{weather.temperature}°C</p>
                            <p className="text-muted-foreground capitalize">{weather.condition}</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Humidité: {weather.humidity}%</p>
                        <p className="text-sm text-muted-foreground">Vent: {weather.windSpeed} km/h</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Booking Card */}
              <Card className="bg-gradient-card shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-baseline justify-between mb-4">
                    <div>
                      <span className="text-3xl font-bold text-primary">
                        <Price amount={typeof destination.price === 'number' ? destination.price : parseFloat(String(destination.price).replace(/\s/g, '')) || 0} fromCurrency="EUR" />
                      </span>
                      <span className="text-muted-foreground ml-2">/ nuit</span>
                    </div>
                  </div>
                  <Button 
                    className="w-full gradient-primary shadow-primary hover:shadow-xl transition-all"
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
                    Réserver maintenant
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Details Section */}
          <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* About */}
              <Card>
                <CardContent className="p-6 space-y-4">
                  <h3 className="text-2xl font-bold">À propos de cette destination</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {destination.description}
                  </p>
                  
                  {/* Category Badge */}
                  {destination.category && (
                    <div className="pt-4 border-t">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-muted-foreground">Catégorie:</span>
                        <Badge variant="secondary" className="text-sm">
                          {destination.category}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {/* Amenities */}
                  {destination.amenities && destination.amenities.length > 0 && (
                    <div className="pt-4 border-t space-y-3">
                      <h4 className="font-semibold text-lg">Équipements et services</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {destination.amenities.map((amenity, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 rounded-full bg-primary" />
                            <span>{amenity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Highlights */}
                  {destination.highlights && destination.highlights.length > 0 && (
                    <div className="pt-4 border-t space-y-3">
                      <h4 className="font-semibold text-lg">Points forts</h4>
                      <div className="space-y-2">
                        {destination.highlights.map((highlight, idx) => (
                          <div key={idx} className="flex items-start gap-3">
                            <Star className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-muted-foreground">{highlight}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Info */}
              <Card className="bg-gradient-to-br from-primary/5 to-secondary/5">
                <CardContent className="p-6 space-y-3">
                  <h3 className="text-lg font-bold">Informations pratiques</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      <span>Check-in: 14h00 - Check-out: 11h00</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span>{destination.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-primary" />
                      <span>Annulation gratuite jusqu'à 24h avant</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Tabs Section */}
          <Tabs defaultValue="activities" className="mt-12">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="activities">Activités & Excursions</TabsTrigger>
              <TabsTrigger value="reviews">Avis Clients</TabsTrigger>
            </TabsList>

            {/* Activities Tab */}
            <TabsContent value="activities" className="mt-6">
              <Card className="p-8 text-center">
                <Mountain className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-50" />
                <h3 className="text-xl font-bold mb-2">Activités et excursions</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Découvrez les activités réellement proposées par nos partenaires près de {destination.location}.
                </p>
                <Button asChild>
                  <a href="/activities">Voir les activités disponibles</a>
                </Button>
              </Card>
            </TabsContent>

            {/* Reviews Tab */}
            <TabsContent value="reviews" className="mt-6">
              <Card className="p-8 text-center">
                <Star className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-50" />
                <h3 className="text-xl font-bold mb-2">Avis clients</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Aucun avis vérifié pour le moment sur cette destination. Les avis affichés sur B-Reserve
                  proviennent uniquement de clients ayant réellement effectué une réservation.
                </p>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
  );
};

export default DestinationDetail;
