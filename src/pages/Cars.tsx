import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Car as CarIcon, SlidersHorizontal, Grid3X3, List } from "lucide-react";
import { CarBookingDialog } from "@/components/CarBookingDialog";
import { CarSearchForm } from "@/components/CarSearchForm";
import { Pagination } from "@/components/Pagination";
import { CarCard, CarData } from "@/components/cars/CarCard";
import { CarFilters } from "@/components/cars/CarFilters";
import { CarDetailsDialog } from "@/components/cars/CarDetailsDialog";
import { useCarRental } from "@/hooks/useCarRental";
import { toast } from "sonner";
import { CarCardSkeleton } from "@/components/ui/search-result-skeletons";
import { LazyImage } from "@/components/ui/lazy-image";
import bannerCars from "@/assets/banner-cars.jpg";
import { useTranslation } from "react-i18next";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

// Popular locations for default car results
const DEFAULT_CAR_LOCATIONS = ['Paris', 'Nice', 'Lyon', 'Marseille', 'Bordeaux'];

const Cars = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const { searchCarRentals, loading } = useCarRental();
  const [priceRange, setPriceRange] = useState([0, 200]);
  const [selectedCar, setSelectedCar] = useState<CarData | null>(null);
  const [detailsCar, setDetailsCar] = useState<CarData | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [apiCars, setApiCars] = useState<CarData[]>([]);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [isDefaultResults, setIsDefaultResults] = useState(false);
  const [loadingDefault, setLoadingDefault] = useState(false);
  
  // Filter states
  const [filterLocation, setFilterLocation] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [selectedTransmissions, setSelectedTransmissions] = useState<string[]>([]);
  const [selectedFuelTypes, setSelectedFuelTypes] = useState<string[]>([]);
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [unlimitedMileageOnly, setUnlimitedMileageOnly] = useState(false);
  const [freeCancellationOnly, setFreeCancellationOnly] = useState(false);
  const [sortBy, setSortBy] = useState("price-asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [hasSearched, setHasSearched] = useState(false);
  const itemsPerPage = 12;

  // Load default cars on mount
  useEffect(() => {
    const location = searchParams.get("location");
    const pickupDate = searchParams.get("pickupDate");
    const returnDate = searchParams.get("returnDate");

    if (location && pickupDate && returnDate) {
      setHasSearched(true);
      setIsDefaultResults(false);
      handleSearch(location, pickupDate, returnDate);
    } else {
      // Load default cars from popular locations
      loadDefaultCars();
    }
  }, [searchParams]);

  const loadDefaultCars = async () => {
    setLoadingDefault(true);
    setIsDefaultResults(true);
    
    // Generate dates for next week
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 8);
    
    const pickupDate = tomorrow.toISOString().split('T')[0];
    const dropoffDate = nextWeek.toISOString().split('T')[0];
    
    try {
      // Search for cars in multiple popular locations
      const searchPromises = DEFAULT_CAR_LOCATIONS.map(location =>
        searchCarRentals({
          pickupLocation: location,
          dropoffLocation: location,
          pickupDate,
          dropoffDate
        })
      );
      
      const results = await Promise.all(searchPromises);
      
      const allCars: CarData[] = [];
      results.forEach((result, index) => {
        if (result?.success && result?.data) {
          const carsArray = Array.isArray(result.data) ? result.data : [result.data];
          carsArray.slice(0, 4).forEach((car: any) => {
            allCars.push({
              id: car.id || `${DEFAULT_CAR_LOCATIONS[index]}-${Math.random().toString()}`,
              name: car.name || 'Véhicule',
              brand: car.brand,
              model: car.model,
              category: car.category || 'Standard',
              price: typeof car.price === 'number' ? car.price : parseFloat(car.price || 0),
              currency: car.currency || 'EUR',
              rating: car.rating || 0,
              reviews: car.reviews || 0,
              image: car.image || '/placeholder.svg',
              images: car.images || [],
              seats: car.seats || 5,
              transmission: car.transmission || 'Automatique',
              fuel: car.fuel || 'Essence',
              luggage: car.luggage || 3,
              airConditioning: car.airConditioning !== false,
              provider: car.provider || 'B-Reserve',
              source: car.source || 'api',
              unlimitedMileage: car.unlimitedMileage !== false,
              freeCancellation: car.freeCancellation === true,
              fuelPolicy: car.fuelPolicy || 'full-to-full',
              deposit: car.deposit || null,
              doors: car.doors || 4,
              engineSize: car.engineSize,
              year: car.year,
              pickupLocation: car.pickupLocation || DEFAULT_CAR_LOCATIONS[index],
              features: car.features || [],
              offerSignature: car.offer_signature,
              offerExpiresAt: car.offer_expires_at,
            });
          });
        }
      });
      
      // Véhicules ajoutés par des agences partenaires (table `services`) - un
      // seul appel non filtré, distinct de la boucle par destination
      // ci-dessus puisqu'un partenaire local n'apparaîtrait jamais dans une
      // recherche sur Paris/Nice/Lyon/etc.
      try {
        const partnerResult = await searchCarRentals({
          pickupLocation: 'partner',
          dropoffLocation: 'partner',
          pickupDate,
          dropoffDate,
          partnerOnly: true,
        });

        if (partnerResult?.success && Array.isArray(partnerResult.data)) {
          partnerResult.data.forEach((car: any) => {
            allCars.push({
              id: car.id,
              name: car.name || 'Véhicule',
              brand: car.brand,
              model: car.model,
              category: car.category || 'Standard',
              price: typeof car.price === 'number' ? car.price : parseFloat(car.price || 0),
              currency: car.currency || 'EUR',
              rating: car.rating || 0,
              reviews: car.reviews || 0,
              image: car.image || '/placeholder.svg',
              images: car.images || [],
              seats: car.seats || 5,
              transmission: car.transmission || 'Automatique',
              fuel: car.fuel || 'Essence',
              luggage: car.luggage || 3,
              airConditioning: car.airConditioning !== false,
              provider: car.provider || 'Partenaire',
              source: car.source || 'partner',
              unlimitedMileage: car.unlimitedMileage === true,
              freeCancellation: car.freeCancellation === true,
              fuelPolicy: car.fuelPolicy || 'full-to-full',
              deposit: car.deposit || null,
              doors: car.doors || 4,
              engineSize: car.engineSize,
              year: car.year,
              pickupLocation: car.pickupLocation,
              features: car.features || [],
              offerSignature: car.offer_signature,
              offerExpiresAt: car.offer_expires_at,
            });
          });
        }
      } catch (error) {
        console.error('Erreur lors du chargement des véhicules partenaires:', error);
      }

      if (allCars.length > 0) {
        setApiCars(allCars);
        toast.success(`${allCars.length} véhicules disponibles dans les destinations populaires`);
      }
    } catch (error) {
      console.error('Error loading default cars:', error);
    } finally {
      setLoadingDefault(false);
    }
  };

  const handleSearch = async (pickupLocation: string, pickupDate: string, dropoffDate: string) => {
    const result = await searchCarRentals({
      pickupLocation,
      dropoffLocation: pickupLocation,
      pickupDate,
      dropoffDate
    });

    if (result?.success && result?.data) {
      const carsArray = Array.isArray(result.data) ? result.data : [result.data];
      setApiCars(carsArray.map((car: any) => ({
        id: car.id || Math.random().toString(),
        name: car.name || 'Véhicule',
        brand: car.brand,
        model: car.model,
        category: car.category || 'Standard',
        price: typeof car.price === 'number' ? car.price : parseFloat(car.price || 0),
        currency: car.currency || 'EUR',
        rating: car.rating || 0,
        reviews: car.reviews || 0,
        image: car.image || '/placeholder.svg',
        images: car.images || [],
        seats: car.seats || 5,
        transmission: car.transmission || 'Automatique',
        fuel: car.fuel || 'Essence',
        luggage: car.luggage || 3,
        airConditioning: car.airConditioning !== false,
        provider: car.provider || 'B-Reserve',
        source: car.source || 'api',
        unlimitedMileage: car.unlimitedMileage !== false,
        freeCancellation: car.freeCancellation === true,
        fuelPolicy: car.fuelPolicy || 'full-to-full',
        deposit: car.deposit || null,
        doors: car.doors || 4,
        engineSize: car.engineSize,
        year: car.year,
        pickupLocation: car.pickupLocation || pickupLocation,
        features: car.features || [],
        offerSignature: car.offer_signature,
        offerExpiresAt: car.offer_expires_at,
      })));
      toast.success(t('cars.vehiclesFoundToast', { count: carsArray.length }));
    } else {
      setApiCars([]);
      toast.info(t('cars.useFormToSearch'));
    }
  };

  // Get unique providers
  const availableProviders = useMemo(() => {
    const providers = new Set(apiCars.map(car => car.provider).filter(Boolean));
    return Array.from(providers) as string[];
  }, [apiCars]);

  // Upper bound for the price filter, derived from the actual results so cars
  // priced above a hardcoded ceiling (e.g. XOF prices) aren't silently hidden
  const maxPrice = useMemo(() => {
    const highest = apiCars.reduce((max, car) => Math.max(max, car.price), 0);
    return Math.max(200, Math.ceil((highest || 200) / 50) * 50);
  }, [apiCars]);

  // Reset the price range whenever a new set of results comes in, so the
  // previous (possibly narrower) range doesn't hide cars from a new search
  useEffect(() => {
    setPriceRange([0, maxPrice]);
  }, [maxPrice]);

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filterLocation) count++;
    if (filterCategory !== 'all') count++;
    if (priceRange[0] > 0 || priceRange[1] < maxPrice) count++;
    if (selectedTransmissions.length > 0) count++;
    if (selectedFuelTypes.length > 0) count++;
    if (selectedProviders.length > 0) count++;
    if (unlimitedMileageOnly) count++;
    if (freeCancellationOnly) count++;
    return count;
  }, [filterLocation, filterCategory, priceRange, maxPrice, selectedTransmissions, selectedFuelTypes, selectedProviders, unlimitedMileageOnly, freeCancellationOnly]);

  // Filter and sort cars
  const filteredAndSortedCars = useMemo(() => {
    let result = [...apiCars];

    if (filterLocation) {
      const search = filterLocation.toLowerCase();
      result = result.filter(car => 
        car.name.toLowerCase().includes(search) ||
        car.category.toLowerCase().includes(search) ||
        (car.brand && car.brand.toLowerCase().includes(search))
      );
    }

    if (filterCategory !== "all") {
      result = result.filter(car => {
        const category = car.category.toLowerCase();
        switch (filterCategory) {
          case "mini": return category.includes("mini");
          case "economy": return category.includes("économique") || category.includes("economy");
          case "compact": return category.includes("compact");
          case "sedan": return category.includes("berline") || category.includes("sedan") || category.includes("standard");
          case "suv": return category.includes("suv") || category.includes("4x4");
          case "luxury": return category.includes("luxe") || category.includes("luxury") || category.includes("premium");
          case "minivan": return category.includes("monospace") || category.includes("minivan") || category.includes("family");
          default: return true;
        }
      });
    }

    result = result.filter(car => car.price >= priceRange[0] && car.price <= priceRange[1]);

    if (selectedTransmissions.length > 0) {
      result = result.filter(car => selectedTransmissions.some(t => car.transmission.toLowerCase().includes(t.toLowerCase())));
    }

    if (selectedFuelTypes.length > 0) {
      result = result.filter(car => selectedFuelTypes.some(f => car.fuel.toLowerCase().includes(f.toLowerCase())));
    }

    if (selectedProviders.length > 0) {
      result = result.filter(car => car.provider && selectedProviders.includes(car.provider));
    }

    if (unlimitedMileageOnly) {
      result = result.filter(car => car.unlimitedMileage);
    }

    if (freeCancellationOnly) {
      result = result.filter(car => car.freeCancellation);
    }

    switch (sortBy) {
      case "price-asc": result.sort((a, b) => a.price - b.price); break;
      case "price-desc": result.sort((a, b) => b.price - a.price); break;
      case "rating": result.sort((a, b) => b.rating - a.rating); break;
      case "popular": result.sort((a, b) => b.reviews - a.reviews); break;
    }

    return result;
  }, [apiCars, filterLocation, filterCategory, priceRange, selectedTransmissions, selectedFuelTypes, selectedProviders, unlimitedMileageOnly, freeCancellationOnly, sortBy]);

  const totalPages = Math.ceil(filteredAndSortedCars.length / itemsPerPage);
  const paginatedCars = filteredAndSortedCars.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const resetFilters = () => {
    setFilterLocation("");
    setFilterCategory("all");
    setPriceRange([0, 200]);
    setSelectedTransmissions([]);
    setSelectedFuelTypes([]);
    setSelectedProviders([]);
    setUnlimitedMileageOnly(false);
    setFreeCancellationOnly(false);
  };

  const handleBook = (car: CarData) => {
    setSelectedCar(car);
    setDialogOpen(true);
  };

  const handleViewDetails = (car: CarData) => {
    setDetailsCar(car);
    setDetailsOpen(true);
  };

  const filtersComponent = (
    <CarFilters
      filterLocation={filterLocation}
      setFilterLocation={setFilterLocation}
      filterCategory={filterCategory}
      setFilterCategory={setFilterCategory}
      priceRange={priceRange}
      setPriceRange={setPriceRange}
      maxPrice={maxPrice}
      selectedTransmissions={selectedTransmissions}
      setSelectedTransmissions={setSelectedTransmissions}
      selectedFuelTypes={selectedFuelTypes}
      setSelectedFuelTypes={setSelectedFuelTypes}
      selectedProviders={selectedProviders}
      setSelectedProviders={setSelectedProviders}
      unlimitedMileageOnly={unlimitedMileageOnly}
      setUnlimitedMileageOnly={setUnlimitedMileageOnly}
      freeCancellationOnly={freeCancellationOnly}
      setFreeCancellationOnly={setFreeCancellationOnly}
      onReset={resetFilters}
      availableProviders={availableProviders}
      activeFiltersCount={activeFiltersCount}
    />
  );

  return (
    <div className="min-h-screen bg-background flex flex-col pt-16">
      <Navbar />
      
      {/* Hero Section with Search Form */}
      <div className="relative min-h-[50vh] md:min-h-[60vh] flex items-center justify-center overflow-hidden">
        <LazyImage
          src={bannerCars}
          alt={t('cars.title')}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/70 via-primary/50 to-background"></div>
        <div className="absolute inset-0" style={{ background: "radial-gradient(120% 90% at 15% 0%, hsl(var(--gold) / 0.22), transparent 55%)" }}></div>
        <div className="relative z-10 container mx-auto px-4 py-12">
          <div className="text-center mb-8 animate-fade-in">

            <h1 className="text-4xl md:text-6xl font-bold mb-4 text-white drop-shadow-lg">
              {t('cars.title')}
            </h1>
            <p className="text-lg md:text-xl text-white/95 drop-shadow-md max-w-2xl mx-auto">
              {t('cars.subtitle')}
            </p>
          </div>
          <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <CarSearchForm />
          </div>
        </div>
      </div>
      
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Desktop Filters */}
          <aside className="hidden lg:block lg:col-span-1 lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">{filtersComponent}</aside>

          {/* Results */}
          <div className="lg:col-span-3 space-y-4">
            {/* Default results badge */}
            {isDefaultResults && apiCars.length > 0 && (
              <div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/20 rounded-xl">
                <Badge className="bg-primary text-primary-foreground">
                  <CarIcon className="w-3 h-3 mr-1" />
                  Véhicules disponibles
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Voitures de location dans les destinations populaires (Paris, Nice, Lyon, Marseille, Bordeaux)
                </span>
              </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-card rounded-xl border">
              <div className="flex items-center gap-3">
                <p className="font-medium">{filteredAndSortedCars.length} véhicules</p>
                {activeFiltersCount > 0 && <Badge variant="secondary">{activeFiltersCount} filtres</Badge>}
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="lg:hidden">
                      <SlidersHorizontal className="w-4 h-4 mr-2" />Filtres
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[320px] overflow-y-auto p-4">{filtersComponent}</SheetContent>
                </Sheet>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-[180px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="price-asc">{t('cars.sortBy.priceAsc')}</SelectItem>
                    <SelectItem value="price-desc">{t('cars.sortBy.priceDesc')}</SelectItem>
                    <SelectItem value="rating">{t('cars.sortBy.rating')}</SelectItem>
                    <SelectItem value="popular">{t('cars.sortBy.popular')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Loading */}
            {(loading || loadingDefault) && (
              <div className="space-y-4">
                <p className="text-center text-muted-foreground">
                  {loadingDefault ? 'Chargement des véhicules disponibles...' : 'Recherche en cours...'}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <CarCardSkeleton key={i} />
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {!loading && !loadingDefault && filteredAndSortedCars.length === 0 && (
              <div className="text-center py-16 bg-card rounded-xl border">
                <CarIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">{t('cars.noVehicles')}</h3>
                <p className="text-muted-foreground mb-4">Utilisez le formulaire de recherche ci-dessus</p>
                {activeFiltersCount > 0 && <Button variant="outline" onClick={resetFilters}>{t('cars.resetFilters')}</Button>}
              </div>
            )}

            {/* Results Grid */}
            {!loading && !loadingDefault && paginatedCars.length > 0 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {paginatedCars.map((car) => (
                    <CarCard key={car.id} car={car} onBook={handleBook} onViewDetails={handleViewDetails} />
                  ))}
                </div>
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} itemsPerPage={itemsPerPage} totalItems={filteredAndSortedCars.length} />
              </>
            )}
          </div>
        </div>
      </main>

      <CarDetailsDialog open={detailsOpen} onOpenChange={setDetailsOpen} car={detailsCar} onBook={handleBook} />
      {selectedCar && <CarBookingDialog open={dialogOpen} onOpenChange={setDialogOpen} car={selectedCar} />}
      <Footer />
    </div>
  );
};

export default Cars;
