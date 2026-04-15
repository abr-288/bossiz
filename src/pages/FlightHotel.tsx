import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Plane, Hotel, MapPin, Calendar, Users, Check, Loader2, Star, Package, AlertTriangle,
  Briefcase, Luggage, Clock, ArrowRight, Wifi, Coffee, Car, Waves, UtensilsCrossed,
  Filter, SortAsc, ChevronDown, Award, Sparkles
} from "lucide-react";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FlightHotelSearchForm } from "@/components/FlightHotelSearchForm";
import { useFlightHotelSearch } from "@/hooks/useFlightHotelSearch";
import { toast } from "sonner";
import { LazyImage } from "@/components/ui/lazy-image";
import bannerFlightHotel from "@/assets/banner-flight-hotel.jpg";
import { Price } from "@/components/ui/price";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "react-i18next";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface FlightOffer {
  id: string;
  airline: string;
  airlineCode: string;
  flightNumber: string;
  logo: string;
  price: number;
  departure: { date: string; time: string; airport: string; city: string };
  arrival: { date: string; time: string; airport: string; city: string };
  returnFlight?: { date: string; time: string; departureAirport: string; arrivalAirport: string };
  duration: string;
  stops: number;
  travelClass: string;
  baggage: { cabin: { quantity: number; weight: string }; checked: { quantity: number; weight: string }; extraBagPrice?: number };
  fareType: string;
}

interface HotelOffer {
  id: string;
  name: string;
  rating: number;
  reviewScore: number;
  reviewCount: number;
  price: number;
  image: string;
  address: string;
  city: string;
  amenities: string[];
  description: string;
  roomType: string;
  breakfast: boolean;
  freeCancellation: boolean;
}

const amenityIcons: Record<string, any> = {
  'wifi': Wifi, 'wifi gratuit': Wifi, 'free wifi': Wifi,
  'piscine': Waves, 'pool': Waves, 'swimming': Waves,
  'restaurant': UtensilsCrossed, 'dining': UtensilsCrossed,
  'parking': Car, 'car park': Car,
  'petit-déjeuner': Coffee, 'breakfast': Coffee,
  'climatisation': Sparkles, 'air conditioning': Sparkles,
};

const getAmenityIcon = (amenity: string) => {
  const lowerAmenity = amenity.toLowerCase();
  for (const [key, Icon] of Object.entries(amenityIcons)) {
    if (lowerAmenity.includes(key)) return Icon;
  }
  return Sparkles;
};

const FlightHotel = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedFlight, setSelectedFlight] = useState<FlightOffer | null>(null);
  const [selectedHotel, setSelectedHotel] = useState<HotelOffer | null>(null);
  const [flights, setFlights] = useState<FlightOffer[]>([]);
  const [hotels, setHotels] = useState<HotelOffer[]>([]);
  const [searchParams, setSearchParams] = useState<any>(null);
  const [flightSort, setFlightSort] = useState<string>('price');
  const [hotelSort, setHotelSort] = useState<string>('price');
  const { searchPackages, loading } = useFlightHotelSearch();

  const handleSearch = async (params: any) => {
    setSearchParams(params);
    const results = await searchPackages(params);
    
    if (results && results.flights && results.hotels) {
      setFlights(results.flights);
      setHotels(results.hotels);
      setSelectedFlight(null);
      setSelectedHotel(null);
      toast.success(`${results.flights.length} vol(s) et ${results.hotels.length} hôtel(s) trouvé(s)`);
    } else {
      toast.error("Erreur lors de la recherche");
    }
  };

  const sortedFlights = useMemo(() => {
    const sorted = [...flights];
    switch (flightSort) {
      case 'price': return sorted.sort((a, b) => a.price - b.price);
      case 'duration': return sorted.sort((a, b) => {
        const durationA = parseInt(a.duration) || 0;
        const durationB = parseInt(b.duration) || 0;
        return durationA - durationB;
      });
      case 'stops': return sorted.sort((a, b) => a.stops - b.stops);
      default: return sorted;
    }
  }, [flights, flightSort]);

  const sortedHotels = useMemo(() => {
    const sorted = [...hotels];
    switch (hotelSort) {
      case 'price': return sorted.sort((a, b) => a.price - b.price);
      case 'rating': return sorted.sort((a, b) => (b.reviewScore || 0) - (a.reviewScore || 0));
      case 'stars': return sorted.sort((a, b) => b.rating - a.rating);
      default: return sorted;
    }
  }, [hotels, hotelSort]);

  const calculateNights = () => {
    if (!searchParams?.departureDate || !searchParams?.returnDate) return 1;
    const departure = new Date(searchParams.departureDate);
    const returnDate = new Date(searchParams.returnDate);
    const nights = Math.ceil((returnDate.getTime() - departure.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(1, nights);
  };

  const calculateTotal = () => {
    if (!selectedFlight || !selectedHotel) return { flightTotal: 0, hotelTotal: 0, total: 0 };
    const nights = calculateNights();
    const rooms = searchParams?.rooms || 1;
    const passengers = (searchParams?.adults || 1) + (searchParams?.children || 0);
    
    const flightTotal = selectedFlight.price * passengers;
    const hotelTotal = selectedHotel.price * nights * rooms;
    const total = flightTotal + hotelTotal;
    
    return { flightTotal, hotelTotal, total, nights, rooms, passengers };
  };

  const handleBooking = () => {
    if (selectedFlight && selectedHotel) {
      const flightParam = encodeURIComponent(JSON.stringify(selectedFlight));
      const hotelParam = encodeURIComponent(JSON.stringify(selectedHotel));
      const searchParam = encodeURIComponent(JSON.stringify(searchParams));
      
      navigate(`/flight-hotel/booking?flight=${flightParam}&hotel=${hotelParam}&search=${searchParam}`);
    } else {
      toast.error("Veuillez sélectionner un vol et un hôtel");
    }
  };

  const getScoreLabel = (score: number) => {
    if (score >= 9) return 'Exceptionnel';
    if (score >= 8) return 'Excellent';
    if (score >= 7) return 'Très bien';
    return 'Bien';
  };

  return (
    <div className="min-h-screen bg-background flex flex-col pt-16">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section with Search Form */}
        <div className="relative min-h-[50vh] md:min-h-[60vh] flex items-center justify-center overflow-hidden">
          <LazyImage
            src={bannerFlightHotel}
            alt="Forfaits Vol + Hôtel"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-background"></div>
          <div className="relative z-10 container mx-auto px-4 py-12">
            <div className="text-center mb-8 animate-fade-in">

              <h1 className="text-4xl md:text-6xl font-bold mb-4 text-white drop-shadow-lg">
                Forfaits Vol + Hôtel
              </h1>
              <p className="text-lg md:text-xl text-white/95 drop-shadow-md max-w-2xl mx-auto">
                Réservez votre vol et votre hébergement en un seul forfait et économisez jusqu'à 30%
              </p>
            </div>
            <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <FlightHotelSearchForm onSearch={handleSearch} />
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {loading && (
            <div className="flex flex-col justify-center items-center py-20 gap-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <p className="text-muted-foreground">Recherche des meilleures offres...</p>
            </div>
          )}

          {!loading && flights.length === 0 && hotels.length === 0 && (
            <div className="text-center py-20">
              <Package className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-xl text-muted-foreground">
                Utilisez le formulaire ci-dessus pour rechercher des vols et hôtels
              </p>
            </div>
          )}

          {!loading && (flights.length > 0 || hotels.length > 0) && (
            <div className="space-y-8">
              {/* Flights Section */}
              {flights.length > 0 && (
                <div>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                      <Plane className="h-6 w-6 text-primary" />
                      Vols disponibles ({flights.length})
                    </h2>
                    <div className="flex items-center gap-2">
                      <SortAsc className="h-4 w-4 text-muted-foreground" />
                      <Select value={flightSort} onValueChange={setFlightSort}>
                        <SelectTrigger className="w-[160px]">
                          <SelectValue placeholder="Trier par" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="price">Prix croissant</SelectItem>
                          <SelectItem value="duration">Durée</SelectItem>
                          <SelectItem value="stops">Escales</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-4">
                    {sortedFlights.map((flight) => (
                      <Card 
                        key={flight.id} 
                        className={`cursor-pointer transition-all ${
                          selectedFlight?.id === flight.id 
                            ? 'ring-2 ring-primary shadow-lg bg-primary/5' 
                            : 'hover:shadow-md hover:border-primary/30'
                        }`}
                        onClick={() => setSelectedFlight(flight)}
                      >
                        <CardContent className="p-4 md:p-6">
                          <div className="flex flex-col lg:flex-row gap-4 lg:items-center">
                            {/* Airline Info */}
                            <div className="flex items-center gap-3 lg:w-48">
                              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                                {flight.logo ? (
                                  <img 
                                    src={flight.logo} 
                                    alt={flight.airline}
                                    className="w-10 h-10 object-contain"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                      (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                    }}
                                  />
                                ) : null}
                                <span className={`text-lg font-bold text-primary ${flight.logo ? 'hidden' : ''}`}>
                                  {flight.airlineCode || '✈️'}
                                </span>
                              </div>
                              <div>
                                <p className="font-semibold text-sm">{flight.airline}</p>
                                <p className="text-xs text-muted-foreground">{flight.flightNumber}</p>
                              </div>
                            </div>

                            {/* Flight Times */}
                            <div className="flex-1 flex items-center justify-between lg:justify-center gap-4">
                              <div className="text-center">
                                <p className="text-xl font-bold">{flight.departure?.time || '08:00'}</p>
                                <p className="text-sm text-muted-foreground">{flight.departure?.airport || searchParams?.origin}</p>
                              </div>
                              
                              <div className="flex flex-col items-center flex-1 max-w-[200px]">
                                <p className="text-xs text-muted-foreground mb-1">{flight.duration}</p>
                                <div className="w-full flex items-center gap-1">
                                  <div className="h-[2px] flex-1 bg-muted-foreground/30"></div>
                                  <Plane className="h-4 w-4 text-primary rotate-90" />
                                  <div className="h-[2px] flex-1 bg-muted-foreground/30"></div>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {flight.stops === 0 ? 'Direct' : `${flight.stops} escale(s)`}
                                </p>
                              </div>

                              <div className="text-center">
                                <p className="text-xl font-bold">{flight.arrival?.time || '12:00'}</p>
                                <p className="text-sm text-muted-foreground">{flight.arrival?.airport || searchParams?.destination}</p>
                              </div>
                            </div>

                            {/* Baggage Info */}
                            <TooltipProvider>
                              <div className="flex items-center gap-3 lg:w-40">
                                <Tooltip>
                                  <TooltipTrigger>
                                    <div className="flex items-center gap-1 text-xs">
                                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                                      <span>{flight.baggage?.cabin?.quantity || 1}x {flight.baggage?.cabin?.weight || '10kg'}</span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>Bagage cabine inclus</TooltipContent>
                                </Tooltip>
                                
                                <Tooltip>
                                  <TooltipTrigger>
                                    <div className={`flex items-center gap-1 text-xs ${(flight.baggage?.checked?.quantity || 0) === 0 ? 'text-muted-foreground/50' : ''}`}>
                                      <Luggage className="h-4 w-4" />
                                      <span>
                                        {(flight.baggage?.checked?.quantity || 0) > 0 
                                          ? `${flight.baggage.checked.quantity}x ${flight.baggage.checked.weight}`
                                          : 'Non inclus'}
                                      </span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {(flight.baggage?.checked?.quantity || 0) > 0 
                                      ? 'Bagage en soute inclus' 
                                      : `Bagage en soute: +${flight.baggage?.extraBagPrice || 45}€`}
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            </TooltipProvider>

                            {/* Price & Select */}
                            <div className="flex items-center justify-between lg:flex-col lg:items-end gap-2 lg:w-32">
                              <div className="text-right">
                                <p className="text-2xl font-bold text-primary">
                                  <Price amount={flight.price} fromCurrency="EUR" />
                                </p>
                                <p className="text-xs text-muted-foreground">/personne</p>
                              </div>
                              {selectedFlight?.id === flight.id && (
                                <Badge variant="default" className="gap-1">
                                  <Check className="h-3 w-3" /> Sélectionné
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Fare Type Badge */}
                          <div className="flex gap-2 mt-3 pt-3 border-t">
                            <Badge variant="outline" className="text-xs">{flight.fareType || 'Standard'}</Badge>
                            <Badge variant="outline" className="text-xs">{flight.travelClass || 'Économique'}</Badge>
                            {flight.returnFlight && (
                              <Badge variant="secondary" className="text-xs">Aller-retour</Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Hotels Section */}
              {hotels.length > 0 && (
                <div>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                      <Hotel className="h-6 w-6 text-primary" />
                      Hôtels disponibles ({hotels.length})
                    </h2>
                    <div className="flex items-center gap-2">
                      <SortAsc className="h-4 w-4 text-muted-foreground" />
                      <Select value={hotelSort} onValueChange={setHotelSort}>
                        <SelectTrigger className="w-[160px]">
                          <SelectValue placeholder="Trier par" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="price">Prix croissant</SelectItem>
                          <SelectItem value="rating">Note</SelectItem>
                          <SelectItem value="stars">Étoiles</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {sortedHotels.map((hotel) => (
                      <Card 
                        key={hotel.id}
                        className={`cursor-pointer transition-all overflow-hidden group ${
                          selectedHotel?.id === hotel.id 
                            ? 'ring-2 ring-primary shadow-lg' 
                            : 'hover:shadow-md hover:border-primary/30'
                        }`}
                        onClick={() => setSelectedHotel(hotel)}
                      >
                        {/* Hotel Image */}
                        <div className="relative h-48 overflow-hidden">
                          <img 
                            src={hotel.image} 
                            alt={hotel.name}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945';
                            }}
                          />
                          {selectedHotel?.id === hotel.id && (
                            <div className="absolute top-3 right-3 h-8 w-8 rounded-full bg-primary flex items-center justify-center shadow-lg">
                              <Check className="text-primary-foreground h-5 w-5" />
                            </div>
                          )}
                          
                          {/* Badges */}
                          <div className="absolute top-3 left-3 flex flex-col gap-2">
                            {(hotel.reviewScore || 0) >= 8.5 && (
                              <Badge className="bg-amber-500 text-white gap-1">
                                <Award className="h-3 w-3" /> Top Noté
                              </Badge>
                            )}
                            {hotel.freeCancellation && (
                              <Badge variant="secondary" className="bg-green-600 text-white text-xs">
                                Annulation gratuite
                              </Badge>
                            )}
                          </div>
                        </div>

                        <CardContent className="p-4 space-y-3">
                          {/* Hotel Name & Stars */}
                          <div>
                            <h3 className="font-semibold text-lg line-clamp-1">{hotel.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex items-center">
                                {[...Array(hotel.rating || 4)].map((_, i) => (
                                  <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                                ))}
                              </div>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {hotel.address || hotel.city}
                              </span>
                            </div>
                          </div>

                          {/* Review Score */}
                          <div className="flex items-center gap-2">
                            <div className="bg-primary text-primary-foreground text-sm font-bold px-2 py-1 rounded">
                              {(hotel.reviewScore || 8.0).toFixed(1)}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{getScoreLabel(hotel.reviewScore || 8)}</p>
                              <p className="text-xs text-muted-foreground">{hotel.reviewCount || 0} avis</p>
                            </div>
                          </div>

                          {/* Amenities */}
                          <div className="flex flex-wrap gap-2">
                            {hotel.amenities?.slice(0, 4).map((amenity, idx) => {
                              const Icon = getAmenityIcon(amenity);
                              return (
                                <TooltipProvider key={idx}>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <div className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded">
                                        <Icon className="h-3 w-3" />
                                        <span className="hidden sm:inline">{amenity}</span>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>{amenity}</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              );
                            })}
                            {hotel.breakfast && (
                              <Badge variant="outline" className="text-xs gap-1 text-green-600 border-green-600">
                                <Coffee className="h-3 w-3" /> Petit-déj inclus
                              </Badge>
                            )}
                          </div>

                          {/* Room Type */}
                          <p className="text-sm text-muted-foreground">{hotel.roomType || 'Chambre Double'}</p>

                          {/* Price */}
                          <div className="pt-3 border-t flex justify-between items-end">
                            <div>
                              <p className="text-2xl font-bold text-primary">
                                <Price amount={hotel.price} fromCurrency="EUR" />
                              </p>
                              <p className="text-xs text-muted-foreground">par nuit</p>
                            </div>
                            <Button variant="outline" size="sm" className="gap-1">
                              Voir plus <ArrowRight className="h-3 w-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Summary and Booking */}
              {(selectedFlight || selectedHotel) && (
                <Card className="sticky bottom-4 shadow-xl border-2 bg-card/95 backdrop-blur">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-primary" />
                        Votre forfait
                      </span>
                      {selectedFlight && selectedHotel && searchParams && (
                        <span className="text-sm font-normal text-muted-foreground">
                          {calculateTotal().nights} nuit{calculateTotal().nights > 1 ? "s" : ""} • {calculateTotal().passengers} passager{calculateTotal().passengers > 1 ? "s" : ""}
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <h3 className="font-semibold flex items-center gap-2 text-sm">
                          <Plane className="h-4 w-4 text-primary" />
                          Vol
                        </h3>
                        {selectedFlight ? (
                          <div className="text-sm bg-muted/50 p-3 rounded-lg">
                            <p className="font-medium">{selectedFlight.airline}</p>
                            <p className="text-muted-foreground text-xs">
                              {selectedFlight.departure?.time} → {selectedFlight.arrival?.time}
                            </p>
                            <p className="text-primary font-semibold mt-1">
                              <Price amount={calculateTotal().flightTotal || selectedFlight.price} fromCurrency="EUR" />
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">Aucun vol sélectionné</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <h3 className="font-semibold flex items-center gap-2 text-sm">
                          <Hotel className="h-4 w-4 text-primary" />
                          Hôtel
                        </h3>
                        {selectedHotel ? (
                          <div className="text-sm bg-muted/50 p-3 rounded-lg">
                            <p className="font-medium line-clamp-1">{selectedHotel.name}</p>
                            <p className="text-muted-foreground text-xs">
                              {calculateTotal().nights} nuit{calculateTotal().nights > 1 ? 's' : ''} • {calculateTotal().rooms} chambre{(calculateTotal().rooms || 1) > 1 ? 's' : ''}
                            </p>
                            <p className="text-primary font-semibold mt-1">
                              <Price amount={calculateTotal().hotelTotal || selectedHotel.price} fromCurrency="EUR" />
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">Aucun hôtel sélectionné</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <h3 className="font-semibold text-sm">Total forfait</h3>
                        {selectedFlight && selectedHotel ? (
                          <div className="bg-primary/10 p-3 rounded-lg">
                            <p className="text-3xl font-bold text-primary">
                              <Price amount={calculateTotal().total} fromCurrency="EUR" />
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Vol + {calculateTotal().nights} nuit{calculateTotal().nights > 1 ? "s" : ""} d'hôtel
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">Sélectionnez un vol et un hôtel</p>
                        )}
                      </div>
                    </div>

                    {selectedFlight && selectedHotel && (
                      <Alert className="mt-4 border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        <AlertDescription className="text-amber-800 dark:text-amber-300 text-sm">
                          Les disponibilités sont vérifiées lors de la confirmation.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full" 
                      size="lg"
                      onClick={handleBooking}
                      disabled={!selectedFlight || !selectedHotel}
                    >
                      Continuer la réservation
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FlightHotel;
