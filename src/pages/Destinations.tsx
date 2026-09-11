import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, MapPin, Star } from "lucide-react";
import { LazyImage } from "@/components/ui/lazy-image";
import { useTranslation } from "react-i18next";
import { useDestinations, useDestinationSearch } from "@/hooks/useDestinations";
import { DestinationGrid } from "@/components/destinations/DestinationGrid";
import destinationsHero from "@/assets/destination-hotel.jpg";
import { useNewsletterSubscribe } from "@/hooks/useNewsletterSubscribe";
import { toast } from "sonner";

// Countries commonly associated with African destinations, used only to
// filter the real search results already returned by the destinations API -
// this does not add or invent any destination data of its own.
const AFRICAN_COUNTRIES = [
  'sénégal', 'senegal', 'côte d\'ivoire', 'cote d\'ivoire', 'ivory coast',
  'maroc', 'morocco', 'égypte', 'egypt', 'tanzanie', 'tanzania',
  'afrique du sud', 'south africa', 'kenya', 'nigeria', 'ghana',
  'tunisie', 'tunisia', 'algérie', 'algeria', 'cameroun', 'cameroon',
  'ethiopie', 'ethiopia', 'rwanda', 'namibie', 'namibia', 'zanzibar',
];

const Destinations = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const { subscribe: subscribeNewsletter, loading: subscribingNewsletter } = useNewsletterSubscribe();

  const defaultResults = useDestinations({ enabled: searchQuery.trim().length < 2 });
  const searchResults = useDestinationSearch(searchQuery);
  const activeResults = searchQuery.trim().length >= 2 ? searchResults : defaultResults;

  const destinations = activeResults.data || [];
  const africanDestinations = destinations.filter((dest) =>
    AFRICAN_COUNTRIES.some((c) => dest.country?.toLowerCase().includes(c))
  );

  const handleNewsletterSubmit = async () => {
    if (!newsletterEmail.trim()) {
      toast.error(t("footer.newsletter.emailRequired"));
      return;
    }
    const result = await subscribeNewsletter(newsletterEmail.trim());
    if (result) {
      toast.success(result.message || t("footer.newsletter.subscribeSuccess"));
      setNewsletterEmail("");
    } else {
      toast.error(t("footer.newsletter.subscribeError"));
    }
  };

  return (
    <div className="min-h-screen flex flex-col pt-16">
      <Navbar />

      {/* Hero Section with Search Form */}
      <div className="relative min-h-[50vh] md:min-h-[60vh] flex items-center justify-center overflow-hidden">
        <LazyImage
          src={destinationsHero}
          alt={t("destinations.title", "Explorez le Monde")}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/70 via-primary/50 to-background"></div>
        <div className="absolute inset-0" style={{ background: "radial-gradient(120% 90% at 15% 0%, hsl(var(--gold) / 0.22), transparent 55%)" }}></div>
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
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 bg-background py-12">
        <div className="container mx-auto px-4">
          <Tabs defaultValue="popular" className="space-y-8">
            <TabsList className="grid w-full max-w-sm mx-auto grid-cols-2">
              <TabsTrigger value="popular">
                <Star className="mr-2 h-4 w-4" />
                {t("destinations.tabs.popular", "Populaires")}
              </TabsTrigger>
              <TabsTrigger value="africa">
                <MapPin className="mr-2 h-4 w-4" />
                {t("destinations.tabs.africa", "Afrique")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="popular">
              <DestinationGrid
                destinations={destinations}
                isLoading={activeResults.isLoading}
                isError={activeResults.isError}
                onRefresh={() => activeResults.refetch()}
                emptyMessage={
                  searchQuery.trim().length >= 2
                    ? t("destinations.noResultsFor", `Aucune destination ne correspond à "${searchQuery}"`)
                    : t("destinations.noResults", "Aucune destination disponible pour le moment")
                }
              />
            </TabsContent>

            <TabsContent value="africa">
              <DestinationGrid
                destinations={africanDestinations}
                isLoading={activeResults.isLoading}
                isError={activeResults.isError}
                onRefresh={() => activeResults.refetch()}
                emptyMessage={t("destinations.noAfricaResults", "Aucune destination africaine trouvée pour cette recherche")}
              />
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
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
            />
            <Button variant="secondary" onClick={handleNewsletterSubmit} disabled={subscribingNewsletter}>
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
