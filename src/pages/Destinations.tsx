import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, MapPin, Star, TrendingUp, Calendar, Users, Plane, Heart, Globe, Sun, Compass, Mountain } from "lucide-react";
import { LazyImage } from "@/components/ui/lazy-image";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

const Destinations = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);

  const toggleFavorite = (city: string) => {
    setFavorites(prev => 
      prev.includes(city) ? prev.filter(c => c !== city) : [...prev, city]
    );
  };

  const popularDestinations = [
    {
      city: "Paris",
      country: "France",
      image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800",
      description: "La ville lumière, capitale de la mode et de la gastronomie",
      price: "À partir de 450 000 FCFA",
      rating: 4.8,
      trending: true,
      tags: ["Culture", "Gastronomie", "Shopping"],
      temperature: "18°C",
    },
    {
      city: "Dubaï",
      country: "Émirats Arabes Unis",
      image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800",
      description: "Luxe et modernité dans le désert",
      price: "À partir de 550 000 FCFA",
      rating: 4.9,
      trending: true,
      tags: ["Luxe", "Shopping", "Plage"],
      temperature: "32°C",
    },
    {
      city: "Marrakech",
      country: "Maroc",
      image: "https://images.unsplash.com/photo-1558969697-1bbde4489068?w=800",
      description: "La perle rouge du Maroc",
      price: "À partir de 280 000 FCFA",
      rating: 4.7,
      trending: false,
      tags: ["Culture", "Aventure", "Gastronomie"],
      temperature: "28°C",
    },
    {
      city: "New York",
      country: "États-Unis",
      image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800",
      description: "La ville qui ne dort jamais",
      price: "À partir de 680 000 FCFA",
      rating: 4.8,
      trending: true,
      tags: ["Culture", "Shopping", "Vie Nocturne"],
      temperature: "15°C",
    },
    {
      city: "Istanbul",
      country: "Turquie",
      image: "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800",
      description: "Entre l'Orient et l'Occident",
      price: "À partir de 320 000 FCFA",
      rating: 4.6,
      trending: false,
      tags: ["Culture", "Histoire", "Gastronomie"],
      temperature: "22°C",
    },
    {
      city: "Bali",
      country: "Indonésie",
      image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800",
      description: "Paradis tropical et spiritualité",
      price: "À partir de 590 000 FCFA",
      rating: 4.9,
      trending: true,
      tags: ["Plage", "Nature", "Détente"],
      temperature: "30°C",
    },
    {
      city: "Le Caire",
      country: "Égypte",
      image: "https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=800",
      description: "L'histoire millénaire des pharaons",
      price: "À partir de 350 000 FCFA",
      rating: 4.5,
      trending: false,
      tags: ["Histoire", "Culture", "Aventure"],
      temperature: "35°C",
    },
    {
      city: "Rome",
      country: "Italie",
      image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800",
      description: "La ville éternelle",
      price: "À partir de 420 000 FCFA",
      rating: 4.8,
      trending: false,
      tags: ["Histoire", "Culture", "Gastronomie"],
      temperature: "24°C",
    },
  ];

  const africanDestinations = [
    {
      city: "Dakar",
      country: "Sénégal",
      image: "https://images.unsplash.com/photo-1578730647099-46d97c00d33d?w=800",
      description: "Vibrant carrefour culturel d'Afrique de l'Ouest",
      price: "À partir de 150 000 FCFA",
      rating: 4.5,
      tags: ["Culture", "Plage", "Musique"],
      temperature: "27°C",
    },
    {
      city: "Zanzibar",
      country: "Tanzanie",
      image: "https://images.unsplash.com/photo-1568322445389-f64ac2515020?w=800",
      description: "Îles aux épices et plages paradisiaques",
      price: "À partir de 480 000 FCFA",
      rating: 4.9,
      tags: ["Plage", "Nature", "Détente"],
      temperature: "29°C",
    },
    {
      city: "Le Cap",
      country: "Afrique du Sud",
      image: "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=800",
      description: "Entre montagne et océan",
      price: "À partir de 520 000 FCFA",
      rating: 4.8,
      tags: ["Nature", "Vin", "Aventure"],
      temperature: "20°C",
    },
    {
      city: "Essaouira",
      country: "Maroc",
      image: "https://images.unsplash.com/photo-1597212618440-806262de4f6b?w=800",
      description: "Ville côtière au charme authentique",
      price: "À partir de 250 000 FCFA",
      rating: 4.6,
      tags: ["Plage", "Culture", "Sports"],
      temperature: "23°C",
    },
    {
      city: "Abidjan",
      country: "Côte d'Ivoire",
      image: "https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?w=800",
      description: "La perle des lagunes",
      price: "À partir de 120 000 FCFA",
      rating: 4.4,
      tags: ["Business", "Culture", "Gastronomie"],
      temperature: "28°C",
    },
    {
      city: "Nairobi",
      country: "Kenya",
      image: "https://images.unsplash.com/photo-1611348524140-53c9a25263d6?w=800",
      description: "Safari et ville moderne",
      price: "À partir de 426 000 FCFA",
      rating: 4.7,
      tags: ["Safari", "Nature", "Aventure"],
      temperature: "22°C",
    },
  ];

  const filteredDestinations = searchQuery
    ? popularDestinations.filter(
        (dest) =>
          dest.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
          dest.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
          dest.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : popularDestinations;

  const DestinationCard = ({ dest, index }: { dest: typeof popularDestinations[0], index: number }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="overflow-hidden hover:shadow-xl transition-all group cursor-pointer h-full">
        <div className="relative h-48 overflow-hidden">
          <LazyImage
            src={dest.image}
            alt={dest.city}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
          {'trending' in dest && dest.trending && (
            <Badge className="absolute top-4 right-4 bg-secondary">
              <TrendingUp className="mr-1 h-3 w-3" />
              Tendance
            </Badge>
          )}
          <Button
            size="icon"
            variant="ghost"
            className={`absolute top-4 left-4 bg-white/80 hover:bg-white ${
              favorites.includes(dest.city) ? 'text-red-500' : ''
            }`}
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(dest.city);
            }}
          >
            <Heart className={`h-4 w-4 ${favorites.includes(dest.city) ? 'fill-current' : ''}`} />
          </Button>
          {'temperature' in dest && (
            <div className="absolute bottom-4 right-4 bg-black/70 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
              <Sun className="h-3 w-3" />
              {dest.temperature}
            </div>
          )}
        </div>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between mb-2">
            <CardTitle className="text-xl">{dest.city}</CardTitle>
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold">{dest.rating}</span>
            </div>
          </div>
          <CardDescription className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {dest.country}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {dest.description}
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            {dest.tags.map((tag, tagIndex) => (
              <Badge key={tagIndex} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-primary">
              {dest.price}
            </span>
            <Button
              size="sm"
              onClick={() => navigate(`/flights?to=${dest.city}`)}
            >
              <Plane className="mr-2 h-4 w-4" />
              Voir les vols
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="min-h-screen flex flex-col pt-16">
      <Navbar />

      {/* Hero Section with Search Form */}
      <div className="relative min-h-[50vh] md:min-h-[60vh] flex items-center justify-center overflow-hidden">
        <LazyImage
          src="https://images.unsplash.com/photo-1488085061387-422e29b40080?w=1920"
          alt={t("destinations.title", "Explorez le Monde")}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-background"></div>
        <div className="relative z-10 container mx-auto px-4 py-12">
          <div className="text-center mb-8 animate-fade-in">

            <h1 className="text-4xl md:text-6xl font-bold mb-4 text-white drop-shadow-lg tracking-tighter">
              {t("destinations.title", "Explorez le Monde")}
            </h1>
            <p className="text-lg md:text-xl text-white/95 drop-shadow-md max-w-2xl mx-auto font-medium">
              {t("destinations.subtitle", "Découvrez des destinations incroyables adaptées à vos envies")}
            </p>
          </div>

          <div className="max-w-3xl mx-auto animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                type="text"
                placeholder={t("destinations.searchPlaceholder", "Rechercher une destination...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 py-7 text-lg bg-white/95 backdrop-blur-sm border-white/20 shadow-2xl rounded-2xl focus-visible:ring-primary/20 transition-all"
              />
              <Button className="absolute right-2 top-1/2 -translate-y-1/2 h-11 px-6 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-all">
                {t("search.search")}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <section className="py-8 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="text-center p-4">
              <CardContent className="pt-2">
                <Globe className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold">150+</p>
                <p className="text-sm text-muted-foreground">{t("destinations.stats.destinations")}</p>
              </CardContent>
            </Card>
            <Card className="text-center p-4">
              <CardContent className="pt-2">
                <Compass className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold">50+</p>
                <p className="text-sm text-muted-foreground">{t("destinations.stats.countries")}</p>
              </CardContent>
            </Card>
            <Card className="text-center p-4">
              <CardContent className="pt-2">
                <Users className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold">100K+</p>
                <p className="text-sm text-muted-foreground">{t("destinations.stats.travelers")}</p>
              </CardContent>
            </Card>
            <Card className="text-center p-4">
              <CardContent className="pt-2">
                <Mountain className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold">4.8</p>
                <p className="text-sm text-muted-foreground">{t("destinations.stats.avgRating")}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="flex-1 bg-background py-12">
        <div className="container mx-auto px-4">
          <Tabs defaultValue="popular" className="space-y-8">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
              <TabsTrigger value="popular">
                <Star className="mr-2 h-4 w-4" />
                Populaires
              </TabsTrigger>
              <TabsTrigger value="africa">
                <MapPin className="mr-2 h-4 w-4" />
                Afrique
              </TabsTrigger>
              <TabsTrigger value="trending">
                <TrendingUp className="mr-2 h-4 w-4" />
                Tendances
              </TabsTrigger>
            </TabsList>

            <TabsContent value="popular">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredDestinations.map((dest, index) => (
                  <DestinationCard key={dest.city} dest={dest} index={index} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="africa">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {africanDestinations.map((dest, index) => (
                  <DestinationCard key={dest.city} dest={dest as any} index={index} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="trending">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {popularDestinations
                  .filter((dest) => dest.trending)
                  .map((dest, index) => (
                    <DestinationCard key={dest.city} dest={dest} index={index} />
                  ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Newsletter Section */}
      <section className="py-12 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            {t("destinations.newsletter", "Recevez nos meilleures offres")}
          </h2>
          <p className="mb-6 opacity-90 max-w-xl mx-auto">
            {t("destinations.newsletterSubtitle", "Inscrivez-vous pour recevoir des offres exclusives et des inspirations voyage")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <Input 
              type="email" 
              placeholder={t("footer.newsletter.placeholder")}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
            />
            <Button variant="secondary">
              {t("pages.support.subscribe")}
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Destinations;
