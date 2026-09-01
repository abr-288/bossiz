import { useEffect, useState, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { TrendingUp, Plane, Shield } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { FlightSearchForm } from "@/components/FlightSearchForm";
import { useFlightSearch } from "@/hooks/useFlightSearch";
import { FlightBookingDialog } from "@/components/FlightBookingDialog";
import { getAirlineName } from "@/utils/airlineNames";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FlightCardSkeleton } from "@/components/ui/search-result-skeletons";
import { PriceCalendar } from "@/components/flights/PriceCalendar";
import { FlightFilters } from "@/components/flights/FlightFilters";
import { FlightCard } from "@/components/flights/FlightCard";
import { Price } from "@/components/ui/price";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LazyImage } from "@/components/ui/lazy-image";
import { useDestinations } from "@/hooks/useDestinations";
import { getIataByCity, getCountryFlag } from "@/utils/airportNames";
import bannerFlights from "@/assets/banner-flights.jpg";
import { buildVolsBossizSearchUrl } from "@/lib/volsBossiz";

interface MappedFlight {
  id: string;
  airline: string;
  airlineCode: string;
  flightNumber: string;
  from: string;
  to: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  stops: number;
  price: number;
  travelClass: string;
  departureDate?: string;
  returnDate?: string;
  baggage?: {
    cabin: { pieces: number; weightKg: number; included: boolean };
    checked: { pieces: number; weightKg: number; included: boolean };
    personalItem: boolean;
  };
  raw: any;
}

const Flights = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { searchFlights, loading, error } = useFlightSearch();
  const [flights, setFlights] = useState<MappedFlight[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isDefaultResults, setIsDefaultResults] = useState(false);

  // Filters state
  const [baggageHandCount, setBaggageHandCount] = useState(0);
  const [baggageCheckCount, setBaggageCheckCount] = useState(0);
  const [stopsFilter, setStopsFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("best");

  const departureDate = searchParams.get("date") || "";

  // Use live trending destinations
  const { data: trendingDestinations, isLoading: loadingTrends } = useDestinations();

  const popularRoutes = useMemo(() => {
    // If we have dynamic data, use it
    if (trendingDestinations && trendingDestinations.length > 0) {
      return trendingDestinations
        .filter(d => d.trending || d.rating >= 4.5)
        .slice(0, 8)
        .map(dest => {
          // Attempt to find IATA code, default to a sensible mapping or the current list if failed
          const iata = getIataByCity(dest.name) || getIataByCity(dest.location);
          if (!iata) return null;
          
          return {
            from: "ABJ",
            to: iata,
            fromCity: "Abidjan",
            toCity: dest.name,
            flag: getCountryFlag(dest.country)
          };
        })
        .filter(Boolean) as any[];
    }

    // Default static routes as fallback
    return [
      { from: "ABJ", to: "CDG", fromCity: "Abidjan", toCity: "Paris", flag: "🇫🇷" },
      { from: "ABJ", to: "DXB", fromCity: "Abidjan", toCity: "Dubai", flag: "🇦🇪" },
      { from: "ABJ", to: "IST", fromCity: "Abidjan", toCity: "Istanbul", flag: "🇹🇷" },
      { from: "ABJ", to: "ACC", fromCity: "Abidjan", toCity: "Accra", flag: "🇬🇭" },
      { from: "ABJ", to: "DKR", fromCity: "Abidjan", toCity: "Dakar", flag: "🇸🇳" },
      { from: "ABJ", to: "CMN", fromCity: "Abidjan", toCity: "Casablanca", flag: "🇲🇦" },
      { from: "ABJ", to: "JNB", fromCity: "Abidjan", toCity: "Johannesburg", flag: "🇿🇦" },
      { from: "ABJ", to: "ADD", fromCity: "Abidjan", toCity: "Addis-Abeba", flag: "🇪🇹" },
    ];
  }, [trendingDestinations]);

  const mapFlightData = (data: any[], from: string, to: string, date: string, returnDate?: string, travelClass: string = "ECONOMY"): MappedFlight[] => {
    return data.map((offer: any) => {
      const firstItinerary = offer.itineraries?.[0];
      const segments = firstItinerary?.segments || [];
      const firstSegment = segments[0];
      const lastSegment = segments[segments.length - 1] || firstSegment;

      const airlineCode = offer.validatingAirlineCodes?.[0] || firstSegment?.carrierCode || "XX";
      const airline = offer.carrierName || getAirlineName(airlineCode);
      
      // Extract flight number from segment
      const flightNumber = firstSegment?.number || firstSegment?.flightNumber || "";

      const priceTotal =
        typeof offer.price === "object" && (offer.price?.grandTotal || offer.price?.total)
          ? parseFloat(offer.price.grandTotal || offer.price.total)
          : typeof offer.price === "number"
          ? offer.price
          : 0;

      const cabin =
        offer.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.cabin ||
        travelClass ||
        "ECONOMY";

      return {
        id: offer.id || Math.random().toString(),
        airline,
        airlineCode,
        flightNumber,
        from,
        to,
        departureTime: firstSegment?.departure?.at || "",
        arrivalTime: lastSegment?.arrival?.at || "",
        duration: firstItinerary?.duration || "N/A",
        stops: segments.length - 1,
        price: priceTotal,
        travelClass: cabin,
        departureDate: date,
        returnDate,
        baggage: offer.baggage || undefined,
        raw: offer,
      };
    });
  };

  // Load default results on mount
  useEffect(() => {
    const hasSearchParams = searchParams.get("from") && searchParams.get("to") && searchParams.get("date");
    
    if (!hasSearchParams && flights.length === 0 && !loading) {
      const loadDefaultFlights = async () => {
        setIsDefaultResults(true);
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 14);
        const dateStr = futureDate.toISOString().split('T')[0];

        const result = await searchFlights({
          origin: "ABJ",
          destination: "CDG",
          departureDate: dateStr,
          adults: 1,
          travelClass: "ECONOMY",
        });

        if (result?.success && Array.isArray(result.data)) {
          setFlights(mapFlightData(result.data, "ABJ", "CDG", dateStr, undefined, "ECONOMY"));
        }
      };

      loadDefaultFlights();
    }
  }, []);

  useEffect(() => {
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const date = searchParams.get("date");
    const returnDate = searchParams.get("returnDate") || undefined;
    const adults = parseInt(searchParams.get("adults") || "1", 10);
    const children = parseInt(searchParams.get("children") || "0", 10);
    const travelClass = searchParams.get("class") || "ECONOMY";

    if (!from || from.trim() === '' || !to || to.trim() === '' || !date || Number.isNaN(adults)) {
      return;
    }

    const runSearch = async () => {
      setHasSearched(true);
      setIsDefaultResults(false);
      const result = await searchFlights({
        origin: from,
        destination: to,
        departureDate: date,
        returnDate,
        adults,
        children: Number.isNaN(children) ? 0 : children,
        travelClass,
      });

      if (result?.success && Array.isArray(result.data)) {
        setFlights(mapFlightData(result.data, from, to, date, returnDate, travelClass));
      }
    };

    runSearch();
  }, [searchParams, searchFlights]);

  const handleBook = (flight: MappedFlight) => {
    const adaptedFlight = {
      ...flight,
      departure: flight.departureTime,
      arrival: flight.arrivalTime,
      class: flight.travelClass,
      flightNumber: flight.flightNumber,
      baggage: flight.baggage,
    };
    setSelectedFlight(adaptedFlight as any);
    setDialogOpen(true);
  };

  const handleDateSelect = (newDate: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("date", newDate);
    setSearchParams(params);
  };

  const parseDuration = (duration: string): number => {
    const match = duration.match(/PT(\d+)H(\d+)M/);
    if (!match) return 0;
    return parseInt(match[1]) * 60 + parseInt(match[2]);
  };

  // Filter and sort flights
  const filteredAndSortedFlights = flights
    .filter((flight) => {
      // Stops filter
      if (stopsFilter === "direct" && flight.stops !== 0) return false;
      if (stopsFilter === "1stop" && flight.stops > 1) return false;
      if (stopsFilter === "2stops" && flight.stops > 2) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "cheapest") return a.price - b.price;
      if (sortBy === "fastest") {
        const durationA = parseDuration(a.duration);
        const durationB = parseDuration(b.duration);
        return durationA - durationB;
      }
      // "best" = combination of price and duration
      return (a.price / 100 + parseDuration(a.duration)) - (b.price / 100 + parseDuration(b.duration));
    });

  return (
    <div className="min-h-screen flex flex-col pt-16">
      <Navbar />

      {/* Hero Section with Search Form */}
      <div className="relative min-h-[50vh] md:min-h-[60vh] flex items-center justify-center overflow-hidden">
        <LazyImage
          src={bannerFlights}
          alt={t('pages.flights.title')}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-background"></div>
        <div className="relative z-10 container mx-auto px-4 py-12">
          <div className="text-center mb-8 animate-fade-in">

            <h1 className="text-4xl md:text-6xl font-bold mb-4 text-white drop-shadow-lg">{t('pages.flights.title')}</h1>
            <p className="text-lg md:text-xl text-white/95 drop-shadow-md max-w-2xl mx-auto">
              {t('pages.flights.subtitle')}
            </p>
          </div>
          {hasSearched && (
            <div className="flex justify-center mb-6">
              <Link to={`/flight-comparison?${searchParams.toString()}`}>
                <Button variant="secondary" className="gap-2">
                  <TrendingUp className="h-4 w-4" />
                  {t('pages.flights.comparePrices')}
                </Button>
              </Link>
            </div>
          )}
          <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <FlightSearchForm />
          </div>

          {/* Popular Destinations */}
          <div className="mt-8 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <p className="text-white/80 text-sm mb-3 text-center">{t('pages.flights.popularFromAbidjan')}</p>
            {loadingTrends ? (
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-9 w-24 bg-white/10 animate-pulse rounded-full" />
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap justify-center gap-2">
                {popularRoutes.map((route) => {
                  const futureDate = new Date();
                  futureDate.setDate(futureDate.getDate() + 14);
                  const dateStr = futureDate.toISOString().split('T')[0];
                  const searchUrl = buildVolsBossizSearchUrl({
                    origin: route.from,
                    destination: route.to,
                    departureDate: dateStr,
                    adults: 1,
                    travelClass: "economy",
                  });
                  return (
                    <a
                      key={route.to}
                      href={searchUrl}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-medium transition-all hover:scale-105 flex items-center gap-2 border border-white/20"
                    >
                      <span>{route.flag}</span>
                      <span>{route.toCity}</span>
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Price Calendar with nicer margin */}
      {hasSearched && departureDate && flights.length > 0 && (
        <div className="bg-background py-8 border-b border-border/50">
          <PriceCalendar
            departureDate={departureDate}
            onDateSelect={handleDateSelect}
            currency="EUR"
            lowestPrice={Math.min(...flights.map(f => f.price))}
          />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto px-4 py-10 md:py-16">
          {loading && (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <FlightCardSkeleton key={i} />
              ))}
            </div>
          )}

          {error && (
            <div className="text-center py-20">
              <p className="text-destructive">{error}</p>
            </div>
          )}

          {!hasSearched && !loading && !isDefaultResults && flights.length === 0 && (
            <div className="space-y-4">
              <p className="text-center text-muted-foreground mb-4">
                {t('pages.flights.loadingPopular')}
              </p>
              {Array.from({ length: 5 }).map((_, i) => (
                <FlightCardSkeleton key={i} />
              ))}
            </div>
          )}

          {(hasSearched || isDefaultResults) && !loading && filteredAndSortedFlights.length === 0 && (
            <div className="text-center py-20">
              <p className="text-muted-foreground">{t('pages.flights.results.noResultsDesc')}</p>
            </div>
          )}

          {/* Default results header */}
          {isDefaultResults && !loading && filteredAndSortedFlights.length > 0 && (
            <div className="mb-10 p-6 md:p-8 bg-white border border-border/50 rounded-3xl shadow-xl shadow-primary/5 flex flex-col md:flex-row items-center gap-6 animate-slide-up-fade">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Plane className="w-8 h-8 text-primary" />
              </div>
              <div className="text-center md:text-left">
                <h2 className="text-xl md:text-2xl font-bold text-foreground">
                  {t('pages.flights.featured.title')}
                </h2>
                <p className="text-muted-foreground mt-2 max-w-xl">
                  {t('pages.flights.featured.subtitle')}
                </p>
              </div>
              <div className="md:ml-auto">
                <Badge variant="secondary" className="px-4 py-2 rounded-full font-semibold">
                  {t('pages.flights.featured.trending')}
                </Badge>
              </div>
            </div>
          )}

          {(hasSearched || isDefaultResults) && !loading && filteredAndSortedFlights.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] xl:grid-cols-[300px_1fr_300px] gap-6">
              {/* Left Sidebar - Filters */}
              <aside className="hidden lg:block">
                <FlightFilters
                  baggageHandCount={baggageHandCount}
                  baggageCheckCount={baggageCheckCount}
                  stopsFilter={stopsFilter}
                  onBaggageHandChange={setBaggageHandCount}
                  onBaggageCheckChange={setBaggageCheckCount}
                  onStopsFilterChange={setStopsFilter}
                />
              </aside>

              {/* Main Content - Results */}
              <main className="space-y-4">
                {/* Sort Tabs */}
                <Tabs value={sortBy} onValueChange={setSortBy}>
                  <TabsList className="w-full justify-start bg-card border border-border h-auto p-0">
                    <TabsTrigger 
                      value="best" 
                      className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6 py-3"
                    >
                      <div className="flex flex-col items-start">
                        <span className="font-semibold text-sm">{t('pages.flights.sort.best')}</span>
                        <span className="text-xs text-muted-foreground">
                          <Price amount={filteredAndSortedFlights[0]?.price || 0} fromCurrency="EUR" /> · {filteredAndSortedFlights[0]?.duration}
                        </span>
                      </div>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="cheapest"
                      className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6 py-3"
                    >
                      <div className="flex flex-col items-start">
                        <span className="font-semibold text-sm">{t('pages.flights.filters.cheapest')}</span>
                        <span className="text-xs text-muted-foreground">
                          <Price amount={Math.min(...filteredAndSortedFlights.map(f => f.price))} fromCurrency="EUR" />
                        </span>
                      </div>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="fastest"
                      className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6 py-3"
                    >
                      <div className="flex flex-col items-start">
                        <span className="font-semibold text-sm">{t('pages.flights.filters.fastest')}</span>
                        <span className="text-xs text-muted-foreground">
                          {filteredAndSortedFlights.sort((a, b) => parseDuration(a.duration) - parseDuration(b.duration))[0]?.duration}
                        </span>
                      </div>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                {/* Flight Cards */}
                <div className="space-y-3">
                  {filteredAndSortedFlights.map((flight) => (
                    <FlightCard
                      key={flight.id}
                      airline={flight.airline}
                      airlineCode={flight.airlineCode}
                      departureTime={flight.departureTime}
                      arrivalTime={flight.arrivalTime}
                      departureAirport={flight.from}
                      arrivalAirport={flight.to}
                      duration={flight.duration}
                      stops={flight.stops}
                      price={flight.price}
                      currency="EUR"
                      onSelect={() => handleBook(flight)}
                    />
                  ))}
                </div>
              </main>

              {/* Right Sidebar - Ads */}
              <aside className="hidden xl:block">
                <div className="sticky top-24 bg-gradient-to-br from-primary via-primary-dark to-primary-darker rounded-2xl p-8 text-center shadow-xl border border-white/10 overflow-hidden group">
                  {/* Decorative background element */}
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-secondary/20 rounded-full blur-3xl group-hover:bg-secondary/30 transition-colors" />
                  
                  <div className="relative z-10">
                    <div className="w-20 h-20 mx-auto mb-6 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-inner border border-white/20 group-hover:scale-110 transition-transform duration-500">
                      <Shield className="w-10 h-10 text-secondary" />
                    </div>
                    <h3 className="font-bold text-xl mb-3 text-white leading-tight">
                      Le forfait de voyage ultime
                    </h3>
                    <p className="text-sm text-white/70 mb-8 leading-relaxed">
                      La Garantie B-Reserve offre des solutions instantanées aux perturbations, une assistance continue et des services de voyage automatisés.
                    </p>
                    <Link to="/help">
                      <Button className="w-full bg-secondary hover:bg-secondary/90 text-primary font-bold rounded-xl shadow-lg shadow-secondary/20 hover:shadow-secondary/40 transition-all">
                        En savoir plus
                      </Button>
                    </Link>
                  </div>
                </div>
              </aside>
            </div>
          )}
        </div>
      </div>

      <Footer />

      {selectedFlight && (
        <FlightBookingDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          flight={selectedFlight}
        />
      )}
    </div>
  );
};

export default Flights;
