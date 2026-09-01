import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plane, Hotel, Car, MapPin, Calendar, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Price } from "@/components/ui/price";

interface BookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: {
    id: string;
    name: string;
    price_per_unit: number;
    currency: string;
    type: string;
    location?: string;
  };
}

export const BookingDialog = ({ open, onOpenChange, service }: BookingDialogProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const getServiceIcon = () => {
    switch (service.type) {
      case "flight": return <Plane className="w-6 h-6" />;
      case "hotel": return <Hotel className="w-6 h-6" />;
      case "car": return <Car className="w-6 h-6" />;
      default: return <MapPin className="w-6 h-6" />;
    }
  };

  const handleStartBooking = () => {
    // Construire les paramètres URL
    const params = new URLSearchParams({
      type: service.type,
      name: service.name,
      price: service.price_per_unit.toString(),
      currency: service.currency,
      location: service.location || "",
      serviceId: service.id,
    });

    // Rediriger vers le processus de réservation unifié
    navigate(`/booking/${service.type}?${params.toString()}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getServiceIcon()}
            {t('booking.dialog.generic.title')} {service.name}
          </DialogTitle>
          <DialogDescription>
            {t('booking.dialog.generic.prepareDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <Card className="p-4 bg-gradient-to-br from-primary/5 to-transparent">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Service</span>
                <span className="font-semibold">{service.name}</span>
              </div>
              {service.location && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Lieu</span>
                  <span className="font-medium flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {service.location}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm text-muted-foreground">Prix de base</span>
                <span className="text-xl font-bold text-primary">
                  <Price amount={service.price_per_unit} fromCurrency={service.currency} showLoader />
                </span>
              </div>
            </div>
          </Card>

          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-muted-foreground">Le processus de réservation comprend :</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">1</div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  <span>Informations des participants</span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">2</div>
                <span>Options et services supplémentaires</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">3</div>
                <span>Préférences et détails</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">4</div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span>Paiement sécurisé</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Annuler
            </Button>
            <Button 
              onClick={handleStartBooking}
              className="flex-1 gradient-primary"
            >
              {t('booking.dialog.generic.startBooking')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
