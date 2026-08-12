import { Bell, ChevronDown, ChevronUp, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useTranslation } from "react-i18next";

interface FlightFiltersProps {
  baggageHandCount: number;
  baggageCheckCount: number;
  stopsFilter: string;
  onBaggageHandChange: (count: number) => void;
  onBaggageCheckChange: (count: number) => void;
  onStopsFilterChange: (filter: string) => void;
}

export const FlightFilters = ({
  baggageHandCount,
  baggageCheckCount,
  stopsFilter,
  onBaggageHandChange,
  onBaggageCheckChange,
  onStopsFilterChange,
}: FlightFiltersProps) => {
  const { t } = useTranslation();
  const [baggageOpen, setBaggageOpen] = useState(true);
  const [stopsOpen, setStopsOpen] = useState(true);

  return (
    <div className="w-full space-y-4">
      {/* Price Alerts */}
      <div className="bg-card rounded-lg border border-border p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-muted rounded-full">
            <Bell className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm mb-1">{t('flightFilters.priceAlerts.title')}</h3>
            <p className="text-xs text-muted-foreground">
              {t('flightFilters.priceAlerts.description')}
            </p>
          </div>
        </div>
      </div>

      {/* Baggage Section */}
      <Collapsible open={baggageOpen} onOpenChange={setBaggageOpen}>
        <div className="bg-card rounded-lg border border-border">
          <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
            <h3 className="font-semibold text-sm">{t('flightFilters.baggage.title')}</h3>
            {baggageOpen ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 pb-4 space-y-4">
              {/* Hand Baggage */}
              <div className="flex items-center justify-between">
                <Label className="text-sm flex items-center gap-2">
                  <span>🎒</span>
                  <span>{t('flightFilters.baggage.hand')}</span>
                </Label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onBaggageHandChange(Math.max(0, baggageHandCount - 1))}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center text-sm font-medium">{baggageHandCount}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onBaggageHandChange(baggageHandCount + 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Checked Baggage */}
              <div className="flex items-center justify-between">
                <Label className="text-sm flex items-center gap-2">
                  <span>🧳</span>
                  <span>{t('flightFilters.baggage.checked')}</span>
                </Label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onBaggageCheckChange(Math.max(0, baggageCheckCount - 1))}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center text-sm font-medium">{baggageCheckCount}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onBaggageCheckChange(baggageCheckCount + 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* Stops Section */}
      <Collapsible open={stopsOpen} onOpenChange={setStopsOpen}>
        <div className="bg-card rounded-lg border border-border">
          <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
            <h3 className="font-semibold text-sm">{t('pages.flights.filters.stops')}</h3>
            {stopsOpen ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 pb-4">
              <RadioGroup value={stopsFilter} onValueChange={onStopsFilterChange}>
                <div className="flex items-center space-x-2 py-2">
                  <RadioGroupItem value="all" id="all" />
                  <Label htmlFor="all" className="text-sm cursor-pointer">{t('pages.flights.filters.all')}</Label>
                </div>
                <div className="flex items-center space-x-2 py-2">
                  <RadioGroupItem value="direct" id="direct" />
                  <Label htmlFor="direct" className="text-sm cursor-pointer">{t('pages.flights.filters.direct')}</Label>
                </div>
                <div className="flex items-center space-x-2 py-2">
                  <RadioGroupItem value="1stop" id="1stop" />
                  <Label htmlFor="1stop" className="text-sm cursor-pointer">{t('flightFilters.upToOneStop')}</Label>
                </div>
                <div className="flex items-center space-x-2 py-2">
                  <RadioGroupItem value="2stops" id="2stops" />
                  <Label htmlFor="2stops" className="text-sm cursor-pointer">{t('flightFilters.upToTwoStops')}</Label>
                </div>
                <div className="flex items-center space-x-2 py-2">
                  <RadioGroupItem value="overnight" id="overnight" />
                  <Label htmlFor="overnight" className="text-sm cursor-pointer">{t('flightFilters.allowOvernight')}</Label>
                </div>
              </RadioGroup>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    </div>
  );
};
