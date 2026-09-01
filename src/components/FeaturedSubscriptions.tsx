import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
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
  Loader2
} from "lucide-react";

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

const ITEMS_PER_PAGE = 4;

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
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(0);
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
        
        const formattedPlans: DisplayPlan[] = (data || []).map((p: SubscriptionPlanDB) => ({
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
  }, []);

  const totalPages = Math.ceil(plans.length / ITEMS_PER_PAGE);
  const currentPlans = plans.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );

  const nextPage = () => {
    if (totalPages > 0) setCurrentPage((prev) => (prev + 1) % totalPages);
  };

  const prevPage = () => {
    if (totalPages > 0) setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
  };

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

  if (isLoading) {
    return (
      <section className="py-16 md:py-20 lg:py-24 bg-gradient-to-b from-background via-muted/20 to-background relative overflow-hidden w-full">
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </section>
    );
  }

  if (plans.length === 0) return null;

  return (
    <section className="py-16 md:py-20 lg:py-24 bg-gradient-to-b from-background via-muted/20 to-background relative overflow-hidden w-full">
      {/* Background mesh gradient */}
      <div className="absolute inset-0 gradient-mesh opacity-40" />
      
      <div className="site-container relative z-10">
        <motion.div 
          className="text-center mb-10 md:mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="inline-block mb-4">
            <span className="px-4 py-2 rounded-full bg-secondary/10 text-secondary text-sm font-semibold">
              {t("subscriptions.badge", "Bossiz Conciergerie")}
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gradient mb-4 md:mb-6">
            {t("subscriptions.featuredTitle", "Nos Abonnements")}
          </h2>
          <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            {t("subscriptions.featuredSubtitle", "Découvrez nos formules adaptées à vos besoins")}
          </p>
          
          {/* Decorative underline */}
          <div className="flex justify-center gap-2 mt-6">
            <div className="w-16 h-1 bg-gradient-primary rounded-full" />
            <div className="w-8 h-1 bg-secondary/50 rounded-full" />
          </div>
        </motion.div>

        {/* Carousel Navigation */}
        <div className="relative">
          {/* Navigation Arrows */}
          <button
            onClick={prevPage}
            className="absolute left-1 sm:left-0 top-1/2 -translate-y-1/2 sm:-translate-x-2 md:-translate-x-6 z-20 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-background/90 border border-border shadow-lg flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all duration-300"
            aria-label={t('common.previous')}
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
          </button>
          
          <button
            onClick={nextPage}
            className="absolute right-1 sm:right-0 top-1/2 -translate-y-1/2 sm:translate-x-2 md:translate-x-6 z-20 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-background/90 border border-border shadow-lg flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all duration-300"
            aria-label={t('common.next')}
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
          </button>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8 px-8 sm:px-4 md:px-8"
            >
              {currentPlans.map((plan, index) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className={`group h-full overflow-hidden border-2 border-border/50 hover:border-secondary/50 shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer hover-lift rounded-2xl bg-gradient-card relative ${plan.popular ? 'ring-2 ring-primary' : ''}`}>
                    {/* Shine effect overlay */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-10">
                      <div className="absolute inset-0 animate-shimmer" />
                    </div>
                    
                    {plan.popular && (
                      <div className="absolute top-3 right-3 z-20">
                        <Badge className="bg-primary text-primary-foreground">
                          <Star className="w-3 h-3 mr-1" />
                          {t("subscriptions.popular", "Populaire")}
                        </Badge>
                      </div>
                    )}

                    <CardHeader className="pb-2">
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center text-white mb-3`}>
                        {plan.icon}
                      </div>
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      <CardDescription className="text-sm">{plan.subtitle}</CardDescription>
                      <div className="mt-2">
                        <span className="text-xl font-bold text-foreground">{plan.price}</span>
                        {plan.priceNote && (
                          <span className="text-xs text-muted-foreground ml-1">{plan.priceNote}</span>
                        )}
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0 pb-4">
                      <ul className="space-y-2">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                            <Check className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                    
                    <CardFooter className="flex flex-col gap-2 pt-0">
                      <Button 
                        className="w-full" 
                        size="sm"
                        onClick={() => handleSubscribe(plan)}
                      >
                        {isRequestOnlyPlan(plan.plan_id) ? (
                          <>
                            {t("subscriptions.requestInfo", "Demander un devis")}
                            <ArrowRight className="w-3 h-3 ml-1" />
                          </>
                        ) : (
                          <>
                            {t("subscriptions.subscribeDirect", "Souscrire")}
                            <ArrowRight className="w-3 h-3 ml-1" />
                          </>
                        )}
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="w-full"
                        onClick={() => openWhatsApp(plan.name)}
                      >
                        <MessageCircle className="w-3 h-3 mr-1" />
                        WhatsApp
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>

          {/* Pagination Dots */}
          <div className="flex justify-center gap-2 mt-8">
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentPage(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  currentPage === index 
                    ? 'bg-primary w-8' 
                    : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                }`}
                aria-label={`Page ${index + 1}`}
              />
            ))}
          </div>
        </div>
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
            <div className="grid grid-cols-2 gap-4">
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
                <Input
                  id="feat-phone"
                  type="tel"
                  value={contactForm.phone}
                  onChange={(e) => setContactForm({...contactForm, phone: e.target.value})}
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
