import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Clock, Ticket, XCircle } from "lucide-react";
import type { EventOrderDetails } from "@/lib/events";

// État d'un achat de billets par la conciergerie, sur la page de confirmation.
export function EventOrderStatusCard({ details, paid }: { details: EventOrderDetails; paid: boolean }) {
  const status = details.conciergeStatus;
  if (!paid && status === "awaiting_payment") return null;

  if (status === "purchased") {
    return (
      <Card className="border-success/40">
        <CardContent className="p-5 space-y-2 text-sm">
          <p className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="h-5 w-5 text-success" />
            Vos billets sont prêts
          </p>
          {details.ticketsInfo && <p className="whitespace-pre-line">{details.ticketsInfo}</p>}
          {Array.isArray(details.ticketLinks) && details.ticketLinks.length > 0 && (
            <ul className="space-y-1">
              {details.ticketLinks.map((url, i) => (
                <li key={url}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-primary hover:underline"
                  >
                    <Ticket className="h-4 w-4" />
                    Billet {i + 1}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    );
  }

  if (status === "unavailable") {
    return (
      <Card className="border-destructive/30">
        <CardContent className="p-5 space-y-1 text-sm">
          <p className="flex items-center gap-2 font-semibold">
            <XCircle className="h-5 w-5 text-destructive" />
            Billets indisponibles
          </p>
          {details.unavailableReason && <p>{details.unavailableReason}</p>}
          <p className="text-muted-foreground">
            Votre commande est annulée et remboursée intégralement sur votre moyen de paiement.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/30">
      <CardContent className="p-5 space-y-1 text-sm">
        <p className="flex items-center gap-2 font-semibold">
          <Clock className="h-5 w-5 text-primary" />
          Notre conciergerie achète vos billets
        </p>
        <p className="text-muted-foreground">
          {details.quantity} billet{details.quantity > 1 ? "s" : ""} pour {details.eventName}. Vous les recevrez par
          email, généralement sous 48 heures. Si les billets ne sont plus disponibles, nous vous contactons ; sans
          solution, vous êtes remboursé intégralement.
        </p>
      </CardContent>
    </Card>
  );
}
