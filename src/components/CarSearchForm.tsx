import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { AlertCircle, ArrowRightLeft, MapPin, Calendar, Clock, User } from "lucide-react";
import { 
  UnifiedForm, 
  UnifiedAutocomplete,
  UnifiedDatePicker,
  UnifiedSubmitButton,
  FormProgressBar
} from "@/components/forms";
import { useTranslation } from "react-i18next";
import { carRentalSchema, type CarRentalInput } from "@/lib/validationSchemas";
import { safeValidate } from "@/lib/formHelpers";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

/**
 * CarSearchForm - Recherche de voitures avec validation Zod
 * Design premium type Trip.com/Kiwi avec options avancées
 */
export const CarSearchForm = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Location states
  const [pickupLocation, setPickupLocation] = useState("");
  const [dropoffLocation, setDropoffLocation] = useState("");
  const [differentDropoff, setDifferentDropoff] = useState(false);
  
  // Date/Time states
  const [pickupDate, setPickupDate] = useState<Date>();
  const [returnDate, setReturnDate] = useState<Date>();
  const [pickupTime, setPickupTime] = useState("10:00");
  const [returnTime, setReturnTime] = useState("10:00");
  
  // Driver age
  const [driverAge, setDriverAge] = useState("30");

  // Validation states
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Time options
  const timeOptions = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hour = h.toString().padStart(2, '0');
      const min = m.toString().padStart(2, '0');
      timeOptions.push(`${hour}:${min}`);
    }
  }

  // Age options
  const ageOptions = [];
  for (let age = 18; age <= 75; age++) {
    ageOptions.push(age.toString());
  }

  // Swap locations
  const handleSwapLocations = () => {
    const temp = pickupLocation;
    setPickupLocation(dropoffLocation);
    setDropoffLocation(temp);
  };

  // Real-time validation
  useEffect(() => {
    if (Object.keys(touched).length === 0) return;

    const formData: Partial<CarRentalInput> = {
      pickupLocation: pickupLocation || "",
      dropoffLocation: differentDropoff ? (dropoffLocation || "") : (pickupLocation || ""),
      pickupDate: pickupDate ? format(pickupDate, "yyyy-MM-dd") : "",
      pickupTime,
      dropoffDate: returnDate ? format(returnDate, "yyyy-MM-dd") : "",
      dropoffTime: returnTime,
      driverAge: parseInt(driverAge) || 25,
    };

    const validation = safeValidate(carRentalSchema, formData as CarRentalInput);
    
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
  }, [pickupLocation, dropoffLocation, differentDropoff, pickupDate, returnDate, pickupTime, returnTime, driverAge, touched]);

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    setTouched({
      pickupLocation: true,
      dropoffLocation: true,
      pickupDate: true,
      pickupTime: true,
      dropoffDate: true,
      dropoffTime: true,
    });

    const formData: CarRentalInput = {
      pickupLocation: pickupLocation || "",
      dropoffLocation: differentDropoff ? (dropoffLocation || pickupLocation || "") : (pickupLocation || ""),
      pickupDate: pickupDate ? format(pickupDate, "yyyy-MM-dd") : "",
      pickupTime,
      dropoffDate: returnDate ? format(returnDate, "yyyy-MM-dd") : "",
      dropoffTime: returnTime,
      driverAge: parseInt(driverAge) || 25,
    };

    const validation = safeValidate(carRentalSchema, formData);

    if (!validation.success) {
      setErrors(validation.errors);
      toast({
        title: t('validation.errorTitle'),
        description: t('validation.errorDescription'),
        variant: "destructive",
      });
      
      const firstErrorField = Object.keys(validation.errors)[0];
      document.getElementById(firstErrorField)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const params = new URLSearchParams({
      location: validation.data.pickupLocation,
      dropoffLocation: validation.data.dropoffLocation,
      pickupDate: `${validation.data.pickupDate}T${validation.data.pickupTime}`,
      returnDate: `${validation.data.dropoffDate}T${validation.data.dropoffTime}`,
      driverAge: validation.data.driverAge.toString(),
    });

    navigate(`/cars?${params.toString()}`);
  };

  const hasErrors = Object.keys(errors).length > 0;

  // Calculate form progress
  const totalFields = differentDropoff ? 4 : 3;
  const completedFields = [
    pickupLocation,
    differentDropoff ? dropoffLocation : true,
    pickupDate,
    returnDate,
  ].filter(Boolean).length;

  return (
    <UnifiedForm onSubmit={handleSearch} variant="search" className="max-w-6xl mx-auto">
      {/* Progress bar */}
      <FormProgressBar 
        totalFields={totalFields} 
        completedFields={Math.min(completedFields, totalFields)}
        className="mb-3 md:mb-4"
      />

      {/* Error alert */}
      {hasErrors && (
        <Alert variant="destructive" className="mb-3 md:mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Veuillez corriger les erreurs dans le formulaire
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        {/* Different dropoff toggle */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-muted-foreground" />
            <Label htmlFor="different-dropoff" className="text-sm font-medium cursor-pointer">
              Restituer à un autre endroit
            </Label>
          </div>
          <Switch
            id="different-dropoff"
            checked={differentDropoff}
            onCheckedChange={setDifferentDropoff}
          />
        </div>

        {/* Locations Row */}
        <div className="grid grid-cols-1 gap-3">
          {/* Pickup & Dropoff locations */}
          <div className={`grid gap-3 ${differentDropoff ? 'grid-cols-1 md:grid-cols-[1fr_auto_1fr]' : 'grid-cols-1'}`}>
            {/* Pickup Location */}
            <div className="space-y-1">
              <UnifiedAutocomplete
                label={t('cars.pickupLocation')}
                type="location"
                value={pickupLocation}
                onChange={(value) => {
                  setPickupLocation(value);
                  handleBlur("pickupLocation");
                }}
                placeholder={t('cars.cityOrAirport')}
                required
                className={errors.pickupLocation && touched.pickupLocation ? "border-destructive" : ""}
              />
              {errors.pickupLocation && touched.pickupLocation && (
                <p className="text-xs text-destructive animate-in slide-in-from-top-1">
                  {errors.pickupLocation}
                </p>
              )}
            </div>

            {/* Swap button */}
            {differentDropoff && (
              <div className="hidden md:flex items-end pb-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleSwapLocations}
                  className="rounded-full h-10 w-10 hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Dropoff Location */}
            <AnimatePresence>
              {differentDropoff && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-1"
                >
                  <UnifiedAutocomplete
                    label={t('cars.dropoffLocation')}
                    type="location"
                    value={dropoffLocation}
                    onChange={(value) => {
                      setDropoffLocation(value);
                      handleBlur("dropoffLocation");
                    }}
                    placeholder={t('cars.cityOrAirport')}
                    required
                    className={errors.dropoffLocation && touched.dropoffLocation ? "border-destructive" : ""}
                  />
                  {errors.dropoffLocation && touched.dropoffLocation && (
                    <p className="text-xs text-destructive animate-in slide-in-from-top-1">
                      {errors.dropoffLocation}
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Dates & Times Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Pickup Date & Time */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <UnifiedDatePicker
                label={t('cars.pickupDate')}
                value={pickupDate}
                onChange={(date) => {
                  setPickupDate(date);
                  handleBlur("pickupDate");
                }}
                minDate={new Date()}
                required
              />
              {errors.pickupDate && touched.pickupDate && (
                <p className="text-xs text-destructive animate-in slide-in-from-top-1">
                  {errors.pickupDate}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-sm font-medium flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4" />
                {t('search.time')}
              </Label>
              <Select value={pickupTime} onValueChange={setPickupTime}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {timeOptions.map((time) => (
                    <SelectItem key={`pickup-${time}`} value={time}>{time}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Return Date & Time */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <UnifiedDatePicker
                label={t('cars.dropoffDate')}
                value={returnDate}
                onChange={(date) => {
                  setReturnDate(date);
                  handleBlur("dropoffDate");
                }}
                minDate={pickupDate || new Date()}
                required
              />
              {errors.dropoffDate && touched.dropoffDate && (
                <p className="text-xs text-destructive animate-in slide-in-from-top-1">
                  {errors.dropoffDate}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-sm font-medium flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4" />
                {t('search.time')}
              </Label>
              <Select value={returnTime} onValueChange={setReturnTime}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {timeOptions.map((time) => (
                    <SelectItem key={`return-${time}`} value={time}>{time}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Driver Age Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div className="space-y-1">
            <Label className="text-sm font-medium flex items-center gap-2 mb-2">
              <User className="w-4 h-4" />
              Âge du conducteur
            </Label>
            <Select value={driverAge} onValueChange={setDriverAge}>
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-[200px]">
                {ageOptions.map((age) => (
                  <SelectItem key={age} value={age}>
                    {age} ans
                    {parseInt(age) < 21 && " (jeune conducteur)"}
                    {parseInt(age) >= 65 && " (senior)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {parseInt(driverAge) < 21 && (
              <p className="text-xs text-amber-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Frais jeune conducteur possibles
              </p>
            )}
            {parseInt(driverAge) >= 70 && (
              <p className="text-xs text-amber-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Restrictions d'âge possibles
              </p>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <UnifiedSubmitButton 
            fullWidth
            disabled={hasErrors}
            className={hasErrors ? "opacity-50 cursor-not-allowed" : ""}
          >
            {t("search.search")}
          </UnifiedSubmitButton>
        </div>
      </div>
    </UnifiedForm>
  );
};
