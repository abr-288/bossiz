import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Bell, BellOff, Trash2, Plane, Hotel, Car } from 'lucide-react';
import { usePriceAlerts, PriceAlert } from '@/hooks/usePriceAlerts';
import { useCurrency } from '@/contexts/CurrencyContext';
import { format } from 'date-fns';
import { EmptyState } from "@/components/ui/empty-state";
import { currentDateFnsLocale } from "@/lib/dateLocale";

const getServiceIcon = (type: string) => {
  switch (type) {
    case 'flight': return <Plane className="h-4 w-4" />;
    case 'hotel': return <Hotel className="h-4 w-4" />;
    case 'car': return <Car className="h-4 w-4" />;
    default: return <Bell className="h-4 w-4" />;
  }
};

const getServiceLabel = (type: string) => {
  switch (type) {
    case 'flight': return 'Vol';
    case 'hotel': return 'Hôtel';
    case 'car': return 'Voiture';
    default: return type;
  }
};

export const PriceAlertManager = () => {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const { getAlerts, updateAlert, deleteAlert, isLoading } = usePriceAlerts();
  const { formatPrice } = useCurrency();

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    const data = await getAlerts();
    setAlerts(data);
  };

  const handleToggleAlert = async (id: string, isActive: boolean) => {
    await updateAlert(id, { is_active: !isActive });
    await loadAlerts();
  };

  const handleDeleteAlert = async (id: string) => {
    await deleteAlert(id);
    await loadAlerts();
  };

  if (isLoading && alerts.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Chargement...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Mes Alertes de Prix
          </CardTitle>
          <CardDescription>
            Recevez des notifications quand les prix baissent pour vos destinations favorites
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {alerts.length === 0 ? (
            <EmptyState
              icon={BellOff}
              title="Aucune alerte de prix configurée"
              description="Créez une alerte pour être prévenu dès que le prix d'un trajet baisse."
            />
          ) : (
            alerts.map((alert) => (
              <Card key={alert.id} className="border-l-4 border-l-primary">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        {getServiceIcon(alert.service_type)}
                        <Badge variant="outline">
                          {getServiceLabel(alert.service_type)}
                        </Badge>
                        <Badge variant={alert.is_active ? 'default' : 'secondary'}>
                          {alert.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="font-medium">
                          {alert.origin && `${alert.origin} → `}
                          {alert.destination}
                        </div>
                        
                        {alert.departure_date && (
                          <div className="text-sm text-muted-foreground">
                            Départ: {format(new Date(alert.departure_date), 'dd MMMM yyyy', { locale: currentDateFnsLocale() })}
                            {alert.return_date && ` - Retour: ${format(new Date(alert.return_date), 'dd MMMM yyyy', { locale: currentDateFnsLocale() })}`}
                          </div>
                        )}
                        
                        {alert.current_price && (
                          <div className="text-sm">
                            Prix actuel: <span className="font-semibold">{formatPrice(alert.current_price, alert.currency)}</span>
                          </div>
                        )}
                        
                        {alert.target_price && (
                          <div className="text-sm text-success">
                            Prix cible: <span className="font-semibold">{formatPrice(alert.target_price, alert.currency)}</span>
                          </div>
                        )}
                        
                        <div className="text-xs text-muted-foreground">
                          Alerte si baisse de {alert.alert_threshold}%
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={alert.is_active}
                        onCheckedChange={() => handleToggleAlert(alert.id, alert.is_active)}
                      />
                      <Button
                        aria-label="Supprimer"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteAlert(alert.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};
