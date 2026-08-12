import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Train, AlertCircle, ArrowRightLeft } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { UnifiedForm, UnifiedAutocomplete, UnifiedDatePicker, UnifiedFormField, UnifiedSubmitButton } from "@/components/forms";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trainSearchSchema, type TrainSearchInput } from "@/lib/validationSchemas";
import { safeValidate } from "@/lib/formHelpers";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export const TrainSearchForm = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [departureDate, setDepartureDate] = useState<Date>();
  const [returnDate, setReturnDate] = useState<Date>();
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [travelClass, setTravelClass] = useState<"economy" | "first">("economy");

  // État des erreurs de validation
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Validation en temps réel
  useEffect(() => {
    if (Object.keys(touched).length === 0) return;

    const formData: TrainSearchInput = {
      origin: origin || "",
      destination: destination || "",
      departureDate: departureDate ? format(departureDate, "yyyy-MM-dd") : "",
      returnDate: returnDate ? format(returnDate, "yyyy-MM-dd") : undefined,
      adults,
      children,
      travelClass,
    };

    const validation = safeValidate(trainSearchSchema, formData);
    
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
  }, [origin, destination, departureDate, returnDate, adults, children, travelClass, touched]);

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleSwap = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Marquer tous les champs comme touchés
    setTouched({
      origin: true,
      destination: true,
      departureDate: true,
      returnDate: !!returnDate,
      adults: true,
      children: true,
      travelClass: true,
    });

    // Validation complète avant soumission
    const formData: TrainSearchInput = {
      origin: origin || "",
      destination: destination || "",
      departureDate: departureDate ? format(departureDate, "yyyy-MM-dd") : "",
      returnDate: returnDate ? format(returnDate, "yyyy-MM-dd") : undefined,
      adults,
      children,
      travelClass,
    };

    const validation = safeValidate(trainSearchSchema, formData);

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

    setLoading(true);

    // Navigate to trains page with search params
    const searchParams = new URLSearchParams({
      from: validation.data.origin,
      to: validation.data.destination,
      date: validation.data.departureDate,
      adults: validation.data.adults.toString(),
      children: validation.data.children.toString(),
      class: validation.data.travelClass,
    });

    if (validation.data.returnDate) {
      searchParams.append("returnDate", validation.data.returnDate);
    }

    navigate(`/trains?${searchParams.toString()}`);
    setLoading(false);
  };

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div className="w-full">
      <UnifiedForm onSubmit={handleSearch} variant="search">
        {/* Alert d'erreur générale */}
        {hasErrors && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Veuillez corriger les erreurs dans le formulaire
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-start">
            <div className="md:col-span-5 space-y-1">
              <UnifiedAutocomplete
                label={t('search.from')}
                value={origin}
                onChange={(value) => {
                  setOrigin(value);
                  handleBlur("origin");
                }}
                placeholder="Paris"
                type="city"
                required
                className={errors.origin && touched.origin ? "border-destructive" : ""}
              />
              {errors.origin && touched.origin && (
                <p className="text-xs text-destructive mt-1 animate-in slide-in-from-top-1">
                  {errors.origin}
                </p>
              )}
            </div>

            <div className="md:col-span-1 flex justify-center items-center pt-6">
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

            <div className="md:col-span-5 space-y-1">
              <UnifiedAutocomplete
                label={t('search.to')}
                value={destination}
                onChange={(value) => {
                  setDestination(value);
                  handleBlur("destination");
                }}
                placeholder="Londres"
                type="city"
                required
                className={errors.destination && touched.destination ? "border-destructive" : ""}
              />
              {errors.destination && touched.destination && (
                <p className="text-xs text-destructive mt-1 animate-in slide-in-from-top-1">
                  {errors.destination}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <UnifiedDatePicker
                label={t('search.departure')}
                value={departureDate}
                onChange={(date) => {
                  setDepartureDate(date);
                  handleBlur("departureDate");
                }}
                required
                minDate={new Date()}
              />
              {errors.departureDate && touched.departureDate && (
                <p className="text-xs text-destructive mt-1 animate-in slide-in-from-top-1">
                  {errors.departureDate}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <UnifiedDatePicker
                label={t('search.return')}
                value={returnDate}
                onChange={(date) => {
                  setReturnDate(date);
                  handleBlur("returnDate");
                }}
                minDate={departureDate || new Date()}
              />
              {errors.returnDate && touched.returnDate && (
                <p className="text-xs text-destructive mt-1 animate-in slide-in-from-top-1">
                  {errors.returnDate}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Adultes *</label>
              <Select 
                value={adults.toString()} 
                onValueChange={(value) => {
                  setAdults(parseInt(value));
                  handleBlur("adults");
                }}
              >
                <SelectTrigger className={cn("h-11", errors.adults && touched.adults && "border-destructive")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.adults && touched.adults && (
                <p className="text-xs text-destructive animate-in slide-in-from-top-1">{errors.adults}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Enfants</label>
              <Select 
                value={children.toString()} 
                onValueChange={(value) => {
                  setChildren(parseInt(value));
                  handleBlur("children");
                }}
              >
                <SelectTrigger className={cn("h-11", errors.children && touched.children && "border-destructive")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.children && touched.children && (
                <p className="text-xs text-destructive animate-in slide-in-from-top-1">{errors.children}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Classe *</label>
              <Select 
                value={travelClass} 
                onValueChange={(value) => {
                  setTravelClass(value as typeof travelClass);
                  handleBlur("travelClass");
                }}
              >
                <SelectTrigger className={cn("h-11", errors.travelClass && touched.travelClass && "border-destructive")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="economy">Économique</SelectItem>
                  <SelectItem value="first">Première</SelectItem>
                </SelectContent>
              </Select>
              {errors.travelClass && touched.travelClass && (
                <p className="text-xs text-destructive animate-in slide-in-from-top-1">{errors.travelClass}</p>
              )}
            </div>
          </div>

          <UnifiedSubmitButton 
            loading={loading} 
            fullWidth 
            className={cn("mt-6", hasErrors && "opacity-50 cursor-not-allowed")}
            disabled={hasErrors || loading}
          >
            Rechercher des trains
          </UnifiedSubmitButton>
        </div>
      </UnifiedForm>
    </div>
  );
};
