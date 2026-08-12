import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, Loader2, Plane, Hotel, Car, Calendar } from "lucide-react";
import { useServices } from "@/hooks/useServices";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Price } from "@/components/ui/price";

type ServiceType = "car" | "event" | "flight" | "flight_hotel" | "hotel" | "tour";

const FeaturedServices = () => {
  const [selectedType, setSelectedType] = useState<ServiceType | undefined>(undefined);
  const { services, loading } = useServices(selectedType);
  const navigate = useNavigate();

  const serviceTypes = [
    { value: undefined, label: "Tous", icon: Star },
    { value: "flight" as ServiceType, label: "Vols", icon: Plane },
    { value: "hotel" as ServiceType, label: "Hôtels", icon: Hotel },
    { value: "car" as ServiceType, label: "Voitures", icon: Car },
    { value: "event" as ServiceType, label: "Événements", icon: Calendar },
    { value: "tour" as ServiceType, label: "Tours", icon: MapPin }
  ];

  const getServiceIcon = (type: string) => {
    switch (type) {
      case "flight": return Plane;
      case "hotel": return Hotel;
      case "car": return Car;
      case "event": return Calendar;
      case "tour": return MapPin;
      default: return Star;
    }
  };

  const displayServices = services.slice(0, 8);

  return (
    <section className="py-16 md:py-20 lg:py-24 bg-gradient-to-b from-background via-muted/20 to-background relative overflow-hidden">
      {/* Background mesh gradient */}
      <div className="absolute inset-0 gradient-mesh opacity-40" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-10 md:mb-16 animate-slide-up-fade">
          <div className="inline-block mb-4">
            <span className="px-4 py-2 rounded-full bg-secondary/10 text-secondary text-sm font-semibold">
              ✨ Nos Meilleures Offres
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gradient mb-4 md:mb-6">
            Services en Vedette
          </h2>
          <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            Découvrez nos meilleures offres sélectionnées pour vous
          </p>
          
          {/* Decorative underline */}
          <div className="flex justify-center gap-2 mt-6">
            <div className="w-16 h-1 bg-gradient-primary rounded-full" />
            <div className="w-8 h-1 bg-secondary/50 rounded-full" />
          </div>
        </div>

        <div className="mb-8 md:mb-12 flex flex-wrap justify-center gap-3 md:gap-4">
          {serviceTypes.map((type, idx) => (
            <Button
              key={type.label}
              variant={selectedType === type.value ? "default" : "outline"}
              onClick={() => setSelectedType(type.value)}
              className={`gap-2 text-sm md:text-base h-10 md:h-12 px-4 md:px-6 rounded-xl hover:scale-105 transition-spring shadow-md hover:shadow-xl animate-slide-up-fade ${
                selectedType === type.value ? 'gradient-primary text-primary-foreground shadow-primary' : ''
              }`}
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              <type.icon className="w-4 h-4 md:w-5 md:h-5" />
              <span>{type.label}</span>
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : displayServices.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Aucun service disponible pour le moment</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {displayServices.map((service, index) => {
              const ServiceIcon = getServiceIcon(service.type);
              return (
                <Card
                  key={service.id}
                  className="group overflow-hidden border-2 border-border/50 hover:border-secondary/50 shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer animate-slide-up-fade hover-lift rounded-2xl bg-gradient-card relative"
                  style={{ animationDelay: `${index * 0.08}s` }}
                  onClick={() => {
                    const routes: Record<string, string> = {
                      flight: '/flights',
                      hotel: '/hotels',
                      car: '/cars',
                      event: '/events',
                      tour: '/tours'
                    };
                    navigate(routes[service.type] || '/');
                  }}
                >
                  {/* Shine effect overlay */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-10">
                    <div className="absolute inset-0 animate-shimmer" />
                  </div>
                  
                  <div className="relative h-48 md:h-56 overflow-hidden">
                    <img
                      src={service.image_url || service.images?.[0] || '/placeholder.svg'}
                      alt={service.name}
                      className="w-full h-full object-cover transition-smooth group-hover:scale-110"
                      loading="lazy"
                    />
                    <Badge className="absolute top-3 left-3 gap-1">
                      <ServiceIcon className="w-3 h-3" />
                      {service.type}
                    </Badge>
                    {service.featured && (
                      <Badge className="absolute top-3 right-3 bg-secondary">
                        ⭐ Vedette
                      </Badge>
                    )}
                  </div>

                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-bold text-foreground line-clamp-1 group-hover:text-primary transition-smooth">
                        {service.name}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 text-muted-foreground mb-3">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm line-clamp-1">{service.location}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-secondary text-secondary" />
                        <span className="font-semibold text-sm">{Number(service.rating || 0).toFixed(1)}</span>
                        <span className="text-xs text-muted-foreground">({service.total_reviews || 0})</span>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary">
                          <Price amount={Number(service.price_per_unit)} fromCurrency={service.currency} showLoader />
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <div className="text-center mt-12">
          <Button
            size="lg"
            onClick={() => navigate(selectedType ? `/${selectedType}s` : '/stays')}
            className="gap-2"
          >
            Voir Tous les Services
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedServices;
