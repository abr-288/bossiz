import { motion } from "framer-motion";
import { Plane, User, Briefcase, Armchair, CreditCard, Calendar, Clock, MapPin, LogIn, AlertTriangle, Timer } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { UnifiedSubmitButton } from "@/components/forms/UnifiedSubmitButton";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Price } from "@/components/ui/price";
import { supabase } from "@/integrations/supabase/client";
import { useSecureFlightBooking, FlightData, PassengerData } from "@/hooks/useSecureFlightBooking";
import { useCreateBooking } from "@/hooks/useCreateBooking";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";
import { CurrencyConverter } from "@/utils/currencyConverter";

interface Passenger {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  documentType: string;
  documentNumber: string;
}

interface SummaryStepProps {
  flightData?: {
    origin: string;
    destination: string;
    departureDate: string;
    returnDate: string | null;
    departureTime: string;
    arrivalTime: string;
    duration: string;
    airline: string;
    airlineCode?: string;
    flightNumber: string;
    price: string;
    stops: number;
    fare: string;
  } | null;
  serviceType: string;
  serviceId?: string;
  serviceName: string;
  servicePrice: number;
  serviceCurrency: string;
  serviceLocation: string;
  startDate: string;
  endDate?: string;
  passengers: Passenger[];
  selectedOptions: Record<string, number>;
  selectedPreferences: Record<string, any>;
  adultsCount: number;
  childrenCount: number;
  onBack: () => void;
}

export const SummaryStep = ({
  flightData,
  serviceType,
  serviceId,
  serviceName,
  servicePrice,
  serviceCurrency,
  serviceLocation,
  startDate,
  endDate,
  passengers,
  selectedOptions,
  selectedPreferences,
  adultsCount,
  childrenCount,
  onBack,
}: SummaryStepProps) => {
  const { t, i18n } = useTranslation();
  const [paymentPlan, setPaymentPlan] = useState<"full" | "deposit">("full");
  const [depositPercent, setDepositPercent] = useState(30);
  const [depositAvailable, setDepositAvailable] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const [isPrebookingDone, setIsPrebookingDone] = useState(false);
  const [myCompanies, setMyCompanies] = useState<{ id: string; name: string }[]>([]);
  const [billToCompanyId, setBillToCompanyId] = useState<string | null>(null);
  const [travelPolicy, setTravelPolicy] = useState<{ max_amount: number; currency: string } | null>(null);
  
  const { prebook, checkout, prebookingData, checkoutData, loading: secureLoading, isPrebookingValid, getRemainingSeconds, reset } = useSecureFlightBooking();
  const { createBooking, loading: bookingLoading } = useCreateBooking();
  const navigate = useNavigate();

  const loading = secureLoading || bookingLoading;

  useEffect(() => {
    if (["hotel", "flight", "train"].includes(serviceType)) {
      setDepositAvailable(false);
      return;
    }
    supabase
      .from("site_config")
      .select("config_value")
      .eq("config_key", "booking_payment_policy")
      .maybeSingle()
      .then(({ data }) => {
        const policy = data?.config_value as any;
        const allowedTypes = Array.isArray(policy?.enabledServiceTypes) ? policy.enabledServiceTypes : [];
        const isAllowed = policy?.depositEnabled !== false && allowedTypes.includes(serviceType);
        setDepositAvailable(isAllowed);
        setDepositPercent(Math.min(99, Math.max(1, Number(policy?.depositPercent) || 30)));
      });
  }, [serviceType]);

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Fetch the company's travel policy for this service type when billing to
  // a company, so the "conforme / hors politique" badge reflects real data
  // instead of always being silent about it.
  useEffect(() => {
    if (!billToCompanyId) {
      setTravelPolicy(null);
      return;
    }
    supabase
      .from("travel_policies")
      .select("max_amount, currency")
      .eq("company_id", billToCompanyId)
      .eq("service_type", serviceType)
      .maybeSingle()
      .then(({ data }) => setTravelPolicy(data));
  }, [billToCompanyId, serviceType]);

  // Update remaining time every second
  useEffect(() => {
    if (prebookingData?.expires_at) {
      const interval = setInterval(() => {
        const remaining = getRemainingSeconds();
        setRemainingTime(remaining);
        
        if (remaining <= 0) {
          clearInterval(interval);
          toast.error(t("ux.summary.expiredToast"), {
            description: t("ux.summary.expiredToastDesc"),
          });
        }
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [prebookingData, getRemainingSeconds]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setIsAuthenticated(!!user);
    if (user) {
      const { data } = await supabase
        .from("company_members")
        .select("company_id, companies(name)")
        .eq("user_id", user.id);
      setMyCompanies((data || []).map((m: any) => ({ id: m.company_id, name: m.companies?.name || t("ux.summary.company") })));
    }
  };

  // Convert frontend passenger format to API format
  const convertPassengers = (passengers: Passenger[]): PassengerData[] => {
    return passengers.map(p => ({
      first_name: p.firstName,
      last_name: p.lastName,
      date_of_birth: p.dateOfBirth,
      nationality: p.nationality,
      document_type: p.documentType,
      document_number: p.documentNumber,
    }));
  };

  // Convert frontend flight data to API format
  const convertFlightData = (): FlightData | null => {
    if (!flightData) return null;
    
    return {
      origin: flightData.origin,
      destination: flightData.destination,
      departure_date: flightData.departureDate,
      return_date: flightData.returnDate || undefined,
      departure_time: flightData.departureTime,
      arrival_time: flightData.arrivalTime,
      duration: flightData.duration,
      airline: flightData.airline,
      airline_code: flightData.airlineCode || '',
      flight_number: flightData.flightNumber,
      price: parseFloat(flightData.price),
      stops: flightData.stops,
      fare: flightData.fare,
      provider: 'amadeus',
    };
  };

  // Format remaining time as MM:SS
  const formatRemainingTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * SECURE BOOKING FLOW - Step 1: Pre-book (mandatory for flights)
   */
  const handlePrebook = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      setShowLoginDialog(true);
      return;
    }

    if (serviceType === 'flight' && flightData) {
      const apiFlightData = convertFlightData();
      if (!apiFlightData) {
        toast.error(t("ux.summary.invalidFlight"));
        return;
      }

      const result = await prebook(
        apiFlightData,
        convertPassengers(passengers),
        adultsCount,
        childrenCount,
        selectedOptions,
        selectedPreferences
      );

      if (result.success) {
        setIsPrebookingDone(true);
        toast.success(t("ux.summary.fareLocked"), {
          description: t("ux.summary.fareLockedDesc", { ref: result.booking_reference, minutes: result.expires_in_seconds! / 60 }),
        });
      }
    } else {
      // For non-flight services, skip pre-booking and go directly to payment
      await handlePayment();
    }
  };

  /**
   * SECURE BOOKING FLOW - Step 2: Checkout and Payment
   */
  const handlePayment = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      setShowLoginDialog(true);
      return;
    }

    try {
      // For flights, validate pre-booking first
      if (serviceType === 'flight' && prebookingData) {
        if (!isPrebookingValid()) {
          toast.error(t("ux.summary.expiredToast"), {
            description: t("ux.summary.expiredToastDesc"),
          });
          reset();
          setIsPrebookingDone(false);
          return;
        }

        // Call checkout to get signed price summary
        const checkoutResult = await checkout();
        
        if (!checkoutResult.success) {
          return;
        }

        // Use server-calculated price from checkout
        const serverPrice = checkoutResult.checkout!.price_breakdown.total_amount;
        
        // Create booking with server-validated data
        const bookingId = await createBooking({
          service_type: 'flight',
          service_name: `Vol ${flightData?.origin} - ${flightData?.destination}`,
          service_description: `${flightData?.airline} - ${flightData?.flightNumber}`,
          location: flightData?.origin || '',
          start_date: startDate,
          end_date: endDate || startDate,
          guests: adultsCount + childrenCount,
          total_price: serverPrice, // CRITICAL: Use server price
          supplier_cost: checkoutResult.checkout!.price_breakdown.base_fare,
          currency: "XOF",
          customer_name: `${passengers[0].firstName} ${passengers[0].lastName}`,
          customer_email: user.email || "client@example.com",
          customer_phone: "+225 00 00 00 00",
          passengers: convertPassengers(passengers),
          booking_details: {
            prebooking_id: prebookingData.prebooking_id,
            booking_reference: prebookingData.booking_reference,
            checkout_signature: checkoutResult.checkout!.checkout_signature,
            flight: flightData,
            price_breakdown: checkoutResult.checkout!.price_breakdown,
            options: selectedOptions,
            preferences: selectedPreferences,
            paymentMethod: "jeko",
          },
          company_id: billToCompanyId || undefined,
        });

        if (bookingId) {
          if (billToCompanyId) {
            toast.success(t("ux.summary.submittedForApproval"));
            navigate("/booking-history");
          } else {
            // Navigate to payment with prebooking reference
            navigate(`/payment?bookingId=${bookingId}&prebookingId=${prebookingData.prebooking_id}`);
          }
        }
      } else {
        // Non-flight services - use existing flow
        const totalPrice = getTotalPrice();
        // Stay and activity use their dedicated catalogs; tours already refer
        // to the generic services catalog. Other types have no reusable row.
        // create-booking verifies catalog-backed prices server-side.
        const verifiableServiceId = ['stay', 'activity', 'tour'].includes(serviceType) ? serviceId : undefined;

        const bookingId = await createBooking({
          service_id: verifiableServiceId,
          service_type: serviceType as any,
          service_name: serviceName,
          service_description: serviceLocation,
          location: serviceLocation,
          start_date: startDate,
          end_date: endDate || startDate,
          guests: adultsCount + childrenCount,
          total_price: totalPrice,
          currency: "XOF",
          customer_name: `${passengers[0].firstName} ${passengers[0].lastName}`,
          customer_email: user.email || "client@example.com",
          customer_phone: "+225 00 00 00 00",
          passengers: convertPassengers(passengers),
          booking_details: {
            options: selectedOptions,
            preferences: selectedPreferences,
            paymentMethod: "jeko",
          },
          company_id: billToCompanyId || undefined,
          payment_plan: paymentPlan,
        });

        if (bookingId) {
          if (billToCompanyId) {
            toast.success(t("ux.summary.submittedForApproval"));
            navigate("/booking-history");
          } else {
            navigate(`/payment?bookingId=${bookingId}`);
          }
        }
      }
    } catch (error) {
      console.error("Erreur lors de la création de la réservation:", error);
    }
  };

  const handleLoginRedirect = () => {
    sessionStorage.setItem('pendingBooking', JSON.stringify({
      flightData,
      serviceType,
      serviceName,
      servicePrice,
      serviceLocation,
      startDate,
      endDate,
      passengers,
      selectedOptions,
      selectedPreferences,
      adultsCount,
      childrenCount,
    }));
    navigate('/auth');
  };

  // Price calculations - DISPLAY ONLY (real price comes from server)
  const getOptionsPrice = () => {
    const optionPrices: Record<string, number> = {
      "cabin-large": 15000,
      "checked-20": 25000,
      "checked-30": 40000,
      "breakfast": 8000,
      "wifi-premium": 3000,
      "late-checkout": 15000,
      "room-upgrade": 25000,
      "full-insurance": 15000,
      "gps": 5000,
      "child-seat": 8000,
      "extra-driver": 10000,
      "guide-private": 25000,
      "meals": 15000,
      "photo-pack": 20000,
      "transport-vip": 35000,
      "premium": 15000,
      "support": 10000,
    };
    
    return Object.entries(selectedOptions).reduce((total, [id, quantity]) => {
      return total + (optionPrices[id] || 0) * quantity;
    }, 0);
  };

  const getPreferencesPrice = () => {
    const selectedSeats = (selectedPreferences.seats as string[]) || [];
    return selectedSeats.length * 7500;
  };

  // Flight search prices are in EUR; catalog prices use the currency stored
  // on the service row. Convert both to XOF before adding XOF-priced options.
  // This pre-checkout total is DISPLAY ONLY - the real, authoritative amount
  // is server-computed in prebook/checkout - but it must still show the
  // right order of magnitude before the user gets there.
  const EUR_TO_XOF_RATE = 656;
  const getBasePrice = () => {
    const basePrice = flightData
      ? parseFloat(flightData.price) * EUR_TO_XOF_RATE
      : CurrencyConverter.autoConvertToXOF(servicePrice, serviceCurrency).convertedAmount;
    return basePrice * (adultsCount + childrenCount);
  };

  const getTotalPrice = () => {
    // If we have server-calculated price, use it
    if (checkoutData?.checkout?.price_breakdown) {
      return checkoutData.checkout.price_breakdown.total_amount;
    }
    if (prebookingData?.price_breakdown) {
      return prebookingData.price_breakdown.total_amount;
    }
    // Fallback to estimated client-side calculation (display only)
    return getBasePrice() + getOptionsPrice() + getPreferencesPrice();
  };

  // Determine which price breakdown to display
  const displayPriceBreakdown = prebookingData?.price_breakdown || checkoutData?.checkout?.price_breakdown;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="bg-primary/5 p-6 rounded-lg border border-primary/20">
        <h2 className="text-2xl font-bold text-primary mb-2">{t("ux.summary.title")}</h2>
        <p className="text-muted-foreground">
          {t("ux.summary.subtitle")}
        </p>
      </div>

      {/* Pre-booking timer alert */}
      {isPrebookingDone && prebookingData && remainingTime > 0 && (
        <Alert className={`border-2 ${remainingTime < 120 ? 'border-destructive bg-destructive/10' : 'border-gold bg-gold/10'}`}>
          <Timer className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <span className="font-semibold">{t("ux.summary.fareLocked")}</span>
              <span className="ml-2 text-muted-foreground">
                {t("ux.summary.reference", { ref: prebookingData.booking_reference })}
              </span>
            </div>
            <Badge variant={remainingTime < 120 ? "destructive" : "secondary"} className="text-lg px-3 py-1">
              {formatRemainingTime(remainingTime)}
            </Badge>
          </AlertDescription>
        </Alert>
      )}

      {/* Expired alert */}
      {isPrebookingDone && prebookingData && remainingTime <= 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <span className="font-semibold">{t("ux.summary.fareExpired")}</span>
            <span className="ml-2">{t("ux.summary.restartBooking")}</span>
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-4"
              onClick={() => {
                reset();
                setIsPrebookingDone(false);
              }}
            >
              {t("ux.summary.restart")}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Détails de la réservation */}
        <div className="lg:col-span-2 space-y-6">
          {/* Service Details */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Plane className="h-5 w-5 text-primary" />
              {flightData ? t("ux.summary.flightDetails") : t("ux.summary.serviceDetails")}
            </h3>
            <div className="space-y-4">
              {flightData ? (
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
                          <Badge variant="secondary" className="px-3">
                            {flightData.duration}
                          </Badge>
                          <Separator className="flex-1" />
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">{flightData.arrivalTime}</p>
                          <p className="text-sm text-muted-foreground">{flightData.destination}</p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {flightData.airline} • {t("ux.summary.flightNumber", { number: flightData.flightNumber })}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{new Date(flightData.departureDate).toLocaleDateString(i18n.language)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{flightData.stops === 0 ? t("ux.summary.direct") : t("ux.summary.stops", { count: flightData.stops })}</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("ux.summary.service")}</span>
                      <span className="font-medium">{serviceName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("ux.summary.location")}</span>
                      <span className="font-medium">{serviceLocation}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("ux.summary.startDate")}</span>
                      <span className="font-medium">
                        {new Date(startDate).toLocaleDateString(i18n.language)}
                      </span>
                    </div>
                    {endDate && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("ux.summary.endDate")}</span>
                        <span className="font-medium">
                          {new Date(endDate).toLocaleDateString(i18n.language)}
                        </span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </Card>

          {/* Passagers */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              {t("ux.summary.passengers")}
            </h3>
            <div className="space-y-3">
              {passengers.map((passenger, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">
                      {passenger.firstName} {passenger.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {passenger.documentType === "passport" ? t("ux.passenger.passport") : t("ux.passenger.idCard")} : {passenger.documentNumber}
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {index < adultsCount ? t("ux.passenger.adult") : t("ux.passenger.child")}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* Options */}
          {Object.keys(selectedOptions).some(key => selectedOptions[key] > 0) && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                {t("ux.summary.selectedOptions")}
              </h3>
              <div className="space-y-2">
                {Object.entries(selectedOptions).map(([id, quantity]) => {
                  if (quantity === 0) return null;
                  return (
                    <div key={id} className="flex justify-between items-center">
                      <span className="text-sm">{id} ({quantity}x)</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Préférences */}
          {serviceType === "flight" && (selectedPreferences.seats as string[] || []).length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Armchair className="h-5 w-5 text-primary" />
                {t("ux.summary.selectedSeats")}
              </h3>
              <div className="flex flex-wrap gap-2">
                {((selectedPreferences.seats as string[]) || []).map((seat) => (
                  <Badge key={seat} variant="secondary" className="px-3 py-1">
                    {seat}
                  </Badge>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Résumé des prix */}
        <div className="space-y-6">
          <Card className="p-6 sticky top-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              {t("ux.summary.priceDetails")}
            </h3>
            <div className="space-y-3">
              {/* Show server-calculated breakdown if available */}
              {displayPriceBreakdown ? (
                <>
                  <div className="flex justify-between text-sm">
                    <span>{t("ux.summary.basePrice")}</span>
                    <span className="font-medium">
                      <Price amount={displayPriceBreakdown.base_fare} />
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>{t("ux.summary.taxes")}</span>
                    <span className="font-medium">
                      <Price amount={displayPriceBreakdown.taxes} />
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>{t("ux.summary.serviceFee")}</span>
                    <span className="font-medium">
                      <Price amount={displayPriceBreakdown.service_fee} />
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between text-sm">
                    <span>{t("ux.summary.serviceLine", { count: adultsCount + childrenCount })}</span>
                    <span className="font-medium">
                      <Price amount={getBasePrice()} />
                    </span>
                  </div>
                  {getOptionsPrice() > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>{t("ux.summary.options")}</span>
                      <span className="font-medium">
                        <Price amount={getOptionsPrice()} />
                      </span>
                    </div>
                  )}
                  {getPreferencesPrice() > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>{t("ux.summary.seats")}</span>
                      <span className="font-medium">
                        <Price amount={getPreferencesPrice()} />
                      </span>
                    </div>
                  )}
                </>
              )}
              
              <Separator />
              <div className="flex justify-between items-center">
                <span className="font-semibold text-lg">{t("ux.summary.total")}</span>
                <span className="font-bold text-2xl text-primary">
                  <Price
                    amount={getTotalPrice()}
                    showLoader
                  />
                </span>
              </div>
              
              {displayPriceBreakdown && (
                <p className="text-xs text-muted-foreground text-center">
                  {t("ux.summary.serverPrice")}
                </p>
              )}
            </div>

            <Separator className="my-6" />

            {myCompanies.length > 0 && (
              <div className="space-y-2 mb-4">
                <h4 className="font-semibold">{t("ux.summary.whoPays")}</h4>
                <select
                  className="w-full p-3 rounded-lg border-2 border-border bg-background text-sm"
                  value={billToCompanyId || ""}
                  onChange={(e) => {
                    setBillToCompanyId(e.target.value || null);
                    if (e.target.value) setPaymentPlan("full");
                  }}
                >
                  <option value="">{t("ux.summary.myself")}</option>
                  {myCompanies.map((c) => (
                    <option key={c.id} value={c.id}>{t("ux.summary.billTo", { name: c.name })}</option>
                  ))}
                </select>
                {billToCompanyId && (
                  <>
                    {travelPolicy ? (
                      getTotalPrice() <= travelPolicy.max_amount ? (
                        <Badge className="bg-success/10 text-success hover:bg-success/10 gap-1.5">
                          {t("ux.summary.policyOk")}
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="gap-1.5">
                          <AlertTriangle className="w-3 h-3" /> {t("ux.summary.policyOver")} <Price amount={travelPolicy.max_amount} fromCurrency={travelPolicy.currency} />)
                        </Badge>
                      )
                    ) : (
                      <Badge variant="outline" className="gap-1.5 text-muted-foreground">
                        {t("ux.summary.noPolicy")}
                      </Badge>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {t("ux.summary.approvalNote")}
                    </p>
                  </>
                )}
              </div>
            )}

            {!billToCompanyId && (
              <div className="space-y-4">
                {depositAvailable && (
                  <div className="space-y-2">
                    <h4 className="font-semibold">{t("ux.summary.amountNow")}</h4>
                    <button
                      type="button"
                      onClick={() => setPaymentPlan("full")}
                      className={`w-full p-3 rounded-lg border-2 text-left ${paymentPlan === "full" ? "border-primary bg-primary/5" : "border-border"}`}
                    >
                      <span className="font-medium">{t("ux.summary.payFull")}</span>
                      <span className="block text-sm text-muted-foreground"><Price amount={getTotalPrice()} /></span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentPlan("deposit")}
                      className={`w-full p-3 rounded-lg border-2 text-left ${paymentPlan === "deposit" ? "border-primary bg-primary/5" : "border-border"}`}
                    >
                      <span className="font-medium">{t("ux.summary.deposit", { percent: depositPercent })}</span>
                      <span className="block text-sm text-muted-foreground">
                        <Price amount={Math.ceil(getTotalPrice() * depositPercent / 100)} /> {t("ux.summary.payNow")} <Price amount={getTotalPrice() - Math.ceil(getTotalPrice() * depositPercent / 100)} /> {t("ux.summary.onSite")}
                      </span>
                    </button>
                  </div>
                )}
                <div className="flex items-start gap-3 rounded-xl border border-primary/15 bg-primary/5 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">{t("ux.summary.securePayment")}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t("ux.summary.securePaymentDesc")}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="booking-actions space-y-3">
              {/* For flights: Two-step process */}
              {serviceType === 'flight' && !isPrebookingDone && (
                <UnifiedSubmitButton
                  variant="default"
                  fullWidth
                  loading={loading}
                  onClick={handlePrebook}
                >
                  {t("ux.summary.lockFare")}
                </UnifiedSubmitButton>
              )}
              
              {serviceType === 'flight' && isPrebookingDone && remainingTime > 0 && (
                <UnifiedSubmitButton
                  variant="payment"
                  fullWidth
                  loading={loading}
                  onClick={handlePayment}
                >
                  {billToCompanyId ? t("ux.summary.submitApproval") : t("ux.summary.proceedPayment")}
                </UnifiedSubmitButton>
              )}

              {/* For non-flight services: Direct payment */}
              {serviceType !== 'flight' && (
                <UnifiedSubmitButton
                  variant="payment"
                  fullWidth
                  loading={loading}
                  onClick={handlePayment}
                >
                  {billToCompanyId ? t("ux.summary.submitApproval") : t("ux.summary.proceedPayment")}
                </UnifiedSubmitButton>
              )}
            </div>

            <Button type="button" variant="outline" onClick={onBack} className="mt-3 w-full">
              {t("ux.booking.back")}
            </Button>
          </Card>
        </div>
      </div>

      {/* Dialog de connexion */}
      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogIn className="h-5 w-5 text-primary" />
              {t("ux.summary.loginRequired")}
            </DialogTitle>
            <DialogDescription>
              {t("ux.summary.loginRequiredDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground">
              {t("ux.summary.loginBenefits")}
            </p>
            <ul className="text-sm space-y-2 text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="text-primary">✓</span> {t("ux.summary.benefitTrack")}
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">✓</span> {t("ux.summary.benefitEmail")}
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">✓</span> {t("ux.summary.benefitManage")}
              </li>
            </ul>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowLoginDialog(false)} className="flex-1">
                {t("ux.summary.cancel")}
              </Button>
              <Button onClick={handleLoginRedirect} className="flex-1">
                {t("ux.summary.signIn")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};
