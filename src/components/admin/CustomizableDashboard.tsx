import { useMemo } from "react";
import { StatsCards } from "@/components/admin/StatsCards";
import { RevenueChart } from "@/components/admin/RevenueChart";
import { BookingsByServiceChart } from "@/components/admin/BookingsByServiceChart";
import { GeographicDistributionChart } from "@/components/admin/GeographicDistributionChart";
import { ConversionMetrics } from "@/components/admin/ConversionMetrics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { WidgetConfig } from "@/hooks/useDashboardPreferences";
import { Price } from "@/components/ui/price";

const COLORS = {
  pending: "#f59e0b",
  confirmed: "#10b981",
  completed: "#3b82f6",
  cancelled: "#ef4444",
};

interface CustomizableDashboardProps {
  widgetsConfig: WidgetConfig[];
  stats: any;
}

export function CustomizableDashboard({ widgetsConfig, stats }: CustomizableDashboardProps) {
  const renderWidget = (widget: WidgetConfig) => {
    if (!widget.visible) return null;

    switch (widget.type) {
      case "stats":
        return (
          <div key={widget.id} className="col-span-full">
            <StatsCards
              totalRevenue={stats.totalRevenue}
              totalMargin={stats.totalMargin}
              bookingsWithKnownCost={stats.bookingsWithKnownCost}
              totalBookings={stats.totalBookings}
              pendingBookings={stats.pendingBookings}
              totalUsers={stats.totalUsers}
            />
          </div>
        );

      case "conversion":
        return (
          <div key={widget.id} className="col-span-full">
            <ConversionMetrics stats={stats} />
          </div>
        );

      case "revenue":
        return (
          <div key={widget.id} className="lg:col-span-1">
            <RevenueChart data={stats.revenueByMonth} />
          </div>
        );

      case "service":
        return (
          <div key={widget.id} className="lg:col-span-1">
            <BookingsByServiceChart data={stats.bookingsByService} />
          </div>
        );

      case "geographic":
        return (
          <div key={widget.id} className="col-span-full">
            <GeographicDistributionChart data={stats.geographicData} />
          </div>
        );

      case "status":
        return (
          <div key={widget.id} className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Répartition par Statut</CardTitle>
                <CardDescription>Distribution des réservations</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats.bookingsByStatus}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ status, count }) => `${status}: ${count}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {stats.bookingsByStatus.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[entry.status as keyof typeof COLORS] || "#8884d8"} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        );

      case "recent":
        return (
          <div key={widget.id} className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Réservations Récentes</CardTitle>
                <CardDescription>Les 10 dernières réservations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.recentBookings.map((booking: any) => (
                    <div key={booking.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{booking.customer_name}</p>
                        <p className="text-sm text-muted-foreground">{booking.customer_email}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold"><Price amount={Number(booking.total_price)} fromCurrency="XOF" /></p>
                        <Badge variant={
                          booking.status === "confirmed" ? "default" :
                          booking.status === "pending" ? "secondary" :
                          booking.status === "completed" ? "outline" : "destructive"
                        }>
                          {booking.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  const sortedWidgets = useMemo(() => {
    return [...widgetsConfig].sort((a, b) => a.order - b.order);
  }, [widgetsConfig]);

  // Group widgets that should be in a grid
  const groupedWidgets = useMemo(() => {
    const groups: WidgetConfig[][] = [];
    let currentGroup: WidgetConfig[] = [];

    sortedWidgets.forEach((widget, index) => {
      if (!widget.visible) return;

      // Full-width widgets
      if (["stats", "conversion", "geographic"].includes(widget.type)) {
        if (currentGroup.length > 0) {
          groups.push([...currentGroup]);
          currentGroup = [];
        }
        groups.push([widget]);
      }
      // Grid widgets
      else {
        currentGroup.push(widget);
        // Push group if we have 2 items or it's the last item
        if (currentGroup.length === 2 || index === sortedWidgets.length - 1) {
          groups.push([...currentGroup]);
          currentGroup = [];
        }
      }
    });

    return groups;
  }, [sortedWidgets]);

  return (
    <div className="space-y-6">
      {groupedWidgets.map((group, groupIndex) => {
        const isGrid = group.length > 1 || 
          !["stats", "conversion", "geographic"].includes(group[0].type);
        
        return isGrid ? (
          <div key={groupIndex} className="grid gap-4 md:grid-cols-2">
            {group.map((widget) => renderWidget(widget))}
          </div>
        ) : (
          <div key={groupIndex}>
            {renderWidget(group[0])}
          </div>
        );
      })}
    </div>
  );
}
