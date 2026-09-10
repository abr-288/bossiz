import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Handshake, BadgePercent, Users, TrendingUp, Car } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { partnerApplicationSchema } from "@/lib/validation";
import { UnifiedForm, UnifiedFormField, UnifiedSubmitButton } from "@/components/forms";
import { LazyImage } from "@/components/ui/lazy-image";
import bannerBecomePartner from "@/assets/hero-slide-1.jpg";

const carPlanLabels: Record<string, string> = {
  decouverte: "Découverte",
  pro: "Pro",
  flotte: "Flotte",
};

const benefits = [
  {
    icon: Users,
    title: "Visibilité auprès de nos clients",
    description: "Vos hôtels apparaissent directement dans les résultats de recherche B-Reserve.",
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

const BecomePartner = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const requestedCarPlan = searchParams.get("plan");
  const [formData, setFormData] = useState({
    name: "",
    contactEmail: "",
    contactPhone: "",
    description: "",
    logoUrl: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      partnerApplicationSchema.parse(formData);
    } catch (error: any) {
      toast.error(error.errors?.[0]?.message || "Veuillez vérifier vos informations.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("partner_applications").insert({
      name: formData.name,
      contact_email: formData.contactEmail,
      contact_phone: formData.contactPhone || null,
      description: formData.description || null,
      logo_url: formData.logoUrl || null,
      requested_car_plan_id: requestedCarPlan || null,
    });
    setLoading(false);

    if (error) {
      console.error("Partner application error:", error);
      toast.error("Impossible d'envoyer votre candidature. Veuillez réessayer.");
      return;
    }

    toast.success("Candidature envoyée ! Notre équipe vous recontactera après étude de votre dossier.");
    setFormData({ name: "", contactEmail: "", contactPhone: "", description: "", logoUrl: "" });
  };

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
            {t("pages.becomePartner.subtitle", "Hôtel, agence de location, guide touristique... Listez vos services sur B-Reserve et touchez de nouveaux clients")}
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
            {!requestedCarPlan && (
              <p className="text-sm text-muted-foreground mt-2">
                Vous louez des véhicules ?{" "}
                <Link to="/partenaires/voitures" className="text-primary font-medium hover:underline">
                  Voir nos forfaits pour partenaires voiture
                </Link>
              </p>
            )}
          </div>

          {/* Application form */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>{t("pages.becomePartner.formTitle", "Votre candidature")}</CardTitle>
                {requestedCarPlan && (
                  <Badge variant="secondary" className="w-fit gap-1.5 mt-1">
                    <Car className="w-3.5 h-3.5" />
                    Forfait voiture demandé : {carPlanLabels[requestedCarPlan] || requestedCarPlan}
                  </Badge>
                )}
              </CardHeader>
              <CardContent>
                <UnifiedForm onSubmit={handleSubmit} variant="contact" loading={loading}>
                  <UnifiedFormField
                    label={t("pages.becomePartner.form.name", "Nom de l'agence / de l'hôtel")}
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
                      placeholder="Nombre de chambres, localisation, services proposés..."
                      rows={5}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full"
                    />
                  </div>
                  <UnifiedSubmitButton loading={loading} fullWidth>
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
