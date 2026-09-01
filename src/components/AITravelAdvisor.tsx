import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Bot } from "lucide-react";
import { useAITravelAdvisor } from "@/hooks/useAITravelAdvisor";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export const AITravelAdvisor = () => {
  const { t } = useTranslation();
  const [destination, setDestination] = useState("");
  const [interests, setInterests] = useState("");
  const [budget, setBudget] = useState("");
  const [duration, setDuration] = useState("");
  const [recommendations, setRecommendations] = useState("");
  
  const { getRecommendations, loading } = useAITravelAdvisor();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!destination.trim()) {
      toast.error(t('aiTravelAdvisor.errors.destinationRequired'));
      return;
    }

    const result = await getRecommendations({
      destination,
      interests,
      budget,
      duration,
    });

    if (result?.success) {
      setRecommendations(result.recommendations);
      toast.success(t('aiTravelAdvisor.success'));
    } else {
      toast.error(result?.error || t('aiTravelAdvisor.errors.generic'));
    }
  };

  return (
    <Card className="w-full shadow-xl border-border/50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
          <Bot className="w-5 h-5 md:w-6 md:h-6 text-primary" />
          {t('aiTravelAdvisor.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
          <div className="space-y-2">
            <Label htmlFor="destination" className="text-sm font-medium">{t('aiTravelAdvisor.destination')} *</Label>
            <Input
              id="destination"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder={t('aiTravelAdvisor.destinationPlaceholder')}
              className="h-11"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="interests" className="text-sm font-medium">{t('aiTravelAdvisor.interests')}</Label>
            <Input
              id="interests"
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              placeholder={t('aiTravelAdvisor.interestsPlaceholder')}
              className="h-11"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            <div className="space-y-2">
              <Label htmlFor="budget" className="text-sm font-medium">{t('aiTravelAdvisor.budget')}</Label>
              <Input
                id="budget"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder={t('aiTravelAdvisor.budgetPlaceholder')}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration" className="text-sm font-medium">{t('aiTravelAdvisor.duration')}</Label>
              <Input
                id="duration"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder={t('aiTravelAdvisor.durationPlaceholder')}
                className="h-11"
              />
            </div>
          </div>

          <div className="pt-1 md:pt-2">
            <Button type="submit" className="w-full h-12 md:h-14 text-base font-semibold" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 md:h-5 md:w-5 animate-spin" />
                  {t('aiTravelAdvisor.generating')}
                </>
              ) : (
                <>
                  <Bot className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                  {t('aiTravelAdvisor.submit')}
                </>
              )}
            </Button>
          </div>
        </form>

        {recommendations && (
          <div className="mt-4 md:mt-6 p-4 bg-muted/50 rounded-xl border border-border">
            <h3 className="font-semibold mb-3 flex items-center gap-2 text-base md:text-lg">
              <Bot className="w-4 h-4 md:w-5 md:h-5 text-primary" />
              {t('aiTravelAdvisor.resultsTitle')}
            </h3>
            <div className="prose prose-sm max-w-none">
              <Textarea
                value={recommendations}
                readOnly
                className="min-h-[400px] font-sans text-sm leading-relaxed resize-none border-0 bg-transparent"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};