import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Price } from "@/components/ui/price";
import { PassengerStep } from "@/components/booking-steps/PassengerStep";
import { UnifiedSubmitButton } from "@/components/forms/UnifiedSubmitButton";
import { useCreateBooking } from "@/hooks/useCreateBooking";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  Plane, Hotel, MapPin, Calendar, Clock, Users, Star,
  Check, ArrowLeft, CreditCard, LogIn
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface FlightDetails {
  id: string;
  airline: string;
  price: number;
  departure: string;
  return: string;
  duration: string;
  stops: number;
  origin?: string;
  destination?: string;
}

interface HotelDetails {
  id: string;
  name: string;
  rating: number;
  price: number;
  image: string;
  address: string;
  amenities: string[];
  description: string;
  checkIn?: string;
  checkOut?: string;
  nights?: number;
}

interface Passenger {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  documentType: "passport" | "id_card";
  documentNumber: string;
}

const FlightHotelBookingProcess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { createBooking, loading: bookingLoading } = useCreateBooking();
  const { t } = useTranslation();

  const [currentStep, setCurrentStep] = useState(1);
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"mobile" | "card">("mobile");
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Récupérer les données du package depuis les params URL
  const flightData: FlightDetails | null = searchParams.get("flight") 
    ? JSON.parse(decodeURIComponent(searchParams.get("flight")!))
    : null;
  const hotelData: HotelDetails | null = searchParams.get("hotel")
    ? JSON.parse(decodeURIComponent(searchParams.get("hotel")!))
    : null;
  const searchData = searchParams.get("search")
    ? JSON.parse(decodeURIComponent(searchParams.get("search")!))
    : null;

  const adults = searchData?.adults || 1;
  const children = searchData?.children || 0;
  const rooms = searchData?.rooms || 1;
  const totalPassengers = adults + children;

  useEffect(() => {
    checkAuth();
    // Vérifier que les données sont présentes
    if (!flightData || !hotelData) {
      toast.error("Données de réservation manquantes");
      navigate("/flight-hotel");
    }
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setIsAuthenticated(!!user);
  };

  // Calculer les nuits d'hôtel
  const calculateNights = () => {
    if (!flightData) return 1;
    const departure = new Date(flightData.departure);
    const returnDate = new Date(flightData.return);
    const nights = Math.ceil((returnDate.getTime() - departure.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(1, nights);
  };

  const nights = calculateNights();

  // Calculer le prix total (pas de faux discount)
  const calculateTotal = () => {
    if (!flightData || !hotelData) return 0;
    const flightTotal = flightData.price * totalPassengers;
    const hotelTotal = hotelData.price * nights * rooms;
    return flightTotal + hotelTotal;
  };

  const steps = [
    { id: 1, label: "Participants", icon: Users },
    { id: 2, label: "Récapitulatif", icon: Check },
    { id: 3, label: "Paiement", icon: CreditCard },
  ];

  const handlePassengersComplete = () => {
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePayment = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      setShowLoginDialog(true);
      return;
    }

    if (!flightData || !hotelData) {
      toast.error("Données de réservation manquantes");
      return;
    }

    try {
      const bookingId = await createBooking({
        service_type: "flight_hotel",
        service_name: `Vol + Hôtel: ${searchData?.origin || ''} → ${searchData?.destination || ''}`,
        service_description: `${flightData.airline} + ${hotelData.name}`,
        location: searchData?.destination || hotelData.address,
        start_date: flightData.departure,
        end_date: flightData.return,
        guests: totalPassengers,
        total_price: calculateTotal(),
        currency: "EUR",
        customer_name: `${passengers[0]?.firstName || ''} ${passengers[0]?.lastName || ''}`,
        customer_email: user.email || "",
        customer_phone: "+225 00 00 00 00",
        passengers: passengers.map((p) => ({
          first_name: p.firstName,
          last_name: p.lastName,
          date_of_birth: p.dateOfBirth,
          document_type: p.documentType,
          document_number: p.documentNumber,
          nationality: p.nationality,
        })),
        booking_details: {
          type: "flight_hotel_package",
          flight: {
            ...flightData,
            origin: searchData?.origin,
            destination: searchData?.destination,
            class: searchData?.travelClass,
          },
          hotel: {
            ...hotelData,
            checkIn: flightData.departure,
            checkOut: flightData.return,
            nights: nights,
            rooms: rooms,
          },
          paymentMethod,
        },
      });

      if (bookingId) {
        navigate(`/payment?bookingId=${bookingId}`);
      }
    } catch (error) {
      console.error("Erreur lors de la création de la réservation:", error);
      toast.error("Erreur lors de la création de la réservation");
    }
  };

  const handleLoginRedirect = () => {
    sessionStorage.setItem('pendingPackageBooking', JSON.stringify({
      flight: flightData,
      hotel: hotelData,
      search: searchData,
      passengers,
    }));
    navigate('/auth');
  };

  if (!flightData || !hotelData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col pt-16">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-6 md:py-8">
        {/* En-tête */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/flight-hotel")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('pages.flightHotelBookingProcess.backToSearch')}
          </Button>
          
          <h1 className="text-2xl md:text-3xl font-bold">Réservation Vol + Hôtel</h1>
          <p className="text-muted-foreground">
            {searchData?.origin} → {searchData?.destination}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stepper */}
            <div className="flex items-center justify-between mb-8">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    currentStep >= step.id 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {currentStep > step.id ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <step.icon className="h-5 w-5" />
                    )}
                  </div>
                  <span className={`ml-2 text-sm font-medium ${
                    currentStep >= step.id ? "text-foreground" : "text-muted-foreground"
                  }`}>
                    {step.label}
                  </span>
                  {index < steps.length - 1 && (
                    <Separator className={`mx-4 w-12 ${
                      currentStep > step.id ? "bg-primary" : "bg-muted"
                    }`} />
                  )}
                </div>
              ))}
            </div>

            {/* Étape 1: Passagers */}
            {currentStep === 1 && (
              <PassengerStep
                passengers={passengers}
                onPassengersChange={setPassengers}
                adultsCount={adults}
                childrenCount={children}
                onNext={handlePassengersComplete}
                serviceType="flight_hotel"
              />
            )}

            {/* Étape 2 & 3: Récapitulatif et Paiement */}
            {currentStep >= 2 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Détails du vol */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Plane className="h-5 w-5 text-primary" />
                    {t('booking.summary.flightDetails')}
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{flightData.airline}</p>
                        <p className="text-sm text-muted-foreground">
                          {flightData.stops === 0 ? "Vol direct" : `${flightData.stops} escale(s)`} • {flightData.duration}
                        </p>
                      </div>
                      <Badge variant="secondary">{searchData?.travelClass || "ECONOMY"}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>Aller: {new Date(flightData.departure).toLocaleDateString("fr-FR")}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>Retour: {new Date(flightData.return).toLocaleDateString("fr-FR")}</span>
                      </div>
                    </div>
                    <div className="flex justify-between pt-3 border-t">
                      <span className="text-muted-foreground">Prix vol ({totalPassengers} passager{totalPassengers > 1 ? "s" : ""})</span>
                      <span className="font-semibold">
                        <Price amount={flightData.price * totalPassengers} fromCurrency="EUR" />
                      </span>
                    </div>
                  </div>
                </Card>

                {/* Détails de l'hôtel */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Hotel className="h-5 w-5 text-primary" />
                    {t('booking.summary.hotelDetails')}
                  </h3>
                  <div className="flex gap-4">
                    <img 
                      src={hotelData.image} 
                      alt={hotelData.name}
                      className="w-32 h-24 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium">{hotelData.name}</h4>
                      <div className="flex items-center gap-1 mt-1">
                        {[...Array(hotelData.rating)].map((_, i) => (
                          <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {hotelData.address}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {hotelData.amenities?.slice(0, 4).map((amenity, idx) => (
                      <Badge key={idx} variant="outline">{amenity}</Badge>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>Check-in: {new Date(flightData.departure).toLocaleDateString("fr-FR")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>Check-out: {new Date(flightData.return).toLocaleDateString("fr-FR")}</span>
                    </div>
                  </div>
                  <div className="flex justify-between pt-3 mt-3 border-t">
                    <span className="text-muted-foreground">
                      Prix hôtel ({nights} nuit{nights > 1 ? "s" : ""}, {rooms} chambre{rooms > 1 ? "s" : ""})
                    </span>
                    <span className="font-semibold">
                      <Price amount={hotelData.price * nights * rooms} fromCurrency="EUR" />
                    </span>
                  </div>
                </Card>

                {/* Passagers */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Passagers
                  </h3>
                  <div className="space-y-3">
                    {passengers.map((passenger, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium">
                            {passenger.firstName} {passenger.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {passenger.documentType === "passport" ? "Passeport" : "Carte d'identité"}: {passenger.documentNumber}
                          </p>
                        </div>
                        <Badge variant="secondary">
                          {index < adults ? "Adulte" : "Enfant"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Mode de paiement */}
                {currentStep === 2 && (
                  <div className="flex gap-4 mt-6">
                    <Button variant="outline" onClick={() => setCurrentStep(1)} className="flex-1">
                      Retour
                    </Button>
                    <Button onClick={() => setCurrentStep(3)} className="flex-1">
                      {t('booking.summary.continueToPayment')}
                    </Button>
                  </div>
                )}

                {currentStep === 3 && (
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Mode de paiement</h3>
                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("mobile")}
                        className={`w-full p-4 rounded-lg border-2 transition-all ${
                          paymentMethod === "mobile"
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            📱
                          </div>
                          <div className="text-left">
                            <p className="font-medium">Mobile Money</p>
                            <p className="text-xs text-muted-foreground">Orange, MTN, Moov</p>
                          </div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("card")}
                        className={`w-full p-4 rounded-lg border-2 transition-all ${
                          paymentMethod === "card"
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            💳
                          </div>
                          <div className="text-left">
                            <p className="font-medium">Carte bancaire</p>
                            <p className="text-xs text-muted-foreground">Visa, Mastercard</p>
                          </div>
                        </div>
                      </button>
                    </div>

                    <div className="flex gap-4 mt-6">
                      <Button variant="outline" onClick={() => setCurrentStep(2)} className="flex-1">
                        Retour
                      </Button>
                      <UnifiedSubmitButton
                        variant="payment"
                        loading={bookingLoading}
                        onClick={handlePayment}
                        className="flex-1"
                      >
                        {t('booking.summary.proceedToPayment')}
                      </UnifiedSubmitButton>
                    </div>
                  </Card>
                )}
              </motion.div>
            )}
          </div>

          {/* Sidebar - Résumé du package */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-24">
              <h3 className="text-lg font-semibold mb-4">Résumé du package</h3>
              
              {/* Vol */}
              <div className="mb-4">
                <div className="flex items-center gap-2 text-sm font-medium mb-2">
                  <Plane className="h-4 w-4 text-primary" />
                  Vol
                </div>
                <p className="text-sm">{flightData.airline}</p>
                <p className="text-xs text-muted-foreground">
                  {searchData?.origin} → {searchData?.destination}
                </p>
                <p className="text-sm font-medium mt-1">
                  <Price amount={flightData.price * totalPassengers} fromCurrency="EUR" />
                </p>
              </div>

              <Separator className="my-4" />

              {/* Hôtel */}
              <div className="mb-4">
                <div className="flex items-center gap-2 text-sm font-medium mb-2">
                  <Hotel className="h-4 w-4 text-primary" />
                  {t('confirmation.serviceTypes.hotel')}
                </div>
                <p className="text-sm">{hotelData.name}</p>
                <p className="text-xs text-muted-foreground">
                  {nights} nuit{nights > 1 ? "s" : ""}, {rooms} chambre{rooms > 1 ? "s" : ""}
                </p>
                <p className="text-sm font-medium mt-1">
                  <Price amount={hotelData.price * nights * rooms} fromCurrency="EUR" />
                </p>
              </div>

              <Separator className="my-4" />

              {/* Total */}
              <div className="flex justify-between items-center">
                <span className="font-semibold">Total</span>
                <span className="text-2xl font-bold text-primary">
                  <Price amount={calculateTotal()} fromCurrency="EUR" showLoader />
                </span>
              </div>
              
              <p className="text-xs text-muted-foreground mt-2">
                Prix total pour {totalPassengers} passager{totalPassengers > 1 ? "s" : ""}
              </p>
            </Card>
          </div>
        </div>
      </main>

      {/* Dialog de connexion */}
      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogIn className="h-5 w-5 text-primary" />
              {t('booking.loginDialog.title')}
            </DialogTitle>
            <DialogDescription>
              {t('booking.loginDialog.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground">
              {t('booking.loginDialog.benefitsIntro')}
            </p>
            <ul className="text-sm space-y-2 text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="text-primary">✓</span> Suivre vos réservations
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">✓</span> Recevoir vos confirmations par email
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">✓</span> Gérer vos voyages facilement
              </li>
            </ul>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowLoginDialog(false)} className="flex-1">
                Annuler
              </Button>
              <Button onClick={handleLoginRedirect} className="flex-1">
                Se connecter
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default FlightHotelBookingProcess;