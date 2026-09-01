import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useCurrency } from "@/contexts/CurrencyContext";
import { 
  Search, 
  SlidersHorizontal, 
  X,
  Car,
  Settings,
  Fuel,
  Building2,
  Gauge,
  Clock,
  Shield
} from "lucide-react";

interface CarFiltersProps {
  filterLocation: string;
  setFilterLocation: (value: string) => void;
  filterCategory: string;
  setFilterCategory: (value: string) => void;
  priceRange: number[];
  setPriceRange: (value: number[]) => void;
  selectedTransmissions: string[];
  setSelectedTransmissions: (value: string[]) => void;
  selectedFuelTypes: string[];
  setSelectedFuelTypes: (value: string[]) => void;
  selectedProviders: string[];
  setSelectedProviders: (value: string[]) => void;
  unlimitedMileageOnly: boolean;
  setUnlimitedMileageOnly: (value: boolean) => void;
  freeCancellationOnly: boolean;
  setFreeCancellationOnly: (value: boolean) => void;
  onReset: () => void;
  availableProviders: string[];
  activeFiltersCount: number;
}

export const CarFilters = ({
  filterLocation,
  setFilterLocation,
  filterCategory,
  setFilterCategory,
  priceRange,
  setPriceRange,
  selectedTransmissions,
  setSelectedTransmissions,
  selectedFuelTypes,
  setSelectedFuelTypes,
  selectedProviders,
  setSelectedProviders,
  unlimitedMileageOnly,
  setUnlimitedMileageOnly,
  freeCancellationOnly,
  setFreeCancellationOnly,
  onReset,
  availableProviders,
  activeFiltersCount,
}: CarFiltersProps) => {
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();

  const categories = [
    { value: 'all', label: 'Toutes catégories' },
    { value: 'mini', label: 'Mini' },
    { value: 'economy', label: 'Économique' },
    { value: 'compact', label: 'Compacte' },
    { value: 'sedan', label: 'Berline' },
    { value: 'suv', label: 'SUV / 4x4' },
    { value: 'luxury', label: 'Luxe / Premium' },
    { value: 'minivan', label: 'Monospace' },
  ];

  const transmissions = ['Automatique', 'Manuelle'];
  const fuelTypes = ['Essence', 'Diesel', 'Hybride', 'Électrique'];

  const toggleTransmission = (trans: string) => {
    if (selectedTransmissions.includes(trans)) {
      setSelectedTransmissions(selectedTransmissions.filter(t => t !== trans));
    } else {
      setSelectedTransmissions([...selectedTransmissions, trans]);
    }
  };

  const toggleFuelType = (fuel: string) => {
    if (selectedFuelTypes.includes(fuel)) {
      setSelectedFuelTypes(selectedFuelTypes.filter(f => f !== fuel));
    } else {
      setSelectedFuelTypes([...selectedFuelTypes, fuel]);
    }
  };

  const toggleProvider = (provider: string) => {
    if (selectedProviders.includes(provider)) {
      setSelectedProviders(selectedProviders.filter(p => p !== provider));
    } else {
      setSelectedProviders([...selectedProviders, provider]);
    }
  };

  return (
    <Card className="p-5 sticky top-20">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">{t('cars.filters')}</h2>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeFiltersCount}
            </Badge>
          )}
        </div>
        {activeFiltersCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onReset} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4 mr-1" />
            Réinitialiser
          </Button>
        )}
      </div>

      <div className="space-y-6">
        {/* Search */}
        <div>
          <Label className="text-sm font-medium mb-2 flex items-center gap-2">
            <Search className="w-4 h-4" />
            Rechercher
          </Label>
          <Input
            placeholder={t('carFilters.brandModelPlaceholder')}
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value)}
            className="mt-2"
          />
        </div>

        <Separator />

        {/* Category */}
        <div>
          <Label className="text-sm font-medium mb-3 flex items-center gap-2">
            <Car className="w-4 h-4" />
            Type de véhicule
          </Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {categories.map((cat) => (
              <Button
                key={cat.value}
                variant={filterCategory === cat.value ? "default" : "outline"}
                size="sm"
                className="text-xs justify-start h-auto py-2"
                onClick={() => setFilterCategory(cat.value)}
              >
                {cat.label}
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Price Range */}
        <div>
          <Label className="text-sm font-medium mb-3 flex items-center justify-between">
            <span>{t('cars.pricePerDay')}</span>
            <span className="text-primary font-semibold">
              {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
            </span>
          </Label>
          <Slider
            min={0}
            max={200}
            step={5}
            value={priceRange}
            onValueChange={setPriceRange}
            className="mt-4"
          />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>0 €</span>
            <span>200 €+</span>
          </div>
        </div>

        <Separator />

        {/* Transmission */}
        <div>
          <Label className="text-sm font-medium mb-3 flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Transmission
          </Label>
          <div className="space-y-2 mt-2">
            {transmissions.map((trans) => (
              <div key={trans} className="flex items-center gap-3">
                <Checkbox
                  id={`trans-${trans}`}
                  checked={selectedTransmissions.includes(trans)}
                  onCheckedChange={() => toggleTransmission(trans)}
                />
                <label
                  htmlFor={`trans-${trans}`}
                  className="text-sm cursor-pointer flex-1"
                >
                  {trans}
                </label>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Fuel Type */}
        <div>
          <Label className="text-sm font-medium mb-3 flex items-center gap-2">
            <Fuel className="w-4 h-4" />
            Carburant
          </Label>
          <div className="space-y-2 mt-2">
            {fuelTypes.map((fuel) => (
              <div key={fuel} className="flex items-center gap-3">
                <Checkbox
                  id={`fuel-${fuel}`}
                  checked={selectedFuelTypes.includes(fuel)}
                  onCheckedChange={() => toggleFuelType(fuel)}
                />
                <label
                  htmlFor={`fuel-${fuel}`}
                  className="text-sm cursor-pointer flex-1"
                >
                  {fuel}
                </label>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Options */}
        <div>
          <Label className="text-sm font-medium mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Options
          </Label>
          <div className="space-y-3 mt-2">
            <div className="flex items-center gap-3">
              <Checkbox
                id="unlimited-mileage"
                checked={unlimitedMileageOnly}
                onCheckedChange={(checked) => setUnlimitedMileageOnly(checked as boolean)}
              />
              <label htmlFor="unlimited-mileage" className="text-sm cursor-pointer flex items-center gap-2">
                <Gauge className="w-4 h-4 text-green-500" />
                Kilométrage illimité
              </label>
            </div>
            <div className="flex items-center gap-3">
              <Checkbox
                id="free-cancellation"
                checked={freeCancellationOnly}
                onCheckedChange={(checked) => setFreeCancellationOnly(checked as boolean)}
              />
              <label htmlFor="free-cancellation" className="text-sm cursor-pointer flex items-center gap-2">
                <Clock className="w-4 h-4 text-green-500" />
                Annulation gratuite
              </label>
            </div>
          </div>
        </div>

        {/* Providers */}
        {availableProviders.length > 0 && (
          <>
            <Separator />
            <div>
              <Label className="text-sm font-medium mb-3 flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Agences
              </Label>
              <div className="space-y-2 mt-2 max-h-40 overflow-y-auto">
                {availableProviders.slice(0, 10).map((provider) => (
                  <div key={provider} className="flex items-center gap-3">
                    <Checkbox
                      id={`provider-${provider}`}
                      checked={selectedProviders.includes(provider)}
                      onCheckedChange={() => toggleProvider(provider)}
                    />
                    <label
                      htmlFor={`provider-${provider}`}
                      className="text-sm cursor-pointer flex-1 truncate"
                    >
                      {provider}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </Card>
  );
};

export default CarFilters;
