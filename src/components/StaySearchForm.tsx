import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { AlertCircle, Building2, Users } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "react-i18next";
import { staySearchSchema, type StaySearchInput } from "@/lib/validationSchemas";
import { safeValidate } from "@/lib/formHelpers";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { 
  UnifiedForm, 
  UnifiedAutocomplete, 
  UnifiedDatePicker, 
  UnifiedSubmitButton,
  FormProgressBar
} from "@/components/forms";

export const StaySearchForm = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [destination, setDestination] = useState("");
  const [checkIn, setCheckIn] = useState<Date>();
  const [checkOut, setCheckOut] = useState<Date>();
  const [propertyType, setPropertyType] = useState<"all" | "apartment" | "house" | "villa" | "guesthouse">("all");
  const [guests, setGuests] = useState(2);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (Object.keys(touched).length === 0) return;

    const formData: StaySearchInput = {
      destination: destination || "",
      checkIn: checkIn ? format(checkIn, "yyyy-MM-dd") : "",
      checkOut: checkOut ? format(checkOut, "yyyy-MM-dd") : "",
      guests,
      propertyType,
    };

    const validation = safeValidate(staySearchSchema, formData);
    
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
  }, [destination, checkIn, checkOut, guests, propertyType, touched]);

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({
      destination: true,
      checkIn: true,
      checkOut: true,
      guests: true,
      propertyType: true,
    });

    const formData: StaySearchInput = {
      destination: destination || "",
      checkIn: checkIn ? format(checkIn, "yyyy-MM-dd") : "",
      checkOut: checkOut ? format(checkOut, "yyyy-MM-dd") : "",
      guests,
      propertyType,
    };

    const validation = safeValidate(staySearchSchema, formData);

    if (!validation.success) {
      setErrors(validation.errors);
      toast({
        title: "Erreur de validation",
        description: "Veuillez corriger les erreurs dans le formulaire",
        variant: "destructive",
      });
      return;
    }

    const params = new URLSearchParams({
      destination: validation.data.destination,
      checkIn: validation.data.checkIn,
      checkOut: validation.data.checkOut,
      guests: validation.data.guests.toString(),
      ...(validation.data.propertyType !== "all" && { type: validation.data.propertyType }),
    });

    navigate(`/stays?${params.toString()}`);
  };

  const hasErrors = Object.keys(errors).length > 0;
  const totalFields = 4;
  const completedFields = [
    destination,
    checkIn,
    checkOut,
    guests > 0
  ].filter(Boolean).length;

  return (
    <UnifiedForm onSubmit={handleSearch} variant="search" className="w-full max-w-6xl mx-auto space-y-6">
      <FormProgressBar 
        totalFields={totalFields} 
        completedFields={completedFields}
        className="mb-2"
      />

      <AnimatePresence>
        {hasErrors && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Alert variant="destructive" className="py-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs font-medium">
                Veuillez corriger les erreurs dans le formulaire
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        <div className="md:col-span-12 lg:col-span-4 min-w-0">
          <UnifiedAutocomplete
            label={t("search.destination")}
            type="location"
            value={destination}
            onChange={(value) => {
              setDestination(value);
              handleBlur("destination");
            }}
            placeholder={t("search.location")}
            required
            className={cn("w-full", errors.destination && touched.destination ? "border-destructive" : "")}
          />
          {errors.destination && touched.destination && (
            <p className="text-[10px] text-destructive mt-1 font-bold uppercase tracking-wider animate-in fade-in slide-in-from-left-1">
              {errors.destination}
            </p>
          )}
        </div>

        <div className="md:col-span-6 lg:col-span-2 min-w-0">
          <UnifiedDatePicker
            label={t("search.checkIn")}
            value={checkIn}
            onChange={(date) => {
              setCheckIn(date);
              handleBlur("checkIn");
            }}
            minDate={new Date()}
            className="w-full"
          />
          {errors.checkIn && touched.checkIn && (
            <p className="text-[10px] text-destructive mt-1 font-bold uppercase tracking-wider">
              {errors.checkIn}
            </p>
          )}
        </div>

        <div className="md:col-span-6 lg:col-span-2 min-w-0">
          <UnifiedDatePicker
            label={t("search.checkOut")}
            value={checkOut}
            onChange={(date) => {
              setCheckOut(date);
              handleBlur("checkOut");
            }}
            minDate={checkIn || new Date()}
            className="w-full"
          />
          {errors.checkOut && touched.checkOut && (
            <p className="text-[10px] text-destructive mt-1 font-bold uppercase tracking-wider">
              {errors.checkOut}
            </p>
          )}
        </div>

        <div className="md:col-span-6 lg:col-span-2 min-w-0">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              {t("search.type")}
            </label>
            <Select 
              value={propertyType} 
              onValueChange={(value) => {
                setPropertyType(value as typeof propertyType);
                handleBlur("propertyType");
              }}
            >
              <SelectTrigger className={cn("h-12 bg-white/50 backdrop-blur-sm border-2 font-medium truncate", errors.propertyType && touched.propertyType && "border-destructive")}>
                <SelectValue placeholder={t("search.allCategories")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("search.allCategories")}</SelectItem>
                <SelectItem value="apartment">Appartement</SelectItem>
                <SelectItem value="house">Maison</SelectItem>
                <SelectItem value="villa">Villa</SelectItem>
                <SelectItem value="guesthouse">Maison d'hôtes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="md:col-span-3 lg:col-span-1 min-w-0 text-left">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              {t("search.guests")}
            </label>
            <Select 
              value={guests.toString()} 
              onValueChange={(value) => {
                setGuests(parseInt(value));
                handleBlur("guests");
              }}
            >
              <SelectTrigger className={cn("h-12 bg-white/50 backdrop-blur-sm border-2 font-medium", errors.guests && touched.guests && "border-destructive")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6, 8, 10, 12, 16].map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} pers.
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="md:col-span-3 lg:col-span-1 min-w-0">
          <UnifiedSubmitButton 
            fullWidth
            disabled={hasErrors}
            className={cn("h-12 shadow-xl shadow-primary/20 font-black", hasErrors && "opacity-50 cursor-not-allowed")}
          >
            {t("search.search")}
          </UnifiedSubmitButton>
        </div>
      </div>
    </UnifiedForm>
  );
};
