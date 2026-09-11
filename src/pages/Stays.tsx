import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Star, Loader2, Palmtree, Wifi, Coffee, Car, Waves, Shield, Clock, Heart, Users, CheckCircle } from "lucide-react";
import { WeatherWidget } from "@/components/WeatherWidget";

import { StaySearchForm } from "@/components/StaySearchForm";
import { BookingDialog } from "@/components/BookingDialog";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Price } from "@/components/ui/price";
import { useStaySearch } from "@/hooks/useStaySearch";
import { LazyImage } from "@/components/ui/lazy-image";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import bannerStays from "@/assets/banner-stays.jpg";

// Types de séjours
const STAY_TYPE_ICONS = [
  { id: "villa", icon: Palmtree, color: "bg-green-500" },
  { id: "apartment", icon: Coffee, color: "bg-blue-500" },
  { id: "beach", icon: Waves, color: "bg-cyan-500" },
  { id: "luxury", icon: Star, color: "bg-amber-500" },
];

const Stays = () => {
  const { t } = useTranslation();

  const stayTypes = STAY_TYPE_ICONS.map((type) => ({
    ...type,
    name: t(`pages.stays.types.${type.id}`),
  }));

  const stayFeatures = [
    { icon: Shield, title: t('pages.stays.features.secureBooking.title'), description: t('pages.stays.features.secureBooking.description') },
    { icon: Clock, title: t('pages.hotels.badges.freeCancellation'), description: t('pages.stays.features.freeCancellation.description') },
    { icon: Users, title: t('pages.stays.features.support.title'), description: t('pages.stays.features.support.description') },
    { icon: CheckCircle, title: t('pages.stays.features.quality.title'), description: t('pages.stays.features.quality.description') },
  ];
  const [searchParams] = useSearchParams();
  const [selectedStay, setSelectedStay] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(searchParams.get("type"));
  const [favorites, setFavorites] = useState<string[]>([]);
  const { stays, loading, searchStays } = useStaySearch();

  useEffect(() => {
    const destination = searchParams.get("destination") || undefined;
    const type = searchParams.get("type") || undefined;
    setSelectedType(type || null);
    searchStays({ location: destination, type });
  }, [searchParams]);

  const toggleFavorite = (id: string) => {
    setFavorites(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const filteredStays = selectedType
    ? stays.filter(stay => stay.type?.toLowerCase().includes(selectedType))
    : stays;

  return (
    <div className="min-h-screen bg-background flex flex-col pt-16">
      <Navbar />

      {/* Hero Section Synchronized with other bannières */}
      <div className="relative min-h-[50vh] md:min-h-[60vh] flex items-center justify-center overflow-hidden">
        <LazyImage
          src={bannerStays}
          alt={t("stays.title", "Séjours et Escapades")}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-background/20"></div>
        <div className="relative z-10 container mx-auto px-4 py-12">
          <div className="text-center mb-8 animate-fade-in">

            <h1 className="text-4xl md:text-7xl font-black mb-6 text-white drop-shadow-lg tracking-tighter">
              {t("stays.title", "Séjours et Escapades")}
            </h1>
            <p className="text-lg md:text-2xl text-white/95 drop-shadow-md max-w-2xl mx-auto font-medium">
              {t("stays.subtitle", "Découvrez nos forfaits séjours tout compris et voyages sur mesure")}
            </p>
          </div>
          <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <StaySearchForm />
          </div>
        </div>
      </div>

      {/* Top Filter Bar - Mobile Only */}
      <section className="sticky top-16 z-30 bg-white/80 backdrop-blur-md border-b border-border py-4 shadow-sm lg:hidden">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-none">
            <span className="text-sm font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap mr-2">{t('pages.stays.filterBy')}</span>
            <Button
              variant={selectedType === null ? "default" : "outline"}
              className="rounded-full h-10 px-6 font-bold"
              onClick={() => setSelectedType(null)}
            >
              Tous les séjours
            </Button>
            {stayTypes.map((type) => (
              <Button
                key={type.id}
                variant={selectedType === type.id ? "default" : "outline"}
                className={cn(
                  "rounded-full h-10 px-6 font-bold flex items-center gap-2 transition-all",
                  selectedType === type.id ? "shadow-lg shadow-primary/20 scale-105" : "hover:bg-primary/5"
                )}
                onClick={() => setSelectedType(type.id)}
              >
                <type.icon className={cn("w-4 h-4", selectedType === type.id ? "text-secondary" : "text-primary")} />
                {type.name}
              </Button>
            ))}
          </div>
        </div>
      </section>

      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-12">
          
          {/* Sidebar Filters - Desktop Only */}
          <aside className="hidden lg:block space-y-8 lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
            <div className="sticky top-28 space-y-8">
              <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <span className="w-8 h-[2px] bg-primary"></span>
                  {t("stays.filters", "Filtrer")}
                </h3>
                <div className="flex flex-col gap-2">
                  <Button
                    variant={selectedType === null ? "default" : "ghost"}
                    className={cn(
                      "justify-start h-12 px-4 rounded-xl font-bold transition-all",
                      selectedType === null ? "shadow-lg shadow-primary/20 scale-[1.02]" : "hover:bg-primary/5"
                    )}
                    onClick={() => setSelectedType(null)}
                  >
                    Tous les séjours
                  </Button>
                  {stayTypes.map((type) => (
                    <Button
                      key={type.id}
                      variant={selectedType === type.id ? "default" : "ghost"}
                      className={cn(
                        "justify-start h-12 px-4 rounded-xl font-bold transition-all group",
                        selectedType === type.id ? "shadow-lg shadow-primary/20 scale-[1.02]" : "hover:bg-primary/5"
                      )}
                      onClick={() => setSelectedType(type.id)}
                    >
                      <type.icon className={cn("w-5 h-5 mr-3 transition-transform group-hover:scale-110", selectedType === type.id ? "text-secondary" : "text-primary")} />
                      {type.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Weather in Sidebar for Desktop */}
              <div className="pt-4 border-t border-border">
                <WeatherWidget city="Abidjan" />
              </div>
            </div>
          </aside>

          {/* Results Area */}
          <div className="space-y-8">
            {/* Header / Summary */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border/50 pb-8">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-foreground">
                    {selectedType 
                      ? `${stayTypes.find(t => t.id === selectedType)?.name || 'Séjours'}`
                      : t("stays.available", "Séjours disponibles")}
                  </h2>
                  <Badge variant="secondary" className="h-7 px-3 rounded-full font-black uppercase tracking-widest text-[10px]">
                    {filteredStays.length} {t("stays.results", "Hébergements")}
                  </Badge>
                </div>
                <p className="text-muted-foreground font-medium max-w-xl">
                  {t("stays.results_desc", "Découvrez notre sélection exclusive triée sur le volet pour vos prochaines vacances.")}
                </p>
              </div>

              {/* Weather Widget - Mobile Only */}
              <div className="lg:hidden w-full md:w-auto">
                <WeatherWidget city="Abidjan" />
              </div>
            </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredStays.length === 0 ? (
          <div className="text-center py-20">
            <Palmtree className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-xl text-muted-foreground">
              {t("stays.noResults", "Aucun séjour disponible")}
            </p>
            <Button className="mt-4" onClick={() => setSelectedType(null)}>
              Voir tous les séjours
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStays.map((stay, index) => (
              <motion.div
                key={stay.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="overflow-hidden hover:shadow-lg transition-all group h-full">
                  <div className="relative h-48 overflow-hidden">
                    <LazyImage
                      src={stay.image_url || 'https://images.unsplash.com/photo-1516426122078-c23e76319801'}
                      alt={stay.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute top-4 left-4 bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                      {stay.type}
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className={`absolute top-4 right-4 bg-white/80 hover:bg-white ${favorites.includes(stay.id) ? 'text-red-500' : ''
                        }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(stay.id);
                      }}
                    >
                      <Heart className={`h-4 w-4 ${favorites.includes(stay.id) ? 'fill-current' : ''}`} />
                    </Button>
                  </div>

                  <CardContent className="p-6">
                    <div className="mb-4">
                      <h3 className="text-xl font-bold mb-2 line-clamp-1">{stay.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{stay.location}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-primary" />
                          {stay.duration}
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          {stay.rating} ({stay.reviews})
                        </span>
                      </div>
                    </div>

                    {/* Amenities icons */}
                    <div className="flex gap-3 mb-4">
                      <Badge variant="outline" className="text-xs">
                        <Wifi className="w-3 h-3 mr-1" /> WiFi
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <Coffee className="w-3 h-3 mr-1" /> Petit-déj
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <Car className="w-3 h-3 mr-1" /> Parking
                      </Badge>
                    </div>

                    <div className="bg-muted/50 rounded-lg p-3 mb-4">
                      <p className="text-xs font-semibold mb-2">{t("stays.highlights", "Points forts")} :</p>
                      <ul className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                        {stay.highlights?.slice(0, 4).map((item, idx) => (
                          <li key={idx} className="flex items-center gap-1 min-w-0">
                            <div className="w-1 h-1 rounded-full bg-primary flex-shrink-0"></div>
                            <span className="truncate">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">{t("common.from", "À partir de")}</p>
                        <Price
                          amount={stay.price_per_unit}
                          fromCurrency={stay.currency}
                          className="text-2xl font-bold text-primary"
                          showLoader={true}
                        />
                      </div>
                      <Button
                        className="bg-primary text-primary-foreground font-semibold"
                        onClick={() => {
                          setSelectedStay({
                            id: stay.id,
                            name: stay.name,
                            price_per_unit: stay.price_per_unit,
                            currency: stay.currency,
                            type: "stay",
                            location: stay.location
                          });
                          setDialogOpen(true);
                        }}
                      >
                        {t("common.book", "Réserver")}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
          </div> {/* End Results Area */}
        </div> {/* End Grid */}
      </main>

      {/* Features Section */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            {t("stays.whyUs", "Pourquoi réserver avec nous ?")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stayFeatures.map((feature, index) => (
              <Card key={index} className="text-center p-6">
                <CardContent className="pt-4">
                  <feature.icon className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {selectedStay && (
        <BookingDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          service={selectedStay}
        />
      )}

      <Footer />
    </div>
  );
};

export default Stays;
