import { useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Star, MapPin, Clock, Users, Map, Loader2 } from "lucide-react";
import { BookingDialog } from "@/components/BookingDialog";
import { TourSearchForm } from "@/components/TourSearchForm";
import { Pagination } from "@/components/Pagination";
import { LazyImage } from "@/components/ui/lazy-image";
import { Price } from "@/components/ui/price";
import { useTourServices } from "@/hooks/useTourServices";
import bannerTours from "@/assets/banner-tours.jpg";

const TOUR_CATEGORIES = ["Culture & Patrimoine", "Nature & Randonnée", "Aventure", "Plage & Détente", "Gastronomie", "Ville & Découverte"];

// Best-effort: pull the first number of days out of a free-text duration
// like "3 jours / 2 nuits" so the duration filter buckets can work without
// forcing guides into a rigid duration field.
const parseDurationDays = (duration: string): number | null => {
  const match = duration.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
};

const Tours = () => {
  const { tours, loading, error } = useTourServices();
  const [priceRange, setPriceRange] = useState([0, 200]);
  const [destinationFilter, setDestinationFilter] = useState("");
  const [durationFilter, setDurationFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("popular");
  const [selectedTour, setSelectedTour] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const maxPrice = useMemo(() => {
    const highest = tours.reduce((max, tour) => Math.max(max, tour.price), 0);
    return Math.max(200, Math.ceil((highest || 200) / 50) * 50);
  }, [tours]);

  useMemo(() => {
    setPriceRange([0, maxPrice]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxPrice]);

  const filteredTours = useMemo(() => {
    let result = tours.filter(tour => tour.price >= priceRange[0] && tour.price <= priceRange[1]);

    if (destinationFilter) {
      const search = destinationFilter.toLowerCase();
      result = result.filter(tour =>
        tour.location.toLowerCase().includes(search) || tour.name.toLowerCase().includes(search)
      );
    }

    if (categoryFilter !== "all") {
      result = result.filter(tour => tour.category === categoryFilter);
    }

    if (durationFilter !== "all") {
      result = result.filter(tour => {
        const days = parseDurationDays(tour.duration);
        if (days === null) return true;
        if (durationFilter === "1day") return days <= 1;
        if (durationFilter === "2-3days") return days >= 2 && days <= 3;
        if (durationFilter === "4plus") return days >= 4;
        return true;
      });
    }

    switch (sortBy) {
      case "price-asc": result = [...result].sort((a, b) => a.price - b.price); break;
      case "price-desc": result = [...result].sort((a, b) => b.price - a.price); break;
      case "rating": result = [...result].sort((a, b) => b.rating - a.rating); break;
      default: result = [...result].sort((a, b) => b.reviews - a.reviews);
    }

    return result;
  }, [tours, priceRange, destinationFilter, categoryFilter, durationFilter, sortBy]);

  const totalPages = Math.ceil(filteredTours.length / itemsPerPage);
  const paginatedTours = filteredTours.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="min-h-screen bg-background flex flex-col pt-16">
      <Navbar />

      {/* Hero Section with Search Form */}
      <div className="relative min-h-[50vh] md:min-h-[60vh] flex items-center justify-center overflow-hidden">
        <LazyImage
          src={bannerTours}
          alt="Circuits & Tours"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-background"></div>
        <div className="relative z-10 container mx-auto px-4 py-12">
          <div className="text-center mb-8 animate-fade-in">

            <h1 className="text-4xl md:text-6xl font-bold mb-4 text-white drop-shadow-lg text-center">
              Circuits & Tours
            </h1>
            <p className="text-lg md:text-xl text-white/95 drop-shadow-md max-w-2xl mx-auto text-center">
              Découvrez des expériences inoubliables avec nos guides locaux
            </p>
          </div>
          <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <TourSearchForm />
          </div>
        </div>
      </div>

      <main className="flex-1 container mx-auto px-4 py-8">

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filtres */}
          <aside className="lg:col-span-1 space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Filtres</h2>

              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">Destination</label>
                  <Input
                    placeholder="Rechercher une destination..."
                    value={destinationFilter}
                    onChange={(e) => setDestinationFilter(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Durée</label>
                  <Select value={durationFilter} onValueChange={setDurationFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Toutes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes</SelectItem>
                      <SelectItem value="1day">1 jour</SelectItem>
                      <SelectItem value="2-3days">2-3 jours</SelectItem>
                      <SelectItem value="4plus">4+ jours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Prix: <Price amount={priceRange[0]} fromCurrency="XOF" /> - <Price amount={priceRange[1]} fromCurrency="XOF" />
                  </label>
                  <Slider
                    min={0}
                    max={maxPrice}
                    step={Math.max(5, Math.round(maxPrice / 40))}
                    value={priceRange}
                    onValueChange={setPriceRange}
                    className="mt-4"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Type d'activité</label>
                  <div className="space-y-2">
                    {TOUR_CATEGORIES.map((cat) => (
                      <label key={cat} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="tour-category"
                          className="rounded"
                          checked={categoryFilter === cat}
                          onChange={() => setCategoryFilter(cat)}
                        />
                        <span className="text-sm">{cat}</span>
                      </label>
                    ))}
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="tour-category"
                        className="rounded"
                        checked={categoryFilter === "all"}
                        onChange={() => setCategoryFilter("all")}
                      />
                      <span className="text-sm">Toutes catégories</span>
                    </label>
                  </div>
                </div>
              </div>
            </Card>
          </aside>

          {/* Liste des tours */}
          <div className="lg:col-span-3 space-y-6">
            <div className="flex justify-between items-center">
              <p className="text-muted-foreground">
                {loading ? "Chargement..." : `${filteredTours.length} circuit${filteredTours.length !== 1 ? "s" : ""} trouvé${filteredTours.length !== 1 ? "s" : ""}`}
              </p>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">Plus populaires</SelectItem>
                  <SelectItem value="price-asc">Prix croissant</SelectItem>
                  <SelectItem value="price-desc">Prix décroissant</SelectItem>
                  <SelectItem value="rating">Mieux notés</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <Card className="p-12 text-center text-muted-foreground">
                Impossible de charger les circuits pour le moment.
              </Card>
            ) : filteredTours.length === 0 ? (
              <Card className="p-12 text-center">
                <Map className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-lg font-medium mb-2">Aucun circuit disponible pour le moment</p>
                <p className="text-muted-foreground mb-6">Nos guides locaux ajoutent bientôt leurs circuits. Revenez vite !</p>
                <Button variant="outline" asChild>
                  <a href="/devenir-partenaire">Vous êtes guide touristique ? Rejoignez-nous</a>
                </Button>
              </Card>
            ) : (
              <>
                <div className="grid md:grid-cols-2 gap-6">
                  {paginatedTours.map((tour) => (
                    <Card key={tour.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <img
                        src={tour.image}
                        alt={tour.name}
                        className="w-full h-48 object-cover"
                        loading="lazy"
                      />
                      <CardContent className="p-6">
                        <h3 className="text-xl font-semibold mb-2">{tour.name}</h3>

                        <div className="flex items-center gap-2 text-muted-foreground mb-3">
                          <MapPin className="w-4 h-4" />
                          <span className="text-sm">{tour.location}</span>
                        </div>

                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < Math.floor(tour.rating)
                                    ? "fill-accent text-accent"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {tour.rating} ({tour.reviews} avis)
                          </span>
                        </div>

                        <div className="flex gap-4 mb-4 text-sm text-muted-foreground">
                          {tour.duration && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>{tour.duration}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>Jusqu'à {tour.groupSizeMax} personnes</span>
                          </div>
                        </div>

                        <div className="flex justify-between items-center mt-4 pt-4 border-t">
                          <div>
                            <p className="text-sm text-muted-foreground">À partir de</p>
                            <p className="text-2xl font-bold text-primary">
                              <Price amount={tour.price} fromCurrency={tour.currency} />
                            </p>
                          </div>
                          <Button onClick={() => {
                            setSelectedTour({
                              id: tour.id,
                              name: tour.name,
                              price_per_unit: tour.price,
                              currency: tour.currency,
                              type: "tour",
                              location: tour.location,
                            });
                            setDialogOpen(true);
                          }}>
                            Réserver
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  itemsPerPage={itemsPerPage}
                  totalItems={filteredTours.length}
                />
              </>
            )}
          </div>
        </div>
      </main>

      {selectedTour && (
        <BookingDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          service={selectedTour}
        />
      )}

      <Footer />
    </div>
  );
};

export default Tours;
