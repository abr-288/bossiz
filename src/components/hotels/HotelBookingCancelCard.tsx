import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { getEdgeFunctionErrorMessage } from "@/lib/getEdgeFunctionErrorMessage";
import { NO_SHOW_TERMS, formatFcfa } from "@/lib/hotels";
import { Loader2 } from "lucide-react";

interface Quote {
  cancellable: boolean;
  reason?: string;
  fee: number;
  refund: number;
  paid: number;
  payAtProperty: boolean;
  lines: { room: string; total: number; feePercent: number; fee: number }[];
}

interface HotelBookingCancelCardProps {
  bookingId: string;
  cancellation?: { fee?: number; refund?: number; feeDueToHotel?: number } | null;
  cancelled: boolean;
  onCancelled: () => void;
}

// Annulation en ligne d'une réservation d'hôtel partenaire : les frais et le
// remboursement sont calculés par le serveur (cancel-hotel-booking, dry_run)
// et montrés avant confirmation.
export function HotelBookingCancelCard({
  bookingId,
  cancellation,
  cancelled,
  onCancelled,
}: HotelBookingCancelCardProps) {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  if (cancelled) {
    return (
      <Card className="border-destructive/30">
        <CardContent className="p-5 text-sm space-y-1">
          <p className="font-semibold">Réservation annulée</p>
          <p>Frais d'annulation : {cancellation?.fee ? formatFcfa(cancellation.fee) : "aucun"}</p>
          {!!cancellation?.refund && (
            <p>Remboursement : {formatFcfa(cancellation.refund)} sur votre moyen de paiement.</p>
          )}
          {!!cancellation?.feeDueToHotel && (
            <p>Frais à régler à l'établissement : {formatFcfa(cancellation.feeDueToHotel)}.</p>
          )}
        </CardContent>
      </Card>
    );
  }

  const call = async (dryRun: boolean) => {
    const { data, error } = await supabase.functions.invoke("cancel-hotel-booking", {
      body: { booking_id: bookingId, dry_run: dryRun },
    });
    if (error || !data?.success) {
      throw new Error(
        error
          ? await getEdgeFunctionErrorMessage(error, "Annulation impossible.")
          : data?.error || "Annulation impossible.",
      );
    }
    return data;
  };

  const openQuote = async () => {
    setLoading(true);
    try {
      const data = await call(true);
      setQuote(data.quote as Quote);
      setOpen(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Annulation impossible.");
    } finally {
      setLoading(false);
    }
  };

  const confirm = async () => {
    setLoading(true);
    try {
      const data = await call(false);
      toast.success(
        data.refund > 0
          ? `Réservation annulée. ${formatFcfa(data.refund)} vous seront remboursés.`
          : "Réservation annulée.",
      );
      setOpen(false);
      onCancelled();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Annulation impossible.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card>
        <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-sm">
            <p className="font-semibold">Besoin d'annuler ?</p>
            <p className="text-muted-foreground">Les conditions de votre tarif s'appliquent. {NO_SHOW_TERMS}</p>
          </div>
          <Button variant="outline" onClick={openQuote} disabled={loading}>
            {loading && !open && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Annuler ma réservation
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={open} onOpenChange={(value) => !loading && setOpen(value)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {quote?.cancellable ? "Annuler cette réservation ?" : "Annulation en ligne impossible"}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm">
                {quote && !quote.cancellable ? (
                  <p>{quote.reason}</p>
                ) : quote ? (
                  <>
                    <ul className="space-y-1">
                      {quote.lines.map((line, i) => (
                        <li key={i} className="flex justify-between gap-3">
                          <span>
                            {line.room} · {line.feePercent === 0 ? "sans frais" : `${line.feePercent} % de frais`}
                          </span>
                          <span className="whitespace-nowrap">{line.fee > 0 ? formatFcfa(line.fee) : "0 FCFA"}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="font-semibold text-foreground">Frais d'annulation : {formatFcfa(quote.fee)}</p>
                    {quote.paid > 0 ? (
                      <p className="text-foreground">
                        Remboursement : <strong>{formatFcfa(quote.refund)}</strong> sur le moyen de paiement utilisé,
                        sous 10 jours ouvrés.
                      </p>
                    ) : quote.fee > 0 && quote.payAtProperty ? (
                      <p>Ces frais sont à régler directement à l'établissement.</p>
                    ) : null}
                    <p>L'annulation est définitive.</p>
                  </>
                ) : null}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>
              {quote?.cancellable ? "Garder ma réservation" : "Fermer"}
            </AlertDialogCancel>
            {quote?.cancellable && (
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  void confirm();
                }}
                disabled={loading}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Confirmer l'annulation
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
