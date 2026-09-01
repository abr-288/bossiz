import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Calendar, AlertCircle, Users, Wallet } from "lucide-react";
import { Price } from "@/components/ui/price";

interface StatsCardsProps {
  totalRevenue: number;
  totalMargin?: number;
  bookingsWithKnownCost?: number;
  totalBookings: number;
  pendingBookings: number;
  totalUsers: number;
}

export function StatsCards({ totalRevenue, totalMargin, bookingsWithKnownCost, totalBookings, pendingBookings, totalUsers }: StatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Revenus Totaux</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold"><Price amount={totalRevenue} fromCurrency="EUR" showLoader /></div>
          <p className="text-xs text-muted-foreground">Réservations payées</p>
        </CardContent>
      </Card>

      {totalMargin !== undefined && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Marge</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600"><Price amount={totalMargin} fromCurrency="EUR" showLoader /></div>
            <p className="text-xs text-muted-foreground">
              Sur {bookingsWithKnownCost ?? 0} réservation(s) à coût connu
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Réservations</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalBookings}</div>
          <p className="text-xs text-muted-foreground">Total de réservations</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">En Attente</CardTitle>
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">{pendingBookings}</div>
          <p className="text-xs text-muted-foreground">Réservations en attente</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Utilisateurs</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalUsers}</div>
          <p className="text-xs text-muted-foreground">Comptes enregistrés</p>
        </CardContent>
      </Card>
    </div>
  );
}
