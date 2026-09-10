import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserDashboardLayout } from "@/components/dashboard/UserDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Calendar, MapPin, Users, CreditCard, Download, Plane, Hotel, Car, Map as MapIcon, Loader2, Star } from "lucide-react";
import { format } from "date-fns";
import { fr, enUS, zhCN } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { Price } from "@/components/ui/price";
import { BookingStatusBadge, PaymentStatusBadge } from "@/components/dashboard/BookingStatusBadge";
import { WriteReviewDialog } from "@/components/reviews/WriteReviewDialog";

interface Booking {
  id: string;
  service_id: string;
  start_date: string;
  end_date: string | null;
  total_price: number;
  currency: string;
  status: string;
  payment_status: string;
  booking_details: any;
  created_at: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  guests: number;
  notes: string | null;
  services: {
    name: string;
    type: string;
    location: string;
  };
}

// Mirrors the reviews INSERT RLS check (see migration 20260910210000): a
// booking is reviewable once it's paid, confirmed, and its service date has
// actually passed - not on a 'completed' status nothing in this codebase
// ever sets.
const isReviewEligible = (booking: Booking) => {
  if (booking.payment_status !== "paid") return false;
  if (booking.status !== "confirmed" && booking.status !== "completed") return false;
  const serviceDate = booking.end_date || booking.start_date;
  return new Date(serviceDate) <= new Date();
};

const BookingHistory = () => {
  const { t, i18n } = useTranslation();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [reviewedBookingIds, setReviewedBookingIds] = useState<Set<string>>(new Set());
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  const navigate = useNavigate();

  const getLocale = () => {
    switch (i18n.language) {
      case 'en': return enUS;
      case 'zh': return zhCN;
      default: return fr;
    }
  };

  useEffect(() => {
    checkAuth();
    fetchBookings();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const fetchBookings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          services (
            name,
            type,
            location
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBookings(data || []);

      const eligibleIds = (data || []).filter(isReviewEligible).map(b => b.id);
      if (eligibleIds.length > 0) {
        const { data: existingReviews } = await supabase
          .from("reviews")
          .select("booking_id")
          .in("booking_id", eligibleIds);
        setReviewedBookingIds(new Set((existingReviews || []).map(r => r.booking_id).filter(Boolean)));
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast.error(t('bookingHistory.loadingError'));
    } finally {
      setLoading(false);
    }
  };

  const getServiceIcon = (type: string) => {
    const icons: Record<string, any> = {
      hotel: Hotel,
      flight: Plane,
      car: Car,
      tour: MapIcon
    };
    const Icon = icons[type] || MapIcon;
    return <Icon className="w-5 h-5" />;
  };

  const filterBookings = (filter: string) => {
    if (filter === "all") return bookings;
    return bookings.filter(b => b.services.type === filter);
  };

  const handleDownloadTicket = async (bookingId: string) => {
    try {
      toast.info(t('bookingHistory.ticketGenerating'));
      
      const { data, error } = await supabase.functions.invoke("generate-ticket", {
        body: { bookingId },
      });

      if (error) throw error;

      if (data.success) {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(data.ticket.html);
          printWindow.document.close();
          setTimeout(() => {
            printWindow.print();
          }, 250);
        }
        toast.success(t('bookingHistory.ticketSuccess'));
      }
    } catch (error) {
      console.error("Error downloading ticket:", error);
      toast.error(t('bookingHistory.ticketError'));
    }
  };

  if (loading) {
    return (
      <UserDashboardLayout>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </UserDashboardLayout>
    );
  }

  return (
    <UserDashboardLayout>
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">{t('bookingHistory.title')}</h1>
          <p className="text-muted-foreground text-lg">
            {t('bookingHistory.subtitle')}
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="all">{t('bookingHistory.tabs.all')} ({bookings.length})</TabsTrigger>
            <TabsTrigger value="flight">{t('bookingHistory.tabs.flights')} ({filterBookings("flight").length})</TabsTrigger>
            <TabsTrigger value="hotel">{t('bookingHistory.tabs.hotels')} ({filterBookings("hotel").length})</TabsTrigger>
            <TabsTrigger value="car">{t('bookingHistory.tabs.cars')} ({filterBookings("car").length})</TabsTrigger>
            <TabsTrigger value="tour">{t('bookingHistory.tabs.tours')} ({filterBookings("tour").length})</TabsTrigger>
          </TabsList>

          {["all", "flight", "hotel", "car", "tour"].map((tab) => (
            <TabsContent key={tab} value={tab} className="space-y-6">
              {filterBookings(tab).length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <p className="text-muted-foreground mb-4">{t('bookingHistory.noBookings')}</p>
                    <Button onClick={() => navigate("/")}>
                      {t('bookingHistory.discoverOffers')}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                filterBookings(tab).map((booking) => (
                  <Card key={booking.id} className="hover:shadow-lg transition-all">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                            {getServiceIcon(booking.services.type)}
                          </div>
                          <div>
                            <CardTitle className="text-xl mb-1">{booking.services.name}</CardTitle>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="w-4 h-4" />
                              {booking.services.location}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <BookingStatusBadge status={booking.status} />
                          <PaymentStatusBadge status={booking.payment_status} />
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">{t('bookingHistory.startDate')}</p>
                            <p className="font-semibold">
                              {format(new Date(booking.start_date), "dd MMM yyyy", { locale: getLocale() })}
                            </p>
                          </div>
                        </div>

                        {booking.end_date && (
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                              <Calendar className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">{t('bookingHistory.endDate')}</p>
                              <p className="font-semibold">
                                {format(new Date(booking.end_date), "dd MMM yyyy", { locale: getLocale() })}
                              </p>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                            <Users className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">{t('bookingHistory.travelers')}</p>
                            <p className="font-semibold">{booking.guests} {t('bookingHistory.person')}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                            <CreditCard className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">{t('bookingHistory.totalAmount')}</p>
                            <p className="font-semibold text-primary">
                              <Price amount={booking.total_price} fromCurrency={booking.currency} />
                            </p>
                          </div>
                        </div>
                      </div>

                      {booking.notes && (
                        <div className="bg-muted/50 rounded-lg p-4 mb-4">
                          <p className="text-sm font-semibold mb-1">{t('bookingHistory.notes')} :</p>
                          <p className="text-sm text-muted-foreground">{booking.notes}</p>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-3">
                        <Button 
                          variant="outline" 
                          className="gap-2"
                          onClick={() => handleDownloadTicket(booking.id)}
                          disabled={booking.payment_status !== 'paid'}
                        >
                          <Download className="w-4 h-4" />
                          {t('bookingHistory.downloadTicket')}
                        </Button>
                        {booking.status === "confirmed" && booking.payment_status === "paid" && (
                          <Button
                            variant="outline"
                            onClick={() => {
                              toast.info(t('bookingHistory.modifyNotAvailable'));
                              navigate('/support');
                            }}
                          >
                            {t('bookingHistory.modifyBooking')}
                          </Button>
                        )}
                        {booking.status === "pending" && (
                          <Button className="gradient-primary shadow-primary">
                            {t('bookingHistory.finalizePayment')}
                          </Button>
                        )}
                        {isReviewEligible(booking) && (
                          reviewedBookingIds.has(booking.id) ? (
                            <Button variant="ghost" disabled className="gap-2 text-muted-foreground">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              Avis envoyé
                            </Button>
                          ) : (
                            <Button variant="outline" className="gap-2" onClick={() => setReviewBooking(booking)}>
                              <Star className="w-4 h-4" />
                              Laisser un avis
                            </Button>
                          )
                        )}
                      </div>

                      <div className="mt-4 pt-4 border-t border-border">
                        <p className="text-xs text-muted-foreground">
                          {t('bookingHistory.bookingMadeOn')} {format(new Date(booking.created_at), "dd MMMM yyyy HH:mm", { locale: getLocale() })}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {reviewBooking && (
        <WriteReviewDialog
          open={!!reviewBooking}
          onOpenChange={(open) => { if (!open) setReviewBooking(null); }}
          bookingId={reviewBooking.id}
          serviceId={reviewBooking.service_id}
          serviceName={reviewBooking.services.name}
          onSubmitted={() => {
            setReviewedBookingIds(prev => new Set(prev).add(reviewBooking.id));
            setReviewBooking(null);
          }}
        />
      )}
    </UserDashboardLayout>
  );
};

export default BookingHistory;
