import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { TrainSearchForm } from "@/components/TrainSearchForm";
import { useTrainSearch } from "@/hooks/useTrainSearch";
import { Train, Clock, ArrowRight, Loader2, SlidersHorizontal, Zap, Wifi, Coffee } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { BookingDialog } from "@/components/BookingDialog";
import { toast } from "sonner";
import { LazyImage } from "@/components/ui/lazy-image";
import { Price } from "@/components/ui/price";
import bannerTrains from "@/assets/banner-trains.jpg";

interface MappedTrain {
  id: string;
  operator: string;
  from: string;
  to: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: number;
  trainType: string;
  class: string;
  amenities: string[];
  stops: number;
  raw: any;
}

const Trains = () => {
  const [searchParams] = useSearchParams();
  const { searchTrains, loading, error } = useTrainSearch();
  const [trains, setTrains] = useState<MappedTrain[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedTrain, setSelectedTrain] = useState<MappedTrain | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Filters state
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200000]);
  const [maxDuration, setMaxDuration] = useState<number>(12);
  const [selectedOperators, setSelectedOperators] = useState<string[]>([]);
  const [selectedTrainTypes, setSelectedTrainTypes] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>("cheapest");

  useEffect(() => {
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const date = searchParams.get("date");
    const adults = parseInt(searchParams.get("adults") || "1", 10);
    const children = parseInt(searchParams.get("children") || "0", 10);

    if (!from || !to || !date) return;

    const runSearch = async () => {
      setHasSearched(true);
      const result = await searchTrains({
        origin: from,
        destination: to,
        departureDate: date,
        adults,
        children,
      });

      if (result) {
        const trainsData = Array.isArray((result as any).data)
          ? (result as any).data
          : Array.isArray((result as any).trains)
          ? (result as any).trains
          : [];

        if (trainsData.length === 0) {
          setTrains([]);
          return;
        }

        const mapped: MappedTrain[] = trainsData.map((train: any) => {
          const price = typeof train.price === "object" 
            ? parseFloat(train.price.total || train.price.amount || 0)
            : typeof train.price === "number"
            ? train.price
            : 0;

          return {
            id: train.id || Math.random().toString(),
            operator: train.operator || train.carrier || "SNCF",
            from: train.departure?.station || from,
            to: train.arrival?.station || to,
            departureTime: train.departure?.time || train.departureTime || "08:00",
            arrivalTime: train.arrival?.time || train.arrivalTime || "12:00",
            duration: train.duration || "4h00",
            price: Math.round(price),
            trainType: train.trainType || train.type || "TGV",
            class: train.class || "2ème classe",
            amenities: train.amenities || ["Wifi", "Prises électriques"],
            stops: train.stops || 0,
            raw: train,
          };
        });
        setTrains(mapped);
      }
    };

    runSearch();
  }, [searchParams]);

  const handleBook = (train: MappedTrain) => {
    setSelectedTrain(train);
    setDialogOpen(true);
  };

  // Available operators
  const availableOperators = useMemo(() => {
    const operators = [...new Set(trains.map(t => t.operator))];
    return operators.sort();
  }, [trains]);

  // Available train types
  const availableTrainTypes = useMemo(() => {
    const types = [...new Set(trains.map(t => t.trainType))];
    return types.sort();
  }, [trains]);

  const toggleOperator = (operator: string) => {
    setSelectedOperators(prev =>
      prev.includes(operator)
        ? prev.filter(o => o !== operator)
        : [...prev, operator]
    );
  };

  const toggleTrainType = (type: string) => {
    setSelectedTrainTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  // Parse duration to hours
  const parseDuration = (duration: string): number => {
    const match = duration.match(/(\d+)h/);
    return match ? parseInt(match[1]) : 0;
  };

  // Filter and sort trains
  const filteredAndSortedTrains = useMemo(() => {
    let filtered = trains.filter(train => {
      // Price filter
      if (train.price < priceRange[0] || train.price > priceRange[1]) return false;

      // Duration filter
      const hours = parseDuration(train.duration);
      if (hours > maxDuration) return false;

      // Operator filter
      if (selectedOperators.length > 0 && !selectedOperators.includes(train.operator)) {
        return false;
      }

      // Train type filter
      if (selectedTrainTypes.length > 0 && !selectedTrainTypes.includes(train.trainType)) {
        return false;
      }

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "cheapest":
          return a.price - b.price;
        case "fastest":
          return parseDuration(a.duration) - parseDuration(b.duration);
        case "earliest":
          return a.departureTime.localeCompare(b.departureTime);
        case "latest":
          return b.departureTime.localeCompare(a.departureTime);
        default:
          return 0;
      }
    });

    return filtered;
  }, [trains, priceRange, maxDuration, selectedOperators, selectedTrainTypes, sortBy]);

  const formatTime = (time: string) => {
    if (time.includes("T")) {
      return new Date(time).toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return time;
  };

  return (
    <div className="min-h-screen flex flex-col pt-16">
      <Navbar />

      {/* Hero Section with Search Form */}
      <div className="relative min-h-[50vh] md:min-h-[60vh] flex items-center justify-center overflow-hidden">
        <LazyImage
          src={bannerTrains}
          alt="Voyagez en Train"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-background"></div>
        <div className="relative z-10 container mx-auto px-4 py-12">
          <div className="text-center mb-8 animate-fade-in">

            <h1 className="text-4xl md:text-6xl font-bold mb-4 text-white drop-shadow-lg">
              Voyagez en Train
            </h1>
            <p className="text-lg md:text-xl text-white/95 drop-shadow-md max-w-2xl mx-auto">
              Trouvez les meilleurs trajets en train pour vos voyages
            </p>
          </div>
          <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <TrainSearchForm />
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="flex-1 bg-background py-12">
        <div className="container mx-auto px-4">
          {loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-lg text-muted-foreground">Recherche des trains disponibles...</p>
            </div>
          )}

          {error && (
            <Card className="border-destructive">
              <CardContent className="pt-6">
                <p className="text-destructive">Erreur: {error}</p>
              </CardContent>
            </Card>
          )}

          {!loading && !error && hasSearched && trains.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center">
                <Train className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg">Aucun train trouvé pour ces critères</p>
              </CardContent>
            </Card>
          )}

          {!loading && trains.length > 0 && (
            <>
              {/* Filter Bar - Mobile/Desktop */}
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground">
                  {filteredAndSortedTrains.length} train(s) trouvé(s)
                </p>

                <div className="flex items-center gap-4">
                  <div className="hidden md:block">
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cheapest">Prix le plus bas</SelectItem>
                        <SelectItem value="fastest">Plus rapide</SelectItem>
                        <SelectItem value="earliest">Départ le plus tôt</SelectItem>
                        <SelectItem value="latest">Départ le plus tard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" className="md:hidden">
                        <SlidersHorizontal className="mr-2 h-4 w-4" />
                        Filtres
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="h-[80vh] overflow-y-auto">
                      <SheetHeader>
                        <SheetTitle>Filtres</SheetTitle>
                      </SheetHeader>
                      <div className="space-y-6 mt-6">
                        <div>
                          <Label>Trier par</Label>
                          <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cheapest">Prix le plus bas</SelectItem>
                              <SelectItem value="fastest">Plus rapide</SelectItem>
                              <SelectItem value="earliest">Départ le plus tôt</SelectItem>
                              <SelectItem value="latest">Départ le plus tard</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar Filters - Desktop Only */}
                <div className="hidden lg:block space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Prix</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Slider
                        min={0}
                        max={200000}
                        step={5000}
                        value={priceRange}
                        onValueChange={(value) => setPriceRange(value as [number, number])}
                      />
                      <div className="flex justify-between text-sm">
                        <span><Price amount={priceRange[0]} fromCurrency="XOF" /></span>
                        <span><Price amount={priceRange[1]} fromCurrency="XOF" /></span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Durée max</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Slider
                        min={1}
                        max={24}
                        step={1}
                        value={[maxDuration]}
                        onValueChange={(value) => setMaxDuration(value[0])}
                      />
                      <p className="text-sm text-center">{maxDuration}h</p>
                    </CardContent>
                  </Card>

                  {availableOperators.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Compagnies</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {availableOperators.map((operator) => (
                          <div key={operator} className="flex items-center space-x-2">
                            <Checkbox
                              id={`operator-${operator}`}
                              checked={selectedOperators.includes(operator)}
                              onCheckedChange={() => toggleOperator(operator)}
                            />
                            <Label htmlFor={`operator-${operator}`} className="text-sm font-normal cursor-pointer">
                              {operator}
                            </Label>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {availableTrainTypes.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Type de train</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {availableTrainTypes.map((type) => (
                          <div key={type} className="flex items-center space-x-2">
                            <Checkbox
                              id={`type-${type}`}
                              checked={selectedTrainTypes.includes(type)}
                              onCheckedChange={() => toggleTrainType(type)}
                            />
                            <Label htmlFor={`type-${type}`} className="text-sm font-normal cursor-pointer">
                              {type}
                            </Label>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Train Results */}
                <div className="lg:col-span-3 space-y-4">
                  {filteredAndSortedTrains.map((train) => (
                    <Card key={train.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                          <div className="md:col-span-3">
                            <div className="flex items-center gap-3 mb-2">
                              <Train className="h-6 w-6 text-primary" />
                              <div>
                                <p className="font-semibold text-lg">{train.operator}</p>
                                <p className="text-sm text-muted-foreground">{train.trainType}</p>
                              </div>
                            </div>
                            <Badge variant="outline" className="mt-2">{train.class}</Badge>
                          </div>

                          <div className="md:col-span-5">
                            <div className="flex items-center justify-between">
                              <div className="text-center">
                                <p className="text-2xl font-bold">{formatTime(train.departureTime)}</p>
                                <p className="text-sm text-muted-foreground">{train.from}</p>
                              </div>

                              <div className="flex-1 px-4">
                                <div className="flex items-center justify-center gap-2">
                                  <Clock className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm text-muted-foreground">{train.duration}</span>
                                </div>
                                <div className="relative mt-2">
                                  <div className="h-px bg-border"></div>
                                  <ArrowRight className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-4 w-4 bg-background text-primary" />
                                </div>
                                {train.stops > 0 && (
                                  <p className="text-xs text-center text-muted-foreground mt-1">
                                    {train.stops} arrêt{train.stops > 1 ? "s" : ""}
                                  </p>
                                )}
                              </div>

                              <div className="text-center">
                                <p className="text-2xl font-bold">{formatTime(train.arrivalTime)}</p>
                                <p className="text-sm text-muted-foreground">{train.to}</p>
                              </div>
                            </div>

                            <div className="flex gap-2 mt-3 flex-wrap">
                              {train.amenities.includes("Wifi") && (
                                <Badge variant="secondary" className="text-xs">
                                  <Wifi className="mr-1 h-3 w-3" />
                                  Wifi
                                </Badge>
                              )}
                              {train.amenities.includes("Prises électriques") && (
                                <Badge variant="secondary" className="text-xs">
                                  <Zap className="mr-1 h-3 w-3" />
                                  Prises
                                </Badge>
                              )}
                              {train.amenities.includes("Bar") && (
                                <Badge variant="secondary" className="text-xs">
                                  <Coffee className="mr-1 h-3 w-3" />
                                  Bar
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="md:col-span-4 text-right">
                            <p className="text-3xl font-bold text-primary mb-1">
                              <Price amount={train.price} fromCurrency="EUR" />
                            </p>
                            <p className="text-sm text-muted-foreground mb-4">par personne</p>
                            <Button onClick={() => handleBook(train)} className="w-full">
                              Réserver
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </>
          )}

          {!hasSearched && !loading && (
            <Card>
              <CardContent className="pt-6 text-center">
                <Train className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">Recherchez votre trajet</h3>
                <p className="text-muted-foreground">
                  Utilisez le formulaire ci-dessus pour trouver les meilleurs trains
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Footer />

      {selectedTrain && (
        <BookingDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          service={{
            id: selectedTrain.id,
            name: `${selectedTrain.operator} - ${selectedTrain.trainType} • ${selectedTrain.from} → ${selectedTrain.to}`,
            price_per_unit: selectedTrain.price,
            currency: "EUR",
            type: "train",
          }}
        />
      )}
    </div>
  );
};

export default Trains;
