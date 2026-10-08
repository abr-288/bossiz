import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, ArrowRight, CalendarDays, CheckCircle2, CreditCard, Loader2, MapPin, ShieldCheck, Users } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ErrorBoundary, { ErrorFallback } from "@/components/ErrorBoundary";
import { getEdgeFunctionErrorMessage } from "@/lib/getEdgeFunctionErrorMessage";
import { Price } from "@/components/ui/price";
import { useTranslation } from "react-i18next";

interface PaymentBooking {
  id: string;
  total_price: number;
  currency: string;
  payment_status: string;
  payment_plan?: string;
  amount_due_now?: number;
  deposit_percent?: number;
  balance_due?: number;
  status: string;
  services?: { name: string; type: string; location: string } | null;
  start_date: string;
  end_date: string | null;
  guests: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  notes: string | null;
}

export default function Payment() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const bookingId = searchParams.get("bookingId");

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [booking, setBooking] = useState<PaymentBooking | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const amountToPay = booking?.payment_plan === "deposit" && Number(booking.balance_due) > 0
    ? Number(booking.amount_due_now)
    : Number(booking?.total_price || 0);

  useEffect(() => {
    if (bookingId) {
      loadBooking();
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
      if (data.payment_status === "partially_paid") {
        toast({
          title: "Acompte déjà réglé",
          description: "Le solde de cette réservation est à régler sur place.",
        });
        navigate("/booking-history");
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
    } catch (error: unknown) {
      console.error("Error loading booking:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de charger la réservation",
        variant: "destructive",
      });
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    setGeneralError(null);
    await processPayment();
  };

  const processPayment = async () => {
    if (!booking) return;

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
          amount: amountToPay,
          currency: "XOF",
          paymentMethod: "jeko",
          customerInfo: {
            name: booking.customer_name,
            email: booking.customer_email,
            phone: booking.customer_phone,
            city: booking.services?.location,
          },
        },
      });

      clearTimeout(timeoutId);

      // Gestion détaillée des erreurs de l'edge function
      if (error) {
        console.error("Erreur edge function:", error);
        
        // Extraire le message d'erreur
        throw new Error(await getEdgeFunctionErrorMessage(error, "Une erreur est survenue lors du traitement du paiement."));
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
      
    } catch (error: unknown) {
      clearTimeout(timeoutId);
      
      console.error("Erreur de paiement:", error);
      
      // Déterminer le message d'erreur approprié
      let userMessage = "Une erreur inattendue est survenue";
      
      if (error instanceof Error) {
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
    <ErrorBoundary fallback={<ErrorFallback title={t('payment.errors.paymentErrorTitle')} description={t('payment.errors.loadPageDescription')} />}>
      <div className="min-h-screen flex flex-col pt-16">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
          <div className="mx-auto max-w-3xl">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-primary">
                Récapitulatif de réservation
              </p>
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                Vérifiez les informations
              </h1>
              <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
                Consultez les détails ci-dessous. Vous serez ensuite redirigé vers Jèko pour effectuer votre paiement sécurisé.
              </p>
            </div>

            {generalError && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{generalError}</AlertDescription>
              </Alert>
            )}

            <Card className="overflow-hidden border-0 shadow-lg">
              <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 md:p-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Votre séjour</p>
                    <h2 className="mt-1 text-2xl font-bold">
                      {booking.services?.name || "Réservation Bossiz+"}
                    </h2>
                    {booking.services?.type && (
                      <p className="mt-1 text-sm capitalize text-muted-foreground">
                        {booking.services.type}
                      </p>
                    )}
                  </div>
                  <div className="rounded-full border bg-background/80 px-3 py-1 text-xs font-medium">
                    Réf. {booking.id.substring(0, 8).toUpperCase()}
                  </div>
                </div>
              </div>

              <div className="space-y-6 p-6 md:p-8">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex gap-3 rounded-xl bg-muted/50 p-4">
                    <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Date de début</p>
                      <p className="mt-1 font-medium">
                        {new Date(booking.start_date).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  {booking.end_date && booking.end_date !== booking.start_date && booking.services?.type !== "flight" && (
                    <div className="flex gap-3 rounded-xl bg-muted/50 p-4">
                      <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Date de fin</p>
                        <p className="mt-1 font-medium">
                          {new Date(booking.end_date).toLocaleDateString("fr-FR", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                  {booking.services?.location && (
                    <div className="flex gap-3 rounded-xl bg-muted/50 p-4">
                      <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Destination</p>
                        <p className="mt-1 font-medium">{booking.services.location}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-3 rounded-xl bg-muted/50 p-4">
                    <Users className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Voyageurs</p>
                      <p className="mt-1 font-medium">{booking.guests}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap justify-between gap-2 border-t pt-5 text-sm">
                  <span className="text-muted-foreground">Réservation au nom de</span>
                  <span className="font-medium">{booking.customer_name}</span>
                </div>

                <div className="rounded-xl border bg-background p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {booking.payment_plan === "deposit" && Number(booking.balance_due) > 0
                          ? `Acompte à régler (${booking.deposit_percent} %)`
                          : "Total à régler"}
                      </p>
                      <p className="mt-1 text-3xl font-bold text-primary">
                        <Price amount={amountToPay} fromCurrency={booking.currency} />
                      </p>
                    </div>
                    <CreditCard className="h-8 w-8 text-primary/70" />
                  </div>
                  {booking.payment_plan === "deposit" && Number(booking.balance_due) > 0 && (
                    <div className="mt-4 flex justify-between border-t pt-3 text-sm">
                      <span className="text-muted-foreground">Solde restant à régler sur place</span>
                      <span className="font-medium">
                        <Price amount={booking.balance_due} fromCurrency={booking.currency} />
                      </span>
                    </div>
                  )}
                </div>

                {booking.notes && (
                  <div className="rounded-xl border p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Note de réservation</p>
                    <p className="mt-2 text-sm">{booking.notes}</p>
                  </div>
                )}

                <div className="flex gap-3 rounded-xl border border-green-500/20 bg-green-500/5 p-4">
                  <ShieldCheck className="h-5 w-5 shrink-0 text-green-600" />
                  <p className="text-sm text-muted-foreground">
                    Le paiement sera effectué sur la page sécurisée de Jèko. Vos données bancaires ne sont pas saisies ni conservées sur Bossiz+.
                  </p>
                </div>

                <Button onClick={handlePayment} disabled={processing} className="h-12 w-full text-base" size="lg">
                  {processing ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Préparation du paiement...
                    </>
                  ) : (
                    <>
                      Continuer vers le paiement Jèko
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Vous quitterez Bossiz+ pour finaliser le paiement sur Jèko.
                </p>
              </div>
            </Card>
          </div>
        </main>
      <Footer />
    </div>
  </ErrorBoundary>
  );
}
