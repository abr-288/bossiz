import { useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Star, Sparkles, Phone } from "lucide-react";
import { useWellnessServices } from "@/hooks/useWellnessServices";
import { WellnessBookingDialog } from "@/components/wellness/WellnessBookingDialog";
import { LazyImage } from "@/components/ui/lazy-image";
import bannerWellness from "@/assets/banner-wellness.jpg";
import { useTranslation } from "react-i18next";
import { CardGridSkeleton } from "@/components/ui/card-grid-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Link } from "react-router-dom";

// Catégories en base -> clés de traduction
const categoryLabels: Record<string, string> = {
  spa: "ux.misc.spa",
  nail_salon: "ux.misc.nailSalon",
  barbershop: "ux.misc.barbershop",
  beauty_institute: "ux.misc.beautyInstitute",
  yoga: "ux.misc.yoga",
};

const WellnessBeauty = () => {
  const { t } = useTranslation();
  const { wellnessServices, loading, error } = useWellnessServices();
  const [locationFilter, setLocationFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedService, setSelectedService] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const filtered = useMemo(() => {
    let result = wellnessServices;
    if (locationFilter) {
      const search = locationFilter.toLowerCase();
      result = result.filter((s) =>
        s.location.toLowerCase().includes(search) || s.name.toLowerCase().includes(search)
      );
    }
    if (categoryFilter !== "all") {
      result = result.filter((s) => s.category === categoryFilter);
    }
    return result;
  }, [wellnessServices, locationFilter, categoryFilter]);

  return (
    <div className="min-h-screen bg-background flex flex-col pt-16">
      <Navbar />

      <div className="relative py-16 md:py-24 overflow-hidden bg-brand">
        <LazyImage
          src={bannerWellness}
          alt={t("ux.wellness.bannerAlt")}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-brand/75 via-brand/60 to-brand/80" />
        <div className="relative z-10 container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 text-white drop-shadow-lg">
            {t("ux.wellness.title")}
          </h1>
          <p className="text-lg md:text-xl text-white/95 max-w-2xl mx-auto">
            {t("ux.wellness.subtitle")}
          </p>
        </div>
      </div>

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1">
            <Input
              placeholder={t("ux.wellness.search")}
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[220px]">
              <SelectValue placeholder={t("ux.wellness.category")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("ux.wellness.allCategories")}</SelectItem>
              {Object.entries(categoryLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <CardGridSkeleton />
        ) : error ? (
          <Card className="p-12 text-center text-muted-foreground">
            {t("ux.wellness.loadError")}
          </Card>
        ) : filtered.length === 0 ? (
          <Card>
            <EmptyState
              icon={Sparkles}
              title={t("ux.wellness.emptyTitle")}
              description={t("ux.wellness.emptyDesc")}
              action={<Button variant="outline" asChild><Link to="/devenir-partenaire?type=wellness">{t("ux.wellness.join")}</Link></Button>}
            />
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((service) => (
              <Card key={service.id} className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
                <img
                  src={service.image_url || "/placeholder.svg"}
                  alt={service.name}
                  className="w-full h-44 object-cover"
                  loading="lazy"
                />
                <CardContent className="p-5 flex-1 flex flex-col">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-lg font-semibold">{service.name}</h3>
                    <Badge variant="secondary" className="whitespace-nowrap">
                      {categoryLabels[service.category] ? t(categoryLabels[service.category]) : service.category}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm truncate">{service.address || service.location}</span>
                  </div>

                  {service.total_reviews > 0 && (
                    <div className="flex items-center gap-1 mb-3">
                      <Star className="w-4 h-4 fill-accent text-accent" />
                      <span className="text-sm text-muted-foreground">
                        {service.rating} ({service.total_reviews} avis)
                      </span>
                    </div>
                  )}

                  {service.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{service.description}</p>
                  )}

                  <div className="mt-auto pt-3 flex items-center justify-between gap-3">
                    {service.phone && (
                      <a href={`tel:${service.phone}`} className="text-sm text-muted-foreground flex items-center gap-1 hover:text-primary">
                        <Phone className="w-3.5 h-3.5" />
                        {service.phone}
                      </a>
                    )}
                    <Button
                      className="ml-auto"
                      onClick={() => {
                        setSelectedService(service);
                        setDialogOpen(true);
                      }}
                    >
                      {t("ux.wellness.book")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {selectedService && (
        <WellnessBookingDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          wellnessService={selectedService}
        />
      )}

      <Footer />
    </div>
  );
};

export default WellnessBeauty;
