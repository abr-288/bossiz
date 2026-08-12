import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calendar, CreditCard, Package, TrendingUp, Plane, Hotel } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { NotificationCenter, Notification } from "@/components/dashboard/NotificationCenter";
import { BookingCard } from "@/components/dashboard/BookingCard";
import { UpcomingReminders } from "@/components/dashboard/UpcomingReminders";
import { BookingCalendar } from "@/components/dashboard/BookingCalendar";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { useOfflineBookings } from "@/hooks/useOfflineBookings";
import { Price } from "@/components/ui/price";
import { useTranslation } from "react-i18next";
import { UserDashboardLayout } from "@/components/dashboard/UserDashboardLayout";

interface Booking {
  id: string;
  service_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  start_date: string;
  end_date: string | null;
  guests: number;
  total_price: number;
  currency: string;
  status: string;
  payment_status: string;
  external_ref: string | null;
  created_at: string;
  services: {
    name: string;
    type: string;
    location: string;
  };
}

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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();
      
      setUserProfile({
        id: user.id,
        full_name: profileData?.full_name || t('dashboardPage.welcome'),
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
    syncPendingChanges 
  } = useOfflineBookings(userProfile?.id);

  useEffect(() => {
    const total = bookings?.length || 0;
    const pending = bookings?.filter((b) => b.status === "pending").length || 0;
    const confirmed = bookings?.filter((b) => b.status === "confirmed").length || 0;
    const completed = bookings?.filter((b) => b.status === "completed").length || 0;
    const flightCount = bookings?.filter((b) => b.services?.type === "flight").length || 0;
    const hotelCount = bookings?.filter((b) => b.services?.type === "hotel").length || 0;
    const totalSpent = bookings?.reduce((sum, booking) => {
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
      const parsed = JSON.parse(saved);
      setNotifications(parsed.map((n: any) => ({
        ...n,
        timestamp: new Date(n.timestamp)
      })));
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
      if (!booking) throw new Error(t('dashboardPage.errors.notFound'));

      const { error } = await supabase
        .from("bookings")
        .update({ status: "confirmed", updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;

      if (booking.payment_status === "pending") {
        toast({
          title: t('dashboardPage.notifications.confirmSuccess'),
          description: t('dashboardPage.notifications.redirectPayment'),
        });
        addNotification({
          type: "info",
          title: t('dashboardPage.notifications.confirmSuccess'),
          message: t('dashboardPage.notifications.redirectPayment'),
        });
        setTimeout(() => navigate(`/payment?bookingId=${id}`), 1000);
        return;
      }

      toast({ title: t('common.success'), description: t('dashboardPage.notifications.emailSent') });
      addNotification({
        type: "success",
        title: t('common.success'),
        message: t('dashboardPage.notifications.emailSent'),
      });
    } catch (error: any) {
      toast({ title: t('common.error'), description: error.message, variant: "destructive" });
    }
  };

  const handleCancelBooking = async (id: string) => {
    try {
      const booking = bookings.find((b) => b.id === id);
      if (!booking) throw new Error(t('dashboardPage.errors.notFound'));

      // Delegates to the refund-payment edge function, which actually calls
      // CinetPay to refund the charge (not just flipping a status flag) when
      // the booking was paid.
      const { data, error } = await supabase.functions.invoke('refund-payment', {
        body: { booking_id: id },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || t('dashboardPage.errors.notFound'));

      toast({
        title: t('dashboardPage.notifications.cancelSuccess'),
        description: data.refunded
          ? t('dashboardPage.notifications.cancelledRefund')
          : t('dashboardPage.notifications.cancelled'),
      });
      addNotification({
        type: "info",
        title: t('dashboardPage.notifications.cancelSuccess'),
        message: data.refunded
          ? t('dashboardPage.notifications.cancelledRefund')
          : t('dashboardPage.notifications.cancelled'),
      });
    } catch (error: any) {
      toast({ title: t('common.error'), description: error.message, variant: "destructive" });
    }
  };

  const handleEditBooking = () => {
    toast({
      title: t('dashboardPage.notifications.comingSoon'),
      description: t('dashboardPage.notifications.editSoon'),
    });
    navigate('/support');
  };

  const handleDeleteBooking = async (id: string) => {
    try {
      const booking = bookings.find((b) => b.id === id);
      if (!booking) throw new Error(t('dashboardPage.errors.notFound'));

      if ((booking.status === "confirmed" || booking.status === "completed") && booking.payment_status === "paid") {
        toast({
          title: t('dashboardPage.notifications.cannotDelete'),
          description: t('dashboardPage.notifications.cannotDeleteDesc'),
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.from("bookings").delete().eq("id", id);
      if (error) throw error;

      toast({ title: t('dashboardPage.notifications.deleteSuccess'), description: t('dashboardPage.notifications.deleted') });
      addNotification({
        type: "warning",
        title: t('dashboardPage.notifications.deleteSuccess'),
        message: t('dashboardPage.notifications.deleted'),
      });
    } catch (error: any) {
      toast({ title: t('common.error'), description: error.message, variant: "destructive" });
    }
  };

  const handleViewDetails = (id: string) => {
    const booking = bookings.find((b) => b.id === id);
    if (booking?.services) {
      toast({
        title: booking.services.name,
        description: `Départ le ${new Date(booking.start_date).toLocaleDateString("fr-FR")}`,
      });
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
            <h1 className="text-2xl md:text-3xl font-bold">{t('dashboardPage.title')}</h1>
            {userProfile && (
              <p className="text-muted-foreground">
                {t('dashboardPage.welcome')}, <span className="text-primary font-medium">{userProfile.full_name}</span> 👋
              </p>
            )}
          </div>
          <NotificationCenter
            notifications={notifications}
            onMarkAsRead={markNotificationAsRead}
            onClearAll={clearAllNotifications}
          />
        </div>

        <OfflineIndicator 
          isOnline={isOnline}
          isSyncing={isSyncing}
          storageStats={storageStats}
          onSync={syncPendingChanges}
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3 md:gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 px-4 pt-4">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                <Package className="w-4 h-4" />
                {t('dashboardPage.totalBookings')}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 px-4 pt-4">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {t('dashboardPage.pending')}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 px-4 pt-4">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                {t('dashboardPage.confirmed')}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-2xl font-bold text-green-600">{stats.confirmed}</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 px-4 pt-4">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                {t('dashboardPage.totalSpent')}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-xl font-bold"><Price amount={stats.totalSpent} showLoader /></div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 px-4 pt-4">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                <Plane className="w-4 h-4" />
                Vols
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-2xl font-bold text-blue-600">{stats.flightCount}</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 px-4 pt-4">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                <Hotel className="w-4 h-4" />
                Hôtels
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-2xl font-bold text-purple-600">{stats.hotelCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Reminders */}
        <UpcomingReminders
          bookings={bookings.filter((b) => b.status === "confirmed")}
          onViewDetails={handleViewDetails}
        />

        {/* Bookings Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-4 flex-wrap h-auto gap-1">
            <TabsTrigger value="all" className="text-xs md:text-sm">
              {t('dashboardPage.tabs.all')} ({stats.total})
            </TabsTrigger>
            <TabsTrigger value="pending" className="text-xs md:text-sm">
              {t('dashboardPage.tabs.pending')} ({stats.pending})
            </TabsTrigger>
            <TabsTrigger value="confirmed" className="text-xs md:text-sm">
              {t('dashboardPage.tabs.confirmed')} ({stats.confirmed})
            </TabsTrigger>
            <TabsTrigger value="completed" className="text-xs md:text-sm">
              {t('dashboardPage.tabs.completed')} ({stats.completed})
            </TabsTrigger>
            <TabsTrigger value="calendar" className="text-xs md:text-sm">
              📅 {t('dashboardPage.tabs.calendar')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {bookings.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{t('dashboardPage.noBookings')}</h3>
                  <p className="text-muted-foreground mb-6">{t('dashboardPage.startPlanning')}</p>
                  <Button onClick={() => navigate("/")}>{t('dashboardPage.explore')}</Button>
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
      </div>
    </UserDashboardLayout>
  );
};

export default UserDashboard;
