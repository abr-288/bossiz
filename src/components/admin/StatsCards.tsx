import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Calendar, AlertCircle, Users, Wallet } from "lucide-react";
import { Price } from "@/components/ui/price";
import { useTranslation } from "react-i18next";

interface StatsCardsProps {
  totalRevenue: number;
  totalMargin?: number;
  bookingsWithKnownCost?: number;
  totalBookings: number;
  pendingBookings: number;
  totalUsers: number;
}

export function StatsCards({ totalRevenue, totalMargin, bookingsWithKnownCost, totalBookings, pendingBookings, totalUsers }: StatsCardsProps) {
  const { t } = useTranslation();
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t("ux.bo.totalRevenue")}</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold"><Price amount={totalRevenue} fromCurrency="EUR" showLoader /></div>
          <p className="text-xs text-muted-foreground">{t("ux.bo.paidBookings")}</p>
        </CardContent>
      </Card>

      {totalMargin !== undefined && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("ux.bo.margin")}</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success"><Price amount={totalMargin} fromCurrency="EUR" showLoader /></div>
            <p className="text-xs text-muted-foreground">
              Sur {bookingsWithKnownCost ?? 0} réservation(s) à coût connu
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t("ux.bo.bookings")}</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalBookings}</div>
          <p className="text-xs text-muted-foreground">{t("ux.bo.totalBookings")}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t("ux.bo.pending")}</CardTitle>
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-warning-foreground">{pendingBookings}</div>
          <p className="text-xs text-muted-foreground">{t("ux.bo.pendingBookings")}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t("ux.bo.users")}</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalUsers}</div>
          <p className="text-xs text-muted-foreground">{t("ux.bo.registeredAccounts")}</p>
        </CardContent>
      </Card>
    </div>
  );
}
