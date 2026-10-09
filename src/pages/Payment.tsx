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
  const { t, i18n } = useTranslation();
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
          title: t("ux.payment.notAuthenticated"),
          description: t("ux.payment.signInToContinue"),
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
          description: t("ux.payment.notFoundOrDenied"),
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }

      // Check if payment already completed
      if (data.payment_status === "paid") {
        toast({
          title: t("ux.payment.alreadyPaid"),
          description: t("ux.payment.alreadyPaidDesc"),
        });
        navigate("/dashboard");
        return;
      }
      if (data.payment_status === "partially_paid") {
        toast({
          title: t("ux.payment.depositPaid"),
          description: t("ux.payment.balanceOnSite"),
        });
        navigate("/booking-history");
        return;
      }

      // Check if booking is cancelled
      if (data.status === "cancelled") {
        toast({
          title: t("ux.payment.cancelled"),
          description: t("ux.payment.cancelledDesc"),
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
        description: error instanceof Error ? error.message : t("ux.payment.loadError"),
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
      setGeneralError(t("ux.payment.timeoutExpired"));
      toast({
        title: t("ux.payment.timeout"),
        description: t("ux.payment.timeoutDesc"),
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
        throw new Error(t("ux.payment.notFound"));
      }

      if (currentBooking.payment_status === "paid") {
        toast({
          title: t("ux.payment.alreadyPaid"),
          description: t("ux.payment.alreadyPaidDesc"),
        });
        navigate("/dashboard");
        return;
      }

      if (currentBooking.status === "cancelled") {
        toast({
          title: t("ux.payment.cancelled"),
          description: t("ux.payment.cancelledCannotPay"),
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
        throw new Error(await getEdgeFunctionErrorMessage(error, t("ux.payment.processingError")));
      }

      // Vérifier le succès de la réponse
      if (!data) {
        throw new Error(t("ux.payment.noResponse"));
      }

      if (!data.success) {
        // Afficher le message d'erreur spécifique de l'edge function
        const errorMsg = data.error || t("ux.payment.createFailed");
        throw new Error(errorMsg);
      }

      if (!data.payment_url) {
        throw new Error(t("ux.payment.noUrl"));
      }

      // Succès - afficher un toast avant la redirection
      toast({
        title: t("ux.payment.redirecting"),
        description: t("ux.payment.redirectingDesc"),
      });

      // Petit délai pour permettre l'affichage du toast
      setTimeout(() => {
        window.location.href = data.payment_url;
      }, 500);
      
    } catch (error: unknown) {
      clearTimeout(timeoutId);
      
      console.error("Erreur de paiement:", error);
      
      // Déterminer le message d'erreur approprié
      let userMessage = t("ux.payment.unexpected");
      
      if (error instanceof Error) {
        userMessage = error.message;
      } else if (typeof error === 'string') {
        userMessage = error;
      }
      
      // Messages spécifiques pour certaines erreurs
      if (userMessage.includes("401") || userMessage.includes("Non autorisé") || userMessage.includes("Unauthorized")) {
        userMessage = t("ux.payment.sessionExpired");
      } else if (userMessage.includes("timeout") || userMessage.includes("TIMEOUT")) {
        userMessage = t("ux.payment.slowServer");
      } else if (userMessage.includes("network") || userMessage.includes("fetch")) {
        userMessage = t("ux.payment.network");
      } else if (userMessage.includes("502") || userMessage.includes("503")) {
        userMessage = t("ux.payment.unavailable");
      }
      
      setGeneralError(userMessage);
      
      toast({
        title: t("ux.payment.error"),
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
                {t("ux.payment.eyebrow")}
              </p>
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                {t("ux.payment.title")}
              </h1>
              <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
                {t("ux.payment.intro")}
              </p>
            </div>

            {generalError && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{generalError}</AlertDescription>
              </Alert>
            )}

            <Card className="overflow-hidden border-0 shadow-lg">
              <div className="bg-primary/5 p-6 md:p-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{t("ux.payment.yourTrip")}</p>
                    <h2 className="mt-1 text-2xl font-bold">
                      {booking.services?.name || t("ux.payment.defaultName")}
                    </h2>
                    {booking.services?.type && (
                      <p className="mt-1 text-sm capitalize text-muted-foreground">
                        {booking.services.type}
                      </p>
                    )}
                  </div>
                  <div className="rounded-full border bg-background/80 px-3 py-1 text-xs font-medium">
                    {t("ux.payment.ref", { ref: booking.id.substring(0, 8).toUpperCase() })}
                  </div>
                </div>
              </div>

              <div className="space-y-6 p-6 md:p-8">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex gap-3 rounded-xl bg-muted/50 p-4">
                    <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">{t("ux.payment.startDate")}</p>
                      <p className="mt-1 font-medium">
                        {new Date(booking.start_date).toLocaleDateString(i18n.language, {
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
                        <p className="text-xs text-muted-foreground">{t("ux.payment.endDate")}</p>
                        <p className="mt-1 font-medium">
                          {new Date(booking.end_date).toLocaleDateString(i18n.language, {
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
                        <p className="text-xs text-muted-foreground">{t("ux.payment.destination")}</p>
                        <p className="mt-1 font-medium">{booking.services.location}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-3 rounded-xl bg-muted/50 p-4">
                    <Users className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">{t("ux.payment.travellers")}</p>
                      <p className="mt-1 font-medium">{booking.guests}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap justify-between gap-2 border-t pt-5 text-sm">
                  <span className="text-muted-foreground">{t("ux.payment.bookedBy")}</span>
                  <span className="font-medium">{booking.customer_name}</span>
                </div>

                <div className="rounded-xl border bg-background p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {booking.payment_plan === "deposit" && Number(booking.balance_due) > 0
                          ? t("ux.payment.depositDue", { percent: booking.deposit_percent })
                          : t("ux.payment.totalDue")}
                      </p>
                      <p className="mt-1 text-3xl font-bold text-primary">
                        <Price amount={amountToPay} fromCurrency={booking.currency} />
                      </p>
                    </div>
                    <CreditCard className="h-8 w-8 text-primary/70" />
                  </div>
                  {booking.payment_plan === "deposit" && Number(booking.balance_due) > 0 && (
                    <div className="mt-4 flex justify-between border-t pt-3 text-sm">
                      <span className="text-muted-foreground">{t("ux.payment.balanceDue")}</span>
                      <span className="font-medium">
                        <Price amount={booking.balance_due} fromCurrency={booking.currency} />
                      </span>
                    </div>
                  )}
                </div>

                {booking.notes && (
                  <div className="rounded-xl border p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("ux.payment.note")}</p>
                    <p className="mt-2 text-sm">{booking.notes}</p>
                  </div>
                )}

                <div className="flex gap-3 rounded-xl border border-success/30 bg-success/5 p-4">
                  <ShieldCheck className="h-5 w-5 shrink-0 text-success" />
                  <p className="text-sm text-muted-foreground">
                    {t("ux.payment.secureNote")}
                  </p>
                </div>

                <Button onClick={handlePayment} disabled={processing} className="h-12 w-full text-base" size="lg">
                  {processing ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {t("ux.payment.preparing")}
                    </>
                  ) : (
                    <>
                      {t("ux.payment.continue")}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  {t("ux.payment.leaveNote")}
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
