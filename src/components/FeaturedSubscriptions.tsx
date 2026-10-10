import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { PhoneNumberInput } from "@/components/PhoneNumberInput";
import {
  Building2,
  Crown,
  FileCheck,
  Plane,
  Check,
  MessageCircle,
  ArrowRight,
  Star,
  Users,
  Briefcase,
  GraduationCap,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Heart,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { localizeRow } from "@/lib/translatableContent";

// Plans qui nécessitent une demande de contact au lieu d'un paiement direct
const REQUEST_ONLY_PLANS = ["visa", "billets", "events"];

interface SubscriptionPlanDB {
  id: string;
  plan_id: string;
  name: string;
  subtitle: string | null;
  icon: string;
  price: string;
  price_note: string | null;
  features: string[];
  popular: boolean;
  color: string;
  sort_order: number;
  is_active: boolean;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  Building2: <Building2 className="h-6 w-6" />,
  Crown: <Crown className="h-6 w-6" />,
  FileCheck: <FileCheck className="h-6 w-6" />,
  Plane: <Plane className="h-6 w-6" />,
  Users: <Users className="h-6 w-6" />,
  Briefcase: <Briefcase className="h-6 w-6" />,
  GraduationCap: <GraduationCap className="h-6 w-6" />,
  CalendarDays: <CalendarDays className="h-6 w-6" />,
  Star: <Star className="h-6 w-6" />,
  Heart: <Heart className="h-6 w-6" />,
};

// Même gabarit de carte que le carrousel « Offres du moment »
const SLIDE_CLASS =
  "flex w-[85%] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm sm:w-[calc((100%-1.5rem)/2)] lg:w-[calc((100%-3rem)/3)]";

interface DisplayPlan {
  id: string;
  plan_id: string;
  name: string;
  subtitle: string | null;
  icon: React.ReactNode;
  price: string;
  priceNote: string | null;
  features: string[];
  popular: boolean;
  color: string;
}

// Vérifie si le plan nécessite une demande de contact
const isRequestOnlyPlan = (planId: string): boolean => {
  return REQUEST_ONLY_PLANS.includes(planId);
};

const FeaturedSubscriptions = () => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const trackRef = useRef<HTMLUListElement>(null);
  const [plans, setPlans] = useState<DisplayPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequestPlan, setSelectedRequestPlan] = useState<DisplayPlan | null>(null);
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { data, error } = await supabase
          .from("subscription_plans")
          .select("*")
          .eq("is_active", true)
          .order("sort_order", { ascending: true });

        if (error) throw error;
        
        const formattedPlans: DisplayPlan[] = (data || []).map((row) => localizeRow(row as SubscriptionPlanDB, i18n.language)).map((p: SubscriptionPlanDB) => ({
          id: p.id,
          plan_id: p.plan_id,
          name: p.name,
          subtitle: p.subtitle,
          icon: ICON_MAP[p.icon] || <Building2 className="h-6 w-6" />,
          price: p.price,
          priceNote: p.price_note,
          features: p.features || [],
          popular: p.popular,
          color: p.color,
        }));
        
        setPlans(formattedPlans);
      } catch (error) {
        console.error("Error fetching subscription plans:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlans();
  }, [i18n.language]);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequestPlan) return;
    
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from("subscription_requests")
        .insert({
          plan_id: selectedRequestPlan.plan_id,
          plan_name: selectedRequestPlan.name,
          name: contactForm.name.trim(),
          email: contactForm.email.trim(),
          phone: contactForm.phone.trim(),
          company: contactForm.company.trim() || null,
          message: contactForm.message.trim() || null,
        });

      if (error) throw error;
    
      toast({
        title: t("subscriptions.requestSent", "Demande envoyée !"),
        description: t("subscriptions.contactSoon", "Notre équipe vous contactera dans les plus brefs délais."),
      });
    
      setContactForm({
        name: "",
        email: "",
        phone: "",
        company: "",
        message: ""
      });
      setSelectedRequestPlan(null);
    } catch (error: any) {
      console.error("Error submitting subscription request:", error);
      toast({
        title: t("common.error", "Erreur"),
        description: t("common.tryAgain", "Une erreur est survenue. Veuillez réessayer."),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubscribe = (plan: DisplayPlan) => {
    if (isRequestOnlyPlan(plan.plan_id)) {
      setSelectedRequestPlan(plan);
    } else {
      navigate(`/subscription-payment?planId=${plan.plan_id}`);
    }
  };

  const openWhatsApp = (planName: string) => {
    const message = encodeURIComponent(`Bonjour, je suis intéressé(e) par l'offre "${planName}" de Bossiz Conciergerie. Pouvez-vous me donner plus d'informations ?`);
    window.open(`https://wa.me/2250700000000?text=${message}`, "_blank");
  };

  const scrollBy = (direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * track.clientWidth * 0.9, behavior: "smooth" });
  };

  if (!isLoading && plans.length === 0) return null;

  return (
    <section aria-labelledby="subscriptions-title" className="w-full py-10 md:py-14">
      <div className="site-container">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 id="subscriptions-title" className="text-xl font-bold text-foreground md:text-2xl">
              {t("subscriptions.featuredTitle")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("subscriptions.featuredSubtitle")}</p>
          </div>
          <div className="hidden gap-2 md:flex">
            <Button variant="outline" size="icon" onClick={() => scrollBy(-1)} aria-label={t("common.previous")}>
              <ChevronLeft />
            </Button>
            <Button variant="outline" size="icon" onClick={() => scrollBy(1)} aria-label={t("common.next")}>
              <ChevronRight />
            </Button>
          </div>
        </div>

        <ul
          ref={trackRef}
          aria-roledescription={t("ux.offers.carousel")}
          className="-mx-4 flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-px-4 px-4 pb-2 hide-scrollbar"
        >
          {isLoading &&
            Array.from({ length: 3 }, (_, i) => (
              <li key={`s-${i}`} className={SLIDE_CLASS} aria-hidden="true">
                <div className="space-y-3 p-5">
                  <Skeleton className="h-12 w-12 rounded-xl" />
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-10 w-full rounded-full" />
                </div>
              </li>
            ))}

          {plans.map((plan) => (
            <li key={plan.id} className={cn(SLIDE_CLASS, plan.popular && "border-primary ring-1 ring-primary")}>
              <div className="flex flex-1 flex-col p-5">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${plan.color} text-white`}>
                    {plan.icon}
                  </div>
                  {plan.popular && (
                    <Badge className="border-0 bg-primary text-primary-foreground">
                      <Star className="mr-1 h-3 w-3" aria-hidden="true" />
                      {t("subscriptions.popular")}
                    </Badge>
                  )}
                </div>
                <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                {plan.subtitle && <p className="mt-1 text-sm text-muted-foreground">{plan.subtitle}</p>}
                <p className="mt-3">
                  <span className="t-price text-xl text-foreground">{plan.price}</span>
                  {plan.priceNote && <span className="ml-1 text-sm text-muted-foreground">{plan.priceNote}</span>}
                </p>
                <ul className="mt-4 space-y-2">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-auto flex flex-col gap-2 pt-5">
                  <Button className="w-full" onClick={() => handleSubscribe(plan)}>
                    {isRequestOnlyPlan(plan.plan_id) ? t("subscriptions.requestInfo") : t("subscriptions.subscribeDirect")}
                    <ArrowRight />
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => openWhatsApp(plan.name)}>
                    <MessageCircle />
                    WhatsApp
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Dialog pour les plans nécessitant une demande */}
      <Dialog open={!!selectedRequestPlan} onOpenChange={(open) => !open && setSelectedRequestPlan(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("subscriptions.subscribeTo", "Souscrire à")} {selectedRequestPlan?.name}</DialogTitle>
            <DialogDescription>
              {t("subscriptions.fillForm", "Remplissez ce formulaire et notre équipe vous contactera rapidement.")}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleContactSubmit} className="space-y-4 mt-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="feat-name">{t("subscriptions.fullName", "Nom complet")} *</Label>
                <Input
                  id="feat-name"
                  value={contactForm.name}
                  onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="feat-phone">{t("subscriptions.phone", "Téléphone")} *</Label>
                <PhoneNumberInput
                  id="feat-phone"
                  value={contactForm.phone}
                  onValueChange={(phone) => setContactForm({ ...contactForm, phone })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="feat-email">{t("subscriptions.email", "Email")} *</Label>
              <Input
                id="feat-email"
                type="email"
                value={contactForm.email}
                onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="feat-message">{t("subscriptions.messageOptional", "Message (optionnel)")}</Label>
              <Textarea
                id="feat-message"
                value={contactForm.message}
                onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                placeholder={t("subscriptions.specifyNeeds", "Précisez vos besoins...")}
                rows={3}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? t("subscriptions.sending", "Envoi en cours...") : t("subscriptions.sendRequest", "Envoyer ma demande")}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default FeaturedSubscriptions;
