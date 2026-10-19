import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import { bookingSchema } from "@/lib/validation";
import { UnifiedForm, UnifiedFormField, UnifiedDatePicker, UnifiedSubmitButton } from "@/components/forms";
import { useCreateBooking } from "@/hooks/useCreateBooking";
import { splitFullName } from "@/utils/splitFullName";

interface HotelBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hotel: {
    id: string;
    name: string;
    location: string;
    price: number;
    currency?: string;
    description?: string;
    amenities?: string[];
    rating?: number;
    images?: string[];
    offerSignature?: string;
    offerExpiresAt?: string;
  };
}

export const HotelBookingDialog = ({ open, onOpenChange, hotel }: HotelBookingDialogProps) => {
  const { t } = useTranslation();
  const [checkIn, setCheckIn] = useState<Date>();
  const [checkOut, setCheckOut] = useState<Date>();
  const navigate = useNavigate();
  const { createBooking, loading } = useCreateBooking();

  // Checked as soon as the dialog opens, not after the user has filled out
  // the whole form - avoids sending someone through 8 fields only to tell
  // them at submit time that they needed to be logged in.
  useEffect(() => {
    if (!open) return;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        onOpenChange(false);
        toast.error(t('booking.validation.mustBeLoggedIn'));
        navigate("/auth");
      }
    })();
  }, [open]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const rooms = parseInt(formData.get("rooms") as string);
    const adults = parseInt(formData.get("adults") as string);
    const children = parseInt(formData.get("children") as string) || 0;
    const customerName = formData.get("customerName") as string;
    const customerEmail = formData.get("customerEmail") as string;
    const customerPhone = formData.get("customerPhone") as string;
    const notes = formData.get("notes") as string;

    // Validate input
    try {
      bookingSchema.parse({
        customerName,
        customerEmail,
        customerPhone,
        notes: notes || null,
      });
    } catch (error: any) {
      toast.error(error.errors?.[0]?.message || t('booking.validation.checkInfo'));
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      toast.error(t('booking.validation.mustBeLoggedIn'));
      navigate("/auth");
      return;
    }

    if (!checkIn || !checkOut) {
      toast.error(t('booking.validation.selectCheckInOut'));
      return;
    }

    if (!hotel.offerSignature || !hotel.offerExpiresAt) {
      toast.error(t('booking.validation.offerExpired', "Cette offre n'est plus valide, veuillez relancer une recherche."));
      return;
    }

    // Calculate nights
    const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));

    if (nights < 1) {
      toast.error(t('booking.validation.checkOutAfterCheckIn'));
      return;
    }

    const totalPrice = hotel.price * rooms * nights;
    const totalGuests = adults + children;
    const { first_name, last_name } = splitFullName(customerName);

    const bookingId = await createBooking({
      service_type: "hotel",
      service_name: hotel.name,
      service_description: hotel.description || `Hôtel ${hotel.name} situé à ${hotel.location}. ${hotel.amenities ? `Équipements: ${hotel.amenities.join(', ')}.` : ''} ${hotel.rating ? `Note: ${hotel.rating}/5.` : ''}`,
      location: hotel.location,
      start_date: checkIn.toISOString().split('T')[0],
      end_date: checkOut.toISOString().split('T')[0],
      guests: totalGuests,
      total_price: totalPrice,
      currency: hotel.currency || "EUR",
      unit_price: hotel.price,
      offer_signature: hotel.offerSignature,
      offer_expires_at: hotel.offerExpiresAt,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      notes: notes ? `${rooms} chambre(s), ${adults} adulte(s), ${children} enfant(s)\n${notes}` : `${rooms} chambre(s), ${adults} adulte(s), ${children} enfant(s)`,
      passengers: [{ first_name, last_name }],
      booking_details: { rooms, adults, children },
    });

    if (!bookingId) return;

    onOpenChange(false);
    navigate(`/payment?bookingId=${bookingId}`);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Réserver {hotel.name}</SheetTitle>
          <SheetDescription>
            Complétez votre réservation d'hôtel à {hotel.location}
          </SheetDescription>
        </SheetHeader>

        <UnifiedForm onSubmit={handleSubmit} variant="booking" loading={loading}>
          <div className="space-y-6">
            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <UnifiedDatePicker
                label="Date d'arrivée"
                value={checkIn}
                onChange={setCheckIn}
                required
                minDate={new Date()}
              />
              <UnifiedDatePicker
                label="Date de départ"
                value={checkOut}
                onChange={setCheckOut}
                required
                minDate={checkIn || new Date()}
              />
            </div>

            {/* Room & Guests */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <UnifiedFormField
                label="Chambres"
                name="rooms"
                type="number"
                defaultValue="1"
                min={1}
                required
              />
              <UnifiedFormField
                label="Adultes"
                name="adults"
                type="number"
                defaultValue="1"
                min={1}
                required
              />
              <UnifiedFormField
                label="Enfants"
                name="children"
                type="number"
                defaultValue="0"
                min={0}
              />
            </div>

            {/* Customer Info */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold text-lg">Informations de contact</h3>
              
              <UnifiedFormField
                label="Nom complet"
                name="customerName"
                placeholder="Nom du client principal"
                required
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <UnifiedFormField
                  label="Email"
                  name="customerEmail"
                  type="email"
                  placeholder="email@example.com"
                  required
                />
                <UnifiedFormField
                  label="Téléphone"
                  name="customerPhone"
                  type="tel"
                  placeholder="+225 XX XX XX XX XX"
                  required
                />
              </div>

              <UnifiedFormField
                label="Demandes spéciales"
                name="notes"
                type="textarea"
                placeholder={t('booking.dialog.hotel.specialRequestsPlaceholder')}
              />
            </div>

            <UnifiedSubmitButton variant="booking" loading={loading} fullWidth>
              {t('booking.summary.confirm')}
            </UnifiedSubmitButton>
          </div>
        </UnifiedForm>
      </SheetContent>
    </Sheet>
  );
};
