import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import { carBookingSchema } from "@/lib/validation";
import { UnifiedForm, UnifiedFormField, UnifiedSubmitButton } from "@/components/forms";
import { useCreateBooking } from "@/hooks/useCreateBooking";
import { splitFullName } from "@/utils/splitFullName";
import { DriverDocumentUpload } from "@/components/DriverDocumentUpload";

interface CarBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  car: {
    id: string;
    name: string;
    category: string;
    price: number;
    currency?: string;
    transmission?: string;
    seats?: number;
    offerSignature?: string;
    offerExpiresAt?: string;
    // 'partner' means car.id is a real services.id (see fetchPartnerCars in
    // car-rental/index.ts) - anything else is a synthetic id from a
    // third-party API (e.g. "priceline-2") and must never be sent as
    // service_id, or create-booking would try to look it up and fail.
    source?: string;
  };
}

export const CarBookingDialog = ({ open, onOpenChange, car }: CarBookingDialogProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { createBooking, loading } = useCreateBooking();

  // Storage paths in the private driver-documents bucket (see
  // DriverDocumentUpload) - never a public URL, only the uploader and
  // admins can read these (RLS on storage.objects).
  const [licenseFrontPath, setLicenseFrontPath] = useState("");
  const [licenseBackPath, setLicenseBackPath] = useState("");
  const [applicantPhotoPath, setApplicantPhotoPath] = useState("");
  const [paymentPlan, setPaymentPlan] = useState<"full" | "deposit">("full");
  const [depositPercent, setDepositPercent] = useState(30);
  const [depositAvailable, setDepositAvailable] = useState(false);

  // Checked as soon as the dialog opens, not after the user has filled out
  // the whole form - avoids sending someone through 9+ fields only to tell
  // them at submit time that they needed to be logged in.
  useEffect(() => {
    if (!open) return;
    setLicenseFrontPath("");
    setLicenseBackPath("");
    setApplicantPhotoPath("");
    supabase.from("site_config").select("config_value").eq("config_key", "booking_payment_policy").maybeSingle()
      .then(({ data }) => {
        const policy = data?.config_value as any;
        setDepositPercent(Math.min(99, Math.max(1, Number(policy?.depositPercent) || 30)));
        const available = policy?.depositEnabled !== false && (policy?.enabledServiceTypes || []).includes("car");
        setDepositAvailable(available);
        if (!available) setPaymentPlan("full");
      });
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
    const pickupDate = formData.get("pickupDate") as string;
    const pickupTime = formData.get("pickupTime") as string;
    const dropoffDate = formData.get("dropoffDate") as string;
    const dropoffTime = formData.get("dropoffTime") as string;
    const pickupLocation = formData.get("pickupLocation") as string;
    const dropoffLocation = formData.get("dropoffLocation") as string;
    const driverLicense = formData.get("driverLicense") as string;
    const customerName = formData.get("customerName") as string;
    const customerEmail = formData.get("customerEmail") as string;
    const customerPhone = formData.get("customerPhone") as string;
    const notes = formData.get("notes") as string;

    // Validate input
    try {
      carBookingSchema.parse({
        customerName,
        customerEmail,
        customerPhone,
        driverLicense,
        pickupLocation,
        dropoffLocation,
        notes: notes || null,
      });
    } catch (error: any) {
      toast.error(error.errors?.[0]?.message || t('booking.validation.checkInfo'));
      return;
    }

    if (!licenseFrontPath || !licenseBackPath || !applicantPhotoPath) {
      toast.error(t("ux.carDialog.photosRequired"));
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      toast.error(t('booking.validation.mustBeLoggedIn'));
      navigate("/auth");
      return;
    }

    if (!car.offerSignature || !car.offerExpiresAt) {
      toast.error(t('booking.validation.offerExpired', "Cette offre n'est plus valide, veuillez relancer une recherche."));
      return;
    }

    // Calculate days
    const start = new Date(`${pickupDate}T${pickupTime}`);
    const end = new Date(`${dropoffDate}T${dropoffTime}`);
    const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

    if (days < 1) {
      toast.error(t('booking.validation.dropoffAfterPickup'));
      return;
    }

    const totalPrice = car.price * days;
    const { first_name, last_name } = splitFullName(customerName);

    const bookingId = await createBooking({
      service_id: car.source === "partner" ? car.id : undefined,
      service_type: "car",
      service_name: car.name,
      service_description: `${car.category} - ${car.transmission || 'Automatique'} - ${car.seats || 5} places`,
      location: pickupLocation,
      start_date: pickupDate,
      end_date: dropoffDate,
      guests: 1,
      total_price: totalPrice,
      currency: car.currency || "EUR",
      unit_price: car.price,
      offer_signature: car.offerSignature,
      offer_expires_at: car.offerExpiresAt,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      notes: notes || undefined,
      passengers: [{ first_name, last_name }],
      booking_details: {
        pickupTime,
        dropoffTime,
        pickupLocation,
        dropoffLocation,
        driverLicense,
        driverLicensePhotoFrontPath: licenseFrontPath,
        driverLicensePhotoBackPath: licenseBackPath,
        applicantPhotoPath,
      },
      payment_plan: paymentPlan,
    });

    if (!bookingId) return;

    onOpenChange(false);
    navigate(`/payment?bookingId=${bookingId}`);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Réserver {car.name}</SheetTitle>
          <SheetDescription>
            {car.category} - {car.transmission || 'Automatique'} - {car.seats || 5} places
          </SheetDescription>
        </SheetHeader>

        <UnifiedForm onSubmit={handleSubmit} variant="booking" loading={loading}>
          <div className="space-y-6">
            {depositAvailable && (
              <div className="space-y-2 rounded-lg border p-4">
                <h3 className="font-semibold">{t("ux.carDialog.choosePayment")}</h3>
                <button type="button" onClick={() => setPaymentPlan("full")} className={`w-full rounded-md border p-3 text-left ${paymentPlan === "full" ? "border-primary bg-primary/5" : ""}`}>
                  {t("ux.carDialog.payFullOnline")}
                </button>
                <button type="button" onClick={() => setPaymentPlan("deposit")} className={`w-full rounded-md border p-3 text-left ${paymentPlan === "deposit" ? "border-primary bg-primary/5" : ""}`}>
                  Verser {depositPercent} % d’acompte en ligne, puis régler le solde sur place
                </button>
                {paymentPlan === "deposit" && <p className="text-xs text-muted-foreground">{t("ux.carDialog.depositNote")}</p>}
              </div>
            )}
            {/* Informations de prise en charge */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">{t("ux.carDialog.pickupSection")}</h3>
              <UnifiedFormField
                label={t("ux.carDialog.pickupPlace")}
                name="pickupLocation"
                placeholder={t('booking.dialog.car.locationPlaceholder')}
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <UnifiedFormField
                  label={t("ux.carDialog.pickupDate")}
                  name="pickupDate"
                  type="date"
                  required
                />
                <UnifiedFormField
                  label={t("ux.carDialog.pickupTime")}
                  name="pickupTime"
                  type="time"
                  defaultValue="10:00"
                  required
                />
              </div>
            </div>

            {/* Dropoff Info */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold text-lg">{t("ux.carDialog.returnSection")}</h3>
              <UnifiedFormField
                label={t("ux.carDialog.returnPlace")}
                name="dropoffLocation"
                placeholder={t('booking.dialog.car.locationPlaceholder')}
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <UnifiedFormField
                  label={t("ux.carDialog.returnDate")}
                  name="dropoffDate"
                  type="date"
                  required
                />
                <UnifiedFormField
                  label={t("ux.carDialog.returnTime")}
                  name="dropoffTime"
                  type="time"
                  defaultValue="10:00"
                  required
                />
              </div>
            </div>

            {/* Driver Info */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold text-lg">{t("ux.carDialog.driverSection")}</h3>
              
              <UnifiedFormField
                label={t("ux.carDialog.fullName")}
                name="customerName"
                placeholder={t("ux.carDialog.fullNamePlaceholder")}
                required
              />

              <UnifiedFormField
                label={t("ux.carDialog.licenceNumber")}
                name="driverLicense"
                placeholder="ABC123456"
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <DriverDocumentUpload
                  label={t("ux.carDialog.licenceFront")}
                  docType="license_front"
                  path={licenseFrontPath}
                  onChange={setLicenseFrontPath}
                />
                <DriverDocumentUpload
                  label={t("ux.carDialog.licenceBack")}
                  docType="license_back"
                  path={licenseBackPath}
                  onChange={setLicenseBackPath}
                />
              </div>
              <DriverDocumentUpload
                label={t("ux.carDialog.applicantPhoto")}
                docType="applicant_photo"
                path={applicantPhotoPath}
                onChange={setApplicantPhotoPath}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <UnifiedFormField
                  label={t("ux.carDialog.email")}
                  name="customerEmail"
                  type="email"
                  placeholder="email@example.com"
                  required
                />
                <UnifiedFormField
                  label={t("ux.carDialog.phone")}
                  name="customerPhone"
                  type="tel"
                  placeholder="+225 XX XX XX XX XX"
                  required
                />
              </div>

              <UnifiedFormField
                label={t("ux.carDialog.extraInfo")}
                name="notes"
                type="textarea"
                placeholder={t('booking.dialog.car.specialRequestsPlaceholder')}
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
