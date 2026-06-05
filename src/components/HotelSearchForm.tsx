import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { AlertCircle, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";
import { 
  UnifiedForm, 
  UnifiedAutocomplete,
  UnifiedDatePicker,
  UnifiedPassengerSelector,
  UnifiedSubmitButton,
  FormProgressBar
} from "@/components/forms";
import { useTranslation } from "react-i18next";
import { hotelSearchSchema, type HotelSearchInput } from "@/lib/validationSchemas";
import { safeValidate } from "@/lib/formHelpers";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { HotelPriceCalendar } from "@/components/hotels/HotelPriceCalendar";

/**
 * HotelSearchForm - Recherche d'hôtels avec validation Zod
 * Design premium type Booking/Hotels.com avec identité Bossiz
 */
export const HotelSearchForm = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [destination, setDestination] = useState("");
  const [checkIn, setCheckIn] = useState<Date>();
  const [checkOut, setCheckOut] = useState<Date>();
  const [passengers, setPassengers] = useState({
    adults: 2,
    children: 0,
    rooms: 1,
    infants: 0
  });
  const [showPriceCalendar, setShowPriceCalendar] = useState(false);

  // Validation pour que la date de départ soit au minimum le lendemain de la date d'arrivée
  const getMinCheckOutDate = () => {
    if (checkIn) {
      const nextDay = new Date(checkIn);
      nextDay.setDate(nextDay.getDate() + 1);
      return nextDay;
    }
    return new Date();
  };

  // État des erreurs de validation
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Validation en temps réel
  useEffect(() => {
    if (Object.keys(touched).length === 0) return;

    const formData: HotelSearchInput = {
      destination: destination || "",
      checkIn: checkIn ? format(checkIn, "yyyy-MM-dd") : "",
      checkOut: checkOut ? format(checkOut, "yyyy-MM-dd") : "",
      adults: passengers.adults,
      children: passengers.children,
      rooms: passengers.rooms,
    };

    const validation = safeValidate(hotelSearchSchema, formData);
    
    if (!validation.success) {
      const filteredErrors: Record<string, string> = {};
      Object.keys(validation.errors).forEach(key => {
        if (touched[key]) {
          filteredErrors[key] = validation.errors[key];
        }
      });
      setErrors(filteredErrors);
    } else {
      const clearedErrors = { ...errors };
      Object.keys(touched).forEach(key => {
        delete clearedErrors[key];
      });
      setErrors(clearedErrors);
    }
  }, [destination, checkIn, checkOut, passengers, touched]);

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Marquer tous les champs comme touchés
    setTouched({
      destination: true,
      checkIn: true,
      checkOut: true,
      adults: true,
      children: true,
      rooms: true,
    });

    // Validation complète avant soumission
    const formData: HotelSearchInput = {
      destination: destination || "",
      checkIn: checkIn ? format(checkIn, "yyyy-MM-dd") : "",
      checkOut: checkOut ? format(checkOut, "yyyy-MM-dd") : "",
      adults: passengers.adults,
      children: passengers.children,
      rooms: passengers.rooms,
    };

    const validation = safeValidate(hotelSearchSchema, formData);

    if (!validation.success) {
      setErrors(validation.errors);
      toast({
        title: "Erreur de validation",
        description: "Veuillez corriger les erreurs dans le formulaire",
        variant: "destructive",
      });
      
      const firstErrorField = Object.keys(validation.errors)[0];
      document.getElementById(firstErrorField)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const params = new URLSearchParams({
      destination: validation.data.destination,
      checkIn: validation.data.checkIn,
      checkOut: validation.data.checkOut,
      adults: validation.data.adults.toString(),
      children: validation.data.children.toString(),
      rooms: validation.data.rooms.toString(),
    });

    navigate(`/hotels?${params.toString()}`);
  };

  const hasErrors = Object.keys(errors).length > 0;

  // Calcul de la progression du formulaire
  const totalFields = 5;
  const completedFields = [
    destination,
    checkIn,
    checkOut,
    passengers.adults > 0,
    passengers.rooms > 0,
  ].filter(Boolean).length;

  return (
    <UnifiedForm onSubmit={handleSearch} variant="search" className="max-w-6xl mx-auto">
      {/* Barre de progression */}
      <FormProgressBar 
        totalFields={totalFields} 
        completedFields={completedFields}
        className="mb-4 md:mb-6"
      />

      {/* Alert d'erreur générale */}
      {hasErrors && (
        <Alert variant="destructive" className="mb-3 md:mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Veuillez corriger les erreurs dans le formulaire
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 md:gap-4">
        {/* Destination */}
        <div className="sm:col-span-2 lg:col-span-4 min-w-0">
          <div className="space-y-1">
            <UnifiedAutocomplete
              label={t("search.destination")}
              type="hotel"
              value={destination}
              onChange={(value) => {
                setDestination(value);
                handleBlur("destination");
              }}
              placeholder={t("search.cityRegionCountry")}
              required
              className={errors.destination && touched.destination ? "border-destructive" : ""}
              helpText="Saisissez la ville, région ou pays de destination"
            />
            {errors.destination && touched.destination && (
              <p className="text-xs text-destructive mt-1 animate-in slide-in-from-top-1">
                {errors.destination}
              </p>
            )}
          </div>
        </div>

        {/* Check-in */}
        <div className="min-w-0 lg:col-span-2">
          <div className="space-y-1">
            <UnifiedDatePicker
              label={t("search.checkIn")}
              value={checkIn}
              onChange={(date) => {
                setCheckIn(date);
                handleBlur("checkIn");
              }}
              minDate={new Date()}
              placeholder="Choisir date"
              required
            />
            {errors.checkIn && touched.checkIn && (
              <p className="text-xs text-destructive mt-1 animate-in slide-in-from-top-1">
                {errors.checkIn}
              </p>
            )}
          </div>
        </div>

        {/* Check-out */}
        <div className="min-w-0 lg:col-span-2">
          <div className="space-y-1">
            <UnifiedDatePicker
              label={t("search.checkOut")}
              value={checkOut}
              onChange={(date) => {
                setCheckOut(date);
                handleBlur("checkOut");
              }}
              minDate={getMinCheckOutDate()}
              placeholder="Choisir date"
              required
            />
            {errors.checkOut && touched.checkOut && (
              <p className="text-xs text-destructive mt-1 animate-in slide-in-from-top-1">
                {errors.checkOut}
              </p>
            )}
          </div>
        </div>

        {/* Guests & Rooms */}
        <div className="sm:col-span-2 lg:col-span-4 min-w-0">
          <div className="space-y-1">
            <UnifiedPassengerSelector
              label={t("search.guests")}
              value={passengers}
              onChange={(value) => {
                setPassengers({ 
                  adults: value.adults,
                  children: value.children,
                  rooms: value.rooms || 1,
                  infants: value.infants || 0
                });
                handleBlur("adults");
                handleBlur("rooms");
              }}
              showRooms
              required
            />
            {((errors.adults && touched.adults) || (errors.children && touched.children) || (errors.rooms && touched.rooms)) && (
              <p className="text-xs text-destructive mt-1 animate-in slide-in-from-top-1">
                {errors.adults || errors.children || errors.rooms}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Comparateur de prix - Affichage conditionnel */}
      {checkIn && (
        <div className="mt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowPriceCalendar(!showPriceCalendar)}
            className="w-full md:w-auto"
          >
            <TrendingDown className="h-4 w-4 mr-2" />
            {showPriceCalendar ? "Masquer" : "Comparer"} les prix par date
          </Button>
        </div>
      )}

      {/* Calendrier de comparaison des prix pour hôtels */}
      {showPriceCalendar && checkIn && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-4 overflow-hidden"
        >
          <HotelPriceCalendar
            checkInDate={format(checkIn, "yyyy-MM-dd")}
            onDateSelect={(dateStr) => {
              setCheckIn(new Date(dateStr));
              handleBlur("checkIn");
            }}
            basePrice={120}
            viewMode="week"
            currency="EUR"
          />
        </motion.div>
      )}

      {/* Submit Button */}
      <div className="mt-4 md:mt-6">
        <UnifiedSubmitButton 
          variant="search"
          disabled={hasErrors}
          className={hasErrors ? "opacity-50 cursor-not-allowed" : ""}
        >
          {t("search.search")}
        </UnifiedSubmitButton>
      </div>
    </UnifiedForm>
  );
};
