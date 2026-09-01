import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Star, MapPin, Loader2 } from "lucide-react";
import { LazyImage } from "@/components/ui/lazy-image";
import { useHotelSearch } from "@/hooks/useHotelSearch";
import bannerHotels from "@/assets/banner-hotels.jpg";

interface PartnerHotel {
  id: string;
  name: string;
  location: string;
  price: number;
  currency: string;
  rating: number;
  image: string;
}

// Page hôtels dédiée aux widgets d'affiliation (Stay22, puis Travelpayouts),
// distincte de /hotels qui interroge les API de recherche (RapidAPI/Booking/etc.).
// Ces widgets redirigent la réservation vers les sites partenaires.
const HotelsPartners = () => {
  const { searchHotels } = useHotelSearch();
  const [partnerHotels, setPartnerHotels] = useState<PartnerHotel[]>([]);
  const [loadingPartners, setLoadingPartners] = useState(true);

  useEffect(() => {
    const loadPartnerHotels = async () => {
      const today = new Date();
      const checkIn = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const checkOut = new Date(today.getTime() + 33 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      try {
        const result = await searchHotels({
          location: 'partner',
          checkIn,
          checkOut,
          adults: 2,
          children: 0,
          rooms: 1,
          partnerOnly: true,
        });

        if (result?.success && result.data?.services) {
          setPartnerHotels(
            result.data.services.map((hotel: any) => ({
              id: hotel.id,
              name: hotel.name,
              location: hotel.location || 'Abidjan',
              price: Math.round(hotel.price?.grandTotal ?? hotel.price ?? 0),
              currency: hotel.currency || 'FCFA',
              rating: hotel.rating ?? 4.5,
              image: hotel.image,
            }))
          );
        }
      } catch (error) {
        console.error('Erreur lors du chargement des hôtels partenaires:', error);
      } finally {
        setLoadingPartners(false);
      }
    };

    loadPartnerHotels();
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col pt-16">
      <Navbar />

      {/* Hero Banner - même habillage que les autres pages de service */}
      <div className="relative min-h-[50vh] md:min-h-[60vh] flex items-center justify-center overflow-hidden">
        <LazyImage
          src={bannerHotels}
          alt="Hôtels & Hébergements"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-background"></div>
        <div className="relative z-10 container mx-auto px-4 py-12 text-center animate-fade-in">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">Trouvez votre hôtel</h1>
          <p className="text-lg md:text-xl text-white/95 drop-shadow-md max-w-2xl mx-auto">
            Comparez les offres de nos partenaires et finalisez votre réservation en toute sécurité
          </p>
        </div>
      </div>

      <main className="flex-1 container mx-auto px-4 py-10 md:py-14">
        <div className="flex items-center gap-2 justify-center text-sm text-muted-foreground mb-8">
          <ShieldCheck className="w-4 h-4 text-secondary" />
          <span>Réservation sécurisée via nos partenaires certifiés</span>
        </div>

        {/* Widget Stay22 */}
        <Card className="w-full max-w-4xl mx-auto border border-gray-200 shadow-sm rounded-3xl overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl">Recherche d'hôtels</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 md:px-6 md:pb-6">
            <iframe
              id="stay22-widget"
              title="Recherche d'hôtels Stay22"
              width="100%"
              height="428"
              src="https://stay22.com/embed/6a7e4e46ef221c981e3e57a4"
              frameBorder="0"
              loading="lazy"
              style={{ border: "none", borderRadius: "12px" }}
            />
          </CardContent>
        </Card>

        {/* Suggestions d'hôtels partenaires (table `services`, partnerOnly) */}
        {loadingPartners ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : partnerHotels.length > 0 ? (
          <div className="max-w-6xl mx-auto mt-12 md:mt-16">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
              Nos hôtels partenaires à Abidjan
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {partnerHotels.map((hotel) => (
                <Card
                  key={hotel.id}
                  className="overflow-hidden border border-border/50 shadow-md hover:shadow-xl transition-all duration-300 rounded-2xl hover-lift"
                >
                  <div className="relative h-48">
                    <LazyImage
                      src={hotel.image}
                      alt={hotel.name}
                      className="w-full h-full object-cover"
                    />
                    <Badge className="absolute top-3 right-3 bg-background/90 text-foreground border">
                      <Star className="w-3 h-3 mr-1 fill-amber-400 text-amber-400" />
                      {hotel.rating}
                    </Badge>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-1">{hotel.name}</h3>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{hotel.location}</span>
                    </div>
                    {hotel.price > 0 ? (
                      <p className="text-xl font-bold text-primary">
                        {hotel.price.toLocaleString()} <span className="text-sm font-medium text-muted-foreground">{hotel.currency}/nuit</span>
                      </p>
                    ) : (
                      <p className="text-sm font-medium text-muted-foreground">Prix sur demande</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : null}
      </main>

      <Footer />
    </div>
  );
};

export default HotelsPartners;
