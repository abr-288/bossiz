import { useState, memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { MapPin, Calendar, Users, MoreVertical, Edit, Trash2, CheckCircle, XCircle, FileDown, Loader2, Ticket } from "lucide-react";
import { useBookingPDF } from "@/hooks/useBookingPDF";
import { Price } from "@/components/ui/price";
import { BookingStatusBadge, PaymentStatusBadge } from "@/components/dashboard/BookingStatusBadge";

interface Booking {
  id: string;
  service_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  start_date: string;
  end_date: string | null;
  guests: number;
  total_price: number;
  currency: string;
  status: string;
  payment_status: string;
  external_ref: string | null;
  created_at: string;
  services: {
    name: string;
    type: string;
    location: string;
  };
}

interface BookingCardProps {
  booking: Booking;
  onConfirm: (id: string) => void;
  onCancel: (id: string) => void;
  onEdit: (booking: Booking) => void;
  onDelete: (id: string) => void;
}

export const BookingCard = ({ booking, onConfirm, onCancel, onEdit, onDelete }: BookingCardProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const { generatePDF, downloadPDF, isGenerating } = useBookingPDF();

  const canConfirm = booking.status === "pending";
  const canCancel = booking.status !== "cancelled" && booking.status !== "completed";
  const canEdit = booking.status === "pending";

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1">
              <CardTitle className="text-lg">{booking.services?.name}</CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {booking.services?.location}
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onClick={() => generatePDF(booking.id)}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <FileDown className="h-4 w-4 mr-2" />
                  )}
                  Exporter PDF
                </DropdownMenuItem>
                {canConfirm && (
                  <DropdownMenuItem onClick={() => onConfirm(booking.id)}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirmer
                  </DropdownMenuItem>
                )}
                {canEdit && (
                  <DropdownMenuItem onClick={() => onEdit(booking)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Modifier
                  </DropdownMenuItem>
                )}
                {canCancel && (
                  <DropdownMenuItem onClick={() => setShowCancelDialog(true)}>
                    <XCircle className="h-4 w-4 mr-2" />
                    Annuler
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{new Date(booking.start_date).toLocaleDateString("fr-FR")}</span>
            </div>
            {booking.end_date && (
              <>
                <span className="text-muted-foreground">→</span>
                <span>{new Date(booking.end_date).toLocaleDateString("fr-FR")}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{booking.guests} voyageur{booking.guests > 1 ? "s" : ""}</span>
          </div>

          {booking.external_ref && (
            <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
              <Ticket className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground font-medium">Numéro de Réservation (PNR)</p>
                <p className="text-lg font-bold text-primary tracking-wider">{booking.external_ref}</p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex gap-2">
              <BookingStatusBadge status={booking.status} />
              <PaymentStatusBadge status={booking.payment_status} />
            </div>
            <div className="text-lg font-bold">
              <Price amount={Number(booking.total_price)} fromCurrency={booking.currency} showLoader />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la réservation</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette réservation ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete(booking.id);
                setShowDeleteDialog(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Annuler la réservation</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir annuler cette réservation ? Vous pouvez être éligible à un remboursement selon les conditions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Retour</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onCancel(booking.id);
                setShowCancelDialog(false);
              }}
            >
              Confirmer l'annulation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

// Memoize to prevent unnecessary re-renders
export default memo(BookingCard);
