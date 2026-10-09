import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/ui/price";
import { Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LazyImage } from "@/components/ui/lazy-image";
import bannerCars from "@/assets/banner-cars.jpg";
import { cn } from "@/lib/utils";
import { getEdgeFunctionErrorMessage } from "@/lib/getEdgeFunctionErrorMessage";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { CardGridSkeleton } from "@/components/ui/card-grid-skeleton";

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
  const { t } = useTranslation();
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
      if (!user) throw new Error(t("ux.carPlans.signIn"));

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
        throw subscriptionError || new Error(t("ux.carPlans.createError"));
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
        throw new Error(await getEdgeFunctionErrorMessage(error, t("ux.carPlans.initError")));
      }
      if (!data?.success || typeof data.payment_url !== "string") {
        throw new Error(data?.error || t("ux.carPlans.noLink"));
      }

      window.location.assign(data.payment_url);
    } catch (error) {
      toast.error(error instanceof Error
        ? error.message
        : t("ux.carPlans.initErrorNoPlan"));
    } finally {
      setProcessingPlanId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col pt-16">
      <Navbar />

      {/* Hero */}
      <div className="relative overflow-hidden bg-brand py-16 md:py-24">
        <LazyImage
          src={bannerCars}
          alt={t("ux.carPlans.bannerAlt")}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-brand/75 via-brand/60 to-brand/80" />
        <div className="relative z-10 container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 text-white drop-shadow-lg">
            {t("ux.carPlans.title")}
          </h1>
          <p className="text-lg text-white/95 drop-shadow-md max-w-2xl mx-auto">
            {t("ux.carPlans.intro")}
          </p>
          <p className="text-sm text-white/85 mt-3">
            {t("ux.carPlans.requiredNote")}
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
            {t("ux.carPlans.yearly")}
          </span>
        </div>

        {loading ? (
          <CardGridSkeleton count={3} imageClassName="h-24" />
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
                      {t("ux.carPlans.popular")}
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
                      <span className="text-muted-foreground">{t("ux.carPlans.payoutShare")}</span>
                      <span className="font-semibold text-primary">90%</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mb-5 px-3 py-2 rounded-lg bg-muted/50">
                      <span className="text-muted-foreground">{t("ux.carPlans.vehicles")}</span>
                      <span className="font-semibold">{plan.max_vehicles ? t("ux.misc.upTo", { count: plan.max_vehicles }) : t("ux.misc.unlimited")}</span>
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
                        ? t("ux.carPlans.preparing")
                        : agencyId
                          ? `Souscrire à ${plan.name}`
                          : t("ux.misc.requestPlan", { name: plan.name })}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <p className="text-center text-sm text-muted-foreground mt-10">
          {t("ux.partnershipData.alreadyPartner")}{" "}
          <Link to="/agency" className="text-primary font-medium hover:underline">
            {t("ux.carPlans.agencySpace")}
          </Link>{" "}
          {t("ux.carPlans.agencySpaceDesc")}
        </p>
      </main>

      <Footer />
    </div>
  );
};

export default CarPartnerPlans;
