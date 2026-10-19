import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell } from 'lucide-react';
import { usePriceAlerts } from '@/hooks/usePriceAlerts';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useTranslation } from "react-i18next";

interface CreatePriceAlertProps {
  initialData?: {
    serviceType: 'flight' | 'hotel' | 'car';
    origin?: string;
    destination?: string;
    departureDate?: string;
    returnDate?: string;
    currentPrice?: number;
  };
  onSuccess?: () => void;
}

export const CreatePriceAlert = ({ initialData, onSuccess }: CreatePriceAlertProps) => {
  const { t } = useTranslation();
  const { createAlert, isLoading } = usePriceAlerts();
  const { selectedCurrency } = useCurrency();
  
  const [formData, setFormData] = useState({
    serviceType: initialData?.serviceType || 'flight',
    origin: initialData?.origin || '',
    destination: initialData?.destination || '',
    departureDate: initialData?.departureDate || '',
    returnDate: initialData?.returnDate || '',
    targetPrice: '',
    alertThreshold: '10',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createAlert({
        service_type: formData.serviceType as 'flight' | 'hotel' | 'car',
        origin: formData.origin || undefined,
        destination: formData.destination,
        departure_date: formData.departureDate || undefined,
        return_date: formData.returnDate || undefined,
        target_price: formData.targetPrice ? parseFloat(formData.targetPrice) : undefined,
        current_price: initialData?.currentPrice,
        currency: selectedCurrency,
        alert_threshold: parseFloat(formData.alertThreshold),
        is_active: true,
      });
      
      if (onSuccess) onSuccess();
      
      // Reset form
      setFormData({
        serviceType: 'flight',
        origin: '',
        destination: '',
        departureDate: '',
        returnDate: '',
        targetPrice: '',
        alertThreshold: '10',
      });
    } catch (error) {
      console.error('Error creating alert:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          {t("ux.priceAlert.title")}
        </CardTitle>
        <CardDescription>
          {t("ux.priceAlert.subtitle")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="serviceType">{t("ux.priceAlert.serviceType")}</Label>
              <Select
                value={formData.serviceType}
                onValueChange={(value) => setFormData({ ...formData, serviceType: value as 'flight' | 'hotel' | 'car' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flight">Vol</SelectItem>
                  <SelectItem value="hotel">{t("ux.priceAlert.hotel")}</SelectItem>
                  <SelectItem value="car">Voiture</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.serviceType === 'flight' && (
              <div className="space-y-2">
                <Label htmlFor="origin">Origine</Label>
                <Input
                  id="origin"
                  value={formData.origin}
                  onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                  placeholder="Paris (CDG)"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="destination">Destination *</Label>
              <Input
                id="destination"
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                placeholder="New York (JFK)"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="departureDate">{t("ux.priceAlert.departure")}</Label>
              <Input
                id="departureDate"
                type="date"
                value={formData.departureDate}
                onChange={(e) => setFormData({ ...formData, departureDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="returnDate">{t("ux.priceAlert.return")}</Label>
              <Input
                id="returnDate"
                type="date"
                value={formData.returnDate}
                onChange={(e) => setFormData({ ...formData, returnDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetPrice">Prix cible ({selectedCurrency})</Label>
              <Input
                id="targetPrice"
                type="number"
                step="0.01"
                value={formData.targetPrice}
                onChange={(e) => setFormData({ ...formData, targetPrice: e.target.value })}
                placeholder={t("ux.priceAlert.targetPrice")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="alertThreshold">{t("ux.priceAlert.threshold")}</Label>
              <Input
                id="alertThreshold"
                type="number"
                step="1"
                min="1"
                max="50"
                value={formData.alertThreshold}
                onChange={(e) => setFormData({ ...formData, alertThreshold: e.target.value })}
                placeholder="10"
              />
              <p className="text-xs text-muted-foreground">
                {t("ux.priceAlert.thresholdDesc")}
              </p>
            </div>
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? t("ux.priceAlert.creating") : 'Créer l\'alerte'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
