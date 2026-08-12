import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AdminStats {
  totalRevenue: number;
  totalSupplierCost: number;
  totalMargin: number;
  bookingsWithKnownCost: number;
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  conversionRate: number;
  totalUsers: number;
  revenueByMonth: { month: string; revenue: number }[];
  bookingsByStatus: { status: string; count: number }[];
  bookingsByService: { name: string; value: number }[];
  geographicData: { location: string; revenue: number; bookings: number }[];
  recentBookings: any[];
}

export const useAdminStats = () => {
  const [stats, setStats] = useState<AdminStats>({
    totalRevenue: 0,
    totalSupplierCost: 0,
    totalMargin: 0,
    bookingsWithKnownCost: 0,
    totalBookings: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    cancelledBookings: 0,
    conversionRate: 0,
    totalUsers: 0,
    revenueByMonth: [],
    bookingsByStatus: [],
    bookingsByService: [],
    geographicData: [],
    recentBookings: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch bookings with service info
        const { data: bookings } = await supabase
          .from("bookings")
          .select(`
            *,
            services:service_id (
              type,
              location,
              name
            )
          `)
          .order("created_at", { ascending: false });

        if (bookings) {
          const paidBookings = bookings.filter((b) => b.payment_status === "paid");
          const totalRevenue = paidBookings.reduce((sum, b) => sum + Number(b.total_price), 0);

          // supplier_cost is only known for hotel/car (back-computed from the
          // retail markup) and flight (real base_fare) bookings - see
          // supabase/functions/create-booking. Other verticals leave it null,
          // so margin is only summed over bookings where it's actually known.
          const bookingsWithCost = paidBookings.filter((b) => b.supplier_cost !== null && b.supplier_cost !== undefined);
          const totalSupplierCost = bookingsWithCost.reduce((sum, b) => sum + Number(b.supplier_cost), 0);
          const totalMargin = bookingsWithCost.reduce((sum, b) => sum + (Number(b.total_price) - Number(b.supplier_cost)), 0);
          const bookingsWithKnownCost = bookingsWithCost.length;

          const totalBookings = bookings.length;
          const pendingBookings = bookings.filter((b) => b.status === "pending").length;
          const confirmedBookings = bookings.filter((b) => b.status === "confirmed").length;
          const cancelledBookings = bookings.filter((b) => b.status === "cancelled").length;
          const conversionRate = totalBookings > 0 ? (confirmedBookings / totalBookings) * 100 : 0;

          // Revenue by month (last 6 months)
          const now = new Date();
          const revenueByMonth = [];
          for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthName = date.toLocaleDateString("fr-FR", { month: "short", year: "numeric" });
            const monthRevenue = bookings
              .filter((b) => {
                const bookingDate = new Date(b.created_at);
                return (
                  b.payment_status === "paid" &&
                  bookingDate.getMonth() === date.getMonth() &&
                  bookingDate.getFullYear() === date.getFullYear()
                );
              })
              .reduce((sum, b) => sum + Number(b.total_price), 0);

            revenueByMonth.push({ month: monthName, revenue: monthRevenue });
          }

          // Bookings by status
          const statusCounts: { [key: string]: number } = {};
          bookings.forEach((b) => {
            statusCounts[b.status] = (statusCounts[b.status] || 0) + 1;
          });

          const bookingsByStatus = Object.entries(statusCounts).map(([status, count]) => ({
            status,
            count,
          }));

          // Bookings by service type
          const serviceTypeMap = new Map();
          bookings.forEach((b: any) => {
            const serviceType = b.services?.type || 'other';
            const count = serviceTypeMap.get(serviceType) || 0;
            serviceTypeMap.set(serviceType, count + 1);
          });

          const serviceTypeLabels: Record<string, string> = {
            hotel: 'Hôtels',
            flight: 'Vols',
            car: 'Voitures',
            tour: 'Tours',
            event: 'Événements',
            flight_hotel: 'Vol + Hôtel',
            other: 'Autres'
          };

          const bookingsByService = Array.from(serviceTypeMap.entries()).map(([type, count]) => ({
            name: serviceTypeLabels[type] || type,
            value: count,
          }));

          // Geographic distribution
          const locationMap = new Map();
          bookings.forEach((b: any) => {
            const location = b.services?.location || 'Non défini';
            const revenue = locationMap.get(location) || 0;
            locationMap.set(location, revenue + Number(b.total_price));
          });

          const geographicData = Array.from(locationMap.entries())
            .map(([location, revenue]) => ({
              location,
              revenue,
              bookings: bookings.filter((b: any) => b.services?.location === location).length,
            }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10);

          // Recent bookings
          const recentBookings = bookings.slice(0, 10);

          setStats({
            totalRevenue,
            totalSupplierCost,
            totalMargin,
            bookingsWithKnownCost,
            totalBookings,
            pendingBookings,
            confirmedBookings,
            cancelledBookings,
            conversionRate,
            totalUsers: 0, // Will be updated below
            revenueByMonth,
            bookingsByStatus,
            bookingsByService,
            geographicData,
            recentBookings,
          });
        }

        // Total users
        const { count: usersCount } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true });

        setStats((prev) => ({ ...prev, totalUsers: usersCount || 0 }));
      } catch (error) {
        console.error("Error fetching admin stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    // Set up realtime subscription for bookings
    const channel = supabase
      .channel("admin-stats")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings" },
        () => fetchStats()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const refetch = () => {
    setLoading(true);
    // Trigger re-fetch
    const channel = supabase.channel("admin-stats-refresh");
    channel.subscribe();
    supabase.removeChannel(channel);
  };

  return { stats, loading, refetch };
};
