import { useState, useMemo } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Plane } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { PassengerStep } from "@/components/booking-steps/PassengerStep";
import { OptionsStep } from "@/components/booking-steps/OptionsStep";
import { PreferencesStep } from "@/components/booking-steps/PreferencesStep";
import { SummaryStep } from "@/components/booking-steps/SummaryStep";
import { Price } from "@/components/ui/price";
import { validateAndCorrectFlightTimes, formatFlightDate } from "@/utils/flightUtils";
import { BaggageInfo } from "@/components/booking-steps/BaggageInfo";
import { getCityName, getAirportName } from "@/utils/airportNames";
import { useTranslation } from "react-i18next";
import { BookingStepper } from "@/components/booking-steps/BookingStepper";

interface Passenger {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  documentType: "passport" | "id_card";
  documentNumber: string;
}

const FlightBookingProcess = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(1);

  // Try to get baggage data from location state
  const baggageData = location.state?.flight?.baggage || location.state?.baggage;

  // Récupération des paramètres du vol
  const airline = searchParams.get("airline") || "Air Côte d'Ivoire";
  const airlineCode = searchParams.get("airlineCode") || "";
  const flightNumber = searchParams.get("flightNumber") || "";
  const departureParam = searchParams.get("departure") || searchParams.get("departureTime") || "";
  const arrivalParam = searchParams.get("arrival") || searchParams.get("arrivalTime") || "";
  const durationParam = searchParams.get("duration") || "";
  const stopsParam = parseInt(searchParams.get("stops") || "0");
  const departureDateParam = searchParams.get("departureDate") || new Date().toISOString().split("T")[0];
  
  // Generate flight number display
  const displayFlightNumber = flightNumber 
    ? `${airlineCode}${flightNumber}`.trim() 
    : airlineCode 
      ? `${airlineCode}${Math.floor(100 + Math.random() * 900)}`
      : "";

  // Validate and correct flight times
  const flightTimes = useMemo(() => {
    return validateAndCorrectFlightTimes(
      departureParam,
      arrivalParam,
      durationParam,
      departureDateParam
    );
  }, [departureParam, arrivalParam, durationParam, departureDateParam]);
  
  const flightData = {
    origin: searchParams.get("from") || searchParams.get("origin") || "ABJ",
    destination: searchParams.get("to") || searchParams.get("destination") || "CDG",
    departureDate: flightTimes.departureDate,
    arrivalDate: flightTimes.arrivalDate,
    returnDate: searchParams.get("returnDate"),
    departureTime: flightTimes.departureTime,
    arrivalTime: flightTimes.arrivalTime,
    duration: flightTimes.duration,
    isNextDay: flightTimes.isNextDay,
    isMultiDay: flightTimes.isMultiDay,
    daysDifference: flightTimes.daysDifference,
    airline: airline,
    airlineCode: airlineCode,
    flightNumber: displayFlightNumber,
    price: searchParams.get("price") || "150000",
    stops: stopsParam,
    fare: searchParams.get("fare") || "basic",
  };

  const adultsCount = parseInt(searchParams.get("adults") || "1");
  const childrenCount = parseInt(searchParams.get("children") || "0");

  // États pour le processus de réservation
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, number>>({});
  const [selectedPreferences, setSelectedPreferences] = useState<Record<string, any>>({});

  const steps = [
    { number: 1, title: t("ux.flightBooking.stepPassengers"), completed: currentStep > 1 },
    { number: 2, title: t("ux.flightBooking.stepBaggage"), completed: currentStep > 2 },
    { number: 3, title: t("ux.flightBooking.stepSeats"), completed: currentStep > 3 },
    { number: 4, title: t("ux.flightBooking.stepPayment"), completed: false },
  ];

  return (
    <div className="min-h-screen bg-background pt-16">
      <Navbar />

      <main className="container mx-auto px-4 py-6 md:py-8 max-w-7xl">
        {/* En-tête */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4 hover:bg-primary/10"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("ux.flightBooking.backToResults")}
          </Button>

          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {t("ux.flightBooking.title")}
              </h1>
              <p className="text-muted-foreground flex items-center gap-2">
                <Plane className="h-4 w-4" />
                {flightData.origin} → {flightData.destination}
              </p>
            </div>
            <p className="t-price text-2xl text-foreground">
              <Price amount={parseInt(flightData.price)} fromCurrency="EUR" showLoader />
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne gauche - Détails du vol */}
          <div className="min-w-0 lg:col-span-1">
            <Card className="p-6 sticky top-24 bg-gradient-to-br from-card to-muted/20">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Plane className="h-5 w-5 text-primary" />
                {t("ux.flightBooking.details")}
              </h3>

              <div className="space-y-4">
                {/* Airline with Logo */}
                <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden bg-white border border-border shrink-0">
                    <img 
                      src={`https://pics.avs.io/80/80/${flightData.airlineCode}.png`}
                      alt={`${flightData.airline} logo`}
                      className="w-10 h-10 object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        if (target.parentElement) {
                          target.parentElement.innerHTML = `<span class="text-lg font-bold text-primary">${flightData.airlineCode?.substring(0, 2) || '✈️'}</span>`;
                        }
                      }}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{flightData.airline}</p>
                    {flightData.flightNumber && (
                      <p className="text-xs text-muted-foreground">Vol {flightData.flightNumber}</p>
                    )}
                  </div>
                </div>

                {/* Departure info */}
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    {formatFlightDate(flightData.departureDate, 'long')}
                  </p>
                </div>

                {/* Flight timeline */}
                <div className="flex items-center gap-2">
                  <div className="text-center min-w-[50px]">
                    <p className="text-sm font-bold">{flightData.departureTime}</p>
                    <p className="text-xs text-muted-foreground">{flightData.origin}</p>
                    <p className="text-xs text-muted-foreground/70 max-w-[80px] truncate" title={getAirportName(flightData.origin)}>
                      {getAirportName(flightData.origin)}
                    </p>
                  </div>
                  <div className="flex-1 flex flex-col items-center gap-0.5 min-w-0">
                    <Badge variant="secondary" className="px-1.5 py-0 text-xs whitespace-nowrap">
                      {flightData.duration}
                    </Badge>
                    <div className="w-full h-[1px] bg-border" />
                    <span className="text-xs text-muted-foreground">
                      {flightData.stops === 0 ? t("ux.flightBooking.direct") : t("ux.summary.stops", { count: flightData.stops })}
                    </span>
                  </div>
                  <div className="text-center min-w-[50px]">
                    <p className="text-sm font-bold">
                      {flightData.arrivalTime}
                      {flightData.isNextDay && <sup className="text-xs text-warning-foreground ml-0.5">+1</sup>}
                      {flightData.isMultiDay && <sup className="text-xs text-warning-foreground ml-0.5">+{flightData.daysDifference}</sup>}
                    </p>
                    <p className="text-xs text-muted-foreground">{flightData.destination}</p>
                    <p className="text-xs text-muted-foreground/70 max-w-[80px] truncate" title={getAirportName(flightData.destination)}>
                      {getAirportName(flightData.destination)}
                    </p>
                  </div>
                </div>

                {/* Arrival date if different */}
                {(flightData.isNextDay || flightData.isMultiDay) && (
                  <div className="text-center">
                    <p className="text-xs text-warning-foreground">
                      {t("ux.flightBooking.arrivalOn", { date: formatFlightDate(flightData.arrivalDate, 'short') })}
                    </p>
                  </div>
                )}

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("ux.flightBooking.passengers")}</span>
                    <span className="font-medium">
                      {t("ux.booking.adults", { count: adultsCount })}
                      {childrenCount > 0 && `, ${t("ux.booking.children", { count: childrenCount })}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("ux.flightBooking.class")}</span>
                    <span className="font-medium">{t("ux.flightBooking.economy")}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("ux.flightBooking.fare")}</span>
                    <span className="font-medium">
                      {flightData.fare === "basic" ? "Basic" : "Benefits"}
                    </span>
                  </div>
                </div>

                <Separator />

                <div className="bg-primary/10 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">{t("ux.flightBooking.price")}</span>
                    <span className="text-xl font-bold text-primary">
                      <Price amount={parseInt(flightData.price)} fromCurrency="EUR" showLoader />
                    </span>
                  </div>
                </div>

                {/* Baggage Information */}
                <BaggageInfo 
                  airline={flightData.airline}
                  fareType={flightData.fare}
                  cabinClass={searchParams.get("class") || "ECONOMY"}
                  apiBaggageData={baggageData}
                />
              </div>
            </Card>
          </div>

          {/* Colonne droite - Processus de réservation */}
          <div className="min-w-0 lg:col-span-2">
            {/* Stepper */}
            <BookingStepper steps={steps} currentStep={currentStep} className="mb-6" />

            {/* Contenu des étapes */}
            {currentStep === 1 && (
              <PassengerStep
                passengers={passengers}
                onPassengersChange={setPassengers}
                adultsCount={adultsCount}
                childrenCount={childrenCount}
                onNext={() => setCurrentStep(2)}
              />
            )}

            {currentStep === 2 && (
              <OptionsStep
                serviceType="flight"
                selectedOptions={selectedOptions}
                onOptionsChange={(optionId, quantity) => {
                  setSelectedOptions((prev) => ({ ...prev, [optionId]: quantity }));
                }}
                guestsCount={adultsCount + childrenCount}
                onNext={() => setCurrentStep(3)}
                onBack={() => setCurrentStep(1)}
                airline={flightData.airline}
                fareType={flightData.fare}
                cabinClass={searchParams.get("class") || "ECONOMY"}
              />
            )}

            {currentStep === 3 && (
              <PreferencesStep
                serviceType="flight"
                selectedPreferences={selectedPreferences}
                onPreferencesChange={setSelectedPreferences}
                guestsCount={adultsCount + childrenCount}
                onNext={() => setCurrentStep(4)}
                onBack={() => setCurrentStep(2)}
              />
            )}

            {currentStep === 4 && (
              <SummaryStep
                flightData={flightData}
                serviceType="flight"
                serviceName={`${flightData.airline} ${flightData.flightNumber}`}
                servicePrice={parseFloat(flightData.price)}
                serviceLocation={flightData.origin}
                startDate={flightData.departureDate}
                endDate={flightData.returnDate || undefined}
                passengers={passengers}
                selectedOptions={selectedOptions}
                selectedPreferences={selectedPreferences}
                adultsCount={adultsCount}
                childrenCount={childrenCount}
                onBack={() => setCurrentStep(3)}
              />
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FlightBookingProcess;
