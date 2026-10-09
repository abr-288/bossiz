import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useTranslation } from "react-i18next";

interface GeographicDistributionChartProps {
  data: Array<{ location: string; revenue: number; bookings: number }>;
}

export function GeographicDistributionChart({ data }: GeographicDistributionChartProps) {
  const { t } = useTranslation();
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("ux.bo.geographicBreakdown2")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            {t("ux.bo.noDataAvailable")}
          </div>
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
          <p className="font-medium">{payload[0].payload.location}</p>
          <p className="text-sm text-primary">
            Revenus: {payload[0].value.toLocaleString()} EUR
          </p>
          <p className="text-sm text-muted-foreground">
            {payload[0].payload.bookings} réservations
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("ux.bo.top10Destinations")}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis type="number" />
            <YAxis 
              dataKey="location" 
              type="category" 
              width={120}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar 
              dataKey="revenue" 
              fill="hsl(var(--primary))" 
              name="Revenus (EUR)"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
