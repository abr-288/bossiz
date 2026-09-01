import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Cloud, Bot, TrendingUp, MapPin, Search } from "lucide-react";
import { useWeather } from "@/hooks/useWeather";
import { useEventSearch } from "@/hooks/useEventSearch";
import { useAITravelAdvisor } from "@/hooks/useAITravelAdvisor";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";

interface SeasonalInfo {
  key: string;
  color: string;
}

const seasonalData: SeasonalInfo[] = [
  { key: "spring", color: "bg-green-500" },
  { key: "summer", color: "bg-orange-500" },
  { key: "autumn", color: "bg-amber-600" },
  { key: "winter", color: "bg-blue-500" }
];

export const SeasonalSuggestions = () => {
  const { t } = useTranslation();
  const [destination, setDestination] = useState("");
  const [searchTrigger, setSearchTrigger] = useState(false);
  
  const { getWeather, loading: weatherLoading } = useWeather();
  const { searchEvents, loading: eventsLoading } = useEventSearch();
  const { getRecommendations, loading: aiLoading } = useAITravelAdvisor();
  
  const [weatherData, setWeatherData] = useState<any>(null);
  const [eventsData, setEventsData] = useState<any>(null);
  const [aiRecommendations, setAiRecommendations] = useState<any>(null);

  const handleSearch = async () => {
    if (!destination.trim()) return;
    
    setSearchTrigger(true);
    
    // Récupérer la météo
    const weather = await getWeather(destination);
    setWeatherData(weather);
    
    // Récupérer les événements
    const events = await searchEvents({ location: destination });
    setEventsData(events);
    
    // Récupérer les recommandations IA
    const recommendations = await getRecommendations({
      destination,
      interests: "saisonnalité, événements locaux, meilleures périodes",
      budget: "flexible",
      duration: "flexible"
    });
    setAiRecommendations(recommendations);
  };

  const currentMonth = new Date().getMonth();
  const currentSeason = Math.floor(currentMonth / 3);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            {t('seasonalSuggestions.title')}
          </CardTitle>
          <CardDescription>
            {t('seasonalSuggestions.subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('seasonalSuggestions.placeholder')}
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} disabled={!destination.trim()}>
              <Search className="h-4 w-4 mr-2" />
              {t('seasonalSuggestions.analyze')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {searchTrigger && destination && (
        <Tabs defaultValue="seasonal" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto gap-1">
            <TabsTrigger value="seasonal" className="text-xs sm:text-sm px-2 py-1.5">
              <Calendar className="h-3.5 w-3.5 mr-1 sm:mr-2 shrink-0" />
              <span className="truncate">{t('seasonalSuggestions.tabs.seasonal')}</span>
            </TabsTrigger>
            <TabsTrigger value="weather" className="text-xs sm:text-sm px-2 py-1.5">
              <Cloud className="h-3.5 w-3.5 mr-1 sm:mr-2 shrink-0" />
              <span className="truncate">{t('seasonalSuggestions.tabs.weather')}</span>
            </TabsTrigger>
            <TabsTrigger value="events" className="text-xs sm:text-sm px-2 py-1.5">
              <TrendingUp className="h-3.5 w-3.5 mr-1 sm:mr-2 shrink-0" />
              <span className="truncate">{t('seasonalSuggestions.tabs.events')}</span>
            </TabsTrigger>
            <TabsTrigger value="ai" className="text-xs sm:text-sm px-2 py-1.5">
              <Bot className="h-3.5 w-3.5 mr-1 sm:mr-2 shrink-0" />
              <span className="truncate">{t('seasonalSuggestions.tabs.ai')}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="seasonal" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {seasonalData.map((season, index) => (
                <motion.div
                  key={season.key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className={currentSeason === index ? "border-primary shadow-lg" : ""}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${season.color}`} />
                          {t(`seasonalSuggestions.seasons.${season.key}.name`)}
                          {currentSeason === index && (
                            <Badge variant="secondary" className="ml-2">{t('seasonalSuggestions.current')}</Badge>
                          )}
                        </CardTitle>
                      </div>
                      <CardDescription>
                        {(t(`seasonalSuggestions.seasons.${season.key}.months`, { returnObjects: true }) as string[]).join(" · ")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">{t(`seasonalSuggestions.seasons.${season.key}.description`)}</p>

                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold">{t('seasonalSuggestions.advantagesLabel')}</h4>
                        <ul className="space-y-1">
                          {(t(`seasonalSuggestions.seasons.${season.key}.advantages`, { returnObjects: true }) as string[]).map((advantage, i) => (
                            <li key={i} className="text-sm flex items-start gap-2">
                              <span className="text-primary">•</span>
                              {advantage}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                        <div>
                          <p className="text-xs text-muted-foreground">{t('seasonalSuggestions.temperature')}</p>
                          <p className="text-sm font-medium">{t(`seasonalSuggestions.seasons.${season.key}.temperature`)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">{t('seasonalSuggestions.rainfall')}</p>
                          <p className="text-sm font-medium">{t(`seasonalSuggestions.seasons.${season.key}.rainfall`)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="weather" className="space-y-4">
            {weatherLoading ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                </CardContent>
              </Card>
            ) : weatherData ? (
              <Card>
                <CardHeader>
                  <CardTitle>{t('seasonalSuggestions.weatherAt', { location: weatherData.location })}</CardTitle>
                  <CardDescription>{weatherData.country}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="text-5xl font-bold">{weatherData.temperature}°C</div>
                        <div>
                          <p className="text-lg font-medium">{weatherData.condition}</p>
                          <p className="text-sm text-muted-foreground">{t('seasonalSuggestions.feelsLike')}: {weatherData.feelsLike}°C</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <span className="text-sm text-muted-foreground">{t('seasonalSuggestions.humidity')}</span>
                        <span className="font-medium">{weatherData.humidity}%</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <span className="text-sm text-muted-foreground">{t('seasonalSuggestions.wind')}</span>
                        <span className="font-medium">{weatherData.windSpeed} km/h</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">
                    {t('seasonalSuggestions.weatherError')}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="events" className="space-y-4">
            {eventsLoading ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-24 w-full" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : eventsData?.events && eventsData.events.length > 0 ? (
              <div className="space-y-4">
                {eventsData.events.slice(0, 6).map((event: any, index: number) => (
                  <motion.div
                    key={event.id || index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex gap-4">
                          {event.thumbnail && (
                            <img
                              src={event.thumbnail}
                              alt={event.name}
                              className="w-24 h-24 object-cover rounded-lg"
                              loading="lazy"
                            />
                          )}
                          <div className="flex-1 space-y-2">
                            <h4 className="font-semibold">{event.name}</h4>
                            <div className="flex flex-wrap gap-2">
                              {event.date && (
                                <Badge variant="outline">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  {event.date}
                                </Badge>
                              )}
                              {event.location && (
                                <Badge variant="outline">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {event.location}
                                </Badge>
                              )}
                            </div>
                            {event.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {event.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">
                    {t('seasonalSuggestions.eventsEmpty')}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="ai" className="space-y-4">
            {aiLoading ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-4/6" />
                  </div>
                </CardContent>
              </Card>
            ) : aiRecommendations?.recommendations ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-primary" />
                    {t('seasonalSuggestions.aiRecommendationsFor', { destination })}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <p className="whitespace-pre-line text-sm leading-relaxed">
                      {aiRecommendations.recommendations}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">
                    {t('seasonalSuggestions.aiError')}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};
