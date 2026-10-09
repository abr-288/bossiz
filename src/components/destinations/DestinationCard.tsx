import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Star, Heart, TrendingUp, Thermometer, Calendar, Users, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LazyImage } from "@/components/ui/lazy-image";
import { Price } from "@/components/ui/price";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Destination } from "@/hooks/useDestinations";
import { MOTION } from "@/lib/motion";

interface DestinationCardProps {
  destination: Destination;
  index?: number;
  variant?: "default" | "compact" | "featured";
}

const categoryColors: Record<string, string> = {
  "Ville": "bg-info",
  "Plage": "bg-cyan-500/90",
  "Île": "bg-teal-500/90",
  "Montagne": "bg-success",
  "Culture": "bg-gold",
  "Nature": "bg-success",
  "Attraction": "bg-primary",
};

export const DestinationCard = ({ destination, index = 0, variant = "default" }: DestinationCardProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleViewDetails = () => {
    navigate(`/destinations/${destination.id}`, { state: { destination } });
  };

  const handleBook = () => {
    navigate(`/destinations/${destination.id}`, { state: { destination, autoBook: true } });
  };

  const categoryColor = categoryColors[destination.category] || "bg-primary/90";

  if (variant === "compact") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: MOTION.slow, delay: index * 0.05 }}
        whileHover={{ y: -4 }}
      >
        <Card className="group overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-lg transition-all duration-slow ease-standard">
          <div className="relative h-32 overflow-hidden">
            <LazyImage
              src={imageError ? "/placeholder.svg" : destination.image}
              alt={destination.name}
              className="w-full h-full object-cover transition-transform duration-slow ease-standard group-hover:scale-110"
              onError={() => setImageError(true)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-2 left-2 right-2">
              <h3 className="text-white font-semibold text-sm truncate">{destination.name}</h3>
              <div className="flex items-center gap-1 text-white/80 text-xs">
                <MapPin className="w-3 h-3" />
                <span className="truncate">{destination.country}</span>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  if (variant === "featured") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: MOTION.slow, delay: index * 0.1 }}
        whileHover={{ y: -8 }}
        className="h-full"
      >
        <Card className="group overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-slow ease-standard h-full flex flex-col">
          <div className="relative h-64 overflow-hidden">
            <LazyImage
              src={imageError ? "/placeholder.svg" : destination.image}
              alt={destination.name}
              className="w-full h-full object-cover transition-transform duration-slow ease-standard group-hover:scale-110"
              onError={() => setImageError(true)}
            />
            
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            
            {/* Top badges */}
            <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
              <div className="flex gap-2 flex-wrap">
                <Badge className={`${categoryColor} text-white border-0 text-xs font-medium`}>
                  {destination.category}
                </Badge>
                {destination.trending && (
                  <Badge className="bg-gold text-gold-foreground border-0 text-xs font-medium">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Tendance
                  </Badge>
                )}
              </div>
              <Button
                aria-label="Ajouter aux favoris"
                variant="ghost"
                size="icon"
                className="h-8 w-8 bg-white/20 backdrop-blur-sm hover:bg-white/40 text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFavorite(!isFavorite);
                }}
              >
                <Heart className={`w-4 h-4 ${isFavorite ? "fill-destructive text-destructive" : ""}`} />
              </Button>
            </div>

            {/* Bottom info overlay */}
            <div className="absolute bottom-3 left-3 right-3">
              <h3 className="text-white font-bold text-xl mb-1">{destination.name}</h3>
              <div className="flex items-center gap-2 text-white/90 text-sm">
                <MapPin className="w-4 h-4" />
                <span>{destination.location}</span>
              </div>
            </div>
          </div>

          <CardContent className="p-4 flex-1 flex flex-col">
            {/* Rating & Reviews */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-full">
                  <Star className="w-4 h-4 fill-gold text-gold" />
                  <span className="font-semibold text-sm">{destination.rating.toFixed(1)}</span>
                </div>
                <span className="text-muted-foreground text-xs">
                  ({destination.reviews.toLocaleString()} avis)
                </span>
              </div>
              {destination.temperature && (
                <div className="flex items-center gap-1 text-muted-foreground text-sm">
                  <Thermometer className="w-4 h-4 text-warning-foreground" />
                  <span>{destination.temperature}°C</span>
                </div>
              )}
            </div>

            {/* Description */}
            <p className="text-muted-foreground text-sm mb-3 line-clamp-2 flex-1">
              {destination.description}
            </p>

            {/* Highlights */}
            {destination.highlights && destination.highlights.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {destination.highlights.slice(0, 3).map((highlight, i) => (
                  <Badge key={i} variant="outline" className="text-xs bg-muted/50">
                    {highlight}
                  </Badge>
                ))}
                {destination.highlights.length > 3 && (
                  <Badge variant="outline" className="text-xs bg-muted/50">
                    +{destination.highlights.length - 3}
                  </Badge>
                )}
              </div>
            )}

            {/* Best Time */}
            {destination.bestTime && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <Calendar className="w-4 h-4" />
                <span>Meilleure période : {destination.bestTime}</span>
              </div>
            )}

            {/* Price & CTA */}
            <div className="flex items-center justify-between pt-3 border-t border-border/50 mt-auto">
              <div>
                <span className="text-xs text-muted-foreground">À partir de</span>
                <div className="flex items-baseline gap-1">
                  <Price 
                    amount={destination.price} 
                    fromCurrency={destination.currency || "EUR"} 
                    className="text-xl font-bold text-primary"
                  />
                  <span className="text-xs text-muted-foreground">/pers.</span>
                </div>
              </div>
              <Button 
                onClick={handleViewDetails}
                className="group/btn"
              >
                {t('common.viewDetails', 'Voir plus')}
                <ChevronRight className="w-4 h-4 ml-1 transition-transform group-hover/btn:translate-x-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Default variant
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: MOTION.slow, delay: index * 0.05 }}
      whileHover={{ y: -6 }}
      className="h-full"
    >
      <Card className="group overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-xl transition-all duration-slow ease-standard h-full flex flex-col">
        <div className="relative h-48 overflow-hidden">
          <LazyImage
            src={imageError ? "/placeholder.svg" : destination.image}
            alt={destination.name}
            className="w-full h-full object-cover transition-transform duration-slow ease-standard group-hover:scale-110"
            onError={() => setImageError(true)}
          />
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          
          {/* Badges */}
          <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
            <Badge className={`${categoryColor} text-white border-0 text-xs`}>
              {destination.category}
            </Badge>
            <Button
              aria-label="Ajouter aux favoris"
              variant="ghost"
              size="icon"
              className="h-8 w-8 bg-white/20 backdrop-blur-sm hover:bg-white/40 text-white"
              onClick={(e) => {
                e.stopPropagation();
                setIsFavorite(!isFavorite);
              }}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? "fill-destructive text-destructive" : ""}`} />
            </Button>
          </div>

          {destination.trending && (
            <div className="absolute top-3 left-20">
              <Badge className="bg-gold text-gold-foreground border-0 text-xs">
                <TrendingUp className="w-3 h-3 mr-1" />
                Tendance
              </Badge>
            </div>
          )}

          {/* Bottom info */}
          <div className="absolute bottom-3 left-3 right-3">
            <h3 className="text-white font-bold text-lg">{destination.name}</h3>
            <div className="flex items-center gap-1 text-white/90 text-sm">
              <MapPin className="w-3 h-3" />
              <span>{destination.country}</span>
            </div>
          </div>
        </div>

        <CardContent className="p-4 flex-1 flex flex-col">
          {/* Rating */}
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-gold text-gold" />
              <span className="font-semibold text-sm">{destination.rating.toFixed(1)}</span>
            </div>
            <span className="text-muted-foreground text-xs">
              ({destination.reviews.toLocaleString()} avis)
            </span>
            {destination.temperature && (
              <div className="ml-auto flex items-center gap-1 text-muted-foreground text-xs">
                <Thermometer className="w-3 h-3 text-warning-foreground" />
                {destination.temperature}°C
              </div>
            )}
          </div>

          {/* Description */}
          <p className="text-muted-foreground text-sm mb-3 line-clamp-2 flex-1">
            {destination.description}
          </p>

          {/* Price & CTA */}
          <div className="flex items-center justify-between pt-2 border-t border-border/50 mt-auto">
            <div>
              <span className="text-xs text-muted-foreground">Dès</span>
            <Price 
              amount={destination.price} 
              fromCurrency={destination.currency || "EUR"} 
              className="text-lg font-bold text-primary"
            />
            </div>
            <Button size="sm" onClick={handleViewDetails}>
              Voir plus
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
