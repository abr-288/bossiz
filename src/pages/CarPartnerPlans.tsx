import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Price } from "@/components/ui/price";
import { Check, Car, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LazyImage } from "@/components/ui/lazy-image";
import bannerCars from "@/assets/banner-cars.jpg";
import { cn } from "@/lib/utils";

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

  useEffect(() => {
    const loadPlans = async () => {
      const { data, error } = await supabase
        .from("car_partner_plans")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (!error && data) {
        setPlans(data as CarPartnerPlan[]);
      }
      setLoading(false);
    };

    loadPlans();
  }, []);

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
            Listez vos véhicules sur B-Reserve, gardez le contrôle de vos tarifs et payez une commission qui baisse avec votre forfait.
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
            Annuel <Badge variant="secondary" className="ml-1 align-middle">-17%</Badge>
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
                      {price === 0 ? (
                        <div className="text-3xl font-bold">Gratuit</div>
                      ) : (
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-bold">
                            <Price amount={price} fromCurrency={plan.currency} />
                          </span>
                          <span className="text-sm text-muted-foreground">/ {yearly ? "an" : "mois"}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-sm mb-4 px-3 py-2 rounded-lg bg-muted/50">
                      <span className="text-muted-foreground">Commission</span>
                      <span className="font-semibold text-primary">{plan.commission_rate}%</span>
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

                    <Button asChild size="lg" variant={featured ? "default" : "outline"} className="w-full">
                      <Link to={`/devenir-partenaire?plan=${plan.plan_id}`}>Choisir {plan.name}</Link>
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
          pour changer de forfait.
        </p>
      </main>

      <Footer />
    </div>
  );
};

export default CarPartnerPlans;
