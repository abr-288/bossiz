import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Handshake,
  BadgePercent,
  Users,
  TrendingUp,
  Hotel,
  UtensilsCrossed,
  Compass,
  Hammer,
  Car,
  Check,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { partnerApplicationSchema } from "@/lib/validation";
import { UnifiedForm, UnifiedFormField, UnifiedSubmitButton } from "@/components/forms";
import { LazyImage } from "@/components/ui/lazy-image";
import bannerBecomePartner from "@/assets/hero-slide-1.jpg";

const partnerTypeOptions = [
  { value: "hotel", label: "Hôtel / hébergement", icon: Hotel },
  { value: "restaurant", label: "Restaurant", icon: UtensilsCrossed },
  { value: "activity", label: "Activité / excursion / tour", icon: Compass },
  { value: "artisan", label: "Artisan / guide local", icon: Hammer },
  { value: "cars", label: "Location de voitures", icon: Car },
] as const;

type PartnerTypeValue = (typeof partnerTypeOptions)[number]["value"];

const carPlanOptions = [
  { value: "decouverte", label: "Découverte — Gratuit, commission 12%, jusqu'à 3 véhicules" },
  { value: "pro", label: "Pro — 25 000 XOF/mois, commission 8%, jusqu'à 15 véhicules" },
  { value: "flotte", label: "Flotte — 60 000 XOF/mois, commission 5%, véhicules illimités" },
];

const carPlanLabels: Record<string, string> = {
  decouverte: "Découverte",
  pro: "Pro",
  flotte: "Flotte",
};

const commonConditions = [
  "Chaque candidature est étudiée manuellement par notre équipe avant toute activation.",
  "B-Reserve peut refuser ou suspendre un partenariat en cas de non-respect de ces conditions.",
];

const conditionsByType: Record<PartnerTypeValue, string[]> = {
  hotel: [
    "Inscription gratuite, sans engagement.",
    "Vos tarifs restent les vôtres : aucune commission n'est ajoutée à l'affichage pour le client.",
    "Une commission de 10% est prélevée sur chaque réservation confirmée.",
    "Votre établissement est géré en autonomie depuis votre espace agence une fois la candidature validée.",
  ],
  restaurant: [
    "Inscription gratuite, sans engagement.",
    "Une commission de 10% est prélevée sur chaque réservation effectuée via la plateforme.",
    "Vous gérez votre menu et vos disponibilités depuis votre espace agence.",
  ],
  activity: [
    "Inscription gratuite, sans engagement.",
    "Une commission de 10% est prélevée sur chaque réservation.",
    "Votre activité est visible dans les résultats Activités & Tours.",
  ],
  artisan: [
    "Inscription gratuite, sans engagement.",
    "Une commission de 10% est prélevée sur chaque prestation réservée.",
    "Une fiche dédiée présente votre savoir-faire avec photos et description.",
  ],
  cars: [
    "L'inscription se fait via l'un de nos 3 forfaits : Découverte (gratuit), Pro ou Flotte.",
    "Une commission dégressive s'applique selon le forfait choisi : 12% (Découverte), 8% (Pro) ou 5% (Flotte).",
    "Le nombre de véhicules en ligne et les mises en avant dépendent du forfait souscrit.",
  ],
};

const benefits = [
  {
    icon: Users,
    title: "Visibilité auprès de nos clients",
    description: "Votre établissement apparaît directement dans les résultats de recherche B-Reserve.",
  },
  {
    icon: BadgePercent,
    title: "Vos prix, sans surcoût",
    description: "Contrairement aux autres sources, aucune commission n'est ajoutée sur vos tarifs partenaires.",
  },
  {
    icon: TrendingUp,
    title: "Gestion autonome",
    description: "Un espace dédié pour gérer vos offres une fois votre candidature approuvée.",
  },
];

const isPartnerType = (value: string | null): value is PartnerTypeValue =>
  !!value && partnerTypeOptions.some((option) => option.value === value);

const BecomePartner = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const requestedCarPlan = searchParams.get("plan");
  const requestedTypeParam = searchParams.get("type");
  const initialType: PartnerTypeValue | "" = isPartnerType(requestedTypeParam)
    ? requestedTypeParam
    : requestedCarPlan
      ? "cars"
      : "";

  const [formData, setFormData] = useState({
    name: "",
    contactEmail: "",
    contactPhone: "",
    description: "",
    logoUrl: "",
  });
  const [partnerType, setPartnerType] = useState<PartnerTypeValue | "">(initialType);
  const [carPlan, setCarPlan] = useState(
    requestedCarPlan && carPlanLabels[requestedCarPlan] ? requestedCarPlan : "decouverte"
  );
  const [acceptedConditions, setAcceptedConditions] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleTypeChange = (value: string) => {
    setPartnerType(value as PartnerTypeValue);
    setAcceptedConditions(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!partnerType) {
      toast.error("Veuillez choisir un type de partenariat.");
      return;
    }

    if (!acceptedConditions) {
      toast.error("Veuillez accepter les conditions du partenariat avant de continuer.");
      return;
    }

    try {
      partnerApplicationSchema.parse(formData);
    } catch (error: any) {
      toast.error(error.errors?.[0]?.message || "Veuillez vérifier vos informations.");
      return;
    }

    const typeLabel = partnerTypeOptions.find((option) => option.value === partnerType)?.label;
    const finalDescription = [
      typeLabel ? `Type de partenariat : ${typeLabel}` : null,
      partnerType === "cars" ? `Forfait souhaité : ${carPlanLabels[carPlan] || carPlan}` : null,
      formData.description || null,
    ]
      .filter(Boolean)
      .join("\n\n");

    setLoading(true);
    const { error } = await supabase.from("partner_applications").insert({
      name: formData.name,
      contact_email: formData.contactEmail,
      contact_phone: formData.contactPhone || null,
      description: finalDescription || null,
      logo_url: formData.logoUrl || null,
      requested_car_plan_id: partnerType === "cars" ? carPlan : null,
    });
    setLoading(false);

    if (error) {
      console.error("Partner application error:", error);
      toast.error("Impossible d'envoyer votre candidature. Veuillez réessayer.");
      return;
    }

    toast.success("Candidature envoyée ! Notre équipe vous recontactera après étude de votre dossier.");
    setFormData({ name: "", contactEmail: "", contactPhone: "", description: "", logoUrl: "" });
    setPartnerType("");
    setCarPlan("decouverte");
    setAcceptedConditions(false);
  };

  const activeConditions = partnerType ? [...conditionsByType[partnerType], ...commonConditions] : [];

  return (
    <div className="min-h-screen bg-background flex flex-col pt-16">
      <Navbar />

      {/* Hero */}
      <section className="relative py-16 md:py-20 bg-primary overflow-hidden">
        <LazyImage
          src={bannerBecomePartner}
          alt={t("pages.becomePartner.title", "Devenir partenaire")}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-primary/65" />
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        </div>
        <div className="relative z-10 container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tighter drop-shadow-lg">
            {t("pages.becomePartner.title", "Devenir partenaire")}
          </h1>
          <p className="text-lg md:text-xl text-white/95 max-w-2xl mx-auto font-medium">
            {t("pages.becomePartner.subtitle", "Hôtel, restaurant, activité, artisan, location de voitures... Listez vos services sur B-Reserve et touchez de nouveaux clients")}
          </p>
        </div>
      </section>

      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {/* Benefits */}
          <div>
            <h2 className="text-2xl font-black text-foreground mb-6 flex items-center gap-2">
              <Handshake className="w-6 h-6 text-primary" />
              {t("pages.becomePartner.benefitsTitle", "Pourquoi nous rejoindre")}
            </h2>
            <div className="space-y-4">
              {benefits.map((benefit) => {
                const Icon = benefit.icon;
                return (
                  <Card key={benefit.title}>
                    <CardContent className="p-6 flex gap-4">
                      <div className="w-12 h-12 flex-shrink-0 bg-primary/10 rounded-2xl flex items-center justify-center">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold mb-1">{benefit.title}</h3>
                        <p className="text-sm text-muted-foreground">{benefit.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            <p className="text-sm text-muted-foreground mt-6">
              {t(
                "pages.becomePartner.reviewNote",
                "Chaque candidature est étudiée manuellement par notre équipe avant activation de votre espace partenaire."
              )}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              <Link to="/partenariat" className="text-primary font-medium hover:underline">
                Voir tous les types de partenariat et leurs conditions
              </Link>
            </p>
          </div>

          {/* Application form */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>{t("pages.becomePartner.formTitle", "Votre candidature")}</CardTitle>
              </CardHeader>
              <CardContent>
                <UnifiedForm onSubmit={handleSubmit} variant="contact" loading={loading}>
                  <div className="space-y-2">
                    <label className="text-sm font-medium block">
                      Type de partenariat <span className="text-destructive">*</span>
                    </label>
                    <Select value={partnerType} onValueChange={handleTypeChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choisissez un type de partenariat" />
                      </SelectTrigger>
                      <SelectContent>
                        {partnerTypeOptions.map((option) => {
                          const Icon = option.icon;
                          return (
                            <SelectItem key={option.value} value={option.value}>
                              <span className="flex items-center gap-2">
                                <Icon className="w-4 h-4 text-primary" />
                                {option.label}
                              </span>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  {partnerType === "cars" && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium block">
                        Forfait souhaité <span className="text-destructive">*</span>
                      </label>
                      <Select value={carPlan} onValueChange={setCarPlan}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choisissez un forfait" />
                        </SelectTrigger>
                        <SelectContent>
                          {carPlanOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Détails complets sur la{" "}
                        <Link to="/partenaires/voitures" className="text-primary hover:underline">
                          page des forfaits voiture
                        </Link>
                        .
                      </p>
                    </div>
                  )}

                  <UnifiedFormField
                    label={t("pages.becomePartner.form.name", "Nom de l'agence / de l'établissement")}
                    name="name"
                    placeholder="Ex: Onomo Hotel Abidjan"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                  <UnifiedFormField
                    label={t("pages.becomePartner.form.email", "Email de contact")}
                    name="contactEmail"
                    type="email"
                    placeholder="contact@votrehotel.com"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    required
                  />
                  <UnifiedFormField
                    label={t("pages.becomePartner.form.phone", "Téléphone")}
                    name="contactPhone"
                    type="tel"
                    placeholder="+225 XX XX XX XX XX"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  />
                  <UnifiedFormField
                    label={t("pages.becomePartner.form.logoUrl", "URL du logo (optionnel)")}
                    name="logoUrl"
                    placeholder="https://..."
                    value={formData.logoUrl}
                    onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                  />
                  <div className="space-y-2">
                    <label className="text-sm font-medium block">
                      {t("pages.becomePartner.form.description", "Présentez votre établissement")}
                    </label>
                    <Textarea
                      placeholder="Nombre de chambres/places, localisation, services proposés..."
                      rows={5}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full"
                    />
                  </div>

                  {partnerType ? (
                    <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-3">
                      <p className="text-sm font-semibold">
                        Conditions —{" "}
                        {partnerTypeOptions.find((o) => o.value === partnerType)?.label}
                      </p>
                      <ul className="space-y-2">
                        {activeConditions.map((condition) => (
                          <li key={condition} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                            <span>{condition}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="flex items-start gap-2 pt-2 border-t border-border">
                        <Checkbox
                          id="accept-conditions"
                          checked={acceptedConditions}
                          onCheckedChange={(checked) => setAcceptedConditions(checked === true)}
                          className="mt-0.5"
                        />
                        <label htmlFor="accept-conditions" className="text-sm cursor-pointer">
                          J'ai lu et j'accepte les conditions de ce partenariat.
                        </label>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      Choisissez un type de partenariat ci-dessus pour afficher les conditions correspondantes.
                    </p>
                  )}

                  <UnifiedSubmitButton
                    loading={loading}
                    fullWidth
                    disabled={!partnerType || !acceptedConditions}
                  >
                    {t("pages.becomePartner.form.submit", "Envoyer ma candidature")}
                  </UnifiedSubmitButton>
                </UnifiedForm>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BecomePartner;
