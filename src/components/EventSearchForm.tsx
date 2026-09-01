import { useState, useEffect } from "react";
import { format } from "date-fns";
import { AlertCircle } from "lucide-react";
import { useEventSearch } from "@/hooks/useEventSearch";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { UnifiedForm, UnifiedAutocomplete, UnifiedDatePicker, UnifiedSubmitButton } from "@/components/forms";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "react-i18next";
import { eventSearchSchema, type EventSearchInput } from "@/lib/validationSchemas";
import { safeValidate } from "@/lib/formHelpers";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

interface EventSearchFormProps {
  onResults: (results: any) => void;
}

export const EventSearchForm = ({ onResults }: EventSearchFormProps) => {
  const { t } = useTranslation();
  const [location, setLocation] = useState("");
  const [date, setDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [category, setCategory] = useState<"all" | "concert" | "sport" | "theater" | "festival" | "conference">("all");
  const [guests, setGuests] = useState(1);
  const { searchEvents, loading } = useEventSearch();
  const { toast } = useToast();

  // État des erreurs de validation
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Validation en temps réel
  useEffect(() => {
    if (Object.keys(touched).length === 0) return;

    const formData: EventSearchInput = {
      location: location || "",
      startDate: date ? format(date, "yyyy-MM-dd") : "",
      endDate: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
      category,
      guests,
    };

    const validation = safeValidate(eventSearchSchema, formData);
    
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
  }, [location, date, endDate, category, guests, touched]);

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    // Marquer tous les champs comme touchés
    setTouched({
      location: true,
      startDate: true,
      endDate: !!endDate,
      category: true,
      guests: true,
    });

    // Validation complète avant soumission
    const formData: EventSearchInput = {
      location: location || "",
      startDate: date ? format(date, "yyyy-MM-dd") : "",
      endDate: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
      category,
      guests,
    };

    const validation = safeValidate(eventSearchSchema, formData);

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

    const results = await searchEvents({
      location: validation.data.location,
      date: validation.data.startDate,
      category: validation.data.category !== "all" ? validation.data.category : undefined,
    });

    if (results?.success) {
      onResults(results);
      toast({
        title: t("common.success"),
        description: `${results.events?.length || 0} ${t("search.results")}`,
      });
    } else {
      toast({
        title: t("errors.generic"),
        description: t("errors.networkError"),
        variant: "destructive",
      });
    }
  };

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <UnifiedForm onSubmit={handleSearch} variant="search" loading={loading}>
          {/* Alert d'erreur générale */}
          {hasErrors && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Veuillez corriger les erreurs dans le formulaire
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="sm:col-span-2 lg:col-span-2 space-y-1 min-w-0">
              <UnifiedAutocomplete
                label={t("search.location")}
                type="location"
                value={location}
                onChange={(value) => {
                  setLocation(value);
                  handleBlur("location");
                }}
                placeholder={t("search.cityOrAirport")}
                required
                className={errors.location && touched.location ? "border-destructive" : ""}
              />
              {errors.location && touched.location && (
                <p className="text-xs text-destructive mt-1 animate-in slide-in-from-top-1">
                  {errors.location}
                </p>
              )}
            </div>

            <div className="min-w-0 space-y-1">
              <UnifiedDatePicker
                label={t("search.date")}
                value={date}
                onChange={(date) => {
                  setDate(date);
                  handleBlur("startDate");
                }}
                minDate={new Date()}
              />
              {errors.startDate && touched.startDate && (
                <p className="text-xs text-destructive mt-1 animate-in slide-in-from-top-1">
                  {errors.startDate}
                </p>
              )}
            </div>

            <div className="min-w-0 space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="category">{t("search.category")}</label>
              <Select 
                value={category} 
                onValueChange={(value) => {
                  setCategory(value as typeof category);
                  handleBlur("category");
                }}
              >
                <SelectTrigger className={cn("h-11", errors.category && touched.category && "border-destructive")}>
                  <SelectValue placeholder={t("search.allCategories")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("search.allCategories")}</SelectItem>
                  <SelectItem value="concert">Concert</SelectItem>
                  <SelectItem value="sport">Sport</SelectItem>
                  <SelectItem value="theater">Théâtre</SelectItem>
                  <SelectItem value="festival">Festival</SelectItem>
                  <SelectItem value="conference">Conférence</SelectItem>
                </SelectContent>
              </Select>
              {errors.category && touched.category && (
                <p className="text-xs text-destructive animate-in slide-in-from-top-1">{errors.category}</p>
              )}
            </div>

            <div className="min-w-0 space-y-2">
              <label className="text-sm font-medium text-foreground">Participants *</label>
              <Select 
                value={guests.toString()} 
                onValueChange={(value) => {
                  setGuests(parseInt(value));
                  handleBlur("guests");
                }}
              >
                <SelectTrigger className={cn("h-11", errors.guests && touched.guests && "border-destructive")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 8, 10, 15, 20, 30, 50].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.guests && touched.guests && (
                <p className="text-xs text-destructive animate-in slide-in-from-top-1">{errors.guests}</p>
              )}
            </div>
          </div>

          <UnifiedSubmitButton 
            loading={loading} 
            fullWidth 
            className={cn("mt-6", hasErrors && "opacity-50 cursor-not-allowed")}
            disabled={hasErrors || loading}
          >
            {t("search.search")}
          </UnifiedSubmitButton>
        </UnifiedForm>
      </CardContent>
    </Card>
  );
};
