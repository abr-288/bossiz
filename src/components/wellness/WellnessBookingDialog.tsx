import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Price } from "@/components/ui/price";

interface Treatment {
  name: string;
  description?: string;
  price?: number;
  currency?: string;
  duration_minutes?: number;
}

interface WellnessService {
  id: string;
  name: string;
  opening_hours: Record<string, { open: string; close: string; closed?: boolean }>;
  slot_interval_minutes: number;
  max_capacity_per_slot: number;
  treatments: Treatment[];
}

interface WellnessBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wellnessService: WellnessService;
}

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

const todayIso = () => new Date().toISOString().split("T")[0];

const buildSlots = (open: string, close: string, intervalMinutes: number): string[] => {
  // Guards against malformed opening_hours entered directly in the DB - see
  // the same guard in RestaurantReservationDialog.tsx.
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

export const WellnessBookingDialog = ({ open, onOpenChange, wellnessService }: WellnessBookingDialogProps) => {
  const navigate = useNavigate();
  const [date, setDate] = useState(todayIso());
  const [partySize, setPartySize] = useState("1");
  const [treatmentIndex, setTreatmentIndex] = useState<string>(wellnessService.treatments.length > 0 ? "0" : "");
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [spotsBySlot, setSpotsBySlot] = useState<Record<string, number>>({});
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

  const dayHours = wellnessService.opening_hours?.[dayKey];

  const slots = useMemo(() => {
    if (!dayHours || dayHours.closed) return [];
    return buildSlots(dayHours.open, dayHours.close, wellnessService.slot_interval_minutes);
  }, [dayHours, wellnessService.slot_interval_minutes]);

  useEffect(() => {
    setSelectedTime(null);
    if (slots.length === 0) {
      setSpotsBySlot({});
      return;
    }
    setLoadingSlots(true);
    supabase
      .rpc("get_wellness_slot_bookings", { p_wellness_service_id: wellnessService.id, p_date: date })
      .then(({ data, error }) => {
        if (error) {
          console.error("Error fetching slot availability:", error);
          setSpotsBySlot({});
        } else {
          const map: Record<string, number> = {};
          (data || []).forEach((row: any) => {
            map[row.booking_time.slice(0, 5)] = row.spots_booked;
          });
          setSpotsBySlot(map);
        }
        setLoadingSlots(false);
      });
  }, [wellnessService.id, date, slots.length]);

  const remainingForSlot = (slot: string) => wellnessService.max_capacity_per_slot - (spotsBySlot[slot] || 0);

  const selectedTreatment = treatmentIndex !== "" ? wellnessService.treatments[parseInt(treatmentIndex)] : null;

  const handleSubmit = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Connectez-vous pour réserver un rendez-vous");
      onOpenChange(false);
      navigate("/auth");
      return;
    }

    if (!selectedTreatment) {
      toast.error("Choisissez une prestation");
      return;
    }
    if (!selectedTime) {
      toast.error("Choisissez un horaire");
      return;
    }
    const size = parseInt(partySize);
    if (!size || size < 1 || size > 50) {
      toast.error("Indiquez un nombre de personnes valide");
      return;
    }
    if (!customerName.trim() || !customerEmail.trim() || !customerPhone.trim()) {
      toast.error("Renseignez vos coordonnées");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("wellness_bookings").insert({
      wellness_service_id: wellnessService.id,
      user_id: user.id,
      booking_date: date,
      booking_time: selectedTime,
      party_size: size,
      treatment_name: selectedTreatment.name,
      treatment_price: selectedTreatment.price ?? null,
      treatment_currency: selectedTreatment.currency ?? null,
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
        toast.error("Impossible de confirmer le rendez-vous, réessayez");
      }
      return;
    }

    toast.success(`Rendez-vous confirmé chez ${wellnessService.name} le ${date} à ${selectedTime}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Réserver un rendez-vous</DialogTitle>
          <DialogDescription>{wellnessService.name}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {wellnessService.treatments.length > 0 && (
            <div className="space-y-2">
              <Label>Prestation *</Label>
              <Select value={treatmentIndex} onValueChange={setTreatmentIndex}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisissez une prestation" />
                </SelectTrigger>
                <SelectContent>
                  {wellnessService.treatments.map((treatment, index) => (
                    <SelectItem key={`${treatment.name}-${index}`} value={index.toString()}>
                      <span className="flex items-center gap-1">
                        {treatment.name}
                        {treatment.duration_minutes ? ` — ${treatment.duration_minutes} min` : ""}
                        {typeof treatment.price === "number" && (
                          <>
                            {" — "}
                            <Price amount={treatment.price} fromCurrency={treatment.currency || "XOF"} />
                          </>
                        )}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTreatment?.description && (
                <p className="text-xs text-muted-foreground">{selectedTreatment.description}</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date *</Label>
              <Input type="date" min={todayIso()} value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Personnes *</Label>
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
              placeholder="Allergies, préférences, occasion spéciale..."
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
            disabled={submitting || !selectedTreatment || !selectedTime || !customerName.trim() || !customerPhone.trim() || !customerEmail.trim()}
            className="gradient-primary"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Confirmer le rendez-vous
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
