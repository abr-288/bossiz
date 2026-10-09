import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, X } from "lucide-react";
import { useLocation } from "react-router-dom";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useCookieConsent } from "@/hooks/useCookieConsent";
import { useTranslation } from "react-i18next";

// La demande n'a de sens qu'une fois la valeur montrée : après une réservation
// confirmée, dans l'espace client, ou sur la page des alertes prix. Ailleurs
// elle s'empilait avec le bandeau cookies et le chat au premier lancement.
const PROMPT_PATHS = ["/confirmation", "/dashboard", "/price-alerts"];

export const NotificationPrompt = () => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const { pathname } = useLocation();
  const { hasResponded: cookieChoiceMade } = useCookieConsent();
  const isRelevantPage = PROMPT_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const { isSupported, permission, requestPermission, subscribe, sendNotification } = usePushNotifications();

  useEffect(() => {
    // Show prompt if notifications are supported and permission hasn't been decided
    if (isSupported && permission === 'default' && cookieChoiceMade && isRelevantPage) {
      // Wait a bit before showing to not overwhelm the user
      const timer = setTimeout(() => {
        const dismissed = localStorage.getItem('notification-prompt-dismissed');
        if (!dismissed) {
          setIsVisible(true);
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
    setIsVisible(false);
  }, [isSupported, permission, cookieChoiceMade, isRelevantPage]);

  const handleEnable = async () => {
    const granted = await requestPermission();
    if (granted) {
      await subscribe();
      sendNotification(t("ux.notifications.enabledTitle"), {
        body: t("ux.notifications.enabledBody"),
        tag: 'welcome'
      });
    }
    setIsVisible(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('notification-prompt-dismissed', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-x-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom)+var(--bottom-nav-h,0px))] z-50 animate-in slide-in-from-bottom-5 sm:inset-x-auto sm:left-4 sm:bottom-[calc(1rem+var(--bottom-nav-h,0px))] lg:bottom-4 sm:max-w-md">
      <Card>
        <CardHeader className="relative pb-3">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 h-10 w-10"
            onClick={handleDismiss}
            aria-label={t("ux.notifications.close")}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
          <CardTitle className="flex items-center gap-2 pr-10 text-lg">
            <Bell className="h-5 w-5 text-primary" />
            {t("ux.notifications.title")}
          </CardTitle>
          <CardDescription>
            {t("ux.notifications.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-muted-foreground">
            • {t("ux.notifications.bullet1")}<br/>
            • {t("ux.notifications.bullet2")}<br/>
            • {t("ux.notifications.bullet3")}
          </div>
          <div className="flex gap-2">
            <Button onClick={handleEnable} className="flex-1">
              {t("ux.notifications.enable")}
            </Button>
            <Button variant="ghost" onClick={handleDismiss}>
              {t("ux.notifications.later")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
