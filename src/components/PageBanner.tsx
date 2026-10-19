import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Hotel, Car, Plane, Train, Calendar, Map } from "lucide-react";
import { FlightSearchForm } from "./FlightSearchForm";
import { HotelSearchForm } from "./HotelSearchForm";
import { FlightHotelSearchForm } from "./FlightHotelSearchForm";
import { CarSearchForm } from "./CarSearchForm";
import { TrainSearchForm } from "./TrainSearchForm";
import { EventSearchForm } from "./EventSearchForm";
import { TourSearchForm } from "./TourSearchForm";
import { StaySearchForm } from "./StaySearchForm";
import { useTranslation } from "react-i18next";

interface PageBannerProps {
  title: string;
  subtitle?: string;
  defaultTab?: string;
  backgroundImage?: string;
  showAllTabs?: boolean;
}

/**
 * PageBanner - Bannière avec formulaires pour les pages internes
 * Design premium unifié avec système UnifiedForm
 */
export const PageBanner = ({ 
  title, 
  subtitle, 
  defaultTab = "flight",
  backgroundImage,
  showAllTabs = true 
}: PageBannerProps) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <section className="relative bg-gradient-to-br from-primary via-primary-light to-secondary pt-16 pb-8 sm:py-16 md:py-20">
      {/* Background avec overlay */}
      {backgroundImage && (
        <>
          <div className="absolute inset-0 z-0">
            <img
              src={backgroundImage}
              alt={title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary-light/85 to-secondary/90 z-[1]" />
        </>
      )}

      <div className="container relative z-10 mx-auto px-4">
        {/* Titre */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold text-white mb-2 sm:mb-3 animate-fade-in">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm sm:text-lg md:text-xl text-white/95 animate-fade-in">
              {subtitle}
            </p>
          )}
        </div>

        {/* Formulaires de recherche */}
        <div className="max-w-6xl mx-auto bg-background rounded-xl shadow-2xl overflow-hidden animate-scale-in">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full h-auto p-0 bg-background border-b flex justify-start overflow-x-auto rounded-none gap-0 scrollbar-hide">
              <TabsTrigger 
                value="flight" 
                className="gap-2 py-4 px-6 rounded-none data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-secondary flex-shrink-0"
              >
                <Plane className="w-5 h-5" />
                <span className="text-sm">{t('nav.flights')}</span>
              </TabsTrigger>
              <TabsTrigger
                value="hotel"
                className="gap-2 py-4 px-6 rounded-none data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-secondary flex-shrink-0"
              >
                <Hotel className="w-5 h-5" />
                <span className="text-sm">{t('nav.hotels')}</span>
              </TabsTrigger>
              <TabsTrigger
                value="flight-hotel"
                className="gap-2 py-4 px-6 rounded-none data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-secondary flex-shrink-0"
              >
                <Plane className="w-4 h-4" />
                <Hotel className="w-4 h-4" />
                <span className="text-sm">{t('nav.flightHotel')}</span>
              </TabsTrigger>
              <TabsTrigger
                value="car"
                className="gap-2 py-4 px-6 rounded-none data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-secondary flex-shrink-0"
              >
                <Car className="w-5 h-5" />
                <span className="text-sm">{t('nav.carRental')}</span>
              </TabsTrigger>
              {showAllTabs && (
                <>
                  <TabsTrigger
                    value="train"
                    className="gap-2 py-4 px-6 rounded-none data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-secondary flex-shrink-0"
                  >
                    <Train className="w-5 h-5" />
                    <span className="text-sm">{t('nav.trains')}</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="event"
                    className="gap-2 py-4 px-6 rounded-none data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-secondary flex-shrink-0"
                  >
                    <Calendar className="w-5 h-5" />
                    <span className="text-sm">{t('nav.events')}</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="tour"
                    className="gap-2 py-4 px-6 rounded-none data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-secondary flex-shrink-0"
                  >
                    <Map className="w-5 h-5" />
                    <span className="text-sm">{t('nav.tours')}</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="stay"
                    className="gap-2 py-4 px-6 rounded-none data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-secondary flex-shrink-0"
                  >
                    <Hotel className="w-5 h-5" />
                    <span className="text-sm">{t('nav.stays')}</span>
                  </TabsTrigger>
                </>
              )}
            </TabsList>

            {/* Formulaires avec UnifiedForm */}
            <TabsContent value="flight" className="p-3 sm:p-6">
              <FlightSearchForm />
            </TabsContent>

            <TabsContent value="hotel" className="p-3 sm:p-6">
              <HotelSearchForm />
            </TabsContent>

            <TabsContent value="flight-hotel" className="p-3 sm:p-6">
              <FlightHotelSearchForm 
                onSearch={(params) => {
                  // Navigation gérée par le formulaire
                }}
              />
            </TabsContent>

            <TabsContent value="car" className="p-3 sm:p-6">
              <CarSearchForm />
            </TabsContent>

            {showAllTabs && (
              <>
                <TabsContent value="train" className="p-3 sm:p-6">
                  <TrainSearchForm />
                </TabsContent>

                <TabsContent value="event" className="p-3 sm:p-6">
                  <EventSearchForm onResults={() => {}} />
                </TabsContent>

                <TabsContent value="tour" className="p-3 sm:p-6">
                  <TourSearchForm />
                </TabsContent>

                <TabsContent value="stay" className="p-3 sm:p-6">
                  <StaySearchForm />
                </TabsContent>
              </>
            )}
          </Tabs>
        </div>
      </div>
    </section>
  );
};
