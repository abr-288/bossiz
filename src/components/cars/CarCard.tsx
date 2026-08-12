import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LazyImage } from "@/components/ui/lazy-image";
import { Price } from "@/components/ui/price";
import { 
  Users, 
  Briefcase, 
  Fuel, 
  Settings, 
  Snowflake, 
  Check,
  Star,
  Gauge,
  DoorOpen,
  Info,
  Shield,
  MapPin
} from "lucide-react";
import { motion } from "framer-motion";

export interface CarData {
  id: string;
  name: string;
  brand?: string;
  model?: string;
  category: string;
  price: number;
  currency?: string;
  rating: number;
  reviews: number;
  image: string;
  seats: number;
  transmission: string;
  fuel: string;
  luggage: number;
  airConditioning?: boolean;
  provider?: string;
  source?: string;
  unlimitedMileage?: boolean;
  freeCancellation?: boolean;
  fuelPolicy?: string;
  deposit?: number | null;
  doors?: number;
  engineSize?: string;
  year?: number;
  pickupLocation?: string;
  features?: string[];
  offerSignature?: string;
  offerExpiresAt?: string;
}

interface CarCardProps {
  car: CarData;
  onBook: (car: CarData) => void;
  onViewDetails: (car: CarData) => void;
}

export const CarCard = ({ car, onBook, onViewDetails }: CarCardProps) => {
  const { t } = useTranslation();
  const [imageError, setImageError] = useState(false);

  const placeholderImage = "https://images.unsplash.com/photo-1494905998402-395d579af36f?w=600&h=400&fit=crop";

  const getCategoryColor = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('luxe') || cat.includes('luxury') || cat.includes('premium')) return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
    if (cat.includes('suv') || cat.includes('4x4')) return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
    if (cat.includes('économique') || cat.includes('economy') || cat.includes('mini')) return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
    if (cat.includes('berline') || cat.includes('sedan')) return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
    return 'bg-muted text-muted-foreground border-border';
  };

  const getFuelIcon = (fuel: string) => {
    const f = fuel.toLowerCase();
    if (f.includes('électrique') || f.includes('electric')) return '⚡';
    if (f.includes('hybride') || f.includes('hybrid')) return '🔋';
    if (f.includes('diesel')) return '🛢️';
    return '⛽';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 group border-border/50 bg-card">
        {/* Image Section */}
        <div className="relative h-48 md:h-56 overflow-hidden bg-muted">
          <LazyImage
            src={imageError ? placeholderImage : car.image}
            alt={car.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setImageError(true)}
          />
          
          {/* Overlay badges */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-2">
            <Badge className={`${getCategoryColor(car.category)} border font-medium`}>
              {car.category}
            </Badge>
            {car.freeCancellation && (
              <Badge className="bg-green-500/90 text-white border-0 text-xs">
                <Check className="w-3 h-3 mr-1" />
                Annulation gratuite
              </Badge>
            )}
          </div>

          {/* Provider badge */}
          {car.provider && (
            <div className="absolute top-3 right-3">
              <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm text-xs font-medium">
                {car.provider}
              </Badge>
            </div>
          )}

          {/* Unlimited mileage badge */}
          {car.unlimitedMileage && (
            <div className="absolute bottom-3 left-3">
              <Badge className="bg-primary/90 text-primary-foreground border-0 text-xs">
                <Gauge className="w-3 h-3 mr-1" />
                Kilométrage illimité
              </Badge>
            </div>
          )}
        </div>

        <CardContent className="p-4 md:p-5">
          {/* Header: Name & Rating */}
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg md:text-xl font-bold text-foreground truncate">
                {car.name}
              </h3>
              {car.year && (
                <p className="text-sm text-muted-foreground">
                  {car.year} • {car.engineSize || ''}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-lg ml-2">
              <Star className="w-4 h-4 fill-primary text-primary" />
              <span className="font-semibold text-primary">{car.rating.toFixed(1)}</span>
            </div>
          </div>

          {/* Reviews & Location */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
            <span>{car.reviews.toLocaleString()} avis</span>
            {car.pickupLocation && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {car.pickupLocation}
              </span>
            )}
          </div>

          {/* Specifications Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                <Users className="w-4 h-4 text-muted-foreground" />
              </div>
              <span className="text-foreground font-medium">{car.seats}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                <Briefcase className="w-4 h-4 text-muted-foreground" />
              </div>
              <span className="text-foreground font-medium">{car.luggage}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                <Settings className="w-4 h-4 text-muted-foreground" />
              </div>
              <span className="text-foreground font-medium text-xs">{car.transmission}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                <span className="text-sm">{getFuelIcon(car.fuel)}</span>
              </div>
              <span className="text-foreground font-medium text-xs">{car.fuel}</span>
            </div>
          </div>

          {/* Additional Info Row */}
          <div className="flex flex-wrap gap-2 mb-4">
            {car.airConditioning && (
              <Badge variant="outline" className="text-xs">
                <Snowflake className="w-3 h-3 mr-1" />
                Climatisation
              </Badge>
            )}
            {car.doors && (
              <Badge variant="outline" className="text-xs">
                <DoorOpen className="w-3 h-3 mr-1" />
                {car.doors} portes
              </Badge>
            )}
            {car.fuelPolicy && (
              <Badge variant="outline" className="text-xs capitalize">
                {car.fuelPolicy === 'full-to-full' ? 'Plein/Plein' : car.fuelPolicy}
              </Badge>
            )}
          </div>

          {/* Deposit Info */}
          {car.deposit && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4 p-2 bg-muted/50 rounded-lg">
              <Shield className="w-4 h-4" />
              <span>{t('carCard.deposit')}: <Price amount={car.deposit} fromCurrency="EUR" className="font-medium text-foreground" /></span>
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-border my-4" />

          {/* Price & Actions */}
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">{t('carCard.totalPrice')}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl md:text-3xl font-bold text-primary">
                  <Price amount={car.price} fromCurrency="EUR" showLoader />
                </span>
                <span className="text-sm text-muted-foreground">/jour</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onViewDetails(car)}
                className="hidden sm:flex"
              >
                <Info className="w-4 h-4 mr-1" />
                Détails
              </Button>
              <Button 
                onClick={() => onBook(car)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              >
                Réserver
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default CarCard;
