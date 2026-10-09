import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CalendarDays, MapPin, ShieldCheck, Users } from "lucide-react";
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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useTranslation } from "react-i18next";
import { currentLocaleTag } from "@/lib/dateLocale";
import { BookingStepper } from "@/components/booking-steps/BookingStepper";

interface Passenger {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  documentType: "passport" | "id_card";
  documentNumber: string;
}

const UnifiedBookingProcess = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);

  // Récupération des paramètres génériques
  const serviceType = searchParams.get("type") || "flight";
  const serviceName = searchParams.get("name") || "Service";
  const servicePrice = searchParams.get("price") || "0";
  const serviceCurrency = searchParams.get("currency") || "XOF";
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
  const [selectedPreferences, setSelectedPreferences] = useState<Record<string, unknown>>({});

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
    if (stepNumber === 1) return t("ux.booking.stepParticipants");
    if (stepNumber === 2) {
      if (serviceType === "flight") return t("ux.booking.stepBaggage");
      if (serviceType === "hotel" || serviceType === "stay") return t("ux.booking.stepOptions");
      return t("ux.booking.stepExtras");
    }
    if (stepNumber === 3) {
      if (serviceType === "flight") return t("ux.booking.stepSeats");
      if (serviceType === "hotel" || serviceType === "stay") return t("ux.booking.stepPreferences");
      return t("ux.booking.stepDetails");
    }
    return t("ux.booking.stepPayment");
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
                <div className="mt-2 text-xs text-warning-foreground">
                  ⚠️ {flightData.stops} escale(s)
                </div>
              )}
            </div>
          </div>
        </>
      );
    }

    return (
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Circuit</p>
            <h3 className="mt-1 font-semibold leading-snug">{serviceName}</h3>
          </div>
        </div>
        {serviceLocation && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 text-primary" />
            <span>{serviceLocation}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="h-4 w-4 text-primary" />
          <span>
            {new Date(startDate).toLocaleDateString(currentLocaleTag())}
            {endDate && ` – ${new Date(endDate).toLocaleDateString(currentLocaleTag())}`}
          </span>
        </div>
      </div>
    );
  };

  const summaryCard = (
      <Card className="overflow-hidden border shadow-sm">
        <div className="border-b bg-muted/30 px-5 py-4">
          <h2 className="font-semibold">{t("ux.booking.yourExperience")}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{t("ux.booking.essentialDetails")}</p>
        </div>
        <div className="space-y-5 p-5">
          {renderServiceDetails()}
          <Separator />
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" /> {t("ux.booking.participants")}
            </span>
            <span className="font-medium">
              {t("ux.booking.adults", { count: adultsCount })}
              {childrenCount > 0 && `, ${t("ux.booking.children", { count: childrenCount })}`}
            </span>
          </div>
          {serviceType === "flight" && flightData && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("ux.booking.fare")}</span>
              <span className="font-medium">{flightData.fare === "basic" ? "Basic" : "Benefits"}</span>
            </div>
          )}
          <div className="rounded-xl bg-primary/5 p-4">
            <p className="text-xs text-muted-foreground">{t("ux.booking.basePrice")}</p>
            <p className="mt-1 text-2xl font-bold text-primary">
              <Price amount={parseFloat(servicePrice)} fromCurrency={serviceType === "flight" ? "EUR" : serviceCurrency} />
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{t("ux.booking.totalConfirmedLater")}</p>
          </div>
          <div className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>{t("ux.booking.reviewBeforeConfirm")}</span>
          </div>
        </div>
      </Card>
  );

  return (
    <div className="min-h-screen bg-background pt-16">
      <Navbar />

      {/* Mobile : étape et prix toujours visibles, détail dans un volet */}
      <div className="sticky top-14 z-30 border-b border-border bg-card/95 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">
              {t("ux.booking.stepOf", { current: currentStep, total: steps.length })} · {getStepTitle(currentStep)}
            </p>
            <p className="t-price truncate text-base text-foreground">
              <Price amount={parseFloat(servicePrice)} fromCurrency={serviceType === "flight" ? "EUR" : serviceCurrency} />
            </p>
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="shrink-0">
                {t("ux.booking.detail")}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto rounded-t-3xl p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              <SheetHeader className="mb-3 text-left">
                <SheetTitle>{t("ux.booking.summary")}</SheetTitle>
              </SheetHeader>
              {summaryCard}
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-10">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-5 -ml-3 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("ux.booking.back")}
        </Button>

        <section className="relative mb-8 overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/10 via-background to-accent/10 p-6 shadow-sm md:p-9">
          <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <Badge variant="secondary" className="mb-4 rounded-full px-3 py-1">
                {serviceType === "tour" ? t("ux.booking.tourBadge") : `${getServiceIcon()} ${t("ux.booking.bookingBadge")}`}
              </Badge>
              <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                {serviceType === "tour" ? t("ux.booking.tourTitle") : t("ux.booking.title")}
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
                {t("ux.booking.intro")}
              </p>
            </div>
            <div className="flex items-center gap-4 rounded-2xl border bg-background/80 px-5 py-4 shadow-sm backdrop-blur">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("ux.booking.basePrice")}</p>
                <p className="text-xl font-bold text-primary">
                  <Price amount={parseFloat(servicePrice)} fromCurrency={serviceType === "flight" ? "EUR" : serviceCurrency} />
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(260px,0.85fr)_minmax(0,2fr)] lg:gap-8">
          {/* Colonne gauche - Détails du service */}
          <aside className="hidden lg:block lg:sticky lg:top-24">
            {summaryCard}
          </aside>

          {/* Colonne droite - Processus de réservation */}
          <div className="min-w-0">
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
                serviceCurrency={serviceCurrency}
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
