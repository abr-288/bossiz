import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Star, Tag, Loader2, Activity } from "lucide-react";
import { useState, useEffect } from "react";
import { BookingDialog } from "@/components/BookingDialog";
import { ActivitySearchForm } from "@/components/ActivitySearchForm";
import { Price } from "@/components/ui/price";
import { useActivitySearch } from "@/hooks/useActivitySearch";
import { LazyImage } from "@/components/ui/lazy-image";
import bannerActivities from "@/assets/banner-activities.jpg";
import { useTranslation } from "react-i18next";

const Activities = () => {
  const { t } = useTranslation();
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { activities, loading, searchActivities } = useActivitySearch();

  useEffect(() => {
    searchActivities();
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col pt-16">
      <Navbar />
      
      {/* Hero Banner */}
      <div className="relative min-h-[50vh] md:min-h-[60vh] flex items-center justify-center overflow-hidden">
        <LazyImage 
          src={bannerActivities}
          alt={t('activities.title')} 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/70 via-primary/50 to-background"></div>
        <div className="absolute inset-0" style={{ background: "radial-gradient(120% 90% at 15% 0%, hsl(var(--gold) / 0.22), transparent 55%)" }}></div>
        <div className="relative z-10 container mx-auto px-4 py-12">
          <div className="text-center mb-8 animate-fade-in">

            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">{t('activities.title')}</h1>
            <p className="text-lg md:text-xl text-white/95 drop-shadow-md max-w-2xl mx-auto">{t('activities.subtitle')}</p>
          </div>
          <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <ActivitySearchForm />
          </div>
        </div>
      </div>
      
      <main className="flex-1 container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-muted-foreground">{t('activities.noActivities')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activities.map((activity) => (
            <Card key={activity.id} className="overflow-hidden hover:shadow-lg transition-all group">
              <div className="relative h-48 overflow-hidden">
                <LazyImage 
                  src={activity.image_url || 'https://images.unsplash.com/photo-1583338505874-0cd6e2b57407'} 
                  alt={activity.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute top-4 left-4 bg-primary/90 text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  {activity.category}
                </div>
                <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-semibold">{activity.rating}</span>
                </div>
              </div>
              
              <CardContent className="p-6">
                <div className="mb-4">
                  <h3 className="text-xl font-bold mb-2 line-clamp-2">{activity.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <MapPin className="w-4 h-4" />
                    {activity.location}
                  </div>
                  {activity.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {activity.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-primary" />
                      {activity.duration}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div>
                    <p className="text-xs text-muted-foreground">{t('activities.startingFrom')}</p>
                    <Price 
                      amount={activity.price_per_unit} 
                      fromCurrency={activity.currency}
                      className="text-2xl font-bold text-primary"
                      showLoader={true}
                    />
                  </div>
                  <Button 
                    className="gradient-primary shadow-primary"
                    onClick={() => {
                      setSelectedActivity({
                        id: activity.id,
                        name: activity.name,
                        price_per_unit: activity.price_per_unit,
                        currency: activity.currency,
                        type: "activity",
                        location: activity.location
                      });
                      setDialogOpen(true);
                    }}
                  >
                    {t('activities.book')}
                  </Button>
                </div>
              </CardContent>
            </Card>
            ))}
          </div>
        )}
      </main>

      {selectedActivity && (
        <BookingDialog 
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          service={selectedActivity}
        />
      )}

      <Footer />
    </div>
  );
};

export default Activities;
