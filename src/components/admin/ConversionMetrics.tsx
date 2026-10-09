import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, CheckCircle, XCircle, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ConversionMetricsProps {
  stats: {
    totalBookings: number;
    confirmedBookings: number;
    cancelledBookings: number;
    pendingBookings: number;
    conversionRate: number;
  };
}

export function ConversionMetrics({ stats }: ConversionMetricsProps) {
  const { t } = useTranslation();
  const { 
    totalBookings, 
    confirmedBookings, 
    cancelledBookings, 
    pendingBookings, 
    conversionRate 
  } = stats;

  const cancelRate = totalBookings > 0 ? (cancelledBookings / totalBookings) * 100 : 0;
  const pendingRate = totalBookings > 0 ? (pendingBookings / totalBookings) * 100 : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t("ux.bo.conversionRate")}</CardTitle>
          <TrendingUp className="h-4 w-4 text-success" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{conversionRate.toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground">
            {confirmedBookings} confirmées sur {totalBookings} total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t("ux.bo.confirmedBookings")}</CardTitle>
          <CheckCircle className="h-4 w-4 text-success" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{confirmedBookings}</div>
          <p className="text-xs text-muted-foreground">
            {conversionRate.toFixed(1)}% du total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t("ux.bo.cancellationRate")}</CardTitle>
          <XCircle className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{cancelRate.toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground">
            {cancelledBookings} annulations
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t("ux.bo.pending")}</CardTitle>
          <Clock className="h-4 w-4 text-warning" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{pendingBookings}</div>
          <p className="text-xs text-muted-foreground">
            {pendingRate.toFixed(1)}% du total
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
