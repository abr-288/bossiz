import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Package, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { NotificationCenter, Notification } from "@/components/dashboard/NotificationCenter";
import { BookingCard } from "@/components/dashboard/BookingCard";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { BookingCalendar } from "@/components/dashboard/BookingCalendar";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { useOfflineBookings } from "@/hooks/useOfflineBookings";
import { useTranslation } from "react-i18next";
import { UserDashboardLayout } from "@/components/dashboard/UserDashboardLayout";
import { getErrorMessage } from "@/lib/errorMessage";

const UserDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userProfile, setUserProfile] = useState<{ full_name: string; email: string; id: string } | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    totalSpent: 0,
    flightCount: 0,
    hotelCount: 0,
  });

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: profileData } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();

      setUserProfile({
        id: user.id,
        full_name: profileData?.full_name || t("dashboardPage.welcome"),
        email: user.email || "",
      });

      loadNotifications();
    };

    checkAuth();
  }, [navigate, t]);

  const {
    bookings,
    loading: bookingsLoading,
    isOnline,
    isSyncing,
    storageStats,
    syncPendingChanges,
  } = useOfflineBookings(userProfile?.id);

  useEffect(() => {
    const total = bookings?.length || 0;
    const pending = bookings?.filter((b) => b.status === "pending").length || 0;
    const confirmed = bookings?.filter((b) => b.status === "confirmed").length || 0;
    const completed = bookings?.filter((b) => b.status === "completed").length || 0;
    const flightCount = bookings?.filter((b) => b.services?.type === "flight").length || 0;
    const hotelCount = bookings?.filter((b) => b.services?.type === "hotel").length || 0;
    const totalSpent =
      bookings?.reduce((sum, booking) => {
        if (booking.payment_status === "paid") {
          return sum + Number(booking.total_price);
        }
        return sum;
      }, 0) || 0;

    setStats({ total, pending, confirmed, completed, totalSpent, flightCount, hotelCount });
  }, [bookings]);

  const loadNotifications = () => {
    const saved = localStorage.getItem("dashboard_notifications");
    if (saved) {
      // Notifications sauvegardées en JSON : la date y est une chaîne.
      const parsed: (Omit<Notification, "timestamp"> & { timestamp: string })[] = JSON.parse(saved);
      setNotifications(
        parsed.map((n) => ({
          ...n,
          timestamp: new Date(n.timestamp),
        })),
      );
    }
  };

  const addNotification = (notification: Omit<Notification, "id" | "timestamp" | "read">) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false,
    };

    const updatedNotifications = [newNotification, ...notifications];
    setNotifications(updatedNotifications);
    localStorage.setItem("dashboard_notifications", JSON.stringify(updatedNotifications));
  };

  const markNotificationAsRead = (id: string) => {
    const updated = notifications.filter((n) => n.id !== id);
    setNotifications(updated);
    localStorage.setItem("dashboard_notifications", JSON.stringify(updated));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    localStorage.removeItem("dashboard_notifications");
  };

  const handleConfirmBooking = async (id: string) => {
    try {
      const booking = bookings.find((b) => b.id === id);
      if (!booking) throw new Error(t("dashboardPage.errors.notFound"));

      const { error } = await supabase
        .from("bookings")
        .update({ status: "confirmed", updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;

      if (booking.payment_status === "pending") {
        toast({
          title: t("dashboardPage.notifications.confirmSuccess"),
          description: t("dashboardPage.notifications.redirectPayment"),
        });
        addNotification({
          type: "info",
          title: t("dashboardPage.notifications.confirmSuccess"),
          message: t("dashboardPage.notifications.redirectPayment"),
        });
        setTimeout(() => navigate(`/payment?bookingId=${id}`), 1000);
        return;
      }

      toast({ title: t("common.success"), description: t("dashboardPage.notifications.emailSent") });
      addNotification({
        type: "success",
        title: t("common.success"),
        message: t("dashboardPage.notifications.emailSent"),
      });
    } catch (error) {
      toast({ title: t("common.error"), description: getErrorMessage(error), variant: "destructive" });
    }
  };

  const handleCancelBooking = async (id: string) => {
    try {
      const booking = bookings.find((b) => b.id === id);
      if (!booking) throw new Error(t("dashboardPage.errors.notFound"));
      // Hôtel partenaire : annulation depuis sa page, selon les conditions du
      // tarif (cancel-hotel-booking), jamais le remboursement intégral générique.
      if ((booking as { booking_details?: { kind?: string } | null }).booking_details?.kind === "partner_hotel") {
        navigate(`/confirmation?bookingId=${id}`);
        return;
      }

      // Delegates to the refund-payment edge function, which actually calls
      // CinetPay to refund the charge (not just flipping a status flag) when
      // the booking was paid.
      const { data, error } = await supabase.functions.invoke("refund-payment", {
        body: { booking_id: id },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || t("dashboardPage.errors.notFound"));

      toast({
        title: t("dashboardPage.notifications.cancelSuccess"),
        description: data.refunded
          ? t("dashboardPage.notifications.cancelledRefund")
          : t("dashboardPage.notifications.cancelled"),
      });
      addNotification({
        type: "info",
        title: t("dashboardPage.notifications.cancelSuccess"),
        message: data.refunded
          ? t("dashboardPage.notifications.cancelledRefund")
          : t("dashboardPage.notifications.cancelled"),
      });
    } catch (error) {
      toast({ title: t("common.error"), description: getErrorMessage(error), variant: "destructive" });
    }
  };

  const handleEditBooking = () => {
    toast({
      title: t("dashboardPage.notifications.comingSoon"),
      description: t("dashboardPage.notifications.editSoon"),
    });
    navigate("/support");
  };

  const handleDeleteBooking = async (id: string) => {
    try {
      const booking = bookings.find((b) => b.id === id);
      if (!booking) throw new Error(t("dashboardPage.errors.notFound"));

      if ((booking.status === "confirmed" || booking.status === "completed") && booking.payment_status === "paid") {
        toast({
          title: t("dashboardPage.notifications.cannotDelete"),
          description: t("dashboardPage.notifications.cannotDeleteDesc"),
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.from("bookings").delete().eq("id", id);
      if (error) throw error;

      toast({
        title: t("dashboardPage.notifications.deleteSuccess"),
        description: t("dashboardPage.notifications.deleted"),
      });
      addNotification({
        type: "warning",
        title: t("dashboardPage.notifications.deleteSuccess"),
        message: t("dashboardPage.notifications.deleted"),
      });
    } catch (error) {
      toast({ title: t("common.error"), description: getErrorMessage(error), variant: "destructive" });
    }
  };

  if (bookingsLoading) {
    return (
      <UserDashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </UserDashboardLayout>
    );
  }

  return (
    <UserDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              {t("ux.dash.hello", { name: (userProfile?.full_name || "").split(" ")[0] || t("ux.dash.traveller") })} 👋
            </h1>
            <p className="text-muted-foreground">{t("ux.dash.subtitle")}</p>
          </div>
          <div className="flex items-center gap-2">
            <NotificationCenter
              notifications={notifications}
              onMarkAsRead={markNotificationAsRead}
              onClearAll={clearAllNotifications}
            />
            <Button onClick={() => navigate("/")} className="gap-2">
              <Plus className="h-4 w-4" />
              {t("ux.dash.bookTrip")}
            </Button>
          </div>
        </div>

        <OfflineIndicator
          isOnline={isOnline}
          isSyncing={isSyncing}
          storageStats={storageStats}
          onSync={syncPendingChanges}
        />

        {userProfile && <DashboardOverview userId={userProfile.id} bookings={bookings} />}

        {/* Gestion des réservations (annulation, paiement, calendrier) :
            masquée tant qu'il n'y en a aucune (la vue d'ensemble invite déjà à réserver) */}
        {bookings.length > 0 && (
          <>
            <h2 className="pt-2 text-lg font-semibold">{t("ux.dash.manageBookings")}</h2>
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="mb-4 flex-wrap h-auto gap-1">
                <TabsTrigger value="all" className="text-xs md:text-sm">
                  {t("dashboardPage.tabs.all")} ({stats.total})
                </TabsTrigger>
                <TabsTrigger value="pending" className="text-xs md:text-sm">
                  {t("dashboardPage.tabs.pending")} ({stats.pending})
                </TabsTrigger>
                <TabsTrigger value="confirmed" className="text-xs md:text-sm">
                  {t("dashboardPage.tabs.confirmed")} ({stats.confirmed})
                </TabsTrigger>
                <TabsTrigger value="completed" className="text-xs md:text-sm">
                  {t("dashboardPage.tabs.completed")} ({stats.completed})
                </TabsTrigger>
                <TabsTrigger value="calendar" className="text-xs md:text-sm">
                  📅 {t("dashboardPage.tabs.calendar")}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                {bookings.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">{t("dashboardPage.noBookings")}</h3>
                      <p className="text-muted-foreground mb-6">{t("dashboardPage.startPlanning")}</p>
                      <Button onClick={() => navigate("/")}>{t("dashboardPage.explore")}</Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {bookings.map((booking) => (
                      <BookingCard
                        key={booking.id}
                        booking={booking}
                        onConfirm={() => handleConfirmBooking(booking.id)}
                        onCancel={() => handleCancelBooking(booking.id)}
                        onEdit={handleEditBooking}
                        onDelete={() => handleDeleteBooking(booking.id)}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="pending" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {bookings
                    .filter((booking) => booking.status === "pending")
                    .map((booking) => (
                      <BookingCard
                        key={booking.id}
                        booking={booking}
                        onConfirm={() => handleConfirmBooking(booking.id)}
                        onCancel={() => handleCancelBooking(booking.id)}
                        onEdit={handleEditBooking}
                        onDelete={() => handleDeleteBooking(booking.id)}
                      />
                    ))}
                </div>
              </TabsContent>

              <TabsContent value="confirmed" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {bookings
                    .filter((booking) => booking.status === "confirmed")
                    .map((booking) => (
                      <BookingCard
                        key={booking.id}
                        booking={booking}
                        onConfirm={() => handleConfirmBooking(booking.id)}
                        onCancel={() => handleCancelBooking(booking.id)}
                        onEdit={handleEditBooking}
                        onDelete={() => handleDeleteBooking(booking.id)}
                      />
                    ))}
                </div>
              </TabsContent>

              <TabsContent value="completed" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {bookings
                    .filter((booking) => booking.status === "completed")
                    .map((booking) => (
                      <BookingCard
                        key={booking.id}
                        booking={booking}
                        onConfirm={() => handleConfirmBooking(booking.id)}
                        onCancel={() => handleCancelBooking(booking.id)}
                        onEdit={handleEditBooking}
                        onDelete={() => handleDeleteBooking(booking.id)}
                      />
                    ))}
                </div>
              </TabsContent>

              <TabsContent value="calendar">
                <BookingCalendar bookings={bookings} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </UserDashboardLayout>
  );
};

export default UserDashboard;
