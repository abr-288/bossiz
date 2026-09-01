import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Star, MapPin, Clock, Users, Map } from "lucide-react";
import { BookingDialog } from "@/components/BookingDialog";
import { TourSearchForm } from "@/components/TourSearchForm";
import { Pagination } from "@/components/Pagination";
import { LazyImage } from "@/components/ui/lazy-image";
import { Price } from "@/components/ui/price";
import bannerTours from "@/assets/banner-tours.jpg";

const Tours = () => {
  const [priceRange, setPriceRange] = useState([0, 1000000]);
  const [selectedTour, setSelectedTour] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const tours = [
    // Afrique
    {
      id: 1,
      name: "Safari au Parc National de la Comoé",
      location: "Côte d'Ivoire",
      price: 250000,
      duration: "3 jours / 2 nuits",
      rating: 4.9,
      reviews: 87,
      image: "/placeholder.svg",
      capacity: "2-8 personnes"
    },
    {
      id: 2,
      name: "Safari au Parc Kruger",
      location: "Afrique du Sud",
      price: 450000,
      duration: "5 jours / 4 nuits",
      rating: 4.9,
      reviews: 312,
      image: "/placeholder.svg",
      capacity: "2-12 personnes"
    },
    {
      id: 3,
      name: "Pyramides de Gizeh et Croisière sur le Nil",
      location: "Égypte",
      price: 520000,
      duration: "7 jours / 6 nuits",
      rating: 4.8,
      reviews: 456,
      image: "/placeholder.svg",
      capacity: "2-15 personnes"
    },
    {
      id: 4,
      name: "Trek du Kilimandjaro",
      location: "Tanzanie",
      price: 780000,
      duration: "8 jours / 7 nuits",
      rating: 4.9,
      reviews: 189,
      image: "/placeholder.svg",
      capacity: "4-10 personnes"
    },
    {
      id: 5,
      name: "Safari et Plages de Zanzibar",
      location: "Tanzanie",
      price: 620000,
      duration: "6 jours / 5 nuits",
      rating: 4.8,
      reviews: 234,
      image: "/placeholder.svg",
      capacity: "2-8 personnes"
    },
    {
      id: 6,
      name: "Désert du Sahara et Marrakech",
      location: "Maroc",
      price: 380000,
      duration: "5 jours / 4 nuits",
      rating: 4.7,
      reviews: 278,
      image: "/placeholder.svg",
      capacity: "2-10 personnes"
    },
    // Europe
    {
      id: 7,
      name: "Tour de Paris et Château de Versailles",
      location: "France",
      price: 420000,
      duration: "4 jours / 3 nuits",
      rating: 4.8,
      reviews: 567,
      image: "/placeholder.svg",
      capacity: "2-15 personnes"
    },
    {
      id: 8,
      name: "Rome, Florence et Venise",
      location: "Italie",
      price: 550000,
      duration: "7 jours / 6 nuits",
      rating: 4.9,
      reviews: 489,
      image: "/placeholder.svg",
      capacity: "2-12 personnes"
    },
    {
      id: 9,
      name: "Grèce Antique et Îles",
      location: "Grèce",
      price: 480000,
      duration: "6 jours / 5 nuits",
      rating: 4.8,
      reviews: 345,
      image: "/placeholder.svg",
      capacity: "2-10 personnes"
    },
    {
      id: 10,
      name: "Barcelona et Costa Brava",
      location: "Espagne",
      price: 390000,
      duration: "5 jours / 4 nuits",
      rating: 4.7,
      reviews: 412,
      image: "/placeholder.svg",
      capacity: "2-15 personnes"
    },
    // Asie
    {
      id: 11,
      name: "Temples d'Angkor et Plages de Sihanoukville",
      location: "Cambodge",
      price: 460000,
      duration: "6 jours / 5 nuits",
      rating: 4.8,
      reviews: 298,
      image: "/placeholder.svg",
      capacity: "2-12 personnes"
    },
    {
      id: 12,
      name: "Tokyo et Mont Fuji",
      location: "Japon",
      price: 720000,
      duration: "7 jours / 6 nuits",
      rating: 4.9,
      reviews: 423,
      image: "/placeholder.svg",
      capacity: "2-10 personnes"
    },
    {
      id: 13,
      name: "Bangkok, Chiang Mai et Îles Phi Phi",
      location: "Thaïlande",
      price: 510000,
      duration: "8 jours / 7 nuits",
      rating: 4.8,
      reviews: 534,
      image: "/placeholder.svg",
      capacity: "2-15 personnes"
    },
    {
      id: 14,
      name: "Bali: Temples, Rizières et Plages",
      location: "Indonésie",
      price: 490000,
      duration: "7 jours / 6 nuits",
      rating: 4.9,
      reviews: 612,
      image: "/placeholder.svg",
      capacity: "2-12 personnes"
    },
    {
      id: 15,
      name: "Taj Mahal et Palais du Rajasthan",
      location: "Inde",
      price: 430000,
      duration: "6 jours / 5 nuits",
      rating: 4.7,
      reviews: 367,
      image: "/placeholder.svg",
      capacity: "2-15 personnes"
    },
    // Amériques
    {
      id: 16,
      name: "Machu Picchu et Vallée Sacrée",
      location: "Pérou",
      price: 680000,
      duration: "7 jours / 6 nuits",
      rating: 4.9,
      reviews: 445,
      image: "/placeholder.svg",
      capacity: "2-12 personnes"
    },
    {
      id: 17,
      name: "New York City Explorer",
      location: "États-Unis",
      price: 590000,
      duration: "5 jours / 4 nuits",
      rating: 4.8,
      reviews: 678,
      image: "/placeholder.svg",
      capacity: "2-20 personnes"
    },
    {
      id: 18,
      name: "Chutes du Niagara et Toronto",
      location: "Canada",
      price: 520000,
      duration: "5 jours / 4 nuits",
      rating: 4.7,
      reviews: 289,
      image: "/placeholder.svg",
      capacity: "2-15 personnes"
    },
    {
      id: 19,
      name: "Plages de Cancún et Pyramides Maya",
      location: "Mexique",
      price: 480000,
      duration: "6 jours / 5 nuits",
      rating: 4.8,
      reviews: 523,
      image: "/placeholder.svg",
      capacity: "2-15 personnes"
    },
    {
      id: 20,
      name: "Rio de Janeiro et Iguazu",
      location: "Brésil",
      price: 610000,
      duration: "7 jours / 6 nuits",
      rating: 4.8,
      reviews: 398,
      image: "/placeholder.svg",
      capacity: "2-12 personnes"
    },
    // Moyen-Orient
    {
      id: 21,
      name: "Dubaï: Luxe et Désert",
      location: "Émirats Arabes Unis",
      price: 750000,
      duration: "5 jours / 4 nuits",
      rating: 4.9,
      reviews: 712,
      image: "/placeholder.svg",
      capacity: "2-10 personnes"
    },
    {
      id: 22,
      name: "Istanbul: Orient et Occident",
      location: "Turquie",
      price: 420000,
      duration: "5 jours / 4 nuits",
      rating: 4.8,
      reviews: 456,
      image: "/placeholder.svg",
      capacity: "2-15 personnes"
    },
    {
      id: 23,
      name: "Petra et Wadi Rum",
      location: "Jordanie",
      price: 560000,
      duration: "6 jours / 5 nuits",
      rating: 4.9,
      reviews: 234,
      image: "/placeholder.svg",
      capacity: "2-12 personnes"
    },
    // Océanie
    {
      id: 24,
      name: "Sydney, Grande Barrière de Corail",
      location: "Australie",
      price: 920000,
      duration: "10 jours / 9 nuits",
      rating: 4.9,
      reviews: 389,
      image: "/placeholder.svg",
      capacity: "2-10 personnes"
    },
    {
      id: 25,
      name: "Nouvelle-Zélande: Hobbiton et Fjords",
      location: "Nouvelle-Zélande",
      price: 850000,
      duration: "9 jours / 8 nuits",
      rating: 4.9,
      reviews: 267,
      image: "/placeholder.svg",
      capacity: "2-12 personnes"
    }
  ];

  // Filter tours by price
  const filteredTours = tours.filter(tour => 
    tour.price >= priceRange[0] && tour.price <= priceRange[1]
  );

  // Pagination
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
              Découvrez des expériences inoubliables
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
                  <Input placeholder="Rechercher une destination..." />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Durée</label>
                  <Select>
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
                    max={1500}
                    step={25}
                    value={priceRange}
                    onValueChange={setPriceRange}
                    className="mt-4"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Type d'activité</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm">Safari & Nature</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm">Culture & Histoire</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm">Plages & Détente</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm">Aventure</span>
                    </label>
                  </div>
                </div>

                <Button className="w-full">Appliquer les filtres</Button>
              </div>
            </Card>
          </aside>

          {/* Liste des tours */}
          <div className="lg:col-span-3 space-y-6">
            <div className="flex justify-between items-center">
              <p className="text-muted-foreground">{filteredTours.length} circuits trouvés</p>
              <Select defaultValue="popular">
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
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{tour.duration}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{tour.capacity}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center mt-4 pt-4 border-t">
                      <div>
                        <p className="text-sm text-muted-foreground">À partir de</p>
                        <p className="text-2xl font-bold text-primary">
                          <Price amount={tour.price} fromCurrency="XOF" />
                        </p>
                      </div>
                      <Button onClick={() => {
                        setSelectedTour({
                          id: tour.id.toString(),
                          name: tour.name,
                          price_per_unit: tour.price,
                          currency: "XOF",
                          type: "tour"
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
