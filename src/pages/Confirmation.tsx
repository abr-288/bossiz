import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Loader2, 
  Home, 
  Download, 
  Share2, 
  Mail, 
  Plane, 
  Hotel, 
  Car, 
  MapPin, 
  Calendar,
  Users,
  CreditCard,
  Copy,
  Check,
  Printer,
  QrCode
} from "lucide-react";
import { format } from "date-fns";
import { fr, enUS, zhCN } from "date-fns/locale";
import { toast } from "sonner";
import { Price } from "@/components/ui/price";
import { useTranslation } from "react-i18next";

const Confirmation = () => {
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get("bookingId");
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const getLocale = () => {
    switch (i18n.language) {
      case 'en': return enUS;
      case 'zh': return zhCN;
      default: return fr;
    }
  };

  useEffect(() => {
    loadBooking();
  }, [bookingId]);

  // Real-time subscription for instant status updates
  useEffect(() => {
    if (!bookingId) return;

    const channel = supabase
      .channel(`booking-status-${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
          filter: `id=eq.${bookingId}`
        },
        (payload) => {
          console.log('Booking updated in real-time:', payload);
          setBooking((prev: any) => ({
            ...prev,
            ...payload.new,
            services: prev?.services,
            passengers: prev?.passengers
          }));
          
          // Show toast notification on status change
          if (payload.new.payment_status === 'paid' && payload.old?.payment_status !== 'paid') {
            toast.success(t('confirmation.paymentReceived'), {
              description: t('confirmation.confirmedDesc'),
              duration: 5000,
            });
          } else if (payload.new.status === 'confirmed' && payload.old?.status !== 'confirmed') {
            toast.success(t('confirmation.bookingConfirmed'), {
              description: t('confirmation.confirmedDesc'),
              duration: 5000,
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookingId, t]);

  const loadBooking = async () => {
    if (!bookingId) {
      setError(t('confirmation.missingBookingId'));
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          services (*),
          passengers (*)
        `)
        .eq("id", bookingId)
        .single();

      if (error) throw error;
      setBooking(data);
    } catch (err: any) {
      console.error("Error loading booking:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getServiceIcon = (type: string) => {
    switch (type) {
      case "flight": return <Plane className="h-6 w-6" />;
      case "hotel":
      case "stay": return <Hotel className="h-6 w-6" />;
      case "car": return <Car className="h-6 w-6" />;
      default: return <MapPin className="h-6 w-6" />;
    }
  };

  const getStatusConfig = () => {
    if (booking?.status === 'confirmed') {
      return {
        icon: <CheckCircle2 className="h-20 w-20 text-green-500" />,
        title: t('confirmation.confirmed'),
        description: t('confirmation.confirmedDesc'),
        bgClass: "from-green-500/20 to-green-500/5",
        borderClass: "border-green-500/30",
      };
    } else if (booking?.status === 'cancelled' && booking?.payment_status === 'refunded') {
      return {
        icon: <XCircle className="h-20 w-20 text-amber-500" />,
        title: t('confirmation.cancelled'),
        description: t('confirmation.cancelledDesc'),
        bgClass: "from-amber-500/20 to-amber-500/5",
        borderClass: "border-amber-500/30",
      };
    } else if (booking?.status === 'failed' || booking?.payment_status === 'failed') {
      return {
        icon: <XCircle className="h-20 w-20 text-destructive" />,
        title: t('confirmation.failed'),
        description: t('confirmation.failedDesc'),
        bgClass: "from-destructive/20 to-destructive/5",
        borderClass: "border-destructive/30",
      };
    } else if (booking?.payment_status === 'paid' && booking?.status === 'pending') {
      // Paid but a flight booking still awaiting a real PNR from the
      // supplier (see create-pnr) - never shown as a green success yet,
      // since it may still automatically resolve to a refund.
      return {
        icon: <Clock className="h-20 w-20 text-amber-500 animate-pulse" />,
        title: t('confirmation.processingSupplier'),
        description: t('confirmation.processingSupplierDesc'),
        bgClass: "from-amber-500/20 to-amber-500/5",
        borderClass: "border-amber-500/30",
      };
    } else if (booking?.payment_status === 'pending') {
      return {
        icon: <Clock className="h-20 w-20 text-amber-500 animate-pulse" />,
        title: t('confirmation.paymentPending'),
        description: t('confirmation.paymentPendingDesc'),
        bgClass: "from-amber-500/20 to-amber-500/5",
        borderClass: "border-amber-500/30",
      };
    }
    return {
      icon: <Clock className="h-20 w-20 text-muted-foreground" />,
      title: t('confirmation.pending'),
      description: t('confirmation.pendingDesc'),
      bgClass: "from-muted/50 to-muted/20",
      borderClass: "border-border",
    };
  };

  const generateBookingRef = () => {
    if (booking?.external_ref) return booking.external_ref;
    if (booking?.id) return `BOS-${booking.id.substring(0, 8).toUpperCase()}`;
    return "---";
  };

  const copyToClipboard = async () => {
    const ref = generateBookingRef();
    await navigator.clipboard.writeText(ref);
    setCopied(true);
    toast.success(t('confirmation.bookingNumber') + " " + t('common.success').toLowerCase() + "!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    const shareData = {
      title: t('confirmation.shareTitle'),
      text: `${t('confirmation.bookingNumber')} ${generateBookingRef()} - ${booking?.services?.name}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log("Share cancelled");
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success(t('confirmation.linkCopied'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col pt-16 bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">{t('confirmation.loading')}</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen flex flex-col pt-16 bg-background">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-12">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="pt-8 pb-8">
              <div className="text-center space-y-6">
                <XCircle className="h-20 w-20 text-destructive mx-auto" />
                <div>
                  <h1 className="text-2xl font-bold">{t('confirmation.error')}</h1>
                  <p className="text-muted-foreground mt-2">{error || t('confirmation.notFound')}</p>
                </div>
                <Button asChild size="lg">
                  <Link to="/">
                    <Home className="h-4 w-4 mr-2" />
                    {t('confirmation.backToHome')}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const statusConfig = getStatusConfig();
  const bookingRef = generateBookingRef();

  return (
    <div className="min-h-screen flex flex-col pt-16 bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-6 md:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto space-y-6"
        >
          {/* Status Header */}
          <Card className={`overflow-hidden border-2 ${statusConfig.borderClass}`}>
            <div className={`bg-gradient-to-br ${statusConfig.bgClass} p-8 md:p-12`}>
              <div className="text-center space-y-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", duration: 0.5 }}
                >
                  {statusConfig.icon}
                </motion.div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                    {statusConfig.title}
                  </h1>
                  <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                    {statusConfig.description}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Booking Reference */}
          <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
            <CardContent className="py-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="text-center md:text-left">
                  <p className="text-sm text-muted-foreground mb-1">{t('confirmation.bookingNumber')}</p>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl md:text-4xl font-bold text-primary tracking-wider">
                      {bookingRef}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={copyToClipboard}
                      className="shrink-0"
                    >
                      {copied ? (
                        <Check className="h-5 w-5 text-green-500" />
                      ) : (
                        <Copy className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-24 bg-white rounded-lg flex items-center justify-center border">
                    <QrCode className="h-16 w-16 text-foreground" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Booking Details */}
            <Card className="md:col-span-2">
              <CardContent className="py-6 space-y-6">
                {/* Service Info */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      {getServiceIcon(booking.services?.type)}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">{booking.services?.name}</h2>
                      <p className="text-sm text-muted-foreground">{booking.services?.location}</p>
                    </div>
                  </div>
                  
                  <Badge variant="secondary" className="mb-4">
                    {booking.services?.type === "flight" ? t('confirmation.serviceTypes.flight') :
                     booking.services?.type === "hotel" ? t('confirmation.serviceTypes.hotel') :
                     booking.services?.type === "car" ? t('confirmation.serviceTypes.car') :
                     booking.services?.type === "tour" ? t('confirmation.serviceTypes.tour') :
                     booking.services?.type === "stay" ? t('confirmation.serviceTypes.stay') : t('confirmation.serviceTypes.default')}
                  </Badge>
                </div>

                <Separator />

                {/* Dates & Guests */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Calendar className="h-4 w-4" />
                      <span>{t('confirmation.startDate')}</span>
                    </div>
                    <p className="font-semibold">
                      {format(new Date(booking.start_date), "EEEE d MMMM yyyy", { locale: getLocale() })}
                    </p>
                  </div>
                  {booking.end_date && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Calendar className="h-4 w-4" />
                        <span>{t('confirmation.endDate')}</span>
                      </div>
                      <p className="font-semibold">
                        {format(new Date(booking.end_date), "EEEE d MMMM yyyy", { locale: getLocale() })}
                      </p>
                    </div>
                  )}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Users className="h-4 w-4" />
                      <span>{t('confirmation.participants')}</span>
                    </div>
                    <p className="font-semibold">{booking.guests} {t('confirmation.person')}</p>
                  </div>
                </div>

                <Separator />

                {/* Passengers */}
                {booking.passengers && booking.passengers.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      {t('confirmation.participants')}
                    </h3>
                    <div className="space-y-2">
                      {booking.passengers.map((passenger: any, index: number) => (
                        <div 
                          key={passenger.id} 
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium">
                              {passenger.first_name} {passenger.last_name}
                            </p>
                            {passenger.date_of_birth && (
                              <p className="text-xs text-muted-foreground">
                                {t('confirmation.bornOn')} {format(new Date(passenger.date_of_birth), "dd/MM/yyyy")}
                              </p>
                            )}
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {index === 0 ? t('confirmation.passenger.main') : `${t('confirmation.passenger.other')} ${index + 1}`}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Separator />

                {/* Contact Info */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary" />
                    {t('confirmation.contact')}
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p className="font-medium">{booking.customer_name}</p>
                    <p className="text-muted-foreground">{booking.customer_email}</p>
                    <p className="text-muted-foreground">{booking.customer_phone}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Price Summary & Actions */}
            <div className="space-y-6">
              <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
                <CardContent className="py-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-primary" />
                    {t('confirmation.amountPaid')}
                  </h3>
                  <div className="text-4xl font-bold text-primary mb-2">
                    <Price amount={booking.total_price} fromCurrency={booking.currency || "XOF"} />
                  </div>
                  <Badge 
                    variant={booking.payment_status === 'paid' ? 'default' : 'secondary'}
                    className={booking.payment_status === 'paid' ? 'bg-green-500' : ''}
                  >
                    {booking.payment_status === 'paid' ? '✓ ' + t('confirmation.paid') : t('confirmation.pending')}
                  </Badge>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="py-6 space-y-3">
                  <h3 className="font-semibold mb-2">{t('confirmation.actions')}</h3>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={handlePrint}
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    {t('confirmation.print')}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={handleShare}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    {t('confirmation.share')}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    asChild
                  >
                    <Link to={`/support?bookingRef=${bookingRef}`}>
                      <Mail className="h-4 w-4 mr-2" />
                      {t('confirmation.contactSupport')}
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <div className="flex flex-col gap-3">
                <Button asChild size="lg" className="w-full">
                  <Link to="/dashboard?tab=bookings">
                    {t('confirmation.viewBookings')}
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="w-full">
                  <Link to="/">
                    <Home className="h-4 w-4 mr-2" />
                    {t('confirmation.backToHome')}
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Important Info */}
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="py-4">
              <h3 className="font-semibold mb-2 text-amber-700 dark:text-amber-400">
                {t('confirmation.important')}
              </h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• {t('confirmation.keepRef')} <strong>{bookingRef}</strong></li>
                <li>• {t('confirmation.emailSent')} <strong>{booking.customer_email}</strong></li>
                <li>• {t('confirmation.presentRef')}</li>
                <li>• {t('confirmation.questions')}</li>
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default Confirmation;
