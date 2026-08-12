import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calendar, CreditCard, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { NotificationCenter, Notification } from "@/components/dashboard/NotificationCenter";
import { BookingCard } from "@/components/dashboard/BookingCard";
import { UpcomingReminders } from "@/components/dashboard/UpcomingReminders";
import { BookingCalendar } from "@/components/dashboard/BookingCalendar";

import { OfflineIndicator } from "@/components/OfflineIndicator";
import { useOfflineBookings } from "@/hooks/useOfflineBookings";
import { Price } from "@/components/ui/price";
import { useTranslation } from "react-i18next";

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

const Dashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userProfile, setUserProfile] = useState<{ full_name: string; email: string; id: string; subscription_type?: string; role?: string } | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    totalSpent: 0,
  });

  // Use offline bookings hook
  const { 
    bookings, 
    loading: bookingsLoading, 
    isOnline, 
    isSyncing, 
    storageStats,
    syncPendingChanges 
  } = useOfflineBookings(userProfile?.id);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/auth');
          return;
        }
        
        setUserProfile({
          full_name: user.user_metadata?.full_name || '',
          email: user.email || '',
          id: user.id,
          subscription_type: user.user_metadata?.subscription_type,
          role: user.user_metadata?.role,
        });
      } catch (error) {
        console.error('Error fetching user:', error);
        navigate('/auth');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      
      // Fetch user profile
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
      
      setLoading(false);
      loadNotifications();
    };

    checkAuth();
  }, [navigate]);

  // Update stats when bookings change
  useEffect(() => {
    const total = bookings?.length || 0;
    const pending = bookings?.filter((b) => b.status === "pending").length || 0;
    const confirmed = bookings?.filter((b) => b.status === "confirmed").length || 0;
    const completed = bookings?.filter((b) => b.status === "completed").length || 0;
    const totalSpent = bookings?.reduce((sum, booking) => {
      if (booking.payment_status === "paid") {
        return sum + Number(booking.total_price);
      }
      return sum;
    }, 0) || 0;

    setStats({ total, pending, confirmed, completed, totalSpent });

    // Check for upcoming bookings and create notifications
    bookings?.forEach((booking) => {
      const startDate = new Date(booking.start_date);
      const today = new Date();
      const diffDays = Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1 && booking.status === "confirmed") {
        const existingNotif = notifications.find(n => n.message.includes(booking.id));
        if (!existingNotif && booking.services) {
          addNotification({
            type: "warning",
            title: t('dashboardPage.notifications.departingTomorrow'),
            message: `${booking.services.name} ${t('dashboardPage.notifications.startsTomorrow')}`,
          });
        }
      }
    });
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
      if (!booking) {
        throw new Error(t('dashboardPage.errors.notFound'));
      }

      const { error } = await supabase
        .from("bookings")
        .update({ 
          status: "confirmed",
          updated_at: new Date().toISOString()
        })
        .eq("id", id);

      if (error) throw error;

      if (booking.payment_status === "pending") {
        toast({
          title: t('dashboardPage.notifications.confirmSuccess'),
          description: t('dashboardPage.notifications.redirectPayment'),
        });
        
        setTimeout(() => {
          navigate(`/payment?bookingId=${id}`);
        }, 1000);
        return;
      }

      try {
        await supabase.functions.invoke("send-booking-pdf-email", {
          body: { bookingId: id },
        });
        
        toast({
          title: t('common.success'),
          description: t('dashboardPage.notifications.emailSent'),
        });
      } catch (emailError) {
        console.error("Error sending confirmation email:", emailError);
        toast({
          title: t('dashboardPage.notifications.confirmed'),
          description: t('dashboardPage.notifications.emailNotSent'),
        });
      }

      addNotification({
        type: "success",
        title: t('dashboardPage.notifications.confirmed'),
        message: booking.payment_status === "paid" 
          ? t('dashboardPage.notifications.emailSent')
          : t('dashboardPage.notifications.redirectPayment'),
      });
    } catch (error: any) {
      console.error("Error confirming booking:", error);
      toast({
        title: t('common.error'),
        description: error.message || t('dashboardPage.errors.confirmError'),
        variant: "destructive",
      });
    }
  };

  const handleCancelBooking = async (id: string) => {
    try {
      const booking = bookings.find((b) => b.id === id);
      if (!booking) {
        throw new Error(t('dashboardPage.errors.notFound'));
      }

      const updateData: any = { 
        status: "cancelled",
        updated_at: new Date().toISOString()
      };

      if (booking.payment_status === "paid") {
        updateData.payment_status = "refunded";
      }

      const { error } = await supabase
        .from("bookings")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;

      toast({
        title: t('dashboardPage.notifications.cancelSuccess'),
        description: booking.payment_status === "paid" 
          ? t('dashboardPage.notifications.cancelledRefund')
          : t('dashboardPage.notifications.cancelled'),
      });

      addNotification({
        type: "info",
        title: t('dashboardPage.notifications.cancelledNotif'),
        message: booking.payment_status === "paid" 
          ? t('dashboardPage.notifications.refundNotif')
          : t('dashboardPage.notifications.cancelled'),
      });
    } catch (error: any) {
      console.error("Error cancelling booking:", error);
      toast({
        title: t('common.error'),
        description: error.message || t('dashboardPage.errors.cancelError'),
        variant: "destructive",
      });
    }
  };

  const handleEditBooking = (booking: Booking) => {
    toast({
      title: t('dashboardPage.notifications.comingSoon'),
      description: t('dashboardPage.notifications.editSoon'),
    });
  };

  const handleDeleteBooking = async (id: string) => {
    try {
      const booking = bookings.find((b) => b.id === id);
      if (!booking) {
        throw new Error(t('dashboardPage.errors.notFound'));
      }

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

      toast({
        title: t('dashboardPage.notifications.deleteSuccess'),
        description: t('dashboardPage.notifications.deleted'),
      });

      addNotification({
        type: "info",
        title: t('dashboardPage.notifications.deletedNotif'),
        message: t('dashboardPage.notifications.deletedFromHistory'),
      });
    } catch (error: any) {
      console.error("Error deleting booking:", error);
      toast({
        title: t('common.error'),
        description: error.message || t('dashboardPage.errors.deleteError'),
        variant: "destructive",
      });
    }
  };

  const handleViewDetails = (id: string) => {
    const booking = bookings.find((b) => b.id === id);
    if (booking && booking.services) {
      toast({
        title: booking.services.name,
        description: `Départ le ${new Date(booking.start_date).toLocaleDateString("fr-FR")}`,
      });
    }
  };

  if (loading || bookingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white pt-16">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-6 md:py-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-bold text-black">{t('dashboardPage.title')}</h1>
            </div>
            {userProfile && (
              <p className="text-lg font-semibold text-black mb-1">
                {t('dashboardPage.welcome')}, {userProfile.full_name} &#x1f44b;
              </p>
            )}
            <p className="text-gray-700">
              {t('dashboardPage.subtitle')}
            </p>
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card className="hover:shadow-lg transition-shadow border-2 border-gray-300 bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Package className="w-4 h-4 text-black" />
                {t('dashboardPage.totalBookings')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-black">{stats.total}</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-2 border-gray-300 bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-black" />
                {t('dashboardPage.pending')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-black">{stats.pending}</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-2 border-gray-300 bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-black" />
                {t('dashboardPage.confirmed')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-black">{stats.confirmed}</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-2 border-gray-300 bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-black" />
                {t('dashboardPage.totalSpent')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black"><Price amount={stats.totalSpent} fromCurrency="EUR" showLoader /></div>
            </CardContent>
          </Card>

          
        </div>

        <div className="mb-8">
          <UpcomingReminders
            bookings={bookings.filter((b) => b.status === "confirmed")}
            onViewDetails={handleViewDetails}
          />
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="all">{t('dashboardPage.tabs.all')} ({stats.total})</TabsTrigger>
            <TabsTrigger value="pending">{t('dashboardPage.tabs.pending')} ({stats.pending})</TabsTrigger>
            <TabsTrigger value="confirmed">{t('dashboardPage.tabs.confirmed')} ({stats.confirmed})</TabsTrigger>
            <TabsTrigger value="completed">{t('dashboardPage.tabs.completed')} ({stats.completed})</TabsTrigger>
            <TabsTrigger value="calendar">📅 {t('dashboardPage.tabs.calendar')}</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {bookings.length === 0 ? (
              <Card className="border-2 border-gray-300 bg-white">
                <CardContent className="py-12 text-center">
                  <Package className="h-12 w-12 mx-auto text-black mb-4" />
                  <h3 className="text-lg font-semibold text-black mb-2">{t('dashboardPage.noBookings')}</h3>
                  <p className="text-gray-700 mb-6">
                    {t('dashboardPage.startPlanning')}
                  </p>
                  <Button onClick={() => navigate("/")} className="bg-black hover:bg-gray-800 text-white">{t('dashboardPage.explore')}</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {bookings.map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    onConfirm={() => handleConfirmBooking(booking.id)}
                    onCancel={() => handleCancelBooking(booking.id)}
                    onEdit={() => handleEditBooking(booking)}
                    onDelete={() => handleDeleteBooking(booking.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {bookings
                .filter((booking) => booking.status === "pending")
                .map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    onConfirm={() => handleConfirmBooking(booking.id)}
                    onCancel={() => handleCancelBooking(booking.id)}
                    onEdit={() => handleEditBooking(booking)}
                    onDelete={() => handleDeleteBooking(booking.id)}
                  />
                ))}
            </div>
          </TabsContent>

          <TabsContent value="confirmed" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {bookings
                .filter((booking) => booking.status === "confirmed")
                .map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    onConfirm={() => handleConfirmBooking(booking.id)}
                    onCancel={() => handleCancelBooking(booking.id)}
                    onEdit={() => handleEditBooking(booking)}
                    onDelete={() => handleDeleteBooking(booking.id)}
                  />
                ))}
            </div>
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {bookings
                .filter((booking) => booking.status === "completed")
                .map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    onConfirm={() => handleConfirmBooking(booking.id)}
                    onCancel={() => handleCancelBooking(booking.id)}
                    onEdit={() => handleEditBooking(booking)}
                    onDelete={() => handleDeleteBooking(booking.id)}
                  />
                ))}
            </div>
          </TabsContent>

          <TabsContent value="calendar">
            <BookingCalendar bookings={bookings} />
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
