import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { EventSearchForm } from "@/components/EventSearchForm";
import { EventResults } from "@/components/EventResults";
import { BookingDialog } from "@/components/BookingDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Music, Trophy, Theater, PartyPopper, Star, Users, TrendingUp } from "lucide-react";
import { LazyImage } from "@/components/ui/lazy-image";
import { useTranslation } from "react-i18next";
import bannerEvents from "@/assets/banner-events.jpg";

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
          <div className="absolute inset-0 bg-gradient-to-b from-primary/70 via-primary/50 to-background"></div>
        <div className="absolute inset-0" style={{ background: "radial-gradient(120% 90% at 15% 0%, hsl(var(--gold) / 0.22), transparent 55%)" }}></div>

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
          <section className="py-12">
            <div className="container mx-auto px-4">
              <Card className="p-12 text-center text-muted-foreground">
                <Calendar className="w-10 h-10 mx-auto mb-4 opacity-50" />
                {t("events.searchPrompt", "Utilisez le formulaire ci-dessus pour rechercher des événements")}
              </Card>
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
