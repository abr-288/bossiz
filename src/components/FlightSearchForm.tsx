import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ArrowRightLeft, AlertCircle, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { 
  UnifiedForm, 
  UnifiedAutocomplete,
  UnifiedDatePicker,
  UnifiedSubmitButton,
  FormProgressBar
} from "@/components/forms";
import { useTranslation } from "react-i18next";
import { flightSearchSchema, type FlightSearchInput } from "@/lib/validationSchemas";
import { safeValidate } from "@/lib/formHelpers";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PriceCalendar } from "@/components/flights/PriceCalendar";

/**
 * FlightSearchForm - Recherche de vols avec UnifiedForm
 * Design premium type Opodo/Booking avec identité Bossiz
 * Optimisé pour mobile
 */
export const FlightSearchForm = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [tripType, setTripType] = useState<"round-trip" | "one-way">("round-trip");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [departureDate, setDepartureDate] = useState<Date>();
  const [returnDate, setReturnDate] = useState<Date>();

  // Validation pour que la date de départ soit au minimum demain
  const getMinDepartureDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  };

  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [travelClass, setTravelClass] = useState<"economy" | "premium_economy" | "business" | "first">("economy");
  const [showPriceCalendar, setShowPriceCalendar] = useState(false);
  
  // État des erreurs de validation
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Validation en temps réel
  useEffect(() => {
    if (Object.keys(touched).length === 0) return;

    const formData: FlightSearchInput = {
      origin: from || "",
      destination: to || "",
      departureDate: departureDate ? format(departureDate, "yyyy-MM-dd") : "",
      returnDate: returnDate ? format(returnDate, "yyyy-MM-dd") : undefined,
      adults,
      children,
      infants,
      travelClass,
      tripType,
    };

    const validation = safeValidate(flightSearchSchema, formData);
    
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
  }, [from, to, departureDate, returnDate, adults, children, infants, travelClass, tripType, touched]);

  const handleSwap = () => {
    const temp = from;
    setFrom(to);
    setTo(temp);
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    setTouched({
      origin: true,
      destination: true,
      departureDate: true,
      returnDate: tripType === "round-trip",
      adults: true,
      children: true,
      infants: true,
      travelClass: true,
      tripType: true,
    });

    const formData: FlightSearchInput = {
      origin: from,
      destination: to,
      departureDate: departureDate ? format(departureDate, "yyyy-MM-dd") : "",
      returnDate: returnDate ? format(returnDate, "yyyy-MM-dd") : undefined,
      adults,
      children,
      infants,
      travelClass,
      tripType,
    };

    const validation = safeValidate(flightSearchSchema, formData);

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

    // Afficher un indicateur de chargement
    toast({
      title: "Recherche en cours",
      description: "Nous recherchons les meilleurs vols pour vous...",
    });

    // Construire les paramètres de recherche
    const params = new URLSearchParams({
      from: validation.data.origin,
      to: validation.data.destination,
      date: validation.data.departureDate,
      ...(validation.data.returnDate && { returnDate: validation.data.returnDate }),
      adults: validation.data.adults.toString(),
      children: validation.data.children.toString(),
      infants: validation.data.infants.toString(),
      class: validation.data.travelClass,
      tripType: validation.data.tripType,
    });

    // Rediriger vers la page des résultats avec animation
    setTimeout(() => {
      navigate(`/flights?${params.toString()}`);
    }, 300);
  };

  const hasErrors = Object.keys(errors).length > 0;

  const totalFields = tripType === "round-trip" ? 7 : 6;
  const completedFields = [
    from,
    to,
    departureDate,
    tripType === "round-trip" ? returnDate : true,
    adults > 0,
    travelClass,
  ].filter(Boolean).length;

  return (
    <UnifiedForm onSubmit={handleSearch} variant="search" className="max-w-5xl mx-auto space-y-4">
      {/* Barre de progression */}
      <FormProgressBar 
        totalFields={totalFields} 
        completedFields={completedFields}
        className="mb-2"
      />

      {/* Alert d'erreur générale */}
      {hasErrors && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-3.5 w-3.5" />
          <AlertDescription className="text-xs">
            Veuillez corriger les erreurs dans le formulaire
          </AlertDescription>
        </Alert>
      )}

      {/* Trip Type Selector */}
      <div className="flex gap-2">
        {[
          { value: "round-trip", label: t("search.roundTrip") },
          { value: "one-way", label: t("search.oneWay") }
        ].map(({ value, label }) => (
          <motion.button
            key={value}
            type="button"
            onClick={() => {
              setTripType(value as "round-trip" | "one-way");
              handleBlur("tripType");
            }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm border",
              tripType === value
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-background text-foreground border-border hover:border-primary/50"
            )}
          >
            {label}
          </motion.button>
        ))}
      </div>

      {/* Ligne 1: Origine - Destination */}
      <div className="grid grid-cols-1 sm:grid-cols-11 gap-3 items-start">
        <div className="sm:col-span-5">
          <UnifiedAutocomplete
            label={t("search.departure")}
            type="airport"
            value={from}
            onChange={(value) => {
              setFrom(value);
              handleBlur("origin");
            }}
            placeholder={t("search.cityOrAirport")}
            required
            className={cn("h-11", errors.origin && touched.origin ? "border-destructive" : "")}
          />
          {errors.origin && touched.origin && (
            <p className="text-xs text-destructive mt-1">{errors.origin}</p>
          )}
        </div>

        <div className="sm:col-span-1 flex justify-center items-center pt-6">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleSwap}
            className="h-10 w-10 rounded-full border-2 hover:border-primary hover:bg-primary/5 transition-all"
          >
            <ArrowRightLeft className="h-4 w-4" />
          </Button>
        </div>

        <div className="sm:col-span-5">
          <UnifiedAutocomplete
            label={t("search.to")}
            type="airport"
            value={to}
            onChange={(value) => {
              setTo(value);
              handleBlur("destination");
            }}
            placeholder={t("search.cityOrAirport")}
            required
            className={cn("h-11", errors.destination && touched.destination ? "border-destructive" : "")}
          />
          {errors.destination && touched.destination && (
            <p className="text-xs text-destructive mt-1">{errors.destination}</p>
          )}
        </div>
      </div>

      {/* Ligne 2: Dates */}
      <div className={cn(
        "grid gap-3",
        tripType === "round-trip" ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"
      )}>
        <div>
          <UnifiedDatePicker
            label={t("search.departureDate")}
            placeholder={t("flights.departureDate")}
            value={departureDate}
            onChange={(date) => {
              setDepartureDate(date);
              handleBlur("departureDate");
            }}
            minDate={getMinDepartureDate()}
            required
          />
          {errors.departureDate && touched.departureDate && (
            <p className="text-xs text-destructive mt-1">{errors.departureDate}</p>
          )}
        </div>

        {tripType === "round-trip" && (
          <div>
            <UnifiedDatePicker
              label={t("search.returnDate")}
              placeholder={t("flights.returnDate")}
              value={returnDate}
              onChange={(date) => {
                setReturnDate(date);
                handleBlur("returnDate");
              }}
              minDate={departureDate || new Date()}
              required
            />
            {errors.returnDate && touched.returnDate && (
              <p className="text-xs text-destructive mt-1">{errors.returnDate}</p>
            )}
          </div>
        )}
      </div>

      {/* Ligne 3: Passagers et Classe */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">
            {t("search.adults")}
          </label>
          <Select 
            value={adults.toString()} 
            onValueChange={(value) => {
              setAdults(parseInt(value));
              handleBlur("adults");
            }}
          >
            <SelectTrigger className={cn("h-11 bg-background", errors.adults && touched.adults && "border-destructive")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">{t("search.children")}</label>
          <Select 
            value={children.toString()} 
            onValueChange={(value) => {
              setChildren(parseInt(value));
              handleBlur("children");
            }}
          >
            <SelectTrigger className={cn("h-11 bg-background", errors.children && touched.children && "border-destructive")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">{t("search.infants", "Bébés")}</label>
          <Select 
            value={infants.toString()} 
            onValueChange={(value) => {
              setInfants(parseInt(value));
              handleBlur("infants");
            }}
          >
            <SelectTrigger className={cn("h-11 bg-background", errors.infants && touched.infants && "border-destructive")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              {[0, 1, 2, 3, 4].map((num) => (
                <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">{t("search.class.title")}</label>
          <Select 
            value={travelClass} 
            onValueChange={(value) => {
              setTravelClass(value as typeof travelClass);
              handleBlur("travelClass");
            }}
          >
            <SelectTrigger className={cn("h-11 bg-background", errors.travelClass && touched.travelClass && "border-destructive")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="economy">{t("search.class.economy")}</SelectItem>
              <SelectItem value="premium_economy">{t("search.class.premium")}</SelectItem>
              <SelectItem value="business">{t("search.class.business")}</SelectItem>
              <SelectItem value="first">{t("search.class.first")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Comparateur de prix */}
      {departureDate && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowPriceCalendar(!showPriceCalendar)}
          className="w-full sm:w-auto h-10"
        >
          <TrendingDown className="h-4 w-4 mr-2" />
          {showPriceCalendar ? "Masquer" : "Comparer"} les prix
        </Button>
      )}

      {/* Calendrier de comparaison des prix */}
      {showPriceCalendar && departureDate && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden"
        >
          <PriceCalendar
            departureDate={format(departureDate, "yyyy-MM-dd")}
            onDateSelect={(dateStr) => {
              setDepartureDate(new Date(dateStr));
              handleBlur("departureDate");
            }}
            lowestPrice={250}
            viewMode="week"
          />
        </motion.div>
      )}

      {/* Submit Button */}
      <UnifiedSubmitButton 
        variant="search"
        disabled={hasErrors}
        className={cn("w-full h-12 text-base font-semibold", hasErrors && "opacity-50 cursor-not-allowed")}
      >
        {t("search.search")}
      </UnifiedSubmitButton>
    </UnifiedForm>
  );
};