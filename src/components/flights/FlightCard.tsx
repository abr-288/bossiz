import { Plane, Clock, CircleCheck, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Price } from "@/components/ui/price";
import { getCityName, getAirportName } from "@/utils/airportNames";
import { useTranslation } from "react-i18next";

const formatDuration = (duration: string): string => {
  if (!duration) return '';
  const match = duration.match(/PT(\d+)H(\d+)?M?/);
  if (match) {
    const hours = match[1] || '0';
    const minutes = match[2] || '0';
    return `${hours}h${minutes.padStart(2, '0')}`;
  }
  return duration;
};

interface FlightCardProps {
  airline: string;
  airlineCode: string;
  departureTime: string;
  arrivalTime: string;
  departureAirport: string;
  arrivalAirport: string;
  duration: string;
  stops: number;
  price: number;
  currency: string;
  onSelect: () => void;
}

export const FlightCard = ({
  airline,
  airlineCode,
  departureTime,
  arrivalTime,
  departureAirport,
  arrivalAirport,
  duration,
  stops,
  price,
  currency,
  onSelect,
}: FlightCardProps) => {
  const { t } = useTranslation();
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return isoString;
    }
  };

  // Airline logo URL - using pics.avs.io service
  const airlineLogoUrl = `https://pics.avs.io/80/80/${airlineCode}.png`;

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Airline Info */}
        <div className="flex items-center gap-3 min-w-[160px]">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden bg-white border border-border">
            <img
              src={airlineLogoUrl}
              alt={`${airline} logo`}
              className="w-10 h-10 object-contain"
              onError={(e) => {
                // Fallback to text if image fails to load
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.parentElement!.innerHTML = `<span class="text-lg font-bold text-primary">${airlineCode.substring(0, 2)}</span>`;
              }}
            />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm">{airline}</span>
            <span className="text-xs text-muted-foreground">{airlineCode}</span>
          </div>
        </div>

        {/* Flight Info */}
        <div className="flex-1 flex items-center gap-2 sm:gap-4 lg:gap-6">
          {/* Departure */}
          <div className="flex flex-col items-start min-w-0">
            <span className="text-lg sm:text-xl lg:text-2xl font-bold">{formatTime(departureTime)}</span>
            <span className="text-sm font-medium">{getCityName(departureAirport)}</span>
            <span className="text-xs text-muted-foreground">{departureAirport}</span>
            <span className="text-[10px] text-muted-foreground/70 max-w-[80px] sm:max-w-[120px] truncate" title={getAirportName(departureAirport)}>
              {getAirportName(departureAirport)}
            </span>
          </div>

          {/* Duration & Stops */}
          <div className="flex-1 flex flex-col items-center min-w-[80px] sm:min-w-[120px] gap-1">
            {/* Duration Badge */}
            <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1 rounded-full">
              <Clock className="h-3.5 w-3.5" />
              <span className="text-sm font-semibold">{formatDuration(duration)}</span>
            </div>

            {/* Flight Path Line */}
            <div className="w-full flex items-center gap-2 my-1">
              <div className="flex-1 h-[2px] bg-border relative">
                {stops > 0 && Array.from({ length: stops }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-secondary border-2 border-background"
                    style={{ left: `${((i + 1) / (stops + 1)) * 100}%`, transform: 'translate(-50%, -50%)' }}
                  />
                ))}
              </div>
              <Plane className="h-4 w-4 text-secondary" />
            </div>

            {/* Stops Badge */}
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium animate-fade-in ${stops === 0
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : stops === 1
                  ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              }`}>
              {stops === 0 ? (
                <>
                  <CircleCheck className="h-3.5 w-3.5" />
                  <span>{t('flightCard.directFlight')}</span>
                </>
              ) : (
                <>
                  <Circle className="h-3.5 w-3.5" />
                  <span>{stops} {t('pages.flights.results.stops')}</span>
                </>
              )}
            </div>
          </div>

          {/* Arrival */}
          <div className="flex flex-col items-end min-w-0">
            <span className="text-lg sm:text-xl lg:text-2xl font-bold">{formatTime(arrivalTime)}</span>
            <span className="text-sm font-medium">{getCityName(arrivalAirport)}</span>
            <span className="text-xs text-muted-foreground">{arrivalAirport}</span>
            <span className="text-[10px] text-muted-foreground/70 max-w-[80px] sm:max-w-[120px] truncate text-right" title={getAirportName(arrivalAirport)}>
              {getAirportName(arrivalAirport)}
            </span>
          </div>
        </div>

        {/* Price & Button */}
        <div className="flex flex-col items-end gap-2 min-w-[150px]">
          <div className="text-right">
            <div className="text-xs text-green-600 font-medium">
              {t('flightCard.seatsAvailable')}
            </div>
            <div className="text-2xl lg:text-3xl font-bold text-primary">
              <Price amount={price} fromCurrency={currency} showLoader />
            </div>
          </div>
          <Button
            onClick={onSelect}
            className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold"
          >
            {t('search.book')}
          </Button>
        </div>
      </div>
    </Card>
  );
};
