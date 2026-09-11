import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { EventSearchForm } from "@/components/EventSearchForm";
import { EventResults } from "@/components/EventResults";
import { BookingDialog } from "@/components/BookingDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Music, Trophy, Theater, PartyPopper, MapPin, Star, Users, Loader2, TrendingUp } from "lucide-react";
import { LazyImage } from "@/components/ui/lazy-image";
import { useTranslation } from "react-i18next";
import { Price } from "@/components/ui/price";
import bannerEvents from "@/assets/banner-events.jpg";

// Événements populaires par défaut
const popularEvents = [
  {
    id: "1",
    name: "Festival de Jazz d'Abidjan",
    description: "Le plus grand festival de jazz d'Afrique de l'Ouest",
    location: "Abidjan, Côte d'Ivoire",
    date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    price: "45",
    currency: "EUR",
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800",
    category: "Festival",
  },
  {
    id: "2",
    name: "Match CAN 2025 - Finale",
    description: "La grande finale de la Coupe d'Afrique des Nations",
    location: "Abidjan, Côte d'Ivoire",
    date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
    price: "120",
    currency: "EUR",
    image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800",
    category: "Sport",
  },
  {
    id: "3",
    name: "Concert Burna Boy",
    description: "Live in Africa Tour 2025",
    location: "Lagos, Nigeria",
    date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    price: "85",
    currency: "EUR",
    image: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800",
    category: "Concert",
  },
  {
    id: "4",
    name: "Dakar Fashion Week",
    description: "Le rendez-vous de la mode africaine",
    location: "Dakar, Sénégal",
    date: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000).toISOString(),
    price: "65",
    currency: "EUR",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
    category: "Mode",
  },
  {
    id: "5",
    name: "Festival Mawazine",
    description: "Rythmes du Monde - Édition 2025",
    location: "Rabat, Maroc",
    date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    price: "55",
    currency: "EUR",
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800",
    category: "Festival",
  },
  {
    id: "6",
    name: "AFCON Fan Zone",
    description: "Zone officielle des supporters",
    location: "Yamoussoukro, Côte d'Ivoire",
    date: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString(),
    price: "25",
    currency: "EUR",
    image: "https://images.unsplash.com/photo-1522778526097-ce0a22ceb253?w=800",
    category: "Sport",
  },
];

const CATEGORY_ICONS = [
  { id: "concert", icon: Music, color: "bg-pink-500" },
  { id: "sport", icon: Trophy, color: "bg-green-500" },
  { id: "theater", icon: Theater, color: "bg-purple-500" },
  { id: "festival", icon: PartyPopper, color: "bg-orange-500" },
];

const Events = () => {
  const { t } = useTranslation();
  const categories = CATEGORY_ICONS.map((c) => ({ ...c, name: t(`events.categoryNames.${c.id}`) }));
  const [searchResults, setSearchResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const filteredEvents = selectedCategory
    ? popularEvents.filter(e => e.category.toLowerCase() === selectedCategory)
    : popularEvents;

  const handleBookEvent = (event: { id: string; name: string; price: string; currency?: string; location: string }) => {
    setSelectedEvent({
      id: event.id,
      name: event.name,
      price_per_unit: parseFloat(event.price) || 0,
      currency: event.currency || 'EUR',
      type: 'event',
      location: event.location,
    });
    setDialogOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col pt-16">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section with Search Form */}
        <div className="relative min-h-[50vh] md:min-h-[60vh] flex items-center justify-center overflow-hidden">
          <LazyImage 
            src={bannerEvents}
            alt={t("events.title", "Découvrez les événements")}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-background"></div>

          <div className="relative z-10 container mx-auto px-4 py-12">
            <div className="text-center mb-8 animate-fade-in">

              <h1 className="text-4xl md:text-6xl font-bold mb-4 text-white drop-shadow-lg">
                {t("events.title", "Découvrez les événements")}
              </h1>
              <p className="text-lg md:text-xl text-white/95 drop-shadow-md max-w-2xl mx-auto">
                {t("events.subtitle", "Trouvez les meilleurs événements et activités culturelles")}
              </p>
            </div>

            <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <EventSearchForm onResults={setSearchResults} />
            </div>
          </div>
        </div>

        {/* Categories Section */}
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
              {t("events.categories", "Catégories populaires")}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categories.map((cat) => (
                <Card 
                  key={cat.id} 
                  className={`cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 ${
                    selectedCategory === cat.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                >
                  <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                    <div className={`${cat.color} p-4 rounded-full mb-4`}>
                      <cat.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="font-semibold">{cat.name}</h3>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Results Section */}
        {searchResults ? (
          <div className="container mx-auto px-4 py-12">
            <EventResults events={searchResults.events} onBook={handleBookEvent} />
          </div>
        ) : (
          /* Popular Events Section */
          <section className="py-12">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold">
                    {selectedCategory 
                      ? `${categories.find(c => c.id === selectedCategory)?.name || ''}`
                      : t("events.popular", "Événements populaires")}
                  </h2>
                  <p className="text-muted-foreground mt-1">
                    {t("events.popularSubtitle", "Les événements les plus attendus")}
                  </p>
                </div>
                {selectedCategory && (
                  <Button variant="outline" onClick={() => setSelectedCategory(null)}>
                    {t("events.viewAll")}
                  </Button>
                )}
              </div>

              {filteredEvents.length === 0 ? (
                <Card className="p-12 text-center text-muted-foreground">
                  Aucun événement dans cette catégorie pour le moment
                </Card>
              ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map((event) => (
                  <Card key={event.id} className="overflow-hidden hover:shadow-xl transition-all group">
                    <div className="relative h-48 overflow-hidden">
                      <LazyImage
                        src={event.image}
                        alt={event.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <Badge className="absolute top-4 left-4 bg-secondary">
                        {event.category}
                      </Badge>
                      <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {new Date(event.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </div>
                    </div>
                    <CardContent className="p-6">
                      <h3 className="text-xl font-bold mb-2 line-clamp-1">{event.name}</h3>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{event.description}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                        <MapPin className="w-4 h-4" />
                        {event.location}
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">{t("common.from")}</p>
                          <Price 
                            amount={parseFloat(event.price)} 
                            fromCurrency={event.currency}
                            className="text-2xl font-bold text-primary"
                          />
                        </div>
                        <Button className="bg-primary text-primary-foreground" onClick={() => handleBookEvent(event)}>
                          {t("common.book")}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              )}
            </div>
          </section>
        )}

        {/* Why Choose Us Section */}
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
              {t("events.whyUs", "Pourquoi réserver avec nous ?")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="text-center p-6">
                <CardContent className="pt-4">
                  <Star className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h3 className="font-bold text-lg mb-2">{t("events.bestPrices.title")}</h3>
                  <p className="text-muted-foreground text-sm">
                    {t("events.bestPrices.description")}
                  </p>
                </CardContent>
              </Card>
              <Card className="text-center p-6">
                <CardContent className="pt-4">
                  <Users className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h3 className="font-bold text-lg mb-2">{t("homepage.features.support-247.title")}</h3>
                  <p className="text-muted-foreground text-sm">
                    {t("events.support.description")}
                  </p>
                </CardContent>
              </Card>
              <Card className="text-center p-6">
                <CardContent className="pt-4">
                  <TrendingUp className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h3 className="font-bold text-lg mb-2">{t("events.authenticTickets.title")}</h3>
                  <p className="text-muted-foreground text-sm">
                    {t("events.authenticTickets.description")}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      {selectedEvent && (
        <BookingDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          service={selectedEvent}
        />
      )}

      <Footer />
    </div>
  );
};

export default Events;
