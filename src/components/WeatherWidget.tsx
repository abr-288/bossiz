import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cloud, Droplets, Wind, Thermometer, Loader2 } from "lucide-react";
import { useWeather, WeatherData } from "@/hooks/useWeather";
import { useTranslation } from "react-i18next";

interface WeatherWidgetProps {
  city: string;
}

export const WeatherWidget = ({ city }: WeatherWidgetProps) => {
  const { t } = useTranslation();
  const { getWeather, loading } = useWeather();
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    if (city) {
      fetchWeather();
    }
  }, [city]);

  const fetchWeather = async () => {
    const data = await getWeather(city);
    if (data) {
      setWeather(data);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!weather) {
    return null;
  }

  return (
    <Card className="bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Cloud className="w-5 h-5 text-primary" />
          Météo à {weather.location}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <img src={`https:${weather.icon}`} alt={weather.condition} className="w-16 h-16" />
            <div>
              <p className="text-4xl font-bold">{Math.round(weather.temperature)}°C</p>
              <p className="text-sm text-muted-foreground">{weather.condition}</p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
          <div className="flex flex-col items-center gap-1">
            <Thermometer className="w-4 h-4 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Ressenti</p>
            <p className="font-semibold">{Math.round(weather.feelsLike)}°C</p>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Droplets className="w-4 h-4 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">{t("ux.weather.humidity")}</p>
            <p className="font-semibold">{weather.humidity}%</p>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Wind className="w-4 h-4 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Vent</p>
            <p className="font-semibold">{Math.round(weather.windSpeed)} km/h</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
