import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AgencyLayout } from "@/components/agency/AgencyLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { formatFcfa, nightsBetween } from "@/lib/hotels";
import { BedDouble, CalendarCheck, Mail, Phone, UserX, Wallet } from "lucide-react";

interface BookedRoom {
  room: string;
  quantity: number;
  occupancy: number;
  pricePerNight: number;
  options?: { breakfastIncluded?: boolean; freeCancellation?: boolean };
}

interface HotelBooking {
  booking_id: string;
  created_at: string;
  hotel_name: string;
  status: string;
  payment_status: string;
  check_in: string;
  check_out: string;
  guests: number;
  total_price: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  notes: string | null;
  pay_at_property: boolean;
  no_show: boolean;
  cancellation: { fee?: number; refund?: number; feeDueToHotel?: number } | null;
  rooms: BookedRoom[] | null;
}

interface OnsiteInvoice {
  id: string;
  period: string;
  stays_count: number;
  stays_amount: number;
  commission_amount: number;
  status: string;
  due_at: string;
  paid_at: string | null;
}

const shortDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

const isoToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const addDays = (iso: string, days: number) => {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

function statusBadge(booking: HotelBooking) {
  if (booking.status === "cancelled") return <Badge variant="destructive">Annulée</Badge>;
  if (booking.no_show) return <Badge variant="destructive">Non présenté</Badge>;
  if (booking.payment_status === "paid") return <Badge>Payée en ligne</Badge>;
  if (booking.pay_at_property) return <Badge variant="secondary">À encaisser sur place</Badge>;
  return <Badge variant="outline">{booking.payment_status}</Badge>;
}

const invoiceStatus: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  issued: { label: "À régler", variant: "secondary" },
  paid: { label: "Réglée", variant: "default" },
};

// Réservations des hôtels du partenaire (agency_hotel_bookings) et factures
// de commission des séjours payés sur place (contrat hébergement, art. 6.3).
export default function AgencyHotelBookings() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"upcoming" | "past" | "invoices">("upcoming");
  const [markingId, setMarkingId] = useState<string | null>(null);

  const bookingsQuery = useQuery({
    queryKey: ["agency-hotel-bookings"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("agency_hotel_bookings");
      if (error) throw error;
      return (data || []) as unknown as HotelBooking[];
    },
  });

  const invoicesQuery = useQuery({
    queryKey: ["agency-hotel-onsite-invoices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hotel_onsite_commission_invoices")
        .select("id, period, stays_count, stays_amount, commission_amount, status, due_at, paid_at")
        .neq("status", "cancelled")
        .order("period", { ascending: false });
      if (error) throw error;
      return (data || []) as OnsiteInvoice[];
    },
  });

  const today = isoToday();
  const { upcoming, past } = useMemo(() => {
    const all = bookingsQuery.data ?? [];
    return {
      upcoming: all.filter((b) => b.check_out >= today).sort((a, b) => a.check_in.localeCompare(b.check_in)),
      past: all.filter((b) => b.check_out < today),
    };
  }, [bookingsQuery.data, today]);
  const list = tab === "upcoming" ? upcoming : past;

  const markNoShow = async (booking: HotelBooking) => {
    if (!confirm(`Déclarer ${booking.customer_name} non présenté(e) ? Le séjour reste dû à 100 % et n'est pas facturé en commission sur place.`)) return;
    setMarkingId(booking.booking_id);
    const { error } = await supabase.rpc("agency_mark_hotel_no_show", { p_booking_id: booking.booking_id });
    setMarkingId(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Non-présentation enregistrée.");
    await queryClient.invalidateQueries({ queryKey: ["agency-hotel-bookings"] });
  };

  // Contrat, art. 7.4 : du jour d'arrivée à J+2, réservation confirmée.
  const canMarkNoShow = (b: HotelBooking) =>
    b.status === "confirmed" && !b.no_show && today >= b.check_in && today <= addDays(b.check_in, 2);

  return (
    <AgencyLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Réservations hôtel</h1>
          <p className="text-muted-foreground">Les séjours réservés dans vos établissements sur Bossiz+.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant={tab === "upcoming" ? "default" : "outline"} size="sm" onClick={() => setTab("upcoming")}>
            À venir et en cours ({upcoming.length})
          </Button>
          <Button variant={tab === "past" ? "default" : "outline"} size="sm" onClick={() => setTab("past")}>
            Passées ({past.length})
          </Button>
          <Button variant={tab === "invoices" ? "default" : "outline"} size="sm" onClick={() => setTab("invoices")}>
            Factures de commission ({invoicesQuery.data?.length ?? 0})
          </Button>
        </div>

        {tab === "invoices" ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Commission de 10 % sur les séjours payés sur place, facturée chaque mois et payable sous 15 jours. Les séjours payés en ligne
              ne sont pas facturés : votre part (90 %) vous est versée 24 h après l'arrivée du client.
            </p>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mois</TableHead>
                    <TableHead>Séjours</TableHead>
                    <TableHead>Montant des séjours</TableHead>
                    <TableHead>Commission</TableHead>
                    <TableHead>Échéance</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoicesQuery.isLoading ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8">Chargement...</TableCell></TableRow>
                  ) : !invoicesQuery.data?.length ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Aucune facture pour l'instant.</TableCell></TableRow>
                  ) : (
                    invoicesQuery.data.map((invoice) => {
                      const status = invoiceStatus[invoice.status] ?? { label: invoice.status, variant: "outline" as const };
                      return (
                        <TableRow key={invoice.id}>
                          <TableCell className="capitalize">
                            {new Date(`${invoice.period}T00:00:00`).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
                          </TableCell>
                          <TableCell>{invoice.stays_count}</TableCell>
                          <TableCell>{formatFcfa(Number(invoice.stays_amount))}</TableCell>
                          <TableCell className="font-semibold">{formatFcfa(Number(invoice.commission_amount))}</TableCell>
                          <TableCell>{shortDate(invoice.due_at)}</TableCell>
                          <TableCell><Badge variant={status.variant}>{status.label}</Badge></TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : bookingsQuery.isLoading ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Chargement...</p>
        ) : bookingsQuery.error ? (
          <p className="text-sm text-destructive py-8 text-center">Impossible de charger les réservations.</p>
        ) : list.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <CalendarCheck className="h-12 w-12 mx-auto mb-2 opacity-50" />
            {tab === "upcoming" ? "Aucune réservation à venir." : "Aucune réservation passée."}
          </div>
        ) : (
          <div className="space-y-4">
            {list.map((booking) => {
              const nights = nightsBetween(booking.check_in, booking.check_out);
              return (
                <Card key={booking.booking_id} className={booking.status === "cancelled" ? "opacity-75" : undefined}>
                  <CardContent className="p-4 md:p-5 space-y-3">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                      <div>
                        <p className="font-semibold">
                          {shortDate(booking.check_in)} → {shortDate(booking.check_out)}
                          <span className="font-normal text-muted-foreground"> · {nights} nuit{nights > 1 ? "s" : ""} · {booking.guests} voyageur{booking.guests > 1 ? "s" : ""}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {booking.hotel_name} · Réf. {booking.booking_id.slice(0, 8).toUpperCase()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {statusBadge(booking)}
                        <span className="font-bold">{formatFcfa(Number(booking.total_price))}</span>
                      </div>
                    </div>
                    <ul className="space-y-1 text-sm">
                      {(booking.rooms ?? []).map((room, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <BedDouble className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span>
                            {room.quantity} × {room.room} · {room.occupancy} voyageur{room.occupancy > 1 ? "s" : ""}
                            {room.options?.breakfastIncluded ? " · petit-déjeuner inclus" : ""}
                          </span>
                        </li>
                      ))}
                    </ul>
                    {booking.status === "cancelled" && booking.cancellation && (
                      <p className="rounded-md bg-muted/50 p-2 text-sm">
                        Annulée · frais {booking.cancellation.fee ? formatFcfa(booking.cancellation.fee) : "aucun"}
                        {booking.cancellation.feeDueToHotel
                          ? ` · à encaisser auprès du client : ${formatFcfa(booking.cancellation.feeDueToHotel)}`
                          : booking.cancellation.fee
                            ? ` · votre part (90 %) : ${formatFcfa(Math.round(booking.cancellation.fee * 0.9))}`
                            : ""}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm border-t pt-3">
                      <span className="font-medium">{booking.customer_name}</span>
                      <a href={`tel:${booking.customer_phone}`} className="flex items-center gap-1 text-primary hover:underline">
                        <Phone className="h-3.5 w-3.5" />{booking.customer_phone}
                      </a>
                      <a href={`mailto:${booking.customer_email}`} className="flex items-center gap-1 text-primary hover:underline">
                        <Mail className="h-3.5 w-3.5" />{booking.customer_email}
                      </a>
                      {booking.pay_at_property && booking.payment_status !== "paid" && booking.status !== "cancelled" && (
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Wallet className="h-3.5 w-3.5" />Le client paie à l'arrivée
                        </span>
                      )}
                      {canMarkNoShow(booking) && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="ml-auto"
                          disabled={markingId === booking.booking_id}
                          onClick={() => markNoShow(booking)}
                        >
                          <UserX className="h-4 w-4 mr-1" />
                          Client non présenté
                        </Button>
                      )}
                    </div>
                    {booking.notes && (
                      <p className="rounded-md bg-muted/50 p-2 text-sm"><span className="font-medium">Demande : </span>{booking.notes}</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AgencyLayout>
  );
}
