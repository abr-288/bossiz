import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Restaurant {
  id: string;
  name: string;
  opening_hours: Record<string, { open: string; close: string; closed?: boolean }>;
  slot_interval_minutes: number;
  max_covers_per_slot: number;
}

interface RestaurantReservationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restaurant: Restaurant;
}

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

const todayIso = () => new Date().toISOString().split("T")[0];

const buildSlots = (open: string, close: string, intervalMinutes: number): string[] => {
  // Guards against malformed opening_hours entered directly in the DB
  // (the partner admin form always writes complete {open, close, closed}
  // objects, but a manual edit could leave open/close missing) - without
  // this, .split(":") on undefined throws and takes down the whole page,
  // since there's only one top-level ErrorBoundary for the app.
  if (!open || !close) return [];
  const slots: string[] = [];
  const [openH, openM] = open.split(":").map(Number);
  const [closeH, closeM] = close.split(":").map(Number);
  if (Number.isNaN(openH) || Number.isNaN(openM) || Number.isNaN(closeH) || Number.isNaN(closeM)) return [];
  let minutes = openH * 60 + openM;
  const endMinutes = closeH * 60 + closeM;
  while (minutes + intervalMinutes <= endMinutes) {
    const h = Math.floor(minutes / 60).toString().padStart(2, "0");
    const m = (minutes % 60).toString().padStart(2, "0");
    slots.push(`${h}:${m}`);
    minutes += intervalMinutes;
  }
  return slots;
};

export const RestaurantReservationDialog = ({ open, onOpenChange, restaurant }: RestaurantReservationDialogProps) => {
  const navigate = useNavigate();
  const [date, setDate] = useState(todayIso());
  const [partySize, setPartySize] = useState("2");
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [coversBySlot, setCoversBySlot] = useState<Record<string, number>>({});
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setCustomerEmail(user.email || "");
        supabase.from("profiles").select("full_name, phone").eq("id", user.id).maybeSingle().then(({ data }) => {
          if (data?.full_name) setCustomerName(data.full_name);
          if (data?.phone) setCustomerPhone(data.phone);
        });
      }
    });
  }, [open]);

  const dayKey = useMemo(() => {
    const d = new Date(date + "T00:00:00");
    return DAY_KEYS[d.getDay()];
  }, [date]);

  const dayHours = restaurant.opening_hours?.[dayKey];

  const slots = useMemo(() => {
    if (!dayHours || dayHours.closed) return [];
    return buildSlots(dayHours.open, dayHours.close, restaurant.slot_interval_minutes);
  }, [dayHours, restaurant.slot_interval_minutes]);

  useEffect(() => {
    setSelectedTime(null);
    if (slots.length === 0) {
      setCoversBySlot({});
      return;
    }
    setLoadingSlots(true);
    supabase
      .rpc("get_restaurant_slot_covers", { p_restaurant_id: restaurant.id, p_date: date })
      .then(({ data, error }) => {
        if (error) {
          console.error("Error fetching slot availability:", error);
          setCoversBySlot({});
        } else {
          const map: Record<string, number> = {};
          (data || []).forEach((row: any) => {
            map[row.reservation_time.slice(0, 5)] = row.covers_booked;
          });
          setCoversBySlot(map);
        }
        setLoadingSlots(false);
      });
  }, [restaurant.id, date, slots.length]);

  const remainingForSlot = (slot: string) => restaurant.max_covers_per_slot - (coversBySlot[slot] || 0);

  const handleSubmit = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Connectez-vous pour réserver une table");
      onOpenChange(false);
      navigate("/auth");
      return;
    }

    if (!selectedTime) {
      toast.error("Choisissez un horaire");
      return;
    }
    const size = parseInt(partySize);
    if (!size || size < 1 || size > 50) {
      toast.error(size > 50 ? "50 personnes maximum par réservation" : "Indiquez le nombre de convives");
      return;
    }
    if (!customerName.trim() || !customerEmail.trim() || !customerPhone.trim()) {
      toast.error("Renseignez vos coordonnées");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("restaurant_reservations").insert({
      restaurant_id: restaurant.id,
      user_id: user.id,
      reservation_date: date,
      reservation_time: selectedTime,
      party_size: size,
      customer_name: customerName.trim(),
      customer_email: customerEmail.trim(),
      customer_phone: customerPhone.trim(),
      special_requests: specialRequests.trim() || null,
    });
    setSubmitting(false);

    if (error) {
      if (error.message?.includes("complet")) {
        toast.error("Ce créneau vient de se remplir, choisissez un autre horaire");
      } else {
        toast.error("Impossible de confirmer la réservation, réessayez");
      }
      return;
    }

    toast.success(`Table réservée chez ${restaurant.name} le ${date} à ${selectedTime}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Réserver une table</DialogTitle>
          <DialogDescription>{restaurant.name}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date *</Label>
              <Input type="date" min={todayIso()} value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Convives *</Label>
              <Input type="number" min="1" max="50" value={partySize} onChange={(e) => setPartySize(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Heure *</Label>
            {loadingSlots ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Vérification des disponibilités...
              </div>
            ) : slots.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">Fermé ce jour-là, choisissez une autre date.</p>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {slots.map((slot) => {
                  const remaining = remainingForSlot(slot);
                  const full = remaining < parseInt(partySize || "1");
                  return (
                    <Button
                      key={slot}
                      type="button"
                      size="sm"
                      variant={selectedTime === slot ? "default" : "outline"}
                      disabled={full}
                      onClick={() => setSelectedTime(slot)}
                    >
                      {slot}
                    </Button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Téléphone *</Label>
              <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Email *</Label>
            <Input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Demandes particulières</Label>
            <Textarea
              placeholder="Allergies, table en terrasse, anniversaire..."
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Annuler</Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !selectedTime || !customerName.trim() || !customerPhone.trim() || !customerEmail.trim()}
            className="gradient-primary"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (
              <>
                <Users className="w-4 h-4 mr-2" />
                Confirmer la réservation
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
