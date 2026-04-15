import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle, Smartphone, CheckCircle2, Wallet } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { paymentSchema, type PaymentInput } from "@/lib/validationSchemas";
import { validateWithSchema, getUserFriendlyErrorMessage } from "@/lib/formHelpers";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ErrorBoundary, { ErrorFallback } from "@/components/ErrorBoundary";
import PaymentMethodSelector from "@/components/PaymentMethodSelector";
import { Price } from "@/components/ui/price";
import CinetPayService from "@/services/cinetpay";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Payment() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const bookingId = searchParams.get("bookingId");

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [booking, setBooking] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState("cinetpay");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [validatedFormData, setValidatedFormData] = useState<PaymentInput | null>(null);
  
  // Customer info
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerCity, setCustomerCity] = useState("Abidjan");

  useEffect(() => {
    if (bookingId) {
      loadBooking();
      loadUserProfile();
    } else {
      navigate("/dashboard?tab=bookings");
    }
  }, [bookingId]);

  const loadBooking = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Non authentifié",
          description: "Veuillez vous connecter pour continuer",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("bookings")
        .select("*, services(name, type, location)")
        .eq("id", bookingId)
        .eq("user_id", user.id) // Security: Only load user's own bookings
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        toast({
          title: "Erreur",
          description: "Réservation introuvable ou accès refusé",
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }

      // Check if payment already completed
      if (data.payment_status === "paid") {
        toast({
          title: "Paiement déjà effectué",
          description: "Cette réservation a déjà été payée",
        });
        navigate("/dashboard");
        return;
      }

      // Check if booking is cancelled
      if (data.status === "cancelled") {
        toast({
          title: "Réservation annulée",
          description: "Cette réservation a été annulée",
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }

      setBooking(data);
      setCustomerName(data.customer_name || "");
      setCustomerEmail(data.customer_email || "");
      setCustomerPhone(data.customer_phone || "");
    } catch (error: any) {
      console.error("Error loading booking:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de charger la réservation",
        variant: "destructive",
      });
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const loadUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        if (profile) {
          if (!customerName) setCustomerName(profile.full_name || "");
          if (!customerPhone) setCustomerPhone(profile.phone || "");
          if (!customerEmail) setCustomerEmail(user.email || "");
        } else if (!customerEmail) {
          setCustomerEmail(user.email || "");
        }
      }
    } catch (error) {
      console.error("Error loading user profile:", error);
    }
  };

  const handlePayment = async () => {
    if (!booking) return;

    // Clear previous errors
    setValidationErrors({});
    setGeneralError(null);

    // Validate form data with Zod
    const formData: PaymentInput = {
      customerName,
      customerEmail,
      customerPhone,
      customerAddress: customerAddress || undefined,
      customerCity,
      paymentMethod: paymentMethod as "wave" | "mobile_money" | "card" | "bank_transfer",
    };

    const validation = validateWithSchema(paymentSchema, formData);

    if (validation.success === false) {
      // Accès safe aux erreurs après vérification explicite
      setValidationErrors(validation.errors);
      toast({
        title: "Erreur de validation",
        description: "Veuillez corriger les erreurs dans le formulaire",
        variant: "destructive",
      });
      
      // Scroll to first error
      const firstErrorField = Object.keys(validation.errors)[0];
      document.getElementById(firstErrorField)?.focus();
      return;
    }

    // Show confirmation dialog for mobile payment methods
    if (paymentMethod === 'wave' || paymentMethod === 'mobile_money') {
      setValidatedFormData(validation.data);
      setShowConfirmDialog(true);
      return;
    }

    // For card and bank transfer, proceed directly
    await processPayment(validation.data);
  };

  const processPayment = async (validatedData: PaymentInput) => {
    // Prevent double processing
    if (processing) return;

    setProcessing(true);

    // Set timeout for payment process (30 seconds)
    const timeoutId = setTimeout(() => {
      setProcessing(false);
      setGeneralError("Le délai de traitement du paiement a expiré. Veuillez réessayer.");
      toast({
        title: "Délai dépassé",
        description: "Le traitement du paiement a pris trop de temps. Veuillez réessayer.",
        variant: "destructive",
      });
    }, 30000);

    try {
      // Security: Don't log sensitive payment information

      // Double-check booking status before payment
      const { data: currentBooking, error: checkError } = await supabase
        .from("bookings")
        .select("payment_status, status")
        .eq("id", bookingId)
        .maybeSingle();

      if (checkError) throw checkError;

      if (!currentBooking) {
        throw new Error("Réservation introuvable");
      }

      if (currentBooking.payment_status === "paid") {
        toast({
          title: "Paiement déjà effectué",
          description: "Cette réservation a déjà été payée",
        });
        navigate("/dashboard");
        return;
      }

      if (currentBooking.status === "cancelled") {
        toast({
          title: "Réservation annulée",
          description: "Cette réservation a été annulée et ne peut être payée",
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }

      // XOF - devise unique de la plateforme
      const { data, error } = await supabase.functions.invoke("process-payment", {
        body: {
          bookingId: bookingId,
          amount: booking.total_price,
          currency: "XOF",
          paymentMethod: validatedData.paymentMethod,
          customerInfo: {
            name: validatedData.customerName,
            email: validatedData.customerEmail,
            phone: validatedData.customerPhone,
            address: validatedData.customerAddress,
            city: validatedData.customerCity,
          },
        },
      });

      clearTimeout(timeoutId);

      // Gestion détaillée des erreurs de l'edge function
      if (error) {
        console.error("Erreur edge function:", error);
        
        // Extraire le message d'erreur
        let errorMessage = "Une erreur est survenue lors du traitement du paiement";
        
        if (error.message) {
          errorMessage = error.message;
        } else if (typeof error === 'string') {
          errorMessage = error;
        }
        
        throw new Error(errorMessage);
      }

      // Vérifier le succès de la réponse
      if (!data) {
        throw new Error("Aucune réponse reçue du serveur de paiement");
      }

      if (!data.success) {
        // Afficher le message d'erreur spécifique de l'edge function
        const errorMsg = data.error || "Échec de la création du paiement";
        throw new Error(errorMsg);
      }

      if (!data.payment_url) {
        throw new Error("URL de paiement non reçue. Veuillez réessayer.");
      }

      // Succès - afficher un toast avant la redirection
      toast({
        title: "Redirection vers le paiement",
        description: "Vous allez être redirigé vers la page de paiement sécurisée...",
      });

      // Petit délai pour permettre l'affichage du toast
      setTimeout(() => {
        window.location.href = data.payment_url;
      }, 500);
      
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      console.error("Erreur de paiement:", error);
      
      // Déterminer le message d'erreur approprié
      let userMessage = "Une erreur inattendue est survenue";
      
      if (error instanceof Error) {
        userMessage = error.message;
      } else if (error?.message) {
        userMessage = error.message;
      } else if (typeof error === 'string') {
        userMessage = error;
      }
      
      // Messages spécifiques pour certaines erreurs
      if (userMessage.includes("401") || userMessage.includes("Non autorisé") || userMessage.includes("Unauthorized")) {
        userMessage = "Session expirée. Veuillez vous reconnecter.";
      } else if (userMessage.includes("timeout") || userMessage.includes("TIMEOUT")) {
        userMessage = "Le serveur met trop de temps à répondre. Veuillez réessayer.";
      } else if (userMessage.includes("network") || userMessage.includes("fetch")) {
        userMessage = "Problème de connexion. Vérifiez votre connexion internet.";
      } else if (userMessage.includes("502") || userMessage.includes("503")) {
        userMessage = "Le service de paiement est temporairement indisponible. Veuillez réessayer.";
      }
      
      setGeneralError(userMessage);
      
      toast({
        title: "Erreur de paiement",
        description: userMessage,
        variant: "destructive",
      });
      setProcessing(false);
    }
  };

  const handleConfirmPayment = () => {
    setShowConfirmDialog(false);
    if (validatedFormData) {
      processPayment(validatedFormData);
    }
  };

  const getPaymentMethodLabel = () => {
    switch (paymentMethod) {
      case 'wave': return 'Wave';
      case 'mobile_money': return 'Mobile Money';
      case 'card': return 'Carte bancaire';
      case 'bank_transfer': return 'Virement bancaire';
      default: return paymentMethod;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!booking) {
    return null;
  }

  return (
    <ErrorBoundary fallback={<ErrorFallback title="Erreur de paiement" description="Impossible de charger la page de paiement" />}>
      <div className="min-h-screen flex flex-col pt-16">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-6 md:py-8">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Paiement</h1>
            <p className="text-sm md:text-base text-muted-foreground mb-6 md:mb-8">
              Complétez votre réservation en effectuant le paiement
            </p>

            {generalError && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{generalError}</AlertDescription>
              </Alert>
            )}

            {/* Mobile payment confirmation info */}
            {(paymentMethod === 'wave' || paymentMethod === 'mobile_money') && customerPhone && (
              <Alert className="mb-6 border-primary/30 bg-primary/5">
                <Smartphone className="h-4 w-4 text-primary" />
                <AlertDescription className="text-foreground">
                  La demande de paiement sera envoyée au numéro: <strong>{customerPhone}</strong>
                </AlertDescription>
              </Alert>
            )}

          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Détails de la réservation</h2>
            <div className="space-y-3">
              {/* Service Information */}
              {booking.services && (
                <>
                  <div className="flex justify-between items-start">
                    <span className="text-muted-foreground">Service:</span>
                    <span className="font-medium text-right">{booking.services.name}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="font-medium text-right capitalize">{booking.services.type}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-muted-foreground">Localisation:</span>
                    <span className="font-medium text-right">{booking.services.location}</span>
                  </div>
                </>
              )}
              
              {/* Dates - Ne pas afficher date de fin pour vols aller simple */}
              <div className="flex justify-between items-start">
                <span className="text-muted-foreground">Date de début:</span>
                <span className="font-medium text-right">
                  {new Date(booking.start_date).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
              </div>
              
              {booking.end_date && booking.end_date !== booking.start_date && booking.services?.type !== 'flight' && (
                <div className="flex justify-between items-start">
                  <span className="text-muted-foreground">Date de fin:</span>
                  <span className="font-medium text-right">
                    {new Date(booking.end_date).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              )}
              
              {/* Guests */}
              <div className="flex justify-between items-start">
                <span className="text-muted-foreground">Nombre de personnes:</span>
                <span className="font-medium text-right">{booking.guests}</span>
              </div>
              
              {/* Customer Info */}
              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-muted-foreground">Nom du client:</span>
                  <span className="font-medium text-right">{booking.customer_name}</span>
                </div>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium text-right">{booking.customer_email}</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-muted-foreground">Téléphone:</span>
                  <span className="font-medium text-right">{booking.customer_phone}</span>
                </div>
              </div>
              
              {/* Notes if available */}
              {booking.notes && (
                <div className="border-t pt-3 mt-3">
                  <span className="text-muted-foreground block mb-1">Notes:</span>
                  <p className="text-sm">{booking.notes}</p>
                </div>
              )}
              
              {/* Booking Reference & Total */}
              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between mb-2">
                  <span className="text-muted-foreground">Référence:</span>
                  <span className="font-mono text-sm">{booking.id.substring(0, 8).toUpperCase()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-lg">Montant total:</span>
                  <span className="font-bold text-2xl text-primary">
                    <Price amount={booking.total_price} fromCurrency={booking.currency} />
                  </span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Informations de paiement</h2>
            
            <div className="space-y-6">
              {/* Payment Method */}
              <div>
                <Label className="text-base font-medium mb-3 block">
                  Méthode de paiement
                </Label>
                <PaymentMethodSelector value={paymentMethod} onChange={setPaymentMethod} />
              </div>

              {/* Customer Information */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="customerName">Nom complet *</Label>
                  <Input
                    id="customerName"
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value);
                      if (validationErrors.customerName) {
                        setValidationErrors(prev => {
                          const { customerName, ...rest } = prev;
                          return rest;
                        });
                      }
                    }}
                    placeholder="Votre nom complet"
                    className={validationErrors.customerName ? "border-destructive" : ""}
                    aria-invalid={!!validationErrors.customerName}
                    aria-describedby={validationErrors.customerName ? "customerName-error" : undefined}
                  />
                  {validationErrors.customerName && (
                    <p id="customerName-error" className="text-xs text-destructive mt-1">
                      {validationErrors.customerName}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="customerEmail">Email *</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={customerEmail}
                    onChange={(e) => {
                      setCustomerEmail(e.target.value);
                      if (validationErrors.customerEmail) {
                        setValidationErrors(prev => {
                          const { customerEmail, ...rest } = prev;
                          return rest;
                        });
                      }
                    }}
                    placeholder="votre@email.com"
                    className={validationErrors.customerEmail ? "border-destructive" : ""}
                    aria-invalid={!!validationErrors.customerEmail}
                    aria-describedby={validationErrors.customerEmail ? "customerEmail-error" : undefined}
                  />
                  {validationErrors.customerEmail && (
                    <p id="customerEmail-error" className="text-xs text-destructive mt-1">
                      {validationErrors.customerEmail}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="customerPhone">Téléphone *</Label>
                  <Input
                    id="customerPhone"
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => {
                      setCustomerPhone(e.target.value);
                      if (validationErrors.customerPhone) {
                        setValidationErrors(prev => {
                          const { customerPhone, ...rest } = prev;
                          return rest;
                        });
                      }
                    }}
                    placeholder="+225 07 XX XX XX XX"
                    className={validationErrors.customerPhone ? "border-destructive" : ""}
                    aria-invalid={!!validationErrors.customerPhone}
                    aria-describedby={validationErrors.customerPhone ? "customerPhone-error" : undefined}
                  />
                  {validationErrors.customerPhone && (
                    <p id="customerPhone-error" className="text-xs text-destructive mt-1">
                      {validationErrors.customerPhone}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Ce numéro sera utilisé pour le paiement mobile
                  </p>
                </div>

                <div>
                  <Label htmlFor="customerAddress">Adresse</Label>
                  <Input
                    id="customerAddress"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="Votre adresse"
                  />
                </div>

                <div>
                  <Label htmlFor="customerCity">Ville *</Label>
                  <Input
                    id="customerCity"
                    value={customerCity}
                    onChange={(e) => {
                      setCustomerCity(e.target.value);
                      if (validationErrors.customerCity) {
                        setValidationErrors(prev => {
                          const { customerCity, ...rest } = prev;
                          return rest;
                        });
                      }
                    }}
                    placeholder="Abidjan"
                    className={validationErrors.customerCity ? "border-destructive" : ""}
                    aria-invalid={!!validationErrors.customerCity}
                    aria-describedby={validationErrors.customerCity ? "customerCity-error" : undefined}
                  />
                  {validationErrors.customerCity && (
                    <p id="customerCity-error" className="text-xs text-destructive mt-1">
                      {validationErrors.customerCity}
                    </p>
                  )}
                </div>
              </div>

              <Button
                onClick={handlePayment}
                disabled={processing}
                className="w-full"
                size="lg"
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Traitement...
                  </>
                ) : (
                  <>Payer <Price amount={booking.total_price} fromCurrency={booking.currency} /></>
                )}
              </Button>

              <p className="text-sm text-center text-muted-foreground">
                Paiement sécurisé par CinetPay
              </p>
            </div>
          </Card>
        </div>
      </main>
      <Footer />

      {/* Payment Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary" />
              Confirmer le paiement {getPaymentMethodLabel()}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4 pt-2">
                <p>
                  Une demande de paiement de{" "}
                  <strong className="text-foreground">
                    <Price amount={booking?.total_price || 0} fromCurrency={booking?.currency} />
                  </strong>{" "}
                  sera envoyée au numéro:
                </p>
                <div className="flex items-center justify-center gap-3 p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <Smartphone className="h-6 w-6 text-primary" />
                  <span className="text-xl font-bold text-foreground">{customerPhone}</span>
                </div>
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Vous recevrez une notification sur ce numéro pour confirmer le paiement</span>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel disabled={processing}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmPayment}
              disabled={processing}
              className="gap-2"
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Traitement...
                </>
              ) : (
                "Confirmer et payer"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  </ErrorBoundary>
  );
}
