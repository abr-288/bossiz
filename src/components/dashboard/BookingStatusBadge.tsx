import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";

// Single source of truth for booking/payment status colors and labels, used
// by BookingCard, BookingHistory, BookingCalendar and AdminBookings. Before
// this, each of these re-implemented its own color/label mapping, so the
// same status ("confirmée") showed up in a different color depending on
// which page you were on.

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

export const BOOKING_STATUS_DOT_COLOR: Record<string, string> = {
  pending: "bg-amber-500",
  confirmed: "bg-emerald-500",
  completed: "bg-blue-500",
  cancelled: "bg-red-500",
};

export const PAYMENT_STATUS_DOT_COLOR: Record<string, string> = {
  pending: "bg-amber-500",
  processing: "bg-amber-500",
  paid: "bg-emerald-500",
  refunded: "bg-slate-400",
  failed: "bg-red-500",
};

const BOOKING_STATUS_VARIANT: Record<string, BadgeVariant> = {
  pending: "secondary",
  confirmed: "default",
  completed: "outline",
  cancelled: "destructive",
};

const PAYMENT_STATUS_VARIANT: Record<string, BadgeVariant> = {
  pending: "secondary",
  processing: "secondary",
  paid: "default",
  completed: "default", // `payments.status` uses "completed", `bookings.payment_status` uses "paid" - same meaning
  refunded: "outline",
  failed: "destructive",
};

// `payments.status` ("completed") and `bookings.payment_status` ("paid")
// are two different enums for the same underlying "successfully charged"
// state - normalize the label so both tables read the same in the UI.
const PAYMENT_STATUS_LABEL_KEY: Record<string, string> = {
  completed: "paid",
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function BookingStatusBadge({ status, className }: StatusBadgeProps) {
  const { t } = useTranslation();
  const variant = BOOKING_STATUS_VARIANT[status] || "secondary";
  const label = t(`booking.status.${status}`, status);
  return <Badge variant={variant} className={className}>{label}</Badge>;
}

export function PaymentStatusBadge({ status, className }: StatusBadgeProps) {
  const { t } = useTranslation();
  const variant = PAYMENT_STATUS_VARIANT[status] || "secondary";
  const labelKey = PAYMENT_STATUS_LABEL_KEY[status] || status;
  const label = t(`booking.payment.${labelKey}`, status);
  return <Badge variant={variant} className={className}>{label}</Badge>;
}
