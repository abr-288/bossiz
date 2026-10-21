import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ImageGalleryField } from "@/components/agency/ImageGalleryField";
import {
  ROOM_AMENITIES,
  ROOM_GALLERY_MAX,
  cancellationLabel,
  formatFcfa,
  type HotelRate,
  type HotelRoomType,
} from "@/lib/hotels";
import { BedDouble, Coffee, Pencil, Plus, Trash2, User, Wallet } from "lucide-react";

const ROOM_NAME_SUGGESTIONS = [
  "Chambre Standard",
  "Chambre Double",
  "Chambre Lits Jumeaux",
  "Chambre Supérieure",
  "Suite",
  "Studio",
  "Appartement 1 chambre",
  "Appartement 2 chambres",
  "Appartement 3 chambres",
  "Villa",
];

const emptyRoomForm = {
  name: "",
  description: "",
  bed_info: "",
  size_m2: "",
  max_guests: "2",
  total_units: "1",
  amenities: [] as string[],
  images: [] as string[],
  is_active: true,
};

const emptyRateForm = {
  occupancy: "2",
  price_per_night: "",
  breakfast_included: false,
  free_cancellation: true,
  free_cancellation_days: "1",
  late_cancellation_fee_percent: "20",
  pay_at_property: false,
  is_active: true,
};

interface HotelRoomsManagerProps {
  serviceId: string | null;
  hotelName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged?: () => void;
}

// « Chambres & tarifs » d'un hôtel partenaire : types de chambre/appartement
// (stock, capacité, équipements, photos) et, pour chacun, ses tarifs (nombre
// de voyageurs, prix par nuit, petit-déjeuner, annulation, paiement sur
// place) - ce qu'affiche le tableau de disponibilités de la fiche publique.
export function HotelRoomsManager({ serviceId, hotelName, open, onOpenChange, onChanged }: HotelRoomsManagerProps) {
  const { toast } = useToast();
  const [roomTypes, setRoomTypes] = useState<HotelRoomType[]>([]);
  const [rates, setRates] = useState<HotelRate[]>([]);
  const [loading, setLoading] = useState(false);

  const [roomDialogOpen, setRoomDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<HotelRoomType | null>(null);
  const [roomForm, setRoomForm] = useState(emptyRoomForm);

  const [rateDialogOpen, setRateDialogOpen] = useState(false);
  const [rateRoom, setRateRoom] = useState<HotelRoomType | null>(null);
  const [editingRate, setEditingRate] = useState<HotelRate | null>(null);
  const [rateForm, setRateForm] = useState(emptyRateForm);
  const [saving, setSaving] = useState(false);

  const showError = useCallback(
    (error: unknown) =>
      toast({
        title: "Erreur",
        description:
          error instanceof Error
            ? error.message
            : (error as { message?: string })?.message || "Enregistrement impossible",
        variant: "destructive",
      }),
    [toast],
  );

  const load = useCallback(async () => {
    if (!serviceId) return;
    setLoading(true);
    const { data: rooms, error } = await supabase
      .from("hotel_room_types")
      .select("*")
      .eq("service_id", serviceId)
      .order("sort_order")
      .order("created_at");
    if (error) {
      showError(error);
      setLoading(false);
      return;
    }
    const roomList = (rooms || []) as HotelRoomType[];
    setRoomTypes(roomList);
    if (roomList.length > 0) {
      const { data: rateRows, error: rateError } = await supabase
        .from("hotel_rates")
        .select("*")
        .in(
          "room_type_id",
          roomList.map((r) => r.id),
        )
        .order("occupancy", { ascending: false })
        .order("price_per_night");
      if (rateError) showError(rateError);
      setRates((rateRows || []) as HotelRate[]);
    } else {
      setRates([]);
    }
    setLoading(false);
  }, [serviceId, showError]);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  const afterChange = async () => {
    await load();
    onChanged?.();
  };

  const openRoomDialog = (room: HotelRoomType | null) => {
    setEditingRoom(room);
    setRoomForm(
      room
        ? {
            name: room.name,
            description: room.description || "",
            bed_info: room.bed_info || "",
            size_m2: room.size_m2 ? String(room.size_m2) : "",
            max_guests: String(room.max_guests),
            total_units: String(room.total_units),
            amenities: room.amenities || [],
            images: room.images || [],
            is_active: room.is_active,
          }
        : emptyRoomForm,
    );
    setRoomDialogOpen(true);
  };

  const saveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceId) return;
    const maxGuests = parseInt(roomForm.max_guests) || 1;
    const tooBigRate = editingRoom && rates.some((r) => r.room_type_id === editingRoom.id && r.occupancy > maxGuests);
    if (tooBigRate) {
      toast({
        title: "Capacité trop basse",
        description: "Un tarif de ce type prévoit plus de voyageurs. Modifiez ou supprimez ce tarif d'abord.",
        variant: "destructive",
      });
      return;
    }
    const payload = {
      name: roomForm.name.trim(),
      description: roomForm.description.trim() || null,
      bed_info: roomForm.bed_info.trim() || null,
      size_m2: roomForm.size_m2 ? parseInt(roomForm.size_m2) || null : null,
      max_guests: maxGuests,
      total_units: parseInt(roomForm.total_units) || 1,
      amenities: roomForm.amenities,
      images: roomForm.images,
      is_active: roomForm.is_active,
    };
    setSaving(true);
    const { data, error } = editingRoom
      ? await supabase.from("hotel_room_types").update(payload).eq("id", editingRoom.id).select().single()
      : await supabase
          .from("hotel_room_types")
          .insert({ ...payload, service_id: serviceId, sort_order: roomTypes.length })
          .select()
          .single();
    setSaving(false);
    if (error) return showError(error);
    setRoomDialogOpen(false);
    await afterChange();
    // Un nouveau type sans tarif n'apparaît pas à la vente : on enchaîne.
    if (!editingRoom && data) openRateDialog(data as HotelRoomType, null);
  };

  const deleteRoom = async (room: HotelRoomType) => {
    if (!confirm(`Supprimer « ${room.name} » et tous ses tarifs ?`)) return;
    const { error } = await supabase.from("hotel_room_types").delete().eq("id", room.id);
    if (error) {
      // Clé étrangère : ce type a déjà été réservé.
      if ((error as { code?: string }).code === "23503") {
        toast({
          title: "Suppression impossible",
          description: "Ce type a déjà des réservations. Désactivez-le plutôt pour ne plus le proposer.",
          variant: "destructive",
        });
        return;
      }
      return showError(error);
    }
    await afterChange();
  };

  const openRateDialog = (room: HotelRoomType, rate: HotelRate | null) => {
    setRateRoom(room);
    setEditingRate(rate);
    setRateForm(
      rate
        ? {
            occupancy: String(rate.occupancy),
            price_per_night: String(rate.price_per_night),
            breakfast_included: rate.breakfast_included,
            free_cancellation: rate.free_cancellation,
            free_cancellation_days: String(Math.max(rate.free_cancellation_days, 1)),
            late_cancellation_fee_percent: String(rate.late_cancellation_fee_percent ?? 20),
            pay_at_property: rate.pay_at_property,
            is_active: rate.is_active,
          }
        : { ...emptyRateForm, occupancy: String(room.max_guests) },
    );
    setRateDialogOpen(true);
  };

  const saveRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rateRoom) return;
    const price = parseFloat(rateForm.price_per_night);
    if (!Number.isFinite(price) || price <= 0) {
      toast({
        title: "Prix invalide",
        description: "Indiquez un prix par nuit supérieur à 0.",
        variant: "destructive",
      });
      return;
    }
    const payload = {
      occupancy: parseInt(rateForm.occupancy) || 1,
      price_per_night: price,
      breakfast_included: rateForm.breakfast_included,
      free_cancellation: rateForm.free_cancellation,
      free_cancellation_days: Math.min(Math.max(parseInt(rateForm.free_cancellation_days) || 1, 1), 60),
      late_cancellation_fee_percent: Math.min(Math.max(parseInt(rateForm.late_cancellation_fee_percent) || 0, 0), 100),
      pay_at_property: rateForm.pay_at_property,
      is_active: rateForm.is_active,
    };
    setSaving(true);
    const { error } = editingRate
      ? await supabase.from("hotel_rates").update(payload).eq("id", editingRate.id)
      : await supabase.from("hotel_rates").insert({ ...payload, room_type_id: rateRoom.id });
    setSaving(false);
    if (error) return showError(error);
    setRateDialogOpen(false);
    await afterChange();
  };

  const deleteRate = async (rate: HotelRate) => {
    if (!confirm("Supprimer ce tarif ?")) return;
    const { error } = await supabase.from("hotel_rates").delete().eq("id", rate.id);
    if (error) return showError(error);
    await afterChange();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chambres & tarifs · {hotelName}</DialogTitle>
            <DialogDescription>
              Ajoutez chaque type de chambre ou d'appartement, puis ses tarifs (selon le nombre de voyageurs et les
              options). Seuls les types actifs avec au moins un tarif actif sont proposés aux clients.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end">
            <Button onClick={() => openRoomDialog(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un type de chambre
            </Button>
          </div>

          {loading ? (
            <p className="text-center text-sm text-muted-foreground py-8">Chargement...</p>
          ) : roomTypes.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <BedDouble className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Aucun type de chambre pour l'instant.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {roomTypes.map((room) => {
                const roomRates = rates.filter((r) => r.room_type_id === room.id);
                return (
                  <div key={room.id} className="rounded-lg border">
                    <div className="flex flex-col sm:flex-row gap-3 p-3 border-b bg-muted/30">
                      {room.images[0] && (
                        <img src={room.images[0]} alt="" className="h-16 w-24 rounded object-cover flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold">{room.name}</p>
                          {!room.is_active && <Badge variant="secondary">Désactivé</Badge>}
                          {roomRates.filter((r) => r.is_active).length === 0 && (
                            <Badge variant="destructive">Aucun tarif actif</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {[
                            room.bed_info,
                            room.size_m2 ? `${room.size_m2} m²` : null,
                            `${room.max_guests} voyageur${room.max_guests > 1 ? "s" : ""} max`,
                            `${room.total_units} unité${room.total_units > 1 ? "s" : ""}`,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </div>
                      <div className="flex items-start gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Modifier le type"
                          onClick={() => openRoomDialog(room)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Supprimer le type"
                          onClick={() => deleteRoom(room)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <div className="p-3 space-y-2">
                      {roomRates.map((rate) => (
                        <div
                          key={rate.id}
                          className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-md border px-3 py-2 text-sm"
                        >
                          <span
                            className="flex items-center gap-0.5 w-20 flex-shrink-0"
                            title={`${rate.occupancy} voyageur(s)`}
                          >
                            {Array.from({ length: Math.min(rate.occupancy, 6) }).map((_, i) => (
                              <User key={i} className="h-3.5 w-3.5" />
                            ))}
                            {rate.occupancy > 6 && <span className="text-xs">×{rate.occupancy}</span>}
                          </span>
                          <span className="font-semibold w-32 flex-shrink-0">
                            {formatFcfa(rate.price_per_night)}
                            <span className="text-xs font-normal text-muted-foreground"> /nuit</span>
                          </span>
                          <span className="flex-1 text-xs text-muted-foreground">
                            {[
                              rate.breakfast_included ? "Petit-déjeuner inclus" : null,
                              rate.free_cancellation
                                ? `${cancellationLabel(rate)}, puis ${rate.late_cancellation_fee_percent ?? 20} %`
                                : cancellationLabel(rate),
                              rate.pay_at_property ? "Paiement sur place" : null,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </span>
                          {!rate.is_active && <Badge variant="secondary">Désactivé</Badge>}
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              aria-label="Modifier le tarif"
                              onClick={() => openRateDialog(room, rate)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              aria-label="Supprimer le tarif"
                              onClick={() => deleteRate(rate)}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      <Button variant="outline" size="sm" onClick={() => openRateDialog(room, null)}>
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Ajouter un tarif
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={roomDialogOpen} onOpenChange={setRoomDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRoom ? "Modifier le type de chambre" : "Nouveau type de chambre"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={saveRoom} className="space-y-4">
            <div className="space-y-2">
              <Label>Nom affiché</Label>
              <Input
                list="hotel-room-name-suggestions"
                placeholder="Ex. : Appartement 1 chambre"
                value={roomForm.name}
                onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })}
                maxLength={120}
                required
              />
              <datalist id="hotel-room-name-suggestions">
                {ROOM_NAME_SUGGESTIONS.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Lits</Label>
                <Input
                  placeholder="Ex. : 1 grand lit double"
                  value={roomForm.bed_info}
                  onChange={(e) => setRoomForm({ ...roomForm, bed_info: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Surface (m²)</Label>
                <Input
                  type="number"
                  min="1"
                  value={roomForm.size_m2}
                  onChange={(e) => setRoomForm({ ...roomForm, size_m2: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Voyageurs maximum</Label>
                <Input
                  type="number"
                  min="1"
                  max="30"
                  value={roomForm.max_guests}
                  onChange={(e) => setRoomForm({ ...roomForm, max_guests: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Nombre d'unités de ce type</Label>
                <Input
                  type="number"
                  min="1"
                  max="500"
                  value={roomForm.total_units}
                  onChange={(e) => setRoomForm({ ...roomForm, total_units: e.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Combien de chambres/appartements identiques vous proposez.
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                rows={3}
                placeholder="Ce que le client trouvera dans ce logement : pièces, vue, cuisine..."
                value={roomForm.description}
                onChange={(e) => setRoomForm({ ...roomForm, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Équipements du logement</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-md border p-3">
                {ROOM_AMENITIES.map((amenity) => (
                  <label key={amenity} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={roomForm.amenities.includes(amenity)}
                      onCheckedChange={(checked) =>
                        setRoomForm({
                          ...roomForm,
                          amenities:
                            checked === true
                              ? [...roomForm.amenities, amenity]
                              : roomForm.amenities.filter((a) => a !== amenity),
                        })
                      }
                    />
                    {amenity}
                  </label>
                ))}
              </div>
            </div>
            <ImageGalleryField
              label="Photos du logement"
              folder="agency-hotels"
              value={roomForm.images}
              onChange={(images) => setRoomForm({ ...roomForm, images })}
              max={ROOM_GALLERY_MAX}
            />
            <div className="flex items-center gap-2">
              <Switch
                checked={roomForm.is_active}
                onCheckedChange={(c) => setRoomForm({ ...roomForm, is_active: c })}
              />
              <Label>Proposé à la réservation</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setRoomDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={saving}>
                {editingRoom ? "Enregistrer" : "Créer et ajouter un tarif"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={rateDialogOpen} onOpenChange={setRateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingRate ? "Modifier le tarif" : "Nouveau tarif"}</DialogTitle>
            {rateRoom && <DialogDescription>{rateRoom.name}</DialogDescription>}
          </DialogHeader>
          <form onSubmit={saveRate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre de voyageurs</Label>
                <Select value={rateForm.occupancy} onValueChange={(v) => setRateForm({ ...rateForm, occupancy: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: rateRoom?.max_guests || 1 }, (_, i) => i + 1).map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n} voyageur{n > 1 ? "s" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Prix par nuit (FCFA)</Label>
                <Input
                  type="number"
                  min="1"
                  value={rateForm.price_per_night}
                  onChange={(e) => setRateForm({ ...rateForm, price_per_night: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-3 rounded-md border p-3">
              <label className="flex items-center justify-between gap-3 text-sm">
                <span className="flex items-center gap-2">
                  <Coffee className="h-4 w-4" />
                  Petit-déjeuner inclus
                </span>
                <Switch
                  checked={rateForm.breakfast_included}
                  onCheckedChange={(c) => setRateForm({ ...rateForm, breakfast_included: c })}
                />
              </label>
              <label className="flex items-center justify-between gap-3 text-sm">
                <span>Annulation gratuite</span>
                <Switch
                  checked={rateForm.free_cancellation}
                  onCheckedChange={(c) => setRateForm({ ...rateForm, free_cancellation: c })}
                />
              </label>
              {rateForm.free_cancellation ? (
                <div className="space-y-2 pl-1">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span>jusqu'à</span>
                    <Input
                      type="number"
                      min="1"
                      max="60"
                      className="w-20 h-8"
                      value={rateForm.free_cancellation_days}
                      onChange={(e) => setRateForm({ ...rateForm, free_cancellation_days: e.target.value })}
                    />
                    <span>jour(s) avant l'arrivée (23 h 59)</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span>puis frais d'annulation tardive de</span>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      className="w-20 h-8"
                      value={rateForm.late_cancellation_fee_percent}
                      onChange={(e) => setRateForm({ ...rateForm, late_cancellation_fee_percent: e.target.value })}
                    />
                    <span>% du séjour</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground pl-1">
                  Tarif non remboursable : 100 % de frais en cas d'annulation.
                </p>
              )}
              <p className="text-xs text-muted-foreground pl-1">
                Non-présentation du client : 100 % du séjour (contrat de partenariat, art. 7).
              </p>
              <label className="flex items-center justify-between gap-3 text-sm">
                <span className="flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  Paiement sur place (pas de paiement en ligne)
                </span>
                <Switch
                  checked={rateForm.pay_at_property}
                  onCheckedChange={(c) => setRateForm({ ...rateForm, pay_at_property: c })}
                />
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={rateForm.is_active}
                onCheckedChange={(c) => setRateForm({ ...rateForm, is_active: c })}
              />
              <Label>Tarif proposé</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setRateDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={saving}>
                Enregistrer
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
