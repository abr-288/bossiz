// Frais d'annulation d'une réservation d'hôtel partenaire, selon les
// conditions figées dans la réservation (booking_details.items) et le
// contrat de partenariat hébergement (art. 7) :
// - annulation gratuite jusqu'à 23 h 59 du jour J-N (N ≥ 1), heure d'Abidjan ;
// - passé ce délai : frais d'annulation tardive du tarif (20 % par défaut) ;
// - tarif non remboursable : 100 % ;
// - le jour de l'arrivée et après : plus d'annulation en ligne.
// Abidjan est à UTC+0 toute l'année : la date du jour est la date UTC.

export interface HotelItemTerms {
  room?: string;
  quantity: number;
  pricePerNight: number;
  freeCancellation?: boolean;
  freeCancellationDays?: number;
  lateCancellationFeePercent?: number;
}

export interface CancellationLine {
  room: string;
  total: number;
  feePercent: number;
  fee: number;
}

export interface CancellationQuote {
  cancellable: boolean;
  reason?: string;
  fee: number;
  refund: number;
  paid: number;
  total: number;
  payAtProperty: boolean;
  lines: CancellationLine[];
}

const DEFAULT_LATE_FEE_PERCENT = 20;

export function todayInAbidjan(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function quoteHotelCancellation(
  booking: {
    status: string;
    payment_status: string;
    amount_paid: number | string | null;
    total_price: number | string;
    start_date: string;
    // deno-lint-ignore no-explicit-any
    booking_details: any;
  },
  today = todayInAbidjan(),
): CancellationQuote {
  const details = booking.booking_details ?? {};
  const items = (Array.isArray(details.items) ? details.items : []) as HotelItemTerms[];
  const nights = Math.max(Number(details.nights) || 1, 1);
  const payAtProperty = details.payAtProperty === true;
  const paid = ["paid", "partially_paid"].includes(booking.payment_status) ? Number(booking.amount_paid || 0) : 0;
  const total = Number(booking.total_price);

  const lines = items.map((item) => {
    const lineTotal = item.quantity * item.pricePerNight * nights;
    let feePercent: number;
    if (!item.freeCancellation) {
      feePercent = 100;
    } else {
      const deadline = addDays(booking.start_date, -Math.max(Number(item.freeCancellationDays) || 1, 1));
      feePercent = today <= deadline
        ? 0
        : Math.min(Math.max(Number(item.lateCancellationFeePercent ?? DEFAULT_LATE_FEE_PERCENT), 0), 100);
    }
    return { room: item.room ?? "Logement", total: lineTotal, feePercent, fee: Math.round(lineTotal * feePercent / 100) };
  });
  const fee = Math.min(lines.reduce((sum, l) => sum + l.fee, 0), total);
  const base = { fee, refund: Math.max(paid - fee, 0), paid, total, payAtProperty, lines };

  if (details.kind !== "partner_hotel") return { ...base, cancellable: false, reason: "Réservation introuvable" };
  if (booking.status === "cancelled") return { ...base, cancellable: false, reason: "Cette réservation est déjà annulée." };
  if (booking.payment_status === "processing") {
    return { ...base, cancellable: false, reason: "Un paiement est en cours sur cette réservation. Réessayez dans quelques minutes." };
  }
  if (today >= booking.start_date) {
    return {
      ...base,
      cancellable: false,
      reason: "L'annulation en ligne est possible jusqu'à la veille de l'arrivée. Contactez Bossiz+ pour toute demande.",
    };
  }
  return { ...base, cancellable: true };
}
