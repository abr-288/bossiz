import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { format, addDays, eachDayOfInterval } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { FlightSearchForm } from "@/components/FlightSearchForm";
import { useFlightSearch } from "@/hooks/useFlightSearch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getAirlineName } from "@/utils/airlineNames";
import { Loader2, TrendingDown, TrendingUp, Plane, ArrowRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Price } from "@/components/ui/price";
import { buildVolsBossizSearchUrl } from "@/lib/volsBossiz";

interface FlightData {
  airline: string;
  airlineCode: string;
  price: number;
  duration: string;
  stops: number;
  date?: string;
}

interface PriceByDate {
  date: string;
  [airline: string]: number | string;
}

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--secondary))",
  "hsl(var(--accent))",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
];

const FlightComparison = () => {
  const [searchParams] = useSearchParams();
  const { searchFlights, loading, error } = useFlightSearch();
  const [flights, setFlights] = useState<FlightData[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [flightsByDate, setFlightsByDate] = useState<Map<string, FlightData[]>>(new Map());

  useEffect(() => {
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const date = searchParams.get("date");
    const returnDate = searchParams.get("returnDate") || undefined;
    const adults = parseInt(searchParams.get("adults") || "1", 10);
    const children = parseInt(searchParams.get("children") || "0", 10);
    const travelClass = searchParams.get("class") || "ECONOMY";

    if (!from || !to || !date) return;

    const runSearch = async () => {

    setHasSearched(true);
    const result = await searchFlights({
      origin: from,
      destination: to,
      departureDate: date,
      returnDate,
      adults,
      children,
      travelClass,
    });

    if (result?.success && Array.isArray(result.data)) {
      const mapped: FlightData[] = result.data.map((offer: any) => {
        const firstItinerary = offer.itineraries?.[0];
        const airlineCode = offer.validatingAirlineCodes?.[0] || "XX";
        const airline = getAirlineName(airlineCode);
        const price = typeof offer.price === "object" ? parseFloat(offer.price.total) : offer.price || 0;
        const duration = firstItinerary?.duration || "N/A";
        const stops = (firstItinerary?.segments?.length || 1) - 1;

        return { airline, airlineCode, price, duration, stops, date };
      });
      setFlights(mapped);
      
      // Store in map by date
      const newMap = new Map(flightsByDate);
      newMap.set(date, mapped);
      setFlightsByDate(newMap);
    }
    };

    runSearch();
  }, [searchParams]);

  const analyzeDateRange = async () => {
    if (!dateRange?.from || !dateRange?.to) return;

    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const returnDate = searchParams.get("returnDate") || undefined;
    const adults = parseInt(searchParams.get("adults") || "1", 10);
    const children = parseInt(searchParams.get("children") || "0", 10);
    const travelClass = searchParams.get("class") || "ECONOMY";

    if (!from || !to) return;

    setIsAnalyzing(true);
    const dates = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
    const newFlightsByDate = new Map<string, FlightData[]>();

    for (const date of dates) {
      const dateStr = format(date, "yyyy-MM-dd");
      
      const result = await searchFlights({
        origin: from,
        destination: to,
        departureDate: dateStr,
        returnDate,
        adults,
        children,
        travelClass,
      });

      if (result?.success && Array.isArray(result.data)) {
        const mapped: FlightData[] = result.data.map((offer: any) => {
          const firstItinerary = offer.itineraries?.[0];
          const airlineCode = offer.validatingAirlineCodes?.[0] || "XX";
          const airline = getAirlineName(airlineCode);
          const price = typeof offer.price === "object" ? parseFloat(offer.price.total) : offer.price || 0;
          const duration = firstItinerary?.duration || "N/A";
          const stops = (firstItinerary?.segments?.length || 1) - 1;

          return { airline, airlineCode, price, duration, stops, date: dateStr };
        });
        newFlightsByDate.set(dateStr, mapped);
      }
    }

    setFlightsByDate(newFlightsByDate);
    
    // Flatten all flights for stats
    const allFlights: FlightData[] = [];
    newFlightsByDate.forEach((flights) => allFlights.push(...flights));
    setFlights(allFlights);
    setHasSearched(true);
    setIsAnalyzing(false);
  };

  // Aggregate data by airline
  const airlineStats = useMemo(() => {
    const grouped = flights.reduce((acc, flight) => {
      if (!acc[flight.airline]) {
        acc[flight.airline] = {
          airline: flight.airline,
          prices: [],
          avgPrice: 0,
          minPrice: Infinity,
          maxPrice: 0,
          count: 0,
        };
      }
      acc[flight.airline].prices.push(flight.price);
      acc[flight.airline].count += 1;
      acc[flight.airline].minPrice = Math.min(acc[flight.airline].minPrice, flight.price);
      acc[flight.airline].maxPrice = Math.max(acc[flight.airline].maxPrice, flight.price);
      return acc;
    }, {} as Record<string, any>);

    return Object.values(grouped).map((stat: any) => ({
      ...stat,
      avgPrice: Math.round(stat.prices.reduce((a: number, b: number) => a + b, 0) / stat.prices.length),
    })).sort((a: any, b: any) => a.avgPrice - b.avgPrice);
  }, [flights]);

  // Price evolution by date
  const priceEvolution = useMemo(() => {
    if (flightsByDate.size === 0) return [];

    const evolution: PriceByDate[] = [];
    const sortedDates = Array.from(flightsByDate.keys()).sort();

    sortedDates.forEach((date) => {
      const dayFlights = flightsByDate.get(date) || [];
      const dataPoint: PriceByDate = { date: format(new Date(date), "dd MMM", { locale: fr }) };

      // Group by airline and get average price
      const airlineGroups = dayFlights.reduce((acc, flight) => {
        if (!acc[flight.airline]) acc[flight.airline] = [];
        acc[flight.airline].push(flight.price);
        return acc;
      }, {} as Record<string, number[]>);

      Object.entries(airlineGroups).forEach(([airline, prices]) => {
        dataPoint[airline] = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
      });

      evolution.push(dataPoint);
    });

    return evolution;
  }, [flightsByDate]);

  const topAirlines = useMemo(() => {
    return airlineStats.slice(0, 5).map(stat => stat.airline);
  }, [airlineStats]);

  const cheapestAirline = airlineStats[0];
  const mostExpensiveAirline = airlineStats[airlineStats.length - 1];
  const avgMarketPrice = useMemo(() => {
    if (flights.length === 0) return 0;
    return Math.round(flights.reduce((sum, f) => sum + f.price, 0) / flights.length);
  }, [flights]);

  return (
    <div className="min-h-screen flex flex-col pt-16">
      <Navbar />
      
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-primary/20 via-secondary/10 to-accent/20 py-10 md:py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Comparaison de Prix des Vols
            </h1>
            <p className="text-lg text-muted-foreground">
              Comparez les tarifs de toutes les compagnies aériennes en un coup d'œil
            </p>
          </div>
          <FlightSearchForm />
        </div>
      </div>

      {/* Results Section */}
      <div className="flex-1 bg-background py-12">
        <div className="container mx-auto px-4">
          {/* Date Range Filter */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Analyse Multi-Dates</CardTitle>
              <CardDescription>
                Sélectionnez une plage de dates pour analyser l'évolution des prix
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                <div className="flex-1">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dateRange && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (
                          dateRange.to ? (
                            <>
                              {format(dateRange.from, "dd MMM yyyy", { locale: fr })} -{" "}
                              {format(dateRange.to, "dd MMM yyyy", { locale: fr })}
                            </>
                          ) : (
                            format(dateRange.from, "dd MMM yyyy", { locale: fr })
                          )
                        ) : (
                          <span>Sélectionner une période</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={setDateRange}
                        numberOfMonths={2}
                        disabled={(date) => date < new Date()}
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <Button 
                  onClick={analyzeDateRange}
                  disabled={!dateRange?.from || !dateRange?.to || isAnalyzing}
                  className="whitespace-nowrap"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyse en cours...
                    </>
                  ) : (
                    "Analyser les prix"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {(loading || isAnalyzing) && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-lg text-muted-foreground">Analyse des prix en cours...</p>
            </div>
          )}

          {error && (
            <Card className="border-destructive">
              <CardContent className="pt-6">
                <p className="text-destructive">Erreur: {error}</p>
              </CardContent>
            </Card>
          )}

          {!loading && !error && hasSearched && flights.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center">
                <Plane className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg">Aucun vol trouvé pour ces critères</p>
              </CardContent>
            </Card>
          )}

          {!loading && flights.length > 0 && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Prix Moyen</CardTitle>
                    <Plane className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold"><Price amount={avgMarketPrice} fromCurrency="EUR" /></div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Sur {flights.length} vols analysés
                    </p>
                  </CardContent>
                </Card>

                {cheapestAirline && (
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Moins Cher</CardTitle>
                      <TrendingDown className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">
                        <Price amount={cheapestAirline.minPrice} fromCurrency="EUR" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{cheapestAirline.airline}</p>
                    </CardContent>
                  </Card>
                )}

                {mostExpensiveAirline && (
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Plus Cher</CardTitle>
                      <TrendingUp className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">
                        <Price amount={mostExpensiveAirline.maxPrice} fromCurrency="EUR" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{mostExpensiveAirline.airline}</p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Charts */}
              <Tabs defaultValue="bar" className="space-y-6">
                <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-4">
                  <TabsTrigger value="bar">Barres</TabsTrigger>
                  <TabsTrigger value="line">Courbes</TabsTrigger>
                  <TabsTrigger value="evolution">Évolution</TabsTrigger>
                  <TabsTrigger value="pie">Camembert</TabsTrigger>
                </TabsList>

                <TabsContent value="bar" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Prix Moyens par Compagnie</CardTitle>
                      <CardDescription>Comparaison des tarifs moyens</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={airlineStats}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis 
                            dataKey="airline" 
                            angle={-45} 
                            textAnchor="end" 
                            height={100}
                            stroke="hsl(var(--foreground))"
                          />
                          <YAxis stroke="hsl(var(--foreground))" />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: "hsl(var(--card))", 
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px"
                            }}
                            formatter={(value: any) => `${value.toLocaleString()} EUR`}
                          />
                          <Legend />
                          <Bar dataKey="avgPrice" name="Prix Moyen" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                          <Bar dataKey="minPrice" name="Prix Min" fill="hsl(var(--secondary))" radius={[8, 8, 0, 0]} />
                          <Bar dataKey="maxPrice" name="Prix Max" fill="hsl(var(--accent))" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="evolution" className="space-y-6">
                  {priceEvolution.length > 0 ? (
                    <Card>
                      <CardHeader>
                        <CardTitle>Évolution des Prix dans le Temps</CardTitle>
                        <CardDescription>
                          Tendance des tarifs pour les {flightsByDate.size} dates analysées
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={400}>
                          <LineChart data={priceEvolution}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis 
                              dataKey="date" 
                              stroke="hsl(var(--foreground))"
                            />
                            <YAxis stroke="hsl(var(--foreground))" />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: "hsl(var(--card))", 
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "8px"
                              }}
                              formatter={(value: any) => `${value.toLocaleString()} EUR`}
                            />
                            <Legend />
                            {topAirlines.map((airline, index) => (
                              <Line
                                key={airline}
                                type="monotone"
                                dataKey={airline}
                                stroke={CHART_COLORS[index % CHART_COLORS.length]}
                                strokeWidth={2}
                                dot={{ r: 4 }}
                                connectNulls
                              />
                            ))}
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardContent className="pt-6 text-center">
                        <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-lg font-medium mb-2">Aucune analyse multi-dates</p>
                        <p className="text-muted-foreground">
                          Utilisez le filtre de dates ci-dessus pour analyser l'évolution des prix
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="line" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Évolution des Prix</CardTitle>
                      <CardDescription>Tendance des tarifs par compagnie</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={airlineStats}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis 
                            dataKey="airline" 
                            angle={-45} 
                            textAnchor="end" 
                            height={100}
                            stroke="hsl(var(--foreground))"
                          />
                          <YAxis stroke="hsl(var(--foreground))" />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: "hsl(var(--card))", 
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px"
                            }}
                            formatter={(value: any) => `${value.toLocaleString()} EUR`}
                          />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="avgPrice" 
                            name="Prix Moyen" 
                            stroke="hsl(var(--primary))" 
                            strokeWidth={3}
                            dot={{ fill: "hsl(var(--primary))", r: 6 }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="minPrice" 
                            name="Prix Min" 
                            stroke="hsl(var(--secondary))" 
                            strokeWidth={2}
                            strokeDasharray="5 5"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="pie" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Part de Marché par Prix</CardTitle>
                      <CardDescription>Distribution des vols par compagnie</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={400}>
                        <PieChart>
                          <Pie
                            data={airlineStats}
                            dataKey="count"
                            nameKey="airline"
                            cx="50%"
                            cy="50%"
                            outerRadius={120}
                            label={(entry) => `${entry.airline} (${entry.count})`}
                          >
                            {airlineStats.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: "hsl(var(--card))", 
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px"
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Detailed Table */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Détails par Compagnie</CardTitle>
                  <CardDescription>Statistiques complètes de prix</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4">Compagnie</th>
                          <th className="text-right py-3 px-4">Prix Min</th>
                          <th className="text-right py-3 px-4">Prix Moyen</th>
                          <th className="text-right py-3 px-4">Prix Max</th>
                          <th className="text-right py-3 px-4">Vols</th>
                          <th className="text-right py-3 px-4">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {airlineStats.map((stat, index) => (
                          <tr key={index} className="border-b border-border hover:bg-muted/50">
                            <td className="py-3 px-4 font-medium">{stat.airline}</td>
                            <td className="text-right py-3 px-4 text-green-600 font-semibold">
                              {stat.minPrice.toLocaleString()} EUR
                            </td>
                            <td className="text-right py-3 px-4">
                              {stat.avgPrice.toLocaleString()} EUR
                            </td>
                            <td className="text-right py-3 px-4 text-red-600">
                              {stat.maxPrice.toLocaleString()} EUR
                            </td>
                            <td className="text-right py-3 px-4">{stat.count}</td>
                            <td className="text-right py-3 px-4">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const searchUrl = buildVolsBossizSearchUrl({
                                    origin: searchParams.get("from") || "",
                                    destination: searchParams.get("to") || "",
                                    departureDate: searchParams.get("date") || "",
                                    returnDate: searchParams.get("returnDate") || undefined,
                                    adults: parseInt(searchParams.get("adults") || "1", 10),
                                    children: parseInt(searchParams.get("children") || "0", 10),
                                    travelClass: searchParams.get("class") || "economy",
                                  });
                                  window.location.href = searchUrl;
                                }}
                              >
                                Voir <ArrowRight className="ml-2 h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {!hasSearched && (
            <Card>
              <CardContent className="pt-6 text-center">
                <Plane className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">Commencez une recherche</h3>
                <p className="text-muted-foreground">
                  Utilisez le formulaire ci-dessus pour comparer les prix des vols
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default FlightComparison;
