import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Users, Briefcase, Luggage, X, Check, Info, Clock, MapPin, Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Price } from "@/components/ui/price";
import { validateAndCorrectFlightTimes, formatFlightDate } from "@/utils/flightUtils";
import { BaggageInfo } from "@/components/booking-steps/BaggageInfo";
import { getCityName, getAirportName } from "@/utils/airportNames";
import { useTranslation } from "react-i18next";

interface FlightBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flight: {
    id: string;
    airline: string;
    airlineCode?: string;
    flightNumber?: string;
    from: string;
    to: string;
    departure: string;
    arrival: string;
    duration?: string;
    stops?: number;
    price: number;
    class: string;
    departureDate?: string;
    returnDate?: string;
    baggage?: {
      cabin: { pieces: number; weightKg: number; included: boolean };
      checked: { pieces: number; weightKg: number; included: boolean };
      personalItem: boolean;
    };
  };
  searchParams?: {
    departureDate: string;
    returnDate?: string;
  };
}

export const FlightBookingDialog = ({ open, onOpenChange, flight, searchParams = null }: FlightBookingDialogProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const departureDate = (searchParams && searchParams.departureDate) || flight.departureDate || new Date().toISOString().split('T')[0];
  const returnDate = (searchParams && searchParams.returnDate) || flight.returnDate;
  const stops = flight.stops ?? 0;

  // Validate and correct flight times
  const flightTimes = useMemo(() => {
    return validateAndCorrectFlightTimes(
      flight.departure,
      flight.arrival,
      flight.duration || '',
      departureDate
    );
  }, [flight.departure, flight.arrival, flight.duration, departureDate]);

  const handleSelectFare = (fare: 'basic' | 'benefits') => {
    // Navigate to booking process page with flight data
    const params = new URLSearchParams({
      id: flight.id,
      airline: flight.airline,
      from: flight.from,
      to: flight.to,
      departure: flight.departure,
      arrival: flight.arrival,
      duration: flightTimes.duration,
      stops: stops.toString(),
      price: flight.price.toString(),
      class: flight.class,
      fare: fare,
      departureDate: departureDate,
    });
    // Add airline code and flight number
    if (flight.airlineCode) {
      params.append('airlineCode', flight.airlineCode);
    }
    if (flight.flightNumber) {
      params.append('flightNumber', flight.flightNumber);
    }
    if (returnDate) {
      params.append('returnDate', returnDate);
    }
    navigate(`/booking-process?${params.toString()}`);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-[95vw] p-0 overflow-y-auto">
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="p-6 border-b bg-gradient-to-r from-primary/10 to-primary/5 sticky top-0 z-10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Informations relatives au voyage</h2>
                  <p className="text-sm text-muted-foreground mt-1">B-reserve by Bossiz</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="hover:bg-background/50">
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="font-medium">1 Passager</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Briefcase className="h-4 w-4 text-primary" />
                  <span className="font-medium">Bagage cabine</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Luggage className="h-4 w-4 text-primary" />
                  <span className="font-medium">Bagage en soute</span>
                </div>
              </div>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-0">
              {/* Left Side - Flight Details */}
              <div className="p-8 bg-gradient-to-b from-muted/30 to-background">
                <div className="space-y-6">
                  {/* Airline Header */}
                  <Card className="p-5 bg-gradient-to-r from-primary/10 to-background border-primary/30 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-lg flex items-center justify-center overflow-hidden bg-white border border-border shrink-0">
                        <img 
                          src={`https://pics.avs.io/100/100/${flight.airlineCode || 'XX'}.png`}
                          alt={`${flight.airline} logo`}
                          className="w-12 h-12 object-contain"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            if (target.parentElement) {
                              target.parentElement.innerHTML = `<svg class="h-7 w-7 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>`;
                            }
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Compagnie aérienne</p>
                        <p className="text-xl font-bold text-foreground truncate">{flight.airline}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {flight.flightNumber ? `Vol ${flight.airlineCode || ''}${flight.flightNumber}` : `Classe ${flight.class}`}
                        </p>
                      </div>
                    </div>
                  </Card>

                  {/* Itinerary Card */}
                  <Card className="p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                      <MapPin className="h-5 w-5 text-primary" />
                      <h3 className="font-bold text-lg">Itinéraire détaillé</h3>
                    </div>
                    
                    <div className="space-y-6">
                      {/* Departure */}
                      <div className="relative pl-8 border-l-2 border-primary/40">
                        <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-primary border-4 border-background shadow-sm"></div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-semibold rounded">Départ</div>
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground font-medium">
                              {formatFlightDate(flightTimes.departureDate, 'long')}
                            </span>
                          </div>
                          <div className="flex items-baseline gap-3">
                            <p className="text-3xl font-bold text-foreground">{flightTimes.departureTime}</p>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <p className="text-base font-semibold">{getCityName(flight.from)} ({flight.from})</p>
                          <p className="text-sm text-muted-foreground">{getAirportName(flight.from)}</p>
                        </div>
                      </div>

                      {/* Flight Duration */}
                      <div className="pl-8 border-l-2 border-dashed border-border">
                        <div className="flex items-center gap-3 py-2">
                          <Clock className="h-5 w-5 text-primary" />
                          <div>
                            <p className="text-sm font-semibold">Durée totale: {flightTimes.duration}</p>
                            <p className="text-xs text-muted-foreground">
                              {stops === 0 ? 'Vol direct' : `${stops} escale${stops > 1 ? 's' : ''}`}
                            </p>
                          </div>
                        </div>
                        
                        {/* Stopover Warning - only if there are stops */}
                        {stops > 0 && (
                          <div className="mt-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                              <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                                  Vol avec {stops} escale{stops > 1 ? 's' : ''}
                                </p>
                                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                                  Les détails des escales et temps de correspondance seront communiqués lors de la confirmation.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Arrival */}
                      <div className="relative pl-8 border-l-2 border-primary/40">
                        <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-primary border-4 border-background shadow-sm"></div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-semibold rounded">Arrivée</div>
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground font-medium">
                              {formatFlightDate(flightTimes.arrivalDate, 'long')}
                              {flightTimes.isNextDay && (
                                <span className="ml-2 text-amber-600 dark:text-amber-400">(+1 jour)</span>
                              )}
                              {flightTimes.isMultiDay && (
                                <span className="ml-2 text-amber-600 dark:text-amber-400">(+{flightTimes.daysDifference} jours)</span>
                              )}
                            </span>
                          </div>
                          <div className="flex items-baseline gap-3">
                            <p className="text-3xl font-bold text-foreground">{flightTimes.arrivalTime}</p>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <p className="text-base font-semibold">{getCityName(flight.to)} ({flight.to})</p>
                          <p className="text-sm text-muted-foreground">{getAirportName(flight.to)}</p>
                        </div>
                      </div>

                      {/* Return Flight - Only if round trip */}
                      {returnDate && (
                        <>
                          {/* Return Flight Duration */}
                          <div className="pl-8 border-l-2 border-dashed border-border">
                            <div className="flex items-center gap-3 py-2">
                              <Clock className="h-5 w-5 text-primary" />
                              <div>
                                <p className="text-sm font-semibold">Séjour à destination</p>
                                <p className="text-xs text-muted-foreground">
                                  Du {formatFlightDate(flightTimes.arrivalDate, 'short')} au {formatFlightDate(returnDate, 'short')}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Return Departure */}
                          <div className="relative pl-8 border-l-2 border-primary/40">
                            <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-primary border-4 border-background shadow-sm"></div>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-semibold rounded">Départ retour</div>
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground font-medium">
                                  {formatFlightDate(returnDate, 'long')}
                                </span>
                              </div>
                              <div className="flex items-baseline gap-3">
                                <p className="text-3xl font-bold text-foreground">{flightTimes.departureTime}</p>
                                <Clock className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <p className="text-base font-semibold">{getCityName(flight.to)} ({flight.to})</p>
                              <p className="text-sm text-muted-foreground">{getAirportName(flight.to)}</p>
                            </div>
                          </div>

                          {/* Return Flight Duration */}
                          <div className="pl-8 border-l-2 border-dashed border-border">
                            <div className="flex items-center gap-3 py-2">
                              <Clock className="h-5 w-5 text-primary" />
                              <div>
                                <p className="text-sm font-semibold">Durée du vol retour: {flightTimes.duration}</p>
                                <p className="text-xs text-muted-foreground">
                                  {stops === 0 ? 'Vol direct' : `${stops} escale${stops > 1 ? 's' : ''}`}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Return Arrival */}
                          <div className="relative pl-8 border-l-2 border-primary/40">
                            <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-primary border-4 border-background shadow-sm"></div>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-semibold rounded">Arrivée retour</div>
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground font-medium">
                                  {formatFlightDate(returnDate, 'long')}
                                  {flightTimes.isNextDay && (
                                    <span className="ml-2 text-amber-600 dark:text-amber-400">(+1 jour)</span>
                                  )}
                                </span>
                              </div>
                              <div className="flex items-baseline gap-3">
                                <p className="text-3xl font-bold text-foreground">{flightTimes.arrivalTime}</p>
                                <Clock className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <p className="text-base font-semibold">{getCityName(flight.from)} ({flight.from})</p>
                              <p className="text-sm text-muted-foreground">{getAirportName(flight.from)}</p>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </Card>

                  {/* Price Card */}
                  <Card className="p-5 bg-gradient-to-br from-primary/15 to-primary/5 border-primary/30 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Prix du billet</p>
                        <p className="text-sm text-muted-foreground">Par passager</p>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-primary">
                          <Price amount={flight.price} fromCurrency="EUR" showLoader />
                        </p>
                      </div>
                    </div>
                  </Card>

                  {/* Baggage Information */}
                  <BaggageInfo 
                    airline={flight.airline}
                    fareType="basic"
                    cabinClass={flight.class}
                    apiBaggageData={flight.baggage}
                  />
                </div>
              </div>

              {/* Right Side - Fare Options */}
              <div className="p-8 bg-background">
                <h3 className="text-2xl font-bold mb-2">Sélectionnez une option de réservation</h3>
                <p className="text-sm text-muted-foreground mb-8">Choisissez l'option qui correspond le mieux à vos besoins</p>
                
                <div className="space-y-4">
                  {/* Basic Fare */}
                  <Card className="p-6 hover:border-primary/50 hover:shadow-md transition-all">
                    <div className="flex items-start gap-4 mb-5">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border border-primary/20">
                        <Briefcase className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xl font-bold mb-2">Tarif Basic</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          L'essentiel pour votre voyage. Billet d'avion uniquement avec bagage cabine inclus.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-start gap-2 text-sm">
                        <X className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <span className="line-through text-muted-foreground">Bagages et sièges moins chers</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <X className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <span className="line-through text-muted-foreground">Remboursement instantané en crédit B-Reserve en cas d&apos;annulation de la compagnie aérienne</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <X className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <span className="line-through text-muted-foreground">Informations en direct concernant les retards et les portes d&apos;embarquement</span>
                      </div>
                    </div>

                    <Button 
                      onClick={() => handleSelectFare('basic')}
                      className="w-full"
                      size="lg"
                    >
                      Continuer pour <Price amount={flight.price} fromCurrency="EUR" />
                    </Button>

                    <button className="w-full text-center text-sm text-primary mt-3 flex items-center justify-center gap-1">
                      <span>+</span>
                      <span className="underline">Afficher les détails</span>
                    </button>

                    <div className="mt-4 space-y-2">
                      <div className="flex items-start gap-2 text-sm">
                        <Info className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">Vol annulé ou retardé</span>
                      </div>
                      <div className="text-xs text-muted-foreground ml-6">
                        {t('flightBookingDialog.cancelPolicyNote')}
                      </div>
                      <div className="flex items-start gap-2 text-sm mt-3">
                        <Info className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">Annulez ou modifiez votre voyage</span>
                      </div>
                      <div className="text-xs text-muted-foreground ml-6">
                        {t('flightBookingDialog.changePolicyNote')}
                      </div>
                    </div>
                  </Card>

                  {/* Benefits Fare */}
                  <Card className="p-6 border-2 border-primary hover:border-primary/90 hover:shadow-lg transition-all bg-gradient-to-br from-primary/5 to-background">
                    <div className="flex items-start gap-4 mb-5">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-md">
                        <Check className="h-6 w-6 text-primary-foreground" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="text-xl font-bold">Tarif Benefits</h4>
                          <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded">RECOMMANDÉ</span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {t('flightBookingDialog.benefitsDescription')}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-start gap-2 text-sm">
                        <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="font-medium">Bagages et sièges à tarifs préférentiels</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="font-medium">Remboursement instantané en cas d&apos;annulation par la compagnie</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="font-medium">Informations en temps réel (retards, portes d&apos;embarquement)</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="font-medium">Assistance prioritaire 24/7</span>
                      </div>
                    </div>

                    <Button 
                      onClick={() => handleSelectFare('benefits')}
                      className="w-full"
                      size="lg"
                    >
                      Continuer pour <Price amount={flight.price + 40} fromCurrency="EUR" />
                    </Button>

                    <button className="w-full text-center text-sm text-primary mt-3 flex items-center justify-center gap-1">
                      <span>+</span>
                      <span className="underline">Afficher les détails</span>
                    </button>
                  </Card>
                </div>
              </div>
            </div>
          </div>
      </SheetContent>
    </Sheet>
  );
};
