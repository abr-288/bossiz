import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Check } from "lucide-react";
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

interface Passenger {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  documentType: "passport" | "id_card";
  documentNumber: string;
}

const UnifiedBookingProcess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);

  // Récupération des paramètres génériques
  const serviceType = searchParams.get("type") || "flight";
  const serviceName = searchParams.get("name") || "Service";
  const servicePrice = searchParams.get("price") || "0";
  const serviceLocation = searchParams.get("location") || "";
  const serviceId = searchParams.get("serviceId") || undefined;
  const startDate = searchParams.get("startDate") || new Date().toISOString().split("T")[0];
  const endDate = searchParams.get("endDate");
  
  // Récupération des paramètres spécifiques au vol
  const flightData = serviceType === "flight" ? {
    origin: searchParams.get("origin") || serviceLocation,
    destination: searchParams.get("destination") || "",
    departureDate: startDate,
    returnDate: endDate,
    departureTime: searchParams.get("departureTime") || "10:00",
    arrivalTime: searchParams.get("arrivalTime") || "12:30",
    duration: searchParams.get("duration") || "2h 30m",
    airline: searchParams.get("airline") || "Air Côte d'Ivoire",
    flightNumber: searchParams.get("flightNumber") || "HF420",
    price: servicePrice,
    stops: parseInt(searchParams.get("stops") || "0"),
    fare: searchParams.get("fare") || "basic",
  } : null;

  const guestsCount = parseInt(searchParams.get("guests") || "1");
  const adultsCount = parseInt(searchParams.get("adults") || guestsCount.toString());
  const childrenCount = parseInt(searchParams.get("children") || "0");

  // États pour le processus de réservation
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, number>>({});
  const [selectedPreferences, setSelectedPreferences] = useState<Record<string, any>>({});

  const getServiceIcon = () => {
    switch (serviceType) {
      case "flight": return "✈️";
      case "hotel": return "🏨";
      case "car": return "🚗";
      case "tour": return "🗺️";
      case "stay": return "🏡";
      case "destination": return "🌍";
      case "event": return "🎫";
      default: return "📋";
    }
  };

  const getStepTitle = (stepNumber: number) => {
    if (stepNumber === 1) return "Participants";
    if (stepNumber === 2) {
      if (serviceType === "flight") return "Bagages";
      if (serviceType === "hotel" || serviceType === "stay") return "Options";
      return "Extras";
    }
    if (stepNumber === 3) {
      if (serviceType === "flight") return "Sièges";
      if (serviceType === "hotel" || serviceType === "stay") return "Préférences";
      return "Détails";
    }
    return "Paiement";
  };

  const steps = [
    { number: 1, title: getStepTitle(1), completed: currentStep > 1 },
    { number: 2, title: getStepTitle(2), completed: currentStep > 2 },
    { number: 3, title: getStepTitle(3), completed: currentStep > 3 },
    { number: 4, title: getStepTitle(4), completed: false },
  ];

  const renderServiceDetails = () => {
    if (serviceType === "flight" && flightData) {
      return (
        <>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-2">
                <div>
                  <p className="text-2xl font-bold">{flightData.departureTime}</p>
                  <p className="text-sm text-muted-foreground">{flightData.origin}</p>
                </div>
                <div className="flex-1 flex items-center gap-2">
                  <Separator className="flex-1" />
                  <Badge variant="secondary" className="px-2 text-xs">
                    {flightData.duration}
                  </Badge>
                  <Separator className="flex-1" />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{flightData.arrivalTime}</p>
                  <p className="text-sm text-muted-foreground">{flightData.destination}</p>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                {flightData.airline} • Vol {flightData.flightNumber}
              </div>
              {flightData.stops > 0 && (
                <div className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                  ⚠️ {flightData.stops} escale(s)
                </div>
              )}
            </div>
          </div>
        </>
      );
    }

    return (
      <div className="space-y-2">
        <h3 className="font-bold text-xl">{serviceName}</h3>
        {serviceLocation && (
          <p className="text-sm text-muted-foreground">📍 {serviceLocation}</p>
        )}
        <p className="text-sm text-muted-foreground">
          📅 {new Date(startDate).toLocaleDateString("fr-FR")}
          {endDate && ` - ${new Date(endDate).toLocaleDateString("fr-FR")}`}
        </p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background pt-16">
      <Navbar />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* En-tête */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4 hover:bg-primary/10"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {getServiceIcon()} Réservation
              </h1>
              <p className="text-muted-foreground">
                {serviceName}
              </p>
            </div>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              <span className="font-bold text-primary">
                <Price amount={parseInt(servicePrice)} fromCurrency="EUR" />
              </span>
            </Badge>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Colonne gauche - Détails du service */}
          <div className="lg:col-span-1">
              <Card className="p-6 sticky top-24 bg-gradient-to-br from-card to-muted/20">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  {getServiceIcon()} Détails
                </h3>

                <div className="space-y-4">
                  {renderServiceDetails()}

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Participants</span>
                      <span className="font-medium">
                        {adultsCount} adulte{adultsCount > 1 ? "s" : ""}
                        {childrenCount > 0 && `, ${childrenCount} enfant${childrenCount > 1 ? "s" : ""}`}
                      </span>
                    </div>
                    {serviceType === "flight" && flightData && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Classe</span>
                          <span className="font-medium">Économique</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Tarif</span>
                          <span className="font-medium">
                            {flightData.fare === "basic" ? "Basic" : "Benefits"}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                <Separator />

                <div className="bg-primary/10 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Prix de base</span>
                    <span className="text-xl font-bold text-primary">
                      <Price amount={parseInt(servicePrice)} fromCurrency="EUR" />
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Colonne droite - Processus de réservation */}
          <div className="lg:col-span-2">
            {/* Stepper */}
            <Card className="p-6 mb-6 bg-gradient-to-r from-primary/5 to-transparent">
              <div className="flex items-center justify-between">
                {steps.map((step, index) => (
                  <div key={step.number} className="flex items-center flex-1">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold transition-all ${
                          step.completed
                            ? "bg-green-500 text-white shadow-lg"
                            : currentStep === step.number
                            ? "bg-primary text-white shadow-lg scale-110"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {step.completed ? <Check className="h-6 w-6" /> : step.number}
                      </div>
                      <span
                        className={`text-sm font-medium mt-2 ${
                          currentStep === step.number ? "text-primary font-semibold" : "text-muted-foreground"
                        }`}
                      >
                        {step.title}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <Separator
                        className={`flex-1 mx-4 h-1 ${
                          step.completed ? "bg-green-500" : "bg-muted"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* Contenu des étapes */}
            {currentStep === 1 && (
              <PassengerStep
                passengers={passengers}
                onPassengersChange={setPassengers}
                adultsCount={adultsCount}
                childrenCount={childrenCount}
                onNext={() => setCurrentStep(2)}
                serviceType={serviceType}
              />
            )}

            {currentStep === 2 && (
              <OptionsStep
                serviceType={serviceType}
                selectedOptions={selectedOptions}
                onOptionsChange={(optionId, quantity) => {
                  setSelectedOptions((prev) => ({ ...prev, [optionId]: quantity }));
                }}
                guestsCount={adultsCount + childrenCount}
                onNext={() => setCurrentStep(3)}
                onBack={() => setCurrentStep(1)}
              />
            )}

            {currentStep === 3 && (
              <PreferencesStep
                serviceType={serviceType}
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
                serviceType={serviceType}
                serviceId={serviceId}
                serviceName={serviceName}
                servicePrice={parseFloat(servicePrice)}
                serviceLocation={serviceLocation}
                startDate={startDate}
                endDate={endDate || undefined}
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

export default UnifiedBookingProcess;
