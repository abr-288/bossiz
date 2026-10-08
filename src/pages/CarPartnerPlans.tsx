import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/ui/price";
import { Check, Car, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LazyImage } from "@/components/ui/lazy-image";
import bannerCars from "@/assets/banner-cars.jpg";
import { cn } from "@/lib/utils";
import { getEdgeFunctionErrorMessage } from "@/lib/getEdgeFunctionErrorMessage";
import { toast } from "sonner";

interface CarPartnerPlan {
  plan_id: string;
  name: string;
  tagline: string | null;
  monthly_price: number;
  yearly_price: number;
  currency: string;
  commission_rate: number;
  max_vehicles: number | null;
  featured_slots: number;
  features: string[];
}

const CarPartnerPlans = () => {
  const [plans, setPlans] = useState<CarPartnerPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [yearly, setYearly] = useState(false);
  const [agencyId, setAgencyId] = useState<string | null>(null);
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadPlans = async () => {
      const [{ data, error }, { data: { user } }] = await Promise.all([
        supabase
          .from("car_partner_plans")
          .select("*")
          .eq("is_active", true)
          .order("sort_order", { ascending: true }),
        supabase.auth.getUser(),
      ]);

      if (!error && data) {
        setPlans((data as CarPartnerPlan[]).filter(
          (plan) => Number(plan.monthly_price) > 0 && Number(plan.yearly_price) > 0,
        ));
      }
      if (user) {
        const { data: agency } = await supabase
          .from("agencies")
          .select("id, is_active")
          .eq("owner_id", user.id)
          .maybeSingle();
        if (agency?.is_active) setAgencyId(agency.id);
      }
      setLoading(false);
    };

    loadPlans();
  }, []);

  const selectPlan = async (plan: CarPartnerPlan) => {
    if (!agencyId) {
      navigate(`/devenir-partenaire?plan=${encodeURIComponent(plan.plan_id)}`);
      return;
    }

    setProcessingPlanId(plan.plan_id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Connectez-vous avec le compte de votre agence pour souscrire.");

      const { data: subscription, error: subscriptionError } = await supabase
        .from("car_partner_subscriptions")
        .insert({
          agency_id: agencyId,
          plan_id: plan.plan_id,
          billing_cycle: yearly ? "yearly" : "monthly",
        })
        .select("id")
        .single();
      if (subscriptionError || !subscription) {
        throw subscriptionError || new Error("Impossible de créer la demande de souscription.");
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("id", user.id)
        .maybeSingle();
      const { data, error } = await supabase.functions.invoke("process-payment", {
        body: {
          carPartnerSubscriptionId: subscription.id,
          paymentMethod: "jeko",
          customerInfo: {
            name: profile?.full_name || user.email?.split("@")[0] || "Partenaire",
            email: user.email || "",
            phone: profile?.phone || "",
          },
        },
      });

      if (error) {
        throw new Error(await getEdgeFunctionErrorMessage(error, "Le paiement n'a pas pu être initialisé."));
      }
      if (!data?.success || typeof data.payment_url !== "string") {
        throw new Error(data?.error || "Aucun lien de paiement n'a été créé. Aucun forfait n'a été activé.");
      }

      window.location.assign(data.payment_url);
    } catch (error) {
      toast.error(error instanceof Error
        ? error.message
        : "Le paiement n'a pas pu être initialisé. Aucun forfait n'a été activé.");
    } finally {
      setProcessingPlanId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col pt-16">
      <Navbar />

      {/* Hero */}
      <div className="relative min-h-[42vh] md:min-h-[48vh] flex items-center justify-center overflow-hidden">
        <LazyImage
          src={bannerCars}
          alt="Forfaits partenaires voiture"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/75 via-primary/55 to-background" />
        <div className="absolute inset-0" style={{ background: "radial-gradient(120% 90% at 15% 0%, hsl(var(--gold) / 0.22), transparent 55%)" }} />
        <div className="relative z-10 container mx-auto px-4 py-12 text-center">
          <div className="inline-flex items-center gap-2 text-white/90 text-sm font-medium mb-3">
            <Car className="w-4 h-4" />
            Partenaires location de voiture
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg">
            Un forfait pour chaque taille de flotte
          </h1>
          <p className="text-lg text-white/95 drop-shadow-md max-w-2xl mx-auto">
            Listez vos véhicules sur Bossiz+ et gardez le contrôle de vos tarifs. Bossiz conserve 10% et vous reverse 90% des locations encaissées en ligne via Jèko.
          </p>
          <p className="text-sm text-white/85 mt-3">
            Un abonnement payant confirmé est requis avant toute nouvelle annonce de véhicule. La publication n'est activée qu'après confirmation du paiement.
          </p>
        </div>
      </div>

      <main className="flex-1 container mx-auto px-4 py-12 md:py-16">
        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <span className={cn("text-sm font-medium", !yearly ? "text-foreground" : "text-muted-foreground")}>Mensuel</span>
          <button
            type="button"
            role="switch"
            aria-checked={yearly}
            onClick={() => setYearly((v) => !v)}
            className="relative h-7 w-12 rounded-full bg-muted transition-colors data-[on=true]:bg-primary"
            data-on={yearly}
          >
            <span
              className={cn(
                "absolute top-1 left-1 h-5 w-5 rounded-full bg-background shadow transition-transform",
                yearly && "translate-x-5"
              )}
            />
          </button>
          <span className={cn("text-sm font-medium", yearly ? "text-foreground" : "text-muted-foreground")}>
            Annuel
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
            {plans.map((plan) => {
              const featured = plan.plan_id === "pro";
              const price = yearly ? plan.yearly_price : plan.monthly_price;
              return (
                <Card
                  key={plan.plan_id}
                  className={cn(
                    "flex flex-col relative overflow-hidden",
                    featured && "border-primary shadow-lg md:-translate-y-2"
                  )}
                >
                  {featured && (
                    <div className="absolute top-0 inset-x-0 bg-primary text-primary-foreground text-center text-xs font-semibold py-1.5">
                      Le plus choisi
                    </div>
                  )}
                  <CardHeader className={cn("pb-2", featured && "pt-9")}>
                    <h2 className="text-xl font-bold">{plan.name}</h2>
                    {plan.tagline && <p className="text-sm text-muted-foreground">{plan.tagline}</p>}
                  </CardHeader>
                  <CardContent className="flex flex-col flex-1">
                    <div className="mb-5">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold">
                          <Price amount={price} fromCurrency={plan.currency} />
                        </span>
                        <span className="text-sm text-muted-foreground">/ {yearly ? "an" : "mois"}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm mb-4 px-3 py-2 rounded-lg bg-muted/50">
                      <span className="text-muted-foreground">Part reversée</span>
                      <span className="font-semibold text-primary">90%</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mb-5 px-3 py-2 rounded-lg bg-muted/50">
                      <span className="text-muted-foreground">Véhicules en ligne</span>
                      <span className="font-semibold">{plan.max_vehicles ? `Jusqu'à ${plan.max_vehicles}` : "Illimité"}</span>
                    </div>

                    <ul className="space-y-2.5 mb-6 flex-1">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      type="button"
                      size="lg"
                      variant={featured ? "default" : "outline"}
                      className="w-full"
                      disabled={processingPlanId !== null}
                      onClick={() => void selectPlan(plan)}
                    >
                      {processingPlanId === plan.plan_id
                        ? "Préparation du paiement..."
                        : agencyId
                          ? `Souscrire à ${plan.name}`
                          : `Demander le forfait ${plan.name}`}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <p className="text-center text-sm text-muted-foreground mt-10">
          Déjà partenaire ?{" "}
          <Link to="/agency" className="text-primary font-medium hover:underline">
            Accédez à votre espace agence
          </Link>{" "}
          pour gérer vos services et abonnements.
        </p>
      </main>

      <Footer />
    </div>
  );
};

export default CarPartnerPlans;
