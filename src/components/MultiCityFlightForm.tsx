import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { UnifiedForm, UnifiedAutocomplete, UnifiedDatePicker, UnifiedSubmitButton } from "@/components/forms";
import { useTranslation } from "react-i18next";

interface FlightLeg {
  id: string;
  from: string;
  to: string;
  date?: Date;
}

interface MultiCityFlightFormProps {
  onSearch: (legs: FlightLeg[]) => void;
}

export const MultiCityFlightForm = ({ onSearch }: MultiCityFlightFormProps) => {
  const { t } = useTranslation();
  const [legs, setLegs] = useState<FlightLeg[]>([
    { id: "1", from: "", to: "", date: undefined },
    { id: "2", from: "", to: "", date: undefined }
  ]);

  const addLeg = () => {
    if (legs.length < 5) {
      setLegs([...legs, { id: Date.now().toString(), from: "", to: "", date: undefined }]);
    }
  };

  const removeLeg = (id: string) => {
    if (legs.length > 2) {
      setLegs(legs.filter(leg => leg.id !== id));
    }
  };

  const updateLeg = (id: string, field: keyof FlightLeg, value: any) => {
    setLegs(legs.map(leg => leg.id === id ? { ...leg, [field]: value } : leg));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(legs);
  };

  return (
    <UnifiedForm onSubmit={handleSubmit} variant="search">
      <div className="space-y-4">
        {legs.map((leg, index) => (
          <div key={leg.id} className="relative">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border border-border rounded-lg bg-muted/20">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold flex-shrink-0">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <UnifiedAutocomplete
                    label="Départ"
                    value={leg.from}
                    onChange={(value) => updateLeg(leg.id, "from", value)}
                    placeholder={t('search.departureCityPlaceholder')}
                    type="airport"
                  />
                </div>
              </div>
              
              <UnifiedAutocomplete
                label="Arrivée"
                value={leg.to}
                onChange={(value) => updateLeg(leg.id, "to", value)}
                placeholder="Destination"
                type="airport"
              />
              
              <UnifiedDatePicker
                label="Date"
                value={leg.date}
                onChange={(date) => updateLeg(leg.id, "date", date)}
                minDate={new Date()}
              />
            </div>
            
            {legs.length > 2 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => removeLeg(leg.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
        
        {legs.length < 5 && (
          <Button
            variant="outline"
            onClick={addLeg}
            className="w-full"
            type="button"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('multiCityFlightForm.addFlight')}
          </Button>
        )}
        
        <UnifiedSubmitButton fullWidth>
          Rechercher des vols multi-destinations
        </UnifiedSubmitButton>
      </div>
    </UnifiedForm>
  );
};
