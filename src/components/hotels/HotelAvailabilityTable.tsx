import { Fragment, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BedDouble, Check, Coffee, Maximize, User, Wallet } from "lucide-react";
import { cancellationLabel, formatFcfa, lateCancellationLabel, type HotelRate, type HotelRoomType } from "@/lib/hotels";

export interface RoomSelection {
  rate: HotelRate;
  roomType: HotelRoomType;
  quantity: number;
}

interface HotelAvailabilityTableProps {
  roomTypes: HotelRoomType[];
  rates: HotelRate[];
  // Unités libres par type sur le séjour ; undefined = pas encore calculé.
  availability: Record<string, number> | undefined;
  nights: number;
  guests: number;
  onReserve: (selections: RoomSelection[]) => void;
  reserving?: boolean;
  // Sélection restaurée (ex. retour de la page de connexion), par tarif.
  initialQuantities?: Record<string, number>;
}

const MAX_PER_RATE = 10;

function Occupancy({ count }: { count: number }) {
  return (
    <span
      className="inline-flex items-center gap-0.5"
      title={`${count} voyageur${count > 1 ? "s" : ""}`}
      aria-label={`${count} voyageur${count > 1 ? "s" : ""}`}
    >
      {Array.from({ length: Math.min(count, 4) }).map((_, i) => (
        <User key={i} className="h-4 w-4" />
      ))}
      {count > 4 && <span className="text-xs font-medium">+{count - 4}</span>}
    </span>
  );
}

function RateOptions({ rate }: { rate: HotelRate }) {
  return (
    <ul className="space-y-1 text-sm">
      {rate.breakfast_included ? (
        <li className="flex items-start gap-1.5 text-success">
          <Coffee className="h-4 w-4 mt-0.5 flex-shrink-0" />
          Petit-déjeuner inclus
        </li>
      ) : (
        <li className="flex items-start gap-1.5 text-muted-foreground">
          <Coffee className="h-4 w-4 mt-0.5 flex-shrink-0" />
          Petit-déjeuner non inclus
        </li>
      )}
      <li
        className={`flex items-start gap-1.5 ${rate.free_cancellation ? "text-success font-medium" : "text-muted-foreground"}`}
      >
        <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <span>
          {cancellationLabel(rate)}
          {rate.free_cancellation && (
            <span className="block text-xs font-normal text-muted-foreground">{lateCancellationLabel(rate)}</span>
          )}
        </span>
      </li>
      <li className={`flex items-start gap-1.5 ${rate.pay_at_property ? "text-success" : "text-muted-foreground"}`}>
        <Wallet className="h-4 w-4 mt-0.5 flex-shrink-0" />
        {rate.pay_at_property ? "Aucun prépaiement : payez sur place" : "Paiement en ligne sécurisé"}
      </li>
    </ul>
  );
}

// Tableau de disponibilités façon Booking : une ligne par tarif, regroupées
// par type de chambre/appartement. Le client choisit un nombre d'unités par
// tarif, sans dépasser les unités libres du type sur ses dates.
export function HotelAvailabilityTable({
  roomTypes,
  rates,
  availability,
  nights,
  guests,
  onReserve,
  reserving,
  initialQuantities,
}: HotelAvailabilityTableProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>(() => initialQuantities ?? {});
  const [detailRoom, setDetailRoom] = useState<HotelRoomType | null>(null);

  const rows = useMemo(
    () =>
      roomTypes
        .map((roomType) => ({
          roomType,
          rates: rates
            .filter((r) => r.room_type_id === roomType.id)
            .sort((a, b) => b.occupancy - a.occupancy || a.price_per_night - b.price_per_night),
        }))
        .filter((row) => row.rates.length > 0),
    [roomTypes, rates],
  );

  const freeUnits = (roomTypeId: string) => availability?.[roomTypeId] ?? 0;
  const selectedForType = (roomTypeId: string, exceptRateId?: string) =>
    rates
      .filter((r) => r.room_type_id === roomTypeId && r.id !== exceptRateId)
      .reduce((sum, r) => sum + (quantities[r.id] || 0), 0);

  const selections: RoomSelection[] = rows.flatMap(({ roomType, rates: roomRates }) =>
    roomRates
      .filter((rate) => (quantities[rate.id] || 0) > 0)
      .map((rate) => ({ rate, roomType, quantity: quantities[rate.id] })),
  );
  const unitsSelected = selections.reduce((sum, s) => sum + s.quantity, 0);
  const capacitySelected = selections.reduce((sum, s) => sum + s.quantity * s.rate.occupancy, 0);
  const totalPerNight = selections.reduce((sum, s) => sum + s.quantity * s.rate.price_per_night, 0);
  const stayNights = Math.max(nights, 1);
  const total = totalPerNight * stayNights;
  const priceLabel = nights > 1 ? `Tarif pour ${nights} nuits` : "Tarif pour 1 nuit";

  const quantitySelect = (roomType: HotelRoomType, rate: HotelRate) => {
    const max = Math.min(freeUnits(roomType.id) - selectedForType(roomType.id, rate.id), MAX_PER_RATE);
    if (availability && freeUnits(roomType.id) === 0) {
      return <span className="text-sm text-destructive font-medium">Complet</span>;
    }
    return (
      <Select
        value={String(quantities[rate.id] || 0)}
        onValueChange={(v) => setQuantities((prev) => ({ ...prev, [rate.id]: Number(v) }))}
        disabled={!availability || nights === 0}
      >
        <SelectTrigger className="w-full min-w-[9rem]" aria-label={`Nombre de « ${roomType.name} »`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Array.from({ length: Math.max(max, 0) + 1 }, (_, n) => n).map((n) => (
            <SelectItem key={n} value={String(n)}>
              {n === 0 ? "0" : `${n}  (${formatFcfa(rate.price_per_night * stayNights * n)})`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };

  const roomSummary = (roomType: HotelRoomType, compact = false) => {
    const free = freeUnits(roomType.id);
    return (
      <div className="space-y-1.5">
        <button
          type="button"
          className="text-left font-semibold text-primary underline-offset-2 hover:underline"
          onClick={() => setDetailRoom(roomType)}
        >
          {roomType.name}
        </button>
        {availability && free > 0 && free <= 3 && (
          <p className="text-xs font-semibold text-destructive">
            Plus que {free} disponible{free > 1 ? "s" : ""} sur notre site !
          </p>
        )}
        {roomType.bed_info && (
          <p className="flex items-center gap-1.5 text-sm">
            <BedDouble className="h-4 w-4 flex-shrink-0" />
            {roomType.bed_info}
          </p>
        )}
        {roomType.size_m2 && (
          <p className="flex items-center gap-1.5 text-sm">
            <Maximize className="h-4 w-4 flex-shrink-0" />
            {roomType.size_m2} m²
          </p>
        )}
        {!compact && roomType.amenities.length > 0 && (
          <ul className="flex flex-wrap gap-x-3 gap-y-1 pt-1 text-xs text-muted-foreground">
            {roomType.amenities.slice(0, 8).map((a) => (
              <li key={a} className="flex items-center gap-1">
                <Check className="h-3 w-3 text-success" />
                {a}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center text-muted-foreground">
        Cet établissement n'a pas encore publié ses chambres en ligne.
      </div>
    );
  }

  const summary = (
    <div className="space-y-3">
      {unitsSelected > 0 ? (
        <>
          <p className="text-sm">
            <span className="font-semibold">
              {unitsSelected} logement{unitsSelected > 1 ? "s" : ""}
            </span>{" "}
            pour
          </p>
          <p className="text-2xl font-bold">{formatFcfa(total)}</p>
          <p className="text-xs text-muted-foreground">
            {stayNights} nuit{stayNights > 1 ? "s" : ""} · taxes et frais compris
          </p>
          {capacitySelected < guests && (
            <p className="text-xs text-destructive">
              Votre sélection accueille {capacitySelected} voyageur{capacitySelected > 1 ? "s" : ""} sur {guests}.
            </p>
          )}
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Sélectionnez un ou plusieurs logements.</p>
      )}
      <Button
        className="w-full"
        size="lg"
        disabled={unitsSelected === 0 || reserving}
        onClick={() => onReserve(selections)}
      >
        Je réserve
      </Button>
      <ul className="space-y-1 text-xs text-muted-foreground">
        <li>• La confirmation est immédiate</li>
        <li>• Aucun frais de réservation</li>
      </ul>
    </div>
  );

  return (
    <>
      {/* Ordinateur : tableau */}
      <div className="hidden lg:grid lg:grid-cols-[1fr_15rem] gap-0 rounded-lg border overflow-hidden">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-primary text-primary-foreground text-left">
              <th className="p-3 font-semibold w-[30%]">Type d'appartement</th>
              <th className="p-3 font-semibold">Nombre de voyageurs</th>
              <th className="p-3 font-semibold">{priceLabel}</th>
              <th className="p-3 font-semibold w-[28%]">Vos options</th>
              <th className="p-3 font-semibold">Sélectionner des appartements</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ roomType, rates: roomRates }) => (
              <Fragment key={roomType.id}>
                {roomRates.map((rate, index) => (
                  <tr key={rate.id} className={index === 0 ? "border-t-2 border-primary/30" : "border-t"}>
                    {index === 0 && (
                      <td rowSpan={roomRates.length} className="p-3 align-top border-r">
                        {roomSummary(roomType)}
                      </td>
                    )}
                    <td className="p-3 align-top border-r">
                      <Occupancy count={rate.occupancy} />
                    </td>
                    <td className="p-3 align-top border-r">
                      <p className="text-base font-bold">{formatFcfa(rate.price_per_night * stayNights)}</p>
                      {nights > 1 && (
                        <p className="text-xs text-muted-foreground">{formatFcfa(rate.price_per_night)} / nuit</p>
                      )}
                      <p className="text-xs text-muted-foreground">Taxes et frais compris</p>
                    </td>
                    <td className="p-3 align-top border-r">
                      <RateOptions rate={rate} />
                    </td>
                    <td className="p-3 align-top">{quantitySelect(roomType, rate)}</td>
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
        <aside className="border-l bg-muted/30">
          <div className="bg-primary p-3 text-primary-foreground text-sm font-semibold">&nbsp;</div>
          <div className="sticky top-24 p-4">{summary}</div>
        </aside>
      </div>

      {/* Mobile et tablette : une carte par type */}
      <div className="lg:hidden space-y-4 pb-28">
        {rows.map(({ roomType, rates: roomRates }) => (
          <div key={roomType.id} className="rounded-lg border">
            <div className="flex gap-3 p-3 border-b">
              {roomType.images[0] && (
                <img src={roomType.images[0]} alt="" className="h-20 w-24 rounded object-cover flex-shrink-0" />
              )}
              {roomSummary(roomType, true)}
            </div>
            <div className="divide-y">
              {roomRates.map((rate) => (
                <div key={rate.id} className="p-3 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <Occupancy count={rate.occupancy} />
                    <div className="text-right">
                      <p className="text-base font-bold">{formatFcfa(rate.price_per_night * stayNights)}</p>
                      <p className="text-xs text-muted-foreground">{priceLabel.replace("Tarif ", "")}</p>
                    </div>
                  </div>
                  <RateOptions rate={rate} />
                  {quantitySelect(roomType, rate)}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="lg:hidden fixed inset-x-0 bottom-0 z-40 border-t bg-background p-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            {unitsSelected > 0 ? (
              <>
                <p className="text-lg font-bold leading-tight">{formatFcfa(total)}</p>
                <p className="text-xs text-muted-foreground">
                  {unitsSelected} logement{unitsSelected > 1 ? "s" : ""} · {stayNights} nuit{stayNights > 1 ? "s" : ""}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Choisissez vos logements</p>
            )}
          </div>
          <Button disabled={unitsSelected === 0 || reserving} onClick={() => onReserve(selections)}>
            Je réserve
          </Button>
        </div>
      </div>

      <Dialog
        open={!!detailRoom}
        onOpenChange={(open) => {
          if (!open) setDetailRoom(null);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {detailRoom && (
            <>
              <DialogHeader>
                <DialogTitle>{detailRoom.name}</DialogTitle>
                <DialogDescription>
                  {[
                    detailRoom.bed_info,
                    detailRoom.size_m2 ? `${detailRoom.size_m2} m²` : null,
                    `Jusqu'à ${detailRoom.max_guests} voyageur${detailRoom.max_guests > 1 ? "s" : ""}`,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </DialogDescription>
              </DialogHeader>
              {detailRoom.images.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {detailRoom.images.map((url, i) => (
                    <img
                      key={url}
                      src={url}
                      alt={`${detailRoom.name} - photo ${i + 1}`}
                      className={`w-full rounded object-cover ${i === 0 ? "col-span-2 aspect-video" : "aspect-[4/3]"}`}
                    />
                  ))}
                </div>
              )}
              {detailRoom.description && <p className="text-sm whitespace-pre-line">{detailRoom.description}</p>}
              {detailRoom.amenities.length > 0 && (
                <div>
                  <p className="font-semibold mb-2">Équipements</p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-sm">
                    {detailRoom.amenities.map((a) => (
                      <li key={a} className="flex items-center gap-1.5">
                        <Check className="h-4 w-4 text-success" />
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <Badge variant="outline" className="w-fit">
                {detailRoom.total_units} logement{detailRoom.total_units > 1 ? "s" : ""} de ce type dans l'établissement
              </Badge>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
