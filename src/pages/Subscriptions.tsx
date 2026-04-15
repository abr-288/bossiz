import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MajesticPlanCard } from "@/components/majestic-club/MajesticPlanCard";
import { 
  Building2, Crown, FileCheck, Plane, Check, MessageCircle, ArrowRight,
  Star, Shield, Clock, Users, Sparkles, Briefcase, GraduationCap,
  CalendarDays, Heart, Loader2, CreditCard, Zap, Key, Diamond, Gem,
  Banknote, Wallet, TrendingUp, Award, Gift
} from "lucide-react";

const REQUEST_ONLY_PLANS = ["visa", "billets", "events"];

interface SubscriptionPlanDB {
  id: string;
  plan_id: string;
  name: string;
  subtitle: string | null;
  icon: string;
  price: string;
  price_note: string | null;
  features: string[] | null;
  popular: boolean | null;
  color: string | null;
  sort_order: number | null;
  is_active: boolean | null;
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

const isRequestOnlyPlan = (planId: string): boolean => REQUEST_ONLY_PLANS.includes(planId);

const PLAN_COLORS = [
  { bg: "from-violet-500 to-purple-600", light: "bg-violet-50 dark:bg-violet-950/30", text: "text-violet-600 dark:text-violet-400", border: "border-violet-200 dark:border-violet-800" },
  { bg: "from-amber-500 to-orange-600", light: "bg-amber-50 dark:bg-amber-950/30", text: "text-amber-600 dark:text-amber-400", border: "border-amber-200 dark:border-amber-800" },
  { bg: "from-emerald-500 to-teal-600", light: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-200 dark:border-emerald-800" },
  { bg: "from-blue-500 to-indigo-600", light: "bg-blue-50 dark:bg-blue-950/30", text: "text-blue-600 dark:text-blue-400", border: "border-blue-200 dark:border-blue-800" },
  { bg: "from-rose-500 to-pink-600", light: "bg-rose-50 dark:bg-rose-950/30", text: "text-rose-600 dark:text-rose-400", border: "border-rose-200 dark:border-rose-800" },
  { bg: "from-cyan-500 to-sky-600", light: "bg-cyan-50 dark:bg-cyan-950/30", text: "text-cyan-600 dark:text-cyan-400", border: "border-cyan-200 dark:border-cyan-800" },
  { bg: "from-fuchsia-500 to-purple-600", light: "bg-fuchsia-50 dark:bg-fuchsia-950/30", text: "text-fuchsia-600 dark:text-fuchsia-400", border: "border-fuchsia-200 dark:border-fuchsia-800" },
  { bg: "from-lime-500 to-green-600", light: "bg-lime-50 dark:bg-lime-950/30", text: "text-lime-600 dark:text-lime-400", border: "border-lime-200 dark:border-lime-800" },
];

export default function Subscriptions() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<DisplayPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequestPlan, setSelectedRequestPlan] = useState<DisplayPlan | null>(null);
  const [contactForm, setContactForm] = useState({ name: "", email: "", phone: "", company: "", message: "" });
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
        
        const formattedPlans: DisplayPlan[] = (data || []).map((p: SubscriptionPlanDB, index: number) => ({
          id: p.id,
          plan_id: p.plan_id,
          name: p.name,
          subtitle: p.subtitle,
          icon: ICON_MAP[p.icon] || <Building2 className="h-6 w-6" />,
          price: p.price,
          priceNote: p.price_note,
          features: p.features || [],
          popular: p.popular || false,
          color: PLAN_COLORS[index % PLAN_COLORS.length].bg,
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
      toast({ title: t("subscriptions.requestSent", "Demande envoyée !"), description: t("subscriptions.contactSoon", "Notre équipe vous contactera dans les plus brefs délais.") });
      setContactForm({ name: "", email: "", phone: "", company: "", message: "" });
      setSelectedRequestPlan(null);
    } catch {
      toast({ title: t("common.error", "Erreur"), description: t("common.tryAgain", "Une erreur est survenue. Veuillez réessayer."), variant: "destructive" });
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

  const getColorSet = (index: number) => PLAN_COLORS[index % PLAN_COLORS.length];

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      
      <main className="pt-14 lg:pt-24">
        {/* Hero - Premium avec cartes de crédit */}
        <section className="relative py-16 sm:py-20 md:py-24 overflow-hidden">
          {/* Image de fond luxueuse */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url('/images/luxury-background.jpg')`
            }}
          >
            {/* Overlay sombre pour lisibilité */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/85 via-primary/75 to-primary-light/85" />
          </div>
          
          {/* Background premium avec cartes de crédit */}
          <div className="absolute inset-0">
            {/* Cartes de crédit flottantes */}
            <motion.div
              className="absolute top-10 left-10 w-32 h-20 bg-gradient-to-br from-white/10 to-white/5 rounded-lg shadow-2xl shadow-white/20 border border-white/20 backdrop-blur-sm"
              animate={{ 
                rotate: [0, 5, -5, 0],
                y: [0, -10, 0],
                opacity: [0.7, 1, 0.7]
              }}
              transition={{ 
                duration: 6, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <div className="flex items-center justify-center h-full">
                <CreditCard className="w-8 h-8 text-white/80" />
              </div>
            </motion.div>

            <motion.div
              className="absolute top-20 right-20 w-36 h-24 bg-gradient-to-br from-white/8 to-white/3 rounded-lg shadow-2xl shadow-black/30 border border-white/10 backdrop-blur-sm"
              animate={{ 
                rotate: [0, -8, 8, 0],
                y: [0, 15, 0],
                opacity: [0.6, 0.9, 0.6]
              }}
              transition={{ 
                duration: 8, 
                repeat: Infinity,
                ease: "easeInOut",
                delay: 2
              }}
            >
              <div className="flex items-center justify-center h-full">
                <CreditCard className="w-10 h-10 text-white/60" />
              </div>
            </motion.div>

            <motion.div
              className="absolute bottom-20 left-1/4 w-28 h-18 bg-gradient-to-br from-white/6 to-white/2 rounded-lg shadow-2xl shadow-white/15 border border-white/15 backdrop-blur-sm"
              animate={{ 
                rotate: [0, 10, -10, 0],
                y: [0, -20, 0],
                opacity: [0.8, 1, 0.8]
              }}
              transition={{ 
                duration: 7, 
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1
              }}
            >
              <div className="flex items-center justify-center h-full">
                <CreditCard className="w-7 h-7 text-white/90" />
              </div>
            </motion.div>

            {/* Éléments de luxe */}
            <motion.div
              className="absolute top-1/3 right-1/4 w-16 h-16 bg-white/10 rounded-full flex items-center justify-center border border-white/20 backdrop-blur-sm"
              animate={{ 
                scale: [1, 1.1, 1],
                opacity: [0.5, 0.8, 0.5]
              }}
              transition={{ 
                duration: 4, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Crown className="w-8 h-8 text-white" />
            </motion.div>

            <motion.div
              className="absolute bottom-1/3 right-1/3 w-14 h-14 bg-white/8 rounded-full flex items-center justify-center border border-white/15 backdrop-blur-sm"
              animate={{ 
                scale: [1, 0.9, 1],
                opacity: [0.6, 0.9, 0.6]
              }}
              transition={{ 
                duration: 5, 
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1.5
              }}
            >
              <Shield className="w-7 h-7 text-white" />
            </motion.div>

            <motion.div
              className="absolute top-1/4 left-1/3 w-12 h-12 bg-white/8 rounded-full flex items-center justify-center border border-white/15 backdrop-blur-sm"
              animate={{ 
                rotate: [0, 180],
                scale: [1, 1.2, 1],
                opacity: [0.4, 0.7, 0.4]
              }}
              transition={{ 
                duration: 10, 
                repeat: Infinity,
                ease: "linear",
                delay: 0.5
              }}
            >
              <Diamond className="w-6 h-6 text-white" />
            </motion.div>

            <motion.div
              className="absolute top-1/2 left-1/5 w-10 h-10 bg-white/6 rounded-full flex items-center justify-center border border-white/15 backdrop-blur-sm"
              animate={{ 
                rotate: [0, -180],
                scale: [1, 0.8, 1],
                opacity: [0.5, 0.8, 0.5]
              }}
              transition={{ 
                duration: 8, 
                repeat: Infinity,
                ease: "linear",
                delay: 1
              }}
            >
              <Gem className="w-5 h-5 text-white" />
            </motion.div>

            <motion.div
              className="absolute bottom-1/4 left-1/2 w-11 h-11 bg-white/8 rounded-full flex items-center justify-center border border-white/15 backdrop-blur-sm"
              animate={{ 
                y: [0, -15, 0],
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{ 
                duration: 6, 
                repeat: Infinity,
                ease: "easeInOut",
                delay: 2
              }}
            >
              <Award className="w-6 h-6 text-white" />
            </motion.div>

            {/* Banknotes flottants */}
            <motion.div
              className="absolute top-1/6 right-1/6 w-8 h-8 bg-white/6 rounded flex items-center justify-center backdrop-blur-sm"
              animate={{ 
                rotate: [0, 15, -15, 0],
                x: [0, 20, 0],
                opacity: [0.4, 0.7, 0.4]
              }}
              transition={{ 
                duration: 7, 
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1.2
              }}
            >
              <Banknote className="w-5 h-5 text-white" />
            </motion.div>

            <motion.div
              className="absolute bottom-1/5 right-1/5 w-9 h-9 bg-white/8 rounded flex items-center justify-center backdrop-blur-sm"
              animate={{ 
                rotate: [0, -20, 20, 0],
                x: [0, -15, 0],
                opacity: [0.5, 0.8, 0.5]
              }}
              transition={{ 
                duration: 9, 
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.8
              }}
            >
              <Wallet className="w-6 h-6 text-white" />
            </motion.div>

            <motion.div
              className="absolute top-2/3 left-1/3 w-10 h-10 bg-white/6 rounded-full flex items-center justify-center border border-white/15 backdrop-blur-sm"
              animate={{ 
                scale: [1, 1.3, 1],
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{ 
                duration: 5, 
                repeat: Infinity,
                ease: "easeInOut",
                delay: 2.5
              }}
            >
              <TrendingUp className="w-6 h-6 text-white" />
            </motion.div>

            {/* Particules */}
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white/60 rounded-full"
                style={{
                  top: `${10 + (i * 7)}%`,
                  left: `${5 + (i * 8)}%`,
                }}
                animate={{ 
                  x: [0, Math.random() * 100 - 50], 
                  y: [0, Math.random() * 100 - 50],
                  opacity: [0, 1, 0]
                }}
                transition={{ 
                  duration: 8 + Math.random() * 4, 
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: Math.random() * 2
                }}
              />
            ))}
            
            {/* Gradient overlays */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-80 h-80 bg-white/8 rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-white/5 to-transparent rounded-full blur-3xl" />
          </div>
          
          <div className="site-container relative z-10">
            <motion.div 
              className="text-center max-w-4xl mx-auto"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              {/* Badge premium */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-8"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <Crown className="w-5 h-5 text-white" />
                </motion.div>
                <span className="text-sm font-semibold text-white tracking-wide">Bossiz Conciergerie</span>
                <Sparkles className="w-4 h-4 text-white" />
              </motion.div>
              
              {/* Titre principal premium */}
              <motion.h1 
                className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-white mb-6 leading-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                Nos Abonnements
              </motion.h1>
              
              {/* Description premium */}
              <motion.p 
                className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed mb-12"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
              >
                Choisissez le forfait qui correspond à vos besoins. 
                <span className="text-white font-semibold"> De l'essentiel au premium </span>, 
                trouvez l'abonnement parfait pour vous.
              </motion.p>
              
              {/* Stats premium */}
              <motion.div
                className="flex flex-wrap justify-center gap-8 sm:gap-12 mb-12"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.6 }}
              >
                {[
                  { icon: Shield, value: "100%", label: "Garanti" },
                  { icon: Clock, value: "24/7", label: "Assistance" },
                  { icon: Users, value: "1000+", label: "Clients" },
                ].map((stat, i) => (
                  <motion.div 
                    key={i}
                    className="flex flex-col items-center gap-2"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-2xl font-bold text-white">{stat.value}</div>
                    <div className="text-sm text-white/60">{stat.label}</div>
                  </motion.div>
                ))}
              </motion.div>
              
              {/* CTA premium */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9, duration: 0.6 }}
              >
                <Button
                  size="lg"
                  className="bg-white text-primary hover:bg-white/90 font-bold px-8 py-4 text-lg rounded-full border-2 border-white/30 shadow-2xl hover:shadow-white/25 transition-all duration-300 hover:scale-105"
                  onClick={() => document.getElementById('majestic-plans')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  <CreditCard className="w-5 h-5 mr-2" />
                  Découvrir les Plans
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Majestic Club VIP Section */}
        <section className="relative py-16 sm:py-20 md:py-24 overflow-hidden">
          {/* Background premium avec images */}
          <div className="absolute inset-0">
            {/* Image de fond principale */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#0A192F]/95 via-[#1A2F4C]/90 to-[#0A192F]/95">
              {/* Cartes de crédit flottantes */}
              <motion.div
                className="absolute top-10 left-10 w-32 h-20 bg-gradient-to-br from-[#D4AF37] to-[#B8941F] rounded-lg shadow-2xl shadow-[#D4AF37]/50 border border-[#D4AF37]/30"
                animate={{ 
                  rotate: [0, 5, -5, 0],
                  y: [0, -10, 0],
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{ 
                  duration: 6, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <div className="flex items-center justify-center h-full">
                  <CreditCard className="w-8 h-8 text-white/80" />
                </div>
              </motion.div>

              <motion.div
                className="absolute top-20 right-20 w-36 h-24 bg-gradient-to-br from-[#4A5568] to-[#2D3748] rounded-lg shadow-2xl shadow-black/30 border border-gray-600/30"
                animate={{ 
                  rotate: [0, -8, 8, 0],
                  y: [0, 15, 0],
                  opacity: [0.6, 0.9, 0.6]
                }}
                transition={{ 
                  duration: 8, 
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 2
                }}
              >
                <div className="flex items-center justify-center h-full">
                  <CreditCard className="w-10 h-10 text-white/60" />
                </div>
              </motion.div>

              <motion.div
                className="absolute bottom-20 left-1/4 w-28 h-18 bg-gradient-to-br from-[#D4AF37]/80 to-[#B8941F]/60 rounded-lg shadow-2xl shadow-[#D4AF37]/40 border border-[#D4AF37]/20"
                animate={{ 
                  rotate: [0, 10, -10, 0],
                  y: [0, -20, 0],
                  opacity: [0.8, 1, 0.8]
                }}
                transition={{ 
                  duration: 7, 
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1
                }}
              >
                <div className="flex items-center justify-center h-full">
                  <CreditCard className="w-7 h-7 text-white/90" />
                </div>
              </motion.div>

              {/* Éléments de luxe flottants */}
              <motion.div
                className="absolute top-1/3 right-1/4 w-16 h-16 bg-[#D4AF37]/20 rounded-full flex items-center justify-center border border-[#D4AF37]/30"
                animate={{ 
                  scale: [1, 1.1, 1],
                  opacity: [0.5, 0.8, 0.5]
                }}
                transition={{ 
                  duration: 4, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Crown className="w-8 h-8 text-[#D4AF37]" />
              </motion.div>

              <motion.div
                className="absolute bottom-1/3 right-1/3 w-14 h-14 bg-[#D4AF37]/15 rounded-full flex items-center justify-center border border-[#D4AF37]/25"
                animate={{ 
                  scale: [1, 0.9, 1],
                  opacity: [0.6, 0.9, 0.6]
                }}
                transition={{ 
                  duration: 5, 
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1.5
                }}
              >
                <Shield className="w-7 h-7 text-[#D4AF37]" />
              </motion.div>

              {/* Éléments de luxe supplémentaires */}
              <motion.div
                className="absolute top-1/4 left-1/3 w-12 h-12 bg-[#D4AF37]/10 rounded-full flex items-center justify-center border border-[#D4AF37]/20"
                animate={{ 
                  rotate: [0, 180],
                  scale: [1, 1.2, 1],
                  opacity: [0.4, 0.7, 0.4]
                }}
                transition={{ 
                  duration: 10, 
                  repeat: Infinity,
                  ease: "linear",
                  delay: 0.5
                }}
              >
                <Diamond className="w-6 h-6 text-[#D4AF37]" />
              </motion.div>

              <motion.div
                className="absolute top-1/2 left-1/5 w-10 h-10 bg-[#D4AF37]/12 rounded-full flex items-center justify-center border border-[#D4AF37]/20"
                animate={{ 
                  rotate: [0, -180],
                  scale: [1, 0.8, 1],
                  opacity: [0.5, 0.8, 0.5]
                }}
                transition={{ 
                  duration: 8, 
                  repeat: Infinity,
                  ease: "linear",
                  delay: 1
                }}
              >
                <Gem className="w-5 h-5 text-[#D4AF37]" />
              </motion.div>

              <motion.div
                className="absolute bottom-1/4 left-1/2 w-11 h-11 bg-[#D4AF37]/10 rounded-full flex items-center justify-center border border-[#D4AF37]/20"
                animate={{ 
                  y: [0, -15, 0],
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={{ 
                  duration: 6, 
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 2
                }}
              >
                <Award className="w-6 h-6 text-[#D4AF37]" />
              </motion.div>

              {/* Banknotes flottants */}
              <motion.div
                className="absolute top-1/6 right-1/6 w-8 h-8 bg-[#D4AF37]/8 rounded flex items-center justify-center"
                animate={{ 
                  rotate: [0, 15, -15, 0],
                  x: [0, 20, 0],
                  opacity: [0.4, 0.7, 0.4]
                }}
                transition={{ 
                  duration: 7, 
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1.2
                }}
              >
                <Banknote className="w-5 h-5 text-[#D4AF37]" />
              </motion.div>

              <motion.div
                className="absolute bottom-1/5 right-1/5 w-9 h-9 bg-[#D4AF37]/10 rounded flex items-center justify-center"
                animate={{ 
                  rotate: [0, -20, 20, 0],
                  x: [0, -15, 0],
                  opacity: [0.5, 0.8, 0.5]
                }}
                transition={{ 
                  duration: 9, 
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.8
                }}
              >
                <Wallet className="w-6 h-6 text-[#D4AF37]" />
              </motion.div>

              {/* Trending Up icon */}
              <motion.div
                className="absolute top-2/3 left-1/3 w-10 h-10 bg-[#D4AF37]/12 rounded-full flex items-center justify-center border border-[#D4AF37]/20"
                animate={{ 
                  scale: [1, 1.3, 1],
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={{ 
                  duration: 5, 
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 2.5
                }}
              >
                <TrendingUp className="w-6 h-6 text-[#D4AF37]" />
              </motion.div>

              {/* Particules dorées */}
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-[#D4AF37]/60 rounded-full"
                  style={{
                    top: `${20 + (i * 10)}%`,
                    left: `${10 + (i * 12)}%`,
                  }}
                  animate={{ 
                    x: [0, Math.random() * 100 - 50], 
                    y: [0, Math.random() * 100 - 50],
                    opacity: [0, 1, 0]
                  }}
                  transition={{ 
                    duration: 8 + Math.random() * 4, 
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: Math.random() * 2
                  }}
                />
              ))}
            </div>
            
            {/* Gradient overlays premium */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-80 h-80 bg-[#D4AF37]/8 rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-[#D4AF37]/5 to-transparent rounded-full blur-3xl" />
          </div>
          
          <div className="site-container relative z-10">
            {/* Premium Banner */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-center mb-20"
            >
              {/* Badge premium */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-[#D4AF37]/20 to-[#D4AF37]/10 border border-[#D4AF37]/30 backdrop-blur-sm mb-8"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <Crown className="w-5 h-5 text-[#D4AF37]" />
                </motion.div>
                <span className="text-sm font-semibold text-[#D4AF37] tracking-wide">MAJESTIC CLUB</span>
                <Sparkles className="w-4 h-4 text-[#D4AF37]" />
              </motion.div>
              
              {/* Titre principal avec effet */}
              <div className="relative mb-8">
                <motion.h2 
                  className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#F5F5F5] via-[#D4AF37] to-[#F5F5F5] leading-tight"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                >
                  L'Excellence
                  <span className="block text-[#D4AF37] mt-2">Redéfinie</span>
                </motion.h2>
                
                {/* Lignes décoratives */}
                <motion.div
                  className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-32 h-0.5 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent"
                  initial={{ width: 0 }}
                  whileInView={{ width: "8rem" }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.8, duration: 0.8 }}
                />
              </div>
              
              {/* Description premium */}
              <motion.p 
                className="text-lg sm:text-xl text-[#F5F5F5]/80 max-w-3xl mx-auto leading-relaxed mb-12"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5, duration: 0.6 }}
              >
                Entrez dans un monde où le luxe n'a pas de limites. 
                <span className="text-[#D4AF37] font-semibold"> Le Majestic Club </span>
                vous offre des privilèges au-delà de l'imagination, 
                transformant chaque désir en réalité.
              </motion.p>
              
              {/* Stats premium */}
              <motion.div
                className="flex flex-wrap justify-center gap-8 sm:gap-12 mb-12"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.7, duration: 0.6 }}
              >
                {[
                  { icon: Shield, value: "100%", label: "Exclusivité" },
                  { icon: Clock, value: "24/7", label: "Service Premium" },
                  { icon: Star, value: "5 étoiles", label: "Qualité" },
                ].map((stat, i) => (
                  <motion.div 
                    key={i}
                    className="flex flex-col items-center gap-2"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center">
                      <stat.icon className="w-6 h-6 text-[#D4AF37]" />
                    </div>
                    <div className="text-2xl font-bold text-[#D4AF37]">{stat.value}</div>
                    <div className="text-sm text-[#F5F5F5]/60">{stat.label}</div>
                  </motion.div>
                ))}
              </motion.div>
              
              {/* CTA premium */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.9, duration: 0.6 }}
              >
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-[#D4AF37] to-[#D4AF37]/80 hover:from-[#D4AF37]/90 hover:to-[#D4AF37]/70 text-[#0A192F] font-bold px-8 py-4 text-lg rounded-full border-2 border-[#D4AF37]/30 shadow-2xl hover:shadow-[#D4AF37]/25 transition-all duration-300 hover:scale-105"
                  onClick={() => document.getElementById('majestic-plans')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  <Crown className="w-5 h-5 mr-2" />
                  Découvrir les Plans VIP
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </motion.div>
            </motion.div>

            <div id="majestic-plans" className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
              <MajesticPlanCard 
                plan={{
                  id: 'access',
                  name: 'Majestic Access',
                  description: 'Accès VIP aux services exclusifs',
                  price: '250 000 FCFA/mois',
                  features: [
                    'Accès au dashboard VIP',
                    'Services de conciergerie',
                    'Chat prioritaire 24/7',
                    'Réservations prioritaires',
                    'Support dédié'
                  ],
                  icon: <Key className="w-6 h-6" />,
                  color: 'from-amber-500 to-amber-600',
                  popular: false
                }}
                index={0}
              />
              
              <MajesticPlanCard 
                plan={{
                  id: 'access_prive',
                  name: 'Majestic Privé',
                  description: 'Accès premium avec propriétés exclusives',
                  price: '750 000 FCFA/mois',
                  features: [
                    'Tout ce qui est inclus dans Access',
                    'Propriétés off-market',
                    'Chef privé à domicile',
                    'Chauffeur personnel',
                    'Événements exclusifs',
                    'Accès anticipé'
                  ],
                  icon: <Crown className="w-6 h-6" />,
                  color: 'from-violet-500 to-purple-600',
                  popular: true
                }}
                index={1}
              />
              
              <MajesticPlanCard 
                plan={{
                  id: 'access_black',
                  name: 'Majestic Black',
                  description: 'Le summum du luxe et de l\'exclusivité',
                  price: '2 500 000 FCFA/mois',
                  features: [
                    'Tout ce qui est inclus dans Privé',
                    'Propriétés Black Card uniquement',
                    'Jet privé disponible',
                    'Yacht de luxe',
                    'Équipe de sécurité dédiée',
                    'Concierge personnel 24/7',
                    'Événements sur mesure',
                    'Accès mondial illimité'
                  ],
                  icon: <Shield className="w-6 h-6" />,
                  color: 'from-gray-800 to-black',
                  popular: false
                }}
                index={2}
              />
            </div>
          </div>
        </section>

        {/* Plans Grid - Card boxes */}
        <section className="py-8 sm:py-12 md:py-16">
          <div className="site-container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-8">
                {t("subscriptions.otherPlans", "Nos Autres Abonnements")}
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                {t("subscriptions.otherPlansDesc", "Découvrez nos formules standards adaptées à vos besoins.")}
              </p>
            </motion.div>

            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : plans.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-muted-foreground">{t("subscriptions.noPlans", "Aucun abonnement disponible.")}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                {plans.map((plan, index) => {
                  const colors = getColorSet(index);
                  return (
                    <motion.div
                      key={plan.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: index * 0.06 }}
                    >
                      <Card className={`group relative h-full overflow-hidden border ${colors.border} hover:shadow-xl transition-all duration-300 rounded-2xl ${plan.popular ? 'ring-2 ring-primary' : ''}`}>
                        {/* Popular ribbon */}
                        {plan.popular && (
                          <div className="absolute top-0 right-0 z-10">
                            <div className="bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl flex items-center gap-1">
                              <Star className="w-3 h-3 fill-current" />
                              {t("subscriptions.popular", "Populaire")}
                            </div>
                          </div>
                        )}

                        {/* Header with gradient icon */}
                        <div className={`p-4 sm:p-5 ${colors.light}`}>
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center text-white shadow-md`}>
                              {plan.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-foreground text-sm sm:text-base leading-tight truncate">{plan.name}</h3>
                              {plan.subtitle && (
                                <p className="text-[11px] text-muted-foreground truncate mt-0.5">{plan.subtitle}</p>
                              )}
                            </div>
                          </div>
                          
                          {/* Price */}
                          <div className="flex items-baseline gap-1.5">
                            <span className={`text-xl sm:text-2xl font-extrabold ${colors.text}`}>
                              {plan.price}
                            </span>
                            {plan.priceNote && (
                              <span className="text-[10px] text-muted-foreground">{plan.priceNote}</span>
                            )}
                          </div>
                        </div>

                        <CardContent className="p-4 sm:p-5 pt-0 flex flex-col flex-1">
                          {/* Features list */}
                          <ul className="space-y-2 flex-1 mt-3">
                            {plan.features.slice(0, 5).map((feature, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <div className={`flex-shrink-0 w-4 h-4 rounded-full bg-gradient-to-r ${plan.color} flex items-center justify-center mt-0.5`}>
                                  <Check className="w-2.5 h-2.5 text-white" />
                                </div>
                                <span className="text-xs text-muted-foreground leading-relaxed">{feature}</span>
                              </li>
                            ))}
                            {plan.features.length > 5 && (
                              <li className="text-xs text-muted-foreground pl-6">
                                +{plan.features.length - 5} {t("subscriptions.moreFeatures", "autres avantages")}
                              </li>
                            )}
                          </ul>

                          {/* Actions */}
                          <div className="space-y-2 mt-4 pt-4 border-t border-border/50">
                            <Button 
                              className={`w-full bg-gradient-to-r ${plan.color} hover:opacity-90 text-white border-0 h-9 text-xs sm:text-sm font-semibold rounded-xl`}
                              onClick={() => handleSubscribe(plan)}
                            >
                              {isRequestOnlyPlan(plan.plan_id) ? (
                                <>
                                  {t("subscriptions.requestInfo", "Demander un devis")}
                                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                                </>
                              ) : (
                                <>
                                  <CreditCard className="w-3.5 h-3.5 mr-1.5" />
                                  {t("subscriptions.subscribe", "Souscrire")}
                                </>
                              )}
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="w-full h-8 text-xs rounded-xl"
                              onClick={() => openWhatsApp(plan.name)}
                            >
                              <MessageCircle className="w-3 h-3 mr-1.5" />
                              WhatsApp
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-10 sm:py-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5" />
          
          <div className="site-container relative z-10">
            <Card className="border-0 bg-gradient-to-br from-primary to-primary-light text-white rounded-2xl overflow-hidden">
              <CardContent className="p-6 sm:p-10 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 mb-4">
                  <Sparkles className="w-3.5 h-3.5 text-secondary" />
                  <span className="text-xs">{t("subscriptions.needHelpBadge", "Assistance personnalisée")}</span>
                </div>
                
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2">
                  {t("subscriptions.needHelp", "Besoin d'aide pour choisir ?")}
                </h2>
                <p className="text-sm text-white/80 mb-6 max-w-lg mx-auto">
                  {t("subscriptions.contactUs", "Notre équipe est disponible pour vous conseiller.")}
                </p>
                
                <Button 
                  size="lg" 
                  onClick={() => openWhatsApp("conseil personnalisé")}
                  className="bg-white text-primary hover:bg-white/90 shadow-lg font-semibold rounded-xl"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  {t("subscriptions.contactWhatsApp", "Nous contacter sur WhatsApp")}
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      
      <Footer />

      {/* Contact Dialog */}
      <Dialog open={!!selectedRequestPlan} onOpenChange={(open) => !open && setSelectedRequestPlan(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${selectedRequestPlan?.color || ''} flex items-center justify-center text-white`}>
                {selectedRequestPlan?.icon}
              </div>
              {selectedRequestPlan?.name}
            </DialogTitle>
            <DialogDescription>
              {t("subscriptions.fillForm", "Remplissez ce formulaire et notre équipe vous contactera rapidement.")}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleContactSubmit} className="space-y-4 mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="request-name">{t("subscriptions.fullName", "Nom complet")} *</Label>
                <Input id="request-name" value={contactForm.name} onChange={(e) => setContactForm({...contactForm, name: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="request-phone">{t("subscriptions.phone", "Téléphone")} *</Label>
                <Input id="request-phone" type="tel" value={contactForm.phone} onChange={(e) => setContactForm({...contactForm, phone: e.target.value})} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="request-email">{t("subscriptions.email", "Email")} *</Label>
              <Input id="request-email" type="email" value={contactForm.email} onChange={(e) => setContactForm({...contactForm, email: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="request-company">{t("subscriptions.company", "Entreprise")}</Label>
              <Input id="request-company" value={contactForm.company} onChange={(e) => setContactForm({...contactForm, company: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="request-message">{t("subscriptions.messageOptional", "Message (optionnel)")}</Label>
              <Textarea id="request-message" value={contactForm.message} onChange={(e) => setContactForm({...contactForm, message: e.target.value})} placeholder={t("subscriptions.specifyNeeds", "Précisez vos besoins...")} rows={3} />
            </div>
            <Button 
              type="submit" 
              className={`w-full bg-gradient-to-r ${selectedRequestPlan?.color || 'from-primary to-primary'} text-white rounded-xl`}
              disabled={isSubmitting}
            >
              {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t("subscriptions.sending", "Envoi...")}</> : t("subscriptions.sendRequest", "Envoyer ma demande")}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
