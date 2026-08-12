import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LazyImage } from "@/components/ui/lazy-image";
import { Price } from "@/components/ui/price";
import { 
  Users, 
  Briefcase, 
  Fuel, 
  Settings, 
  Snowflake, 
  Check,
  X,
  Star,
  Gauge,
  DoorOpen,
  Shield,
  MapPin,
  Calendar,
  Car,
  Info,
  Clock,
  CreditCard
} from "lucide-react";
import { CarData } from "./CarCard";

interface CarDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  car: CarData | null;
  onBook: (car: CarData) => void;
}

export const CarDetailsDialog = ({ open, onOpenChange, car, onBook }: CarDetailsDialogProps) => {
  const { t } = useTranslation();

  if (!car) return null;

  const placeholderImage = "https://images.unsplash.com/photo-1494905998402-395d579af36f?w=800&h=500&fit=crop";

  const getCategoryColor = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('luxe') || cat.includes('luxury') || cat.includes('premium')) return 'bg-amber-500/10 text-amber-600';
    if (cat.includes('suv') || cat.includes('4x4')) return 'bg-emerald-500/10 text-emerald-600';
    if (cat.includes('économique') || cat.includes('economy') || cat.includes('mini')) return 'bg-blue-500/10 text-blue-600';
    if (cat.includes('berline') || cat.includes('sedan')) return 'bg-purple-500/10 text-purple-600';
    return 'bg-muted text-muted-foreground';
  };

  const getFuelPolicyLabel = (policy: string) => {
    switch (policy) {
      case 'full-to-full': return t('carDetails.fuelPolicyFullToFull');
      case 'same-to-same': return t('carDetails.fuelPolicySameToSame');
      case 'full-to-empty': return t('carDetails.fuelPolicyFullToEmpty');
      default: return policy;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        {/* Hero Image */}
        <div className="relative h-64 md:h-80 w-full">
          <LazyImage
            src={car.image || placeholderImage}
            alt={car.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
          
          {/* Badges overlay */}
          <div className="absolute top-4 left-4 flex flex-wrap gap-2">
            <Badge className={`${getCategoryColor(car.category)} font-semibold px-3 py-1`}>
              {car.category}
            </Badge>
            {car.freeCancellation && (
              <Badge className="bg-green-500 text-white">
                <Check className="w-3 h-3 mr-1" />
                {t('pages.hotels.badges.freeCancellation')}
              </Badge>
            )}
          </div>

          {/* Provider */}
          {car.provider && (
            <div className="absolute top-4 right-4">
              <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm text-sm font-medium">
                {car.provider}
              </Badge>
            </div>
          )}

          {/* Car name overlay */}
          <div className="absolute bottom-4 left-4 right-4">
            <h2 className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg">
              {car.name}
            </h2>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1 bg-primary text-primary-foreground px-2 py-1 rounded-lg">
                <Star className="w-4 h-4 fill-current" />
                <span className="font-semibold">{car.rating.toFixed(1)}</span>
              </div>
              <span className="text-white/90 text-sm">{car.reviews.toLocaleString()} {t('pages.hotels.results.reviews')}</span>
              {car.year && (
                <span className="text-white/90 text-sm">• {car.year}</span>
              )}
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Quick Specs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="flex flex-col items-center p-4 bg-muted/50 rounded-xl">
              <Users className="w-6 h-6 text-primary mb-2" />
              <span className="text-lg font-bold">{car.seats}</span>
              <span className="text-xs text-muted-foreground">{t('carDetails.passengers')}</span>
            </div>
            <div className="flex flex-col items-center p-4 bg-muted/50 rounded-xl">
              <Briefcase className="w-6 h-6 text-primary mb-2" />
              <span className="text-lg font-bold">{car.luggage}</span>
              <span className="text-xs text-muted-foreground">{t('carDetails.luggage')}</span>
            </div>
            <div className="flex flex-col items-center p-4 bg-muted/50 rounded-xl">
              <Settings className="w-6 h-6 text-primary mb-2" />
              <span className="text-lg font-bold text-center">{car.transmission}</span>
              <span className="text-xs text-muted-foreground">{t('cars.transmission')}</span>
            </div>
            <div className="flex flex-col items-center p-4 bg-muted/50 rounded-xl">
              <DoorOpen className="w-6 h-6 text-primary mb-2" />
              <span className="text-lg font-bold">{car.doors || 4}</span>
              <span className="text-xs text-muted-foreground">{t('carDetails.doors')}</span>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Vehicle Details */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Car className="w-5 h-5 text-primary" />
                {t('carDetails.vehicleSpecs')}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <span className="text-muted-foreground">{t('carDetails.brand')}</span>
                  <span className="font-medium">{car.brand || car.name.split(' ')[0]}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <span className="text-muted-foreground">{t('carDetails.model')}</span>
                  <span className="font-medium">{car.model || car.name.split(' ').slice(1).join(' ')}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <span className="text-muted-foreground">{t('cars.fuel')}</span>
                  <span className="font-medium">{car.fuel}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <span className="text-muted-foreground">{t('carDetails.engine')}</span>
                  <span className="font-medium">{car.engineSize || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <span className="text-muted-foreground">{t('carDetails.airConditioning')}</span>
                  <span className="font-medium">
                    {car.airConditioning ? (
                      <Check className="w-5 h-5 text-green-500" />
                    ) : (
                      <X className="w-5 h-5 text-red-500" />
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <span className="text-muted-foreground">{t('carDetails.year')}</span>
                  <span className="font-medium">{car.year || 2024}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Rental Conditions */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Info className="w-5 h-5 text-primary" />
                {t('carDetails.rentalConditions')}
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <Gauge className={`w-5 h-5 ${car.unlimitedMileage ? 'text-green-500' : 'text-amber-500'}`} />
                  <div className="flex-1">
                    <span className="font-medium">{t('carDetails.mileage')}</span>
                    <p className="text-sm text-muted-foreground">
                      {car.unlimitedMileage ? t('carDetails.unlimited') : t('carDetails.limited')}
                    </p>
                  </div>
                  {car.unlimitedMileage && <Check className="w-5 h-5 text-green-500" />}
                </div>

                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <Fuel className="w-5 h-5 text-primary" />
                  <div className="flex-1">
                    <span className="font-medium">{t('carDetails.fuelPolicy')}</span>
                    <p className="text-sm text-muted-foreground">
                      {getFuelPolicyLabel(car.fuelPolicy || 'full-to-full')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <Clock className={`w-5 h-5 ${car.freeCancellation ? 'text-green-500' : 'text-amber-500'}`} />
                  <div className="flex-1">
                    <span className="font-medium">{t('carDetails.cancellation')}</span>
                    <p className="text-sm text-muted-foreground">
                      {car.freeCancellation ? t('carDetails.freeCancellationUntil48h') : t('carDetails.cancellationTermsApply')}
                    </p>
                  </div>
                  {car.freeCancellation && <Check className="w-5 h-5 text-green-500" />}
                </div>

                {car.deposit && (
                  <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <CreditCard className="w-5 h-5 text-amber-500" />
                    <div className="flex-1">
                      <span className="font-medium">{t('carDetails.depositRequired')}</span>
                      <p className="text-sm text-muted-foreground">
                        <Price amount={car.deposit} fromCurrency="EUR" /> {t('carDetails.blockedOnCard')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Features */}
            {car.features && car.features.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    {t('carDetails.featuresIncluded')}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {car.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 p-2">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Pickup Location */}
            {car.pickupLocation && (
              <>
                <Separator />
                <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-xl border border-primary/10">
                  <MapPin className="w-6 h-6 text-primary" />
                  <div>
                    <span className="font-medium">{t('cars.pickupLocation')}</span>
                    <p className="text-sm text-muted-foreground">{car.pickupLocation}</p>
                  </div>
                </div>
              </>
            )}
          </div>

          <Separator className="my-6" />

          {/* Price & Book */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-muted/50 rounded-xl">
            <div>
              <p className="text-sm text-muted-foreground">{t('carDetails.totalPricePerDay')}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl md:text-4xl font-bold text-primary">
                  <Price amount={car.price} fromCurrency="EUR" showLoader />
                </span>
                <span className="text-muted-foreground">/{t('carDetails.day')}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{t('carDetails.taxesIncluded')}</p>
            </div>
            <Button 
              size="lg"
              onClick={() => {
                onBook(car);
                onOpenChange(false);
              }}
              className="w-full sm:w-auto px-8 py-6 text-lg"
            >
              {t('carDetails.bookNow')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CarDetailsDialog;
