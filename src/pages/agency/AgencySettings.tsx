import { useState, useEffect } from "react";
import { AgencyLayout } from "@/components/agency/AgencyLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { PhoneNumberInput } from "@/components/PhoneNumberInput";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Building2, CreditCard, Loader2, Save } from "lucide-react";
import { JEKO_PAYOUT_METHODS, type JekoPayoutMethod } from "@/constants/jekoPayoutMethods";
import { getEdgeFunctionErrorMessage } from "@/lib/getEdgeFunctionErrorMessage";

const bankFields = [
  { key: "bankName", label: "Nom de la banque" },
  { key: "bankCode", label: "Code banque" },
  { key: "swiftCode", label: "Code SWIFT / BIC" },
  { key: "agencyCode", label: "Code agence" },
  { key: "accountNumber", label: "Numéro de compte" },
  { key: "key", label: "Clé RIB" },
] as const;

type BankField = (typeof bankFields)[number]["key"];
type BankDetails = Record<BankField, string>;

const emptyBankDetails: BankDetails = {
  bankName: "",
  bankCode: "",
  swiftCode: "",
  agencyCode: "",
  accountNumber: "",
  key: "",
};

interface AgencyData {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  contact_email: string | null;
  contact_phone: string | null;
}

interface BrandingSubscription {
  id: string;
  status: "pending" | "processing" | "active" | "expired";
  ends_at: string | null;
}

export default function AgencySettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [agency, setAgency] = useState<AgencyData | null>(null);
  const [brandingSubscription, setBrandingSubscription] = useState<BrandingSubscription | null>(null);
  const [startingBrandingPayment, setStartingBrandingPayment] = useState(false);
  const [payoutMethod, setPayoutMethod] = useState<JekoPayoutMethod | "">("");
  const [beneficiaryName, setBeneficiaryName] = useState("");
  const [mobileMoneyNumber, setMobileMoneyNumber] = useState("");
  const [bankDetails, setBankDetails] = useState<BankDetails>(emptyBankDetails);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    logo_url: "",
    contact_email: "",
    contact_phone: "",
  });

  useEffect(() => {
    fetchAgency();
  }, []);

  const fetchAgency = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("agencies")
      .select("*")
      .eq("owner_id", user.id)
      .single();

    if (error) {
      console.error("Error fetching agency:", error);
    } else if (data) {
      setAgency(data);
      setFormData({
        name: data.name,
        description: data.description || "",
        logo_url: data.logo_url || "",
        contact_email: data.contact_email || "",
        contact_phone: data.contact_phone || "",
      });

      const [
        { data: payoutData, error: payoutError },
        { data: brandingData, error: brandingError },
      ] = await Promise.all([
        supabase
          .from("agency_payout_details")
          .select("*")
          .eq("agency_id", data.id)
          .maybeSingle(),
        supabase
          .from("agency_branding_subscriptions")
          .select("id, status, ends_at")
          .eq("agency_id", data.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
      if (payoutError) {
        console.error("Error loading agency payout details:", payoutError);
      } else if (payoutData) {
        setPayoutMethod(payoutData.payment_method as JekoPayoutMethod);
        setBeneficiaryName(payoutData.beneficiary_name || data.name);
        setMobileMoneyNumber(payoutData.mobile_money_number || "");
        setBankDetails({ ...emptyBankDetails, ...(payoutData.bank_details as Partial<BankDetails> | null) });
      }
      if (brandingError) {
        console.error("Error loading agency branding subscription:", brandingError);
      } else {
        setBrandingSubscription(brandingData as BrandingSubscription | null);
      }
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agency) return;

    setSaving(true);
    try {
      const normalizedNumber = mobileMoneyNumber.trim().replace(/[\s()-]/g, "");
      if (payoutMethod && !beneficiaryName.trim()) {
        throw new Error("Renseignez le nom exact du bénéficiaire du compte de réception.");
      }
      if (payoutMethod && payoutMethod !== "bank" && !/^\+[1-9]\d{7,14}$/.test(normalizedNumber)) {
        throw new Error("Le numéro Mobile Money doit être au format international, par exemple +2250700000000.");
      }
      if (payoutMethod === "bank" && bankFields.some(({ key }) => !bankDetails[key].trim())) {
        throw new Error("Complétez tous les champs du RIB pour recevoir les virements bancaires.");
      }

      const { error } = await supabase
        .from("agencies")
        .update({
          name: formData.name,
          description: formData.description || null,
          logo_url: formData.logo_url || null,
          contact_email: formData.contact_email || null,
          contact_phone: formData.contact_phone
            ? formData.contact_phone.startsWith("+")
              ? formData.contact_phone
              : `+225 ${formData.contact_phone}`
            : null,
        })
        .eq("id", agency.id);

      if (error) throw error;

      if (payoutMethod) {
        const { error: payoutSaveError } = await supabase
          .from("agency_payout_details")
          .upsert({
            agency_id: agency.id,
            payment_method: payoutMethod,
            beneficiary_name: beneficiaryName.trim(),
            mobile_money_number: payoutMethod === "bank" ? null : normalizedNumber,
            bank_details: payoutMethod === "bank" ? bankDetails : null,
            updated_at: new Date().toISOString(),
          });
        if (payoutSaveError) throw payoutSaveError;
      }

      toast({
        title: "Succès",
        description: "Paramètres mis à jour",
      });

      if (payoutMethod) {
        const { error: payoutProcessError } = await supabase.functions.invoke("process-agency-payouts", {
          body: { agencyId: agency.id },
        });
        if (payoutProcessError) {
          console.error("Saved payout details but could not process due payouts:", payoutProcessError);
          toast({
            title: "Coordonnées enregistrées",
            description: "Impossible de lancer les reversements en attente. L'équipe Bossiz en a besoin pour vérifier la configuration.",
            variant: "destructive",
          });
        }
      }
    } catch (error: unknown) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible d'enregistrer les paramètres.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const startBrandingPayment = async () => {
    if (!agency) return;
    setStartingBrandingPayment(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Connectez-vous avec le compte de votre agence pour continuer.");

      let subscriptionId =
        brandingSubscription?.status === "pending" || brandingSubscription?.status === "processing"
          ? brandingSubscription.id
          : null;

      if (!subscriptionId) {
        const { data: subscription, error: subscriptionError } = await supabase
          .from("agency_branding_subscriptions")
          .insert({ agency_id: agency.id })
          .select("id, status, ends_at")
          .single();
        if (subscriptionError || !subscription) {
          throw subscriptionError || new Error("Impossible de préparer l’abonnement branding.");
        }
        subscriptionId = subscription.id;
        setBrandingSubscription(subscription as BrandingSubscription);
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("id", user.id)
        .maybeSingle();
      const { data, error } = await supabase.functions.invoke("process-payment", {
        body: {
          agencyBrandingSubscriptionId: subscriptionId,
          paymentMethod: "jeko",
          customerInfo: {
            name: profile?.full_name || user.email?.split("@")[0] || "Partenaire",
            email: user.email || "",
            phone: profile?.phone || formData.contact_phone,
          },
        },
      });

      if (error) {
        throw new Error(await getEdgeFunctionErrorMessage(error, "Le paiement du branding n'a pas pu être initialisé."));
      }
      if (!data?.success || typeof data.payment_url !== "string") {
        throw new Error(data?.error || "Aucun lien de paiement n'a été créé. Le branding reste désactivé.");
      }

      window.location.assign(data.payment_url);
    } catch (error) {
      toast({
        title: "Paiement non démarré",
        description: error instanceof Error ? error.message : "Impossible d'initialiser le paiement.",
        variant: "destructive",
      });
    } finally {
      setStartingBrandingPayment(false);
    }
  };

  const brandingIsActive =
    brandingSubscription?.status === "active" &&
    !!brandingSubscription.ends_at &&
    new Date(brandingSubscription.ends_at).getTime() > Date.now();
  const brandingHasExpired =
    brandingSubscription?.status === "expired" ||
    (brandingSubscription?.status === "active" &&
      !!brandingSubscription.ends_at &&
      new Date(brandingSubscription.ends_at).getTime() <= Date.now());

  if (loading) {
    return (
      <AgencyLayout>
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </AgencyLayout>
    );
  }

  return (
    <AgencyLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold">Paramètres de l'agence</h1>
          <p className="text-muted-foreground">
            Gérez les informations de votre agence
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Informations générales
              </CardTitle>
              <CardDescription>
                Ces informations peuvent être affichées aux clients si la visibilité est activée
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom de l'agence</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="Décrivez votre agence..."
                />
              </div>

              <ImageUpload
                label="Logo de l'agence"
                folder="agency-logos"
                value={formData.logo_url}
                onChange={(logo_url) => setFormData({ ...formData, logo_url })}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact_email">Email de contact</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_phone">Téléphone</Label>
                  <PhoneNumberInput
                    id="contact_phone"
                    value={formData.contact_phone}
                    onValueChange={(contact_phone) => setFormData({ ...formData, contact_phone })}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Branding visible aux clients
              </CardTitle>
              <CardDescription>
                Votre nom et votre logo s’affichent sur vos offres pendant 30 jours après confirmation du paiement.
                Tarif : 2 500 F CFA par mois.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              {brandingIsActive ? (
                <div>
                  <p className="font-medium text-green-700 dark:text-green-400">Branding actif</p>
                  <p className="text-sm text-muted-foreground">
                    Expire le {new Date(brandingSubscription.ends_at).toLocaleDateString("fr-FR")}.
                  </p>
                </div>
              ) : brandingSubscription?.status === "processing" ? (
                <p className="text-sm text-muted-foreground">
                  Paiement en cours de confirmation. Le branding s’activera après validation.
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {brandingHasExpired
                    ? "Votre abonnement a expiré. Renouvelez-le pour réactiver le branding."
                    : "Le branding est désactivé jusqu’à la confirmation du paiement."}
                </p>
              )}
              <Button
                type="button"
                onClick={startBrandingPayment}
                disabled={
                  startingBrandingPayment ||
                  brandingIsActive
                }
              >
                {startingBrandingPayment ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="mr-2 h-4 w-4" />
                )}
                {brandingIsActive ? "Abonnement en cours" : "Payer 2 500 F avec Jèko"}
              </Button>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Moyen de réception des reversements</CardTitle>
              <CardDescription>
                Bossiz conserve 10% et votre agence reçoit 90% des ventes réglées en ligne via Jèko sous 24 heures.
                Ces coordonnées sont privées et utilisées uniquement pour vos reversements.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="payout-method">Moyen de paiement Jèko</Label>
                <Select
                  value={payoutMethod}
                  onValueChange={(value) => setPayoutMethod(value as JekoPayoutMethod)}
                >
                  <SelectTrigger id="payout-method">
                    <SelectValue placeholder="Choisissez un moyen de réception" />
                  </SelectTrigger>
                  <SelectContent>
                    {JEKO_PAYOUT_METHODS.map((method) => (
                      <SelectItem key={method.value} value={method.value}>{method.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {payoutMethod && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="beneficiary-name">Nom du titulaire</Label>
                    <Input
                      id="beneficiary-name"
                      value={beneficiaryName}
                      onChange={(event) => setBeneficiaryName(event.target.value)}
                      required
                    />
                  </div>
                  {payoutMethod === "bank" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {bankFields.map(({ key, label }) => (
                        <div className="space-y-2" key={key}>
                          <Label htmlFor={`bank-${key}`}>{label}</Label>
                          <Input
                            id={`bank-${key}`}
                            value={bankDetails[key]}
                            onChange={(event) => setBankDetails({ ...bankDetails, [key]: event.target.value })}
                            required
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="mobile-money-number">Numéro Mobile Money</Label>
                      <PhoneNumberInput
                        id="mobile-money-number"
                        value={mobileMoneyNumber}
                        placeholder="07 00 00 00 00"
                        onValueChange={setMobileMoneyNumber}
                        required
                      />
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </form>
      </div>
    </AgencyLayout>
  );
}
