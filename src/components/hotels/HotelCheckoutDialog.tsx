import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PhoneNumberInput } from "@/components/PhoneNumberInput";
import { supabase } from "@/integrations/supabase/client";
import { NO_SHOW_TERMS, cancellationLabel, formatFcfa, lateCancellationLabel } from "@/lib/hotels";
import type { RoomSelection } from "@/components/hotels/HotelAvailabilityTable";
import { CalendarDays, Coffee, Loader2, Users, Wallet } from "lucide-react";

export interface CheckoutContact {
  name: string;
  email: string;
  phone: string;
  notes: string;
}

interface HotelCheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hotelName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  selections: RoomSelection[];
  submitting: boolean;
  onConfirm: (contact: CheckoutContact) => void;
}

const longDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "long", year: "numeric" });

// Dernière étape avant réservation : récapitulatif des logements choisis et
// coordonnées du client (pré-remplies depuis son profil).
export function HotelCheckoutDialog({
  open,
  onOpenChange,
  hotelName,
  checkIn,
  checkOut,
  nights,
  guests,
  selections,
  submitting,
  onConfirm,
}: HotelCheckoutDialogProps) {
  const [contact, setContact] = useState<CheckoutContact>({ name: "", email: "", phone: "", notes: "" });

  useEffect(() => {
    if (!open) return;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from("profiles").select("full_name, phone").eq("id", user.id).maybeSingle();
      setContact((prev) => ({
        ...prev,
        name: prev.name || profile?.full_name || "",
        email: prev.email || user.email || "",
        phone: prev.phone || profile?.phone || "",
      }));
    })();
  }, [open]);

  const total = selections.reduce((sum, s) => sum + s.quantity * s.rate.price_per_night * nights, 0);
  const payAtProperty = selections.length > 0 && selections.every((s) => s.rate.pay_at_property);

  return (
    <Dialog open={open} onOpenChange={(value) => !submitting && onOpenChange(value)}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Finaliser votre réservation</DialogTitle>
          <DialogDescription>{hotelName}</DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border divide-y">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Arrivée</p>
              <p className="font-semibold">{longDate(checkIn)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Départ</p>
              <p className="font-semibold">{longDate(checkOut)}</p>
            </div>
            <div className="flex gap-4 sm:flex-col sm:gap-0">
              <p className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />{nights} nuit{nights > 1 ? "s" : ""}</p>
              <p className="flex items-center gap-1.5"><Users className="h-4 w-4" />{guests} voyageur{guests > 1 ? "s" : ""}</p>
            </div>
          </div>
          {selections.map(({ rate, roomType, quantity }) => (
            <div key={rate.id} className="flex justify-between gap-3 p-4 text-sm">
              <div className="space-y-0.5">
                <p className="font-semibold">{quantity} × {roomType.name}</p>
                <p className="text-xs text-muted-foreground">
                  {rate.occupancy} voyageur{rate.occupancy > 1 ? "s" : ""} · {cancellationLabel(rate)}
                  {rate.free_cancellation ? ` · ${lateCancellationLabel(rate).replace("Ensuite : ", "ensuite ")}` : ""}
                </p>
                <p className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Coffee className="h-3 w-3" />{rate.breakfast_included ? "Petit-déjeuner inclus" : "Sans petit-déjeuner"}</span>
                  {rate.pay_at_property && <span className="flex items-center gap-1"><Wallet className="h-3 w-3" />Paiement sur place</span>}
                </p>
              </div>
              <p className="font-semibold whitespace-nowrap">{formatFcfa(quantity * rate.price_per_night * nights)}</p>
            </div>
          ))}
          <div className="flex justify-between p-4">
            <span className="font-semibold">Total</span>
            <span className="text-lg font-bold">{formatFcfa(total)}</span>
          </div>
        </div>

        <p className={`rounded-md p-3 text-sm ${payAtProperty ? "bg-gold/10" : "bg-primary/5"}`}>
          {payAtProperty
            ? "Aucun paiement maintenant : vous réglez directement à l'hôtel. Votre réservation est confirmée tout de suite."
            : "Vous serez redirigé vers le paiement sécurisé. La réservation est confirmée dès le paiement reçu."}
        </p>
        <p className="text-xs text-muted-foreground">
          {NO_SHOW_TERMS} Annulation en ligne possible jusqu'à la veille de l'arrivée, depuis votre réservation.
          En réservant, vous acceptez ces conditions et le règlement de l'établissement.
        </p>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            onConfirm(contact);
          }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="checkout-name">Nom complet</Label>
              <Input id="checkout-name" value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} maxLength={120} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="checkout-email">Email</Label>
              <Input id="checkout-email" type="email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="checkout-phone">Téléphone</Label>
            <PhoneNumberInput
              id="checkout-phone"
              value={contact.phone}
              onValueChange={(phone) => setContact((prev) => ({ ...prev, phone }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="checkout-notes">Demandes particulières (optionnel)</Label>
            <Textarea
              id="checkout-notes"
              rows={3}
              maxLength={1000}
              placeholder="Heure d'arrivée prévue, lit bébé, étage élevé..."
              value={contact.notes}
              onChange={(e) => setContact({ ...contact, notes: e.target.value })}
            />
          </div>
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button type="button" variant="outline" disabled={submitting} onClick={() => onOpenChange(false)}>
              Modifier ma sélection
            </Button>
            <Button type="submit" size="lg" disabled={submitting || selections.length === 0}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {payAtProperty ? "Confirmer la réservation" : `Payer ${formatFcfa(total)}`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
