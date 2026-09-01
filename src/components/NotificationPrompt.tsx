import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, X } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";

export const NotificationPrompt = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { isSupported, permission, requestPermission, subscribe, sendNotification } = usePushNotifications();

  useEffect(() => {
    // Show prompt if notifications are supported and permission hasn't been decided
    if (isSupported && permission === 'default') {
      // Wait a bit before showing to not overwhelm the user
      const timer = setTimeout(() => {
        const dismissed = localStorage.getItem('notification-prompt-dismissed');
        if (!dismissed) {
          setIsVisible(true);
        }
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isSupported, permission]);

  const handleEnable = async () => {
    const granted = await requestPermission();
    if (granted) {
      await subscribe();
      sendNotification('Notifications activées', {
        body: 'Vous recevrez désormais des notifications pour vos réservations',
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
    <div className="fixed bottom-4 left-4 z-50 max-w-md animate-in slide-in-from-bottom-5">
      <Card>
        <CardHeader className="relative pb-3">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 h-6 w-6"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Activer les notifications
          </CardTitle>
          <CardDescription>
            Recevez des notifications pour vos réservations et offres spéciales
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-muted-foreground">
            • Confirmations de réservation<br/>
            • Rappels de voyage<br/>
            • Offres personnalisées
          </div>
          <div className="flex gap-2">
            <Button onClick={handleEnable} className="flex-1">
              Activer
            </Button>
            <Button variant="outline" onClick={handleDismiss}>
              Plus tard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
