import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MajesticPlanCard } from "@/components/majestic-club/MajesticPlanCard";
import { useContentManagement } from "@/hooks/useContentManagement";
import { autoConvertAndFormat } from "@/utils/currencyConverter";
import { useAuth } from "@/hooks/useAuthMinimal";
import { 
  Check, X, Star, Users, Clock, Shield, Zap, ArrowRight, 
  Crown, Sparkles, TrendingUp, Award, Gift, CreditCard,
  ChevronRight, CheckCircle2, Heart, MessageCircle, Phone, Lock
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
  Building2: <Check className="h-6 w-6" />,
  Crown: <Crown className="h-6 w-6" />,
  FileCheck: <Check className="h-6 w-6" />,
  Plane: <Check className="h-6 w-6" />,
  Users: <Users className="h-6 w-6" />,
  Briefcase: <Check className="h-6 w-6" />,
  GraduationCap: <Check className="h-6 w-6" />,
  CalendarDays: <Check className="h-6 w-6" />,
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
  { bg: "from-primary to-primary-dark", light: "bg-primary-light/20 dark:bg-primary-dark/30", text: "text-primary dark:text-primary-light", border: "border-primary/30 dark:border-primary/70" },
  { bg: "from-secondary to-secondary", light: "bg-secondary/10 dark:bg-secondary/20", text: "text-secondary dark:text-secondary", border: "border-secondary/30 dark:border-secondary/70" },
  { bg: "from-primary to-primary-dark", light: "bg-primary-light/20 dark:bg-primary-dark/30", text: "text-primary dark:text-primary-light", border: "border-primary/30 dark:border-primary/70" },
  { bg: "from-primary to-primary-dark", light: "bg-primary-light/20 dark:bg-primary-dark/30", text: "text-primary dark:text-primary-light", border: "border-primary/30 dark:border-primary/70" },
];

export default function NewSubscriptions() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const auth = useAuth(); // Permet l'accès sans exiger de paiement
  const {
    pageSections,
    customizablePlans,
    testimonials,
    valuePropositions,
    globalSettings,
    getGlobalSetting
  } = useContentManagement();
  
  const [plans, setPlans] = useState<DisplayPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequestPlan, setSelectedRequestPlan] = useState<DisplayPlan | null>(null);
  const [contactForm, setContactForm] = useState({ name: "", email: "", phone: "", company: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchPlans = async () => {
      console.log("Début du chargement des plans d'abonnement...");
      try {
        const { data, error } = await supabase
          .from("subscription_plans")
          .select("*")
          .eq("is_active", true)
          .order("sort_order", { ascending: true });

        console.log("Résultat de la requête:", { data, error });
        
        if (error) {
          console.error("Erreur Supabase:", error);
          throw error;
        }
        
        console.log("Plans bruts:", data);
        
        const formattedPlans: DisplayPlan[] = (data || []).map((p: SubscriptionPlanDB, index: number) => {
          console.log(`Traitement du plan ${index}:`, p);
          return {
            id: p.id,
            plan_id: p.plan_id,
            name: p.name,
            subtitle: p.subtitle,
            icon: ICON_MAP[p.icon] || <Check className="h-6 w-6" />,
            price: p.price,
            priceNote: p.price_note,
            features: p.features || [],
            popular: p.popular || false,
            color: PLAN_COLORS[index % PLAN_COLORS.length].bg,
          };
        });
        
        console.log("Plans formatés:", formattedPlans);
        setPlans(formattedPlans);
      } catch (error) {
        console.error("Error fetching subscription plans:", error);
      } finally {
        console.log("Fin du chargement, isLoading = false");
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
      toast({ title: "Demande envoyée !", description: "Notre équipe vous contactera dans les plus brefs délais." });
      setContactForm({ name: "", email: "", phone: "", company: "", message: "" });
      setSelectedRequestPlan(null);
    } catch {
      toast({ title: "Erreur", description: "Une erreur est survenue. Veuillez réessayer.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubscribe = (plan: DisplayPlan) => {
    console.log("handleSubscribe appelé avec:", plan);
    console.log("plan.plan_id:", plan.plan_id);
    console.log("isRequestOnlyPlan:", isRequestOnlyPlan(plan.plan_id));
    
    if (isRequestOnlyPlan(plan.plan_id)) {
      console.log("Plan de type demande - ouverture du dialogue");
      setSelectedRequestPlan(plan);
    } else {
      console.log("Plan normal - navigation vers paiement");
      const paymentUrl = `/subscription-payment?planId=${plan.plan_id}&billingCycle=monthly`;
      console.log("URL de navigation:", paymentUrl);
      
      try {
        navigate(paymentUrl);
        console.log("Navigation lancée avec succès");
      } catch (error) {
        console.error("Erreur de navigation:", error);
      }
    }
  };

  const openWhatsApp = (planName: string) => {
    const message = encodeURIComponent(`Bonjour, je suis intéressé(e) par l'offre "${planName}" de Bossiz Conciergerie. Pouvez-vous me donner plus d'informations ?`);
    window.open(`https://wa.me/2250700000000?text=${message}`, "_blank");
  };

  const getColorSet = (index: number) => PLAN_COLORS[index % PLAN_COLORS.length];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Navbar />
      
      <main className="pt-20">
        {/* Section Plans Majestic - Tout en haut */}
        <section id="pricing" className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold text-black mb-4">
                Choisissez votre plan Majestic
              </h2>
              <p className="text-lg text-gray-700">
                Des plans flexibles pour répondre à vos besoins. Changez ou annulez à tout moment.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {/* Majestic Access */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
              >
                <Card className="h-full bg-white border-2 border-gray-300 hover:border-yellow-400 hover:shadow-2xl transition-all duration-300">
                  <CardHeader className="text-center pb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 flex items-center justify-center mx-auto mb-3">
                      <Crown className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-xl font-bold text-gray-900 mb-2">
                      Majestic Access
                    </CardTitle>
                    <p className="text-sm text-gray-600 mb-3">
                      Accès Premium aux services exclusifs
                    </p>
                    <div className="text-3xl font-bold text-gray-900 mb-1">
                      327 323 FCFA
                    </div>
                    <p className="text-xs text-gray-500">
                      par mois
                    </p>
                    <div className="mt-3 inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      7 jours d'essai gratuit
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ul className="space-y-2 mb-6">
                      <li className="flex items-center text-gray-700 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        Assistance 24/7 prioritaire
                      </li>
                      <li className="flex items-center text-gray-700 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        Conciergerie personnelle
                      </li>
                      <li className="flex items-center text-gray-700 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        Réservations prioritaires
                      </li>
                      <li className="flex items-center text-gray-700 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        Accès aux lounges VIP
                      </li>
                      <li className="flex items-center text-gray-700 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        Transport premium
                      </li>
                      <li className="flex items-center text-gray-700 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        Support dédié
                      </li>
                    </ul>
                    <Button
                      onClick={() => navigate('/majestic-subscription?planId=majestic_access')}
                      className="w-full py-3 px-4 rounded-lg font-semibold bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-white transition-all duration-300"
                    >
                      Commencer
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Majestic Privé */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                <Card className="h-full bg-white border-2 border-purple-500 hover:border-purple-600 hover:shadow-2xl transition-all duration-300 relative">
                  <div className="absolute top-0 right-0 bg-purple-500 text-white px-3 py-1 text-xs font-bold shadow-lg z-10">
                    Le plus populaire
                  </div>
                  <CardHeader className="text-center pb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-400 to-purple-600 flex items-center justify-center mx-auto mb-3">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-xl font-bold text-gray-900 mb-2">
                      Majestic Privé
                    </CardTitle>
                    <p className="text-sm text-gray-600 mb-3">
                      Expérience ultra-exclusive et personnalisée
                    </p>
                    <div className="text-3xl font-bold text-gray-900 mb-1">
                      655 301 FCFA
                    </div>
                    <p className="text-xs text-gray-500">
                      par mois
                    </p>
                    <div className="mt-3 inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      14 jours d'essai gratuit
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ul className="space-y-2 mb-6">
                      <li className="flex items-center text-gray-700 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        Tout Majestic Access +
                      </li>
                      <li className="flex items-center text-gray-700 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        Chef personnel privé
                      </li>
                      <li className="flex items-center text-gray-700 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        Yacht et jet privé
                      </li>
                      <li className="flex items-center text-gray-700 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        Événements exclusifs
                      </li>
                      <li className="flex items-center text-gray-700 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        Conseiller dédié 24/7
                      </li>
                      <li className="flex items-center text-gray-700 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        Assistance mondiale illimitée
                      </li>
                    </ul>
                    <Button
                      onClick={() => navigate('/majestic-subscription?planId=majestic_prive')}
                      className="w-full py-3 px-4 rounded-lg font-semibold bg-gradient-to-r from-purple-400 to-purple-600 hover:from-purple-500 hover:to-purple-700 text-white transition-all duration-300"
                    >
                      Commencer
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Majestic Black */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
              >
                <Card className="h-full bg-white border-2 border-gray-800 hover:border-black hover:shadow-2xl transition-all duration-300">
                  <CardHeader className="text-center pb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-gray-800 to-black flex items-center justify-center mx-auto mb-3">
                      <Lock className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-xl font-bold text-gray-900 mb-2">
                      Majestic Black
                    </CardTitle>
                    <p className="text-sm text-gray-600 mb-3">
                      Le nec plus ultra du luxe et du service
                    </p>
                    <div className="text-3xl font-bold text-gray-900 mb-1">
                      1 311 258 FCFA
                    </div>
                    <p className="text-xs text-gray-500">
                      par mois
                    </p>
                    <div className="mt-3 inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      30 jours d'essai gratuit
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ul className="space-y-2 mb-6">
                      <li className="flex items-center text-gray-700 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        Tout Majestic Privé +
                      </li>
                      <li className="flex items-center text-gray-700 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        Black Card personnelle
                      </li>
                      <li className="flex items-center text-gray-700 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        Accès illimité partout
                      </li>
                      <li className="flex items-center text-gray-700 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        Équipe personnelle dédiée
                      </li>
                      <li className="flex items-center text-gray-700 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        Investissements exclusifs
                      </li>
                      <li className="flex items-center text-gray-700 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        Hébergements privés
                      </li>
                    </ul>
                    <Button
                      onClick={() => navigate('/majestic-subscription?planId=majestic_black')}
                      className="w-full py-3 px-4 rounded-lg font-semibold bg-gradient-to-r from-gray-800 to-black hover:from-gray-900 hover:to-black text-white transition-all duration-300"
                    >
                      Devenir Black
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Hero Section - Très persuasif */}
        {(() => {
          const heroSection = pageSections.find(s => s.page_key === 'subscriptions' && s.section_key === 'hero');
          return heroSection?.is_visible ? (
            <section className="relative py-20 lg:py-32 overflow-hidden">
              {/* Background avec image */}
              <div 
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{
                  backgroundImage: `url('https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop')`
                }}
              >
                {/* Overlay avec couleurs dynamiques */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/90 to-primary-dark/95" />
              </div>
              
              <div className="relative z-10 container mx-auto px-4">
                <div className="max-w-4xl mx-auto text-center text-white">
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                  >
                    {/* Badge premium */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
                      <Sparkles className="w-4 h-4 text-secondary" />
                      <span className="text-sm font-semibold">{getGlobalSetting('site_name') || 'BOSSIZ CONCIERGERIE'}</span>
                      <Award className="w-4 h-4 text-secondary" />
                    </div>
                    
                    {/* Titre principal */}
                    <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
                      {heroSection?.title || 'Transformez Votre Vie'}
                      <span className="block text-3xl md:text-5xl text-secondary mt-2">
                        {heroSection?.subtitle || 'Avec Nos Services Premium'}
                      </span>
                    </h1>
                    
                    {/* Sous-titre persuasif */}
                    <p className="text-xl md:text-2xl text-primary-light mb-8 leading-relaxed">
                      {heroSection?.description || 'Plus de 1000 clients nous font déjà confiance. Rejoignez l\'élite qui accède à un monde d\'opportunités illimitées.'}
                    </p>
                    
                    {/* Preuve sociale */}
                    <div className="flex flex-wrap justify-center gap-8 mb-12">
                      {[
                        { icon: Users, value: "1000+", label: "Clients Satisfaits" },
                        { icon: Star, value: "4.9/5", label: "Note Moyenne" },
                        { icon: Shield, value: "100%", label: "Garantie Satisfaction" },
                        { icon: Clock, value: "24/7", label: "Support Premium" },
                      ].map((stat, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.1 }}
                          className="text-center"
                        >
                          <stat.icon className="w-8 h-8 mx-auto mb-2 text-secondary" />
                          <div className="text-2xl font-bold text-black">{stat.value}</div>
                          <div className="text-sm text-gray-600">{stat.label}</div>
                        </motion.div>
                      ))}
                    </div>
                    
                    {/* Boutons d'action */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <Button
                        size="lg"
                        className="bg-secondary hover:bg-secondary/90 text-primary font-bold px-8 py-4 text-lg rounded-full shadow-2xl hover:shadow-secondary/50 transition-all duration-300 hover:scale-105"
                        onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                      >
                        <Crown className="w-5 h-5 mr-2" />
                        {heroSection?.button_text || 'Découvrir Nos Offres'}
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                      
                      <Button
                        size="lg"
                        variant="outline"
                        className="border-2 border-white text-white hover:bg-white hover:text-primary font-bold px-8 py-4 text-lg rounded-full transition-all duration-300"
                        onClick={() => openWhatsApp("Conseil personnalisé")}
                      >
                        <MessageCircle className="w-5 h-5 mr-2" />
                        Parler à un Conseiller
                      </Button>
                    </div>
                  </motion.div>
                </div>
              </div>
            </section>
          ) : null;
        })()}
        
        {/* Section Unifiée - Tous Nos Plans */}
        <section id="pricing" className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl font-bold text-black mb-4">
                Choisissez Votre Plan Voyage
              </h2>
              <p className="text-xl text-gray-700 max-w-3xl mx-auto">
                Des solutions adaptées à chaque type de voyageur et chaque budget. Changez ou annulez à tout moment.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
              
              {/* Student Adventure */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
              >
                <Card className="h-full bg-white border-2 border-gray-300 hover:border-orange-400 hover:shadow-2xl transition-all duration-300">
                  <CardHeader className="text-center pb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-400 to-orange-600 flex items-center justify-center mx-auto mb-3">
                      <MessageCircle className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-xl font-bold text-gray-900 mb-2">
                      Student Adventure
                    </CardTitle>
                    <p className="text-sm text-gray-600 mb-3">
                      Aventure voyage abordable
                    </p>
                    <div className="text-3xl font-bold text-gray-900 mb-1">
                      32 781 FCFA
                    </div>
                    <p className="text-xs text-gray-500">
                      par mois
                    </p>
                    <div className="mt-3 inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      3 jours d'essai
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ul className="space-y-2 mb-6">
                      <li className="flex items-center text-gray-700 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        Réservations budget optimisées
                      </li>
                      <li className="flex items-center text-gray-700 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        Auberges/hostels partenaires
                      </li>
                      <li className="flex items-center text-gray-700 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        Assurance voyage étudiant
                      </li>
                      <li className="flex items-center text-gray-700 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        Guide voyage numérique
                      </li>
                      <li className="flex items-center text-gray-700 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        Community étudiante
                      </li>
                    </ul>
                    <Button
                      onClick={() => navigate('/majestic-subscription?planId=student_adventure')}
                      className="w-full py-3 px-4 rounded-lg font-semibold bg-gradient-to-r from-orange-400 to-orange-600 hover:from-orange-500 hover:to-orange-700 text-white transition-all duration-300"
                    >
                      Commencer
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Family Explorer */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                <Card className="h-full bg-white border-2 border-gray-300 hover:border-green-400 hover:shadow-2xl transition-all duration-300">
                  <CardHeader className="text-center pb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-400 to-green-600 flex items-center justify-center mx-auto mb-3">
                      <Heart className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-xl font-bold text-gray-900 mb-2">
                      Family Explorer
                    </CardTitle>
                    <p className="text-sm text-gray-600 mb-3">
                      Voyages en famille
                    </p>
                    <div className="text-3xl font-bold text-gray-900 mb-1">
                      98 344 FCFA
                    </div>
                    <p className="text-xs text-gray-500">
                      par mois
                    </p>
                    <div className="mt-3 inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      5 jours d'essai
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ul className="space-y-2 mb-6">
                      <li className="flex items-center text-gray-700 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        Réductions familiales -20%
                      </li>
                      <li className="flex items-center text-gray-700 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        Activités enfants gratuites
                      </li>
                      <li className="flex items-center text-gray-700 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        Chambres familiales garanties
                      </li>
                      <li className="flex items-center text-gray-700 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        Assistance familiale 24/7
                      </li>
                      <li className="flex items-center text-gray-700 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        Assurance famille complète
                      </li>
                    </ul>
                    <Button
                      onClick={() => navigate('/majestic-subscription?planId=family_explorer')}
                      className="w-full py-3 px-4 rounded-lg font-semibold bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 text-white transition-all duration-300"
                    >
                      Commencer
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Business Travel Pro */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
              >
                <Card className="h-full bg-white border-2 border-gray-300 hover:border-blue-400 hover:shadow-2xl transition-all duration-300">
                  <CardHeader className="text-center pb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center mx-auto mb-3">
                      <Star className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-xl font-bold text-gray-900 mb-2">
                      Business Travel Pro
                    </CardTitle>
                    <p className="text-sm text-gray-600 mb-3">
                      Voyageurs d'affaires
                    </p>
                    <div className="text-3xl font-bold text-gray-900 mb-1">
                      131 126 FCFA
                    </div>
                    <p className="text-xs text-gray-500">
                      par mois
                    </p>
                    <div className="mt-3 inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      7 jours d'essai
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ul className="space-y-2 mb-6">
                      <li className="flex items-center text-gray-700 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        Réservations prioritaires
                      </li>
                      <li className="flex items-center text-gray-700 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        Accès salons aéroport
                      </li>
                      <li className="flex items-center text-gray-700 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        Support business 24/7
                      </li>
                      <li className="flex items-center text-gray-700 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        Gestion dépenses voyage
                      </li>
                      <li className="flex items-center text-gray-700 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        Assurance professionnelle
                      </li>
                    </ul>
                    <Button
                      onClick={() => navigate('/majestic-subscription?planId=business_pro')}
                      className="w-full py-3 px-4 rounded-lg font-semibold bg-gradient-to-r from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700 text-white transition-all duration-300"
                    >
                      Commencer
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Digital Nomad Pass */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
              >
                <Card className="h-full bg-white border-2 border-gray-300 hover:border-teal-400 hover:shadow-2xl transition-all duration-300">
                  <CardHeader className="text-center pb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-teal-400 to-teal-600 flex items-center justify-center mx-auto mb-3">
                      <CreditCard className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-xl font-bold text-gray-900 mb-2">
                      Digital Nomad Pass
                    </CardTitle>
                    <p className="text-sm text-gray-600 mb-3">
                      Travail et voyage
                    </p>
                    <div className="text-3xl font-bold text-gray-900 mb-1">
                      163 907 FCFA
                    </div>
                    <p className="text-xs text-gray-500">
                      par mois
                    </p>
                    <div className="mt-3 inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      10 jours d'essai
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ul className="space-y-2 mb-6">
                      <li className="flex items-center text-gray-700 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        Espaces coworking mondiaux
                      </li>
                      <li className="flex items-center text-gray-700 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        WiFi premium illimité
                      </li>
                      <li className="flex items-center text-gray-700 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        Séjours longs flexibles
                      </li>
                      <li className="flex items-center text-gray-700 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        Assistance nomade spécialisée
                      </li>
                      <li className="flex items-center text-gray-700 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        Services VPN et sécurité
                      </li>
                    </ul>
                    <Button
                      onClick={() => navigate('/majestic-subscription?planId=digital_nomad')}
                      className="w-full py-3 px-4 rounded-lg font-semibold bg-gradient-to-r from-teal-400 to-teal-600 hover:from-teal-500 hover:to-teal-700 text-white transition-all duration-300"
                    >
                      Commencer
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Majestic Access */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
              >
                <Card className="h-full bg-white border-2 border-yellow-400 hover:border-yellow-500 hover:shadow-2xl transition-all duration-300 relative">
                  <div className="absolute top-0 right-0 bg-yellow-400 text-black px-3 py-1 text-xs font-bold shadow-lg z-10">
                    Premium
                  </div>
                  <CardHeader className="text-center pb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 flex items-center justify-center mx-auto mb-3">
                      <Crown className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-xl font-bold text-gray-900 mb-2">
                      Majestic Access
                    </CardTitle>
                    <p className="text-sm text-gray-600 mb-3">
                      Services exclusifs
                    </p>
                    <div className="text-3xl font-bold text-gray-900 mb-1">
                      327 323 FCFA
                    </div>
                    <p className="text-xs text-gray-500">
                      par mois
                    </p>
                    <div className="mt-3 inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      7 jours d'essai
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ul className="space-y-2 mb-6">
                      <li className="flex items-center text-gray-700 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        Assistance 24/7 prioritaire
                      </li>
                      <li className="flex items-center text-gray-700 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        Conciergerie personnelle
                      </li>
                      <li className="flex items-center text-gray-700 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        Accès lounges VIP
                      </li>
                      <li className="flex items-center text-gray-700 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        Transport premium
                      </li>
                      <li className="flex items-center text-gray-700 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        Assurance voyage premium
                      </li>
                    </ul>
                    <Button
                      onClick={() => navigate('/majestic-subscription?planId=majestic_access')}
                      className="w-full py-3 px-4 rounded-lg font-semibold bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-white transition-all duration-300"
                    >
                      Commencer
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Corporate Elite */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6 }}
              >
                <Card className="h-full bg-white border-2 border-indigo-400 hover:border-indigo-500 hover:shadow-2xl transition-all duration-300">
                  <CardHeader className="text-center pb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-400 to-indigo-600 flex items-center justify-center mx-auto mb-3">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-xl font-bold text-gray-900 mb-2">
                      Corporate Elite
                    </CardTitle>
                    <p className="text-sm text-gray-600 mb-3">
                      Gestion entreprise
                    </p>
                    <div className="text-3xl font-bold text-gray-900 mb-1">
                      655 301 FCFA
                    </div>
                    <p className="text-xs text-gray-500">
                      par mois
                    </p>
                    <div className="mt-3 inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      14 jours d'essai
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ul className="space-y-2 mb-6">
                      <li className="flex items-center text-gray-700 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        Gestion centralisée équipe
                      </li>
                      <li className="flex items-center text-gray-700 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        Dashboard administrateur
                      </li>
                      <li className="flex items-center text-gray-700 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        Reporting analytics détaillés
                      </li>
                      <li className="flex items-center text-gray-700 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        Support entreprise 24/7
                      </li>
                      <li className="flex items-center text-gray-700 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        Facturation centralisée
                      </li>
                    </ul>
                    <Button
                      onClick={() => navigate('/majestic-subscription?planId=corporate_elite')}
                      className="w-full py-3 px-4 rounded-lg font-semibold bg-gradient-to-r from-indigo-400 to-indigo-600 hover:from-indigo-500 hover:to-indigo-700 text-white transition-all duration-300"
                    >
                      Commencer
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Majestic Privé */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.7 }}
              >
                <Card className="h-full bg-white border-2 border-purple-500 hover:border-purple-600 hover:shadow-2xl transition-all duration-300 relative">
                  <div className="absolute top-0 right-0 bg-purple-500 text-white px-3 py-1 text-xs font-bold shadow-lg z-10">
                    Le plus populaire
                  </div>
                  <CardHeader className="text-center pb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-400 to-purple-600 flex items-center justify-center mx-auto mb-3">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-xl font-bold text-gray-900 mb-2">
                      Majestic Privé
                    </CardTitle>
                    <p className="text-sm text-gray-600 mb-3">
                      Ultra-exclusive
                    </p>
                    <div className="text-3xl font-bold text-gray-900 mb-1">
                      655 301 FCFA
                    </div>
                    <p className="text-xs text-gray-500">
                      par mois
                    </p>
                    <div className="mt-3 inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      14 jours d'essai
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ul className="space-y-2 mb-6">
                      <li className="flex items-center text-gray-700 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        Tout Majestic Access +
                      </li>
                      <li className="flex items-center text-gray-700 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        Chef personnel privé
                      </li>
                      <li className="flex items-center text-gray-700 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        Yacht et jet privé
                      </li>
                      <li className="flex items-center text-gray-700 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        Événements exclusifs
                      </li>
                      <li className="flex items-center text-gray-700 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        Conseiller dédié 24/7
                      </li>
                    </ul>
                    <Button
                      onClick={() => navigate('/majestic-subscription?planId=majestic_prive')}
                      className="w-full py-3 px-4 rounded-lg font-semibold bg-gradient-to-r from-purple-400 to-purple-600 hover:from-purple-500 hover:to-purple-700 text-white transition-all duration-300"
                    >
                      Devenir Privé
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Majestic Black */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.8 }}
              >
                <Card className="h-full bg-white border-2 border-gray-800 hover:border-black hover:shadow-2xl transition-all duration-300">
                  <CardHeader className="text-center pb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-gray-800 to-black flex items-center justify-center mx-auto mb-3">
                      <Lock className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-xl font-bold text-gray-900 mb-2">
                      Majestic Black
                    </CardTitle>
                    <p className="text-sm text-gray-600 mb-3">
                      Nec plus ultra
                    </p>
                    <div className="text-3xl font-bold text-gray-900 mb-1">
                      1 311 258 FCFA
                    </div>
                    <p className="text-xs text-gray-500">
                      par mois
                    </p>
                    <div className="mt-3 inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      30 jours d'essai
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ul className="space-y-2 mb-6">
                      <li className="flex items-center text-gray-700 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        Tout Majestic Privé +
                      </li>
                      <li className="flex items-center text-gray-700 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        Black Card personnelle
                      </li>
                      <li className="flex items-center text-gray-700 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        Accès illimité partout
                      </li>
                      <li className="flex items-center text-gray-700 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        Équipe personnelle dédiée
                      </li>
                      <li className="flex items-center text-gray-700 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        Sécurité VIP rapprochée
                      </li>
                    </ul>
                    <Button
                      onClick={() => navigate('/majestic-subscription?planId=majestic_black')}
                      className="w-full py-3 px-4 rounded-lg font-semibold bg-gradient-to-r from-gray-800 to-black hover:from-gray-900 hover:to-black text-white transition-all duration-300"
                    >
                      Devenir Black
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Section CTA Final - Design moderne */}
        <section className="relative py-24 overflow-hidden">
          {/* Background moderne avec gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
            {/* Pattern subtile */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0 bg-repeat" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
              }}></div>
            </div>
            
            {/* Effet de brillance */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
          </div>
          
          <div className="relative z-10 container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center max-w-5xl mx-auto"
            >
              {/* Badge */}
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-sm font-semibold mb-6 shadow-lg">
                <Sparkles className="w-4 h-4 mr-2" />
                Offre Spéciale Limitée
              </div>
              
              {/* Titre principal */}
              <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
                Prêt à <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">Transformer</span> Votre Vie ?
              </h2>
              
              {/* Sous-titre */}
              <p className="text-xl md:text-2xl text-blue-200 mb-12 max-w-3xl mx-auto leading-relaxed">
                Découvrez un monde d'opportunités exclusives et transformez votre expérience de voyage dès aujourd'hui.
              </p>
              
              {/* Boutons d'action */}
              <div className="flex flex-col sm:flex-row gap-6 justify-center mb-10">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-slate-900 font-bold px-10 py-5 text-xl rounded-2xl shadow-2xl hover:shadow-yellow-500/25 transition-all duration-300 hover:scale-105 border-2 border-yellow-400/50"
                  onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  <Crown className="w-6 h-6 mr-3" />
                  Choisir Mon Plan
                  <ArrowRight className="w-6 h-6 ml-3" />
                </Button>
                
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white/30 text-white hover:bg-white hover:text-slate-900 font-bold px-10 py-5 text-xl rounded-2xl transition-all duration-300 hover:scale-105 backdrop-blur-sm"
                  onClick={() => openWhatsApp("Conseil personnalisé")}
                >
                  <MessageCircle className="w-6 h-6 mr-3" />
                  Parler à un Conseiller
                </Button>
              </div>
              
              {/* Garantie et confiance */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-blue-200">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  <span className="font-medium">Garantie 30 jours</span>
                </div>
                <div className="hidden sm:block w-px h-5 bg-blue-400/30"></div>
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-400" />
                  <span className="font-medium">Paiement sécurisé</span>
                </div>
                <div className="hidden sm:block w-px h-5 bg-blue-400/30"></div>
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-400" />
                  <span className="font-medium">Service premium</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* FAQ Section - Avant le footer */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
              Questions fréquentes
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-semibold mb-3 text-gray-900">
                  Puis-je changer de plan ?
                </h3>
                <p className="text-gray-600">
                  Oui, vous pouvez passer à un plan supérieur à tout moment. Les changements prennent effet immédiatement.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-semibold mb-3 text-gray-900">
                  Comment puis-je annuler ?
                </h3>
                <p className="text-gray-600">
                  Vous pouvez annuler votre abonnement à tout moment depuis votre tableau de bord. L'annulation prend effet à la fin de la période de facturation.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-semibold mb-3 text-gray-900">
                  Y a-t-il un engagement ?
                </h3>
                <p className="text-gray-600">
                  Non, tous nos plans sont sans engagement. Vous êtes libre de résilier quand vous le souhaitez.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-semibold mb-3 text-gray-900">
                  Quels modes de paiement sont acceptés ?
                </h3>
                <p className="text-gray-600">
                  Nous acceptons les cartes de crédit, les virements bancaires et les paiements mobiles via CinetPay.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />

      {/* Dialog pour les plans sur demande */}
      <Dialog open={!!selectedRequestPlan} onOpenChange={(open) => !open && setSelectedRequestPlan(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${selectedRequestPlan?.color || 'from-primary to-primary-dark'} flex items-center justify-center text-white`}>
                {selectedRequestPlan?.icon}
              </div>
              {selectedRequestPlan?.name}
            </DialogTitle>
            <DialogDescription>
              Remplissez ce formulaire et Notre équipe vous contactera rapidement.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleContactSubmit} className="space-y-4 mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="request-name">Nom complet *</Label>
                <Input id="request-name" value={contactForm.name} onChange={(e) => setContactForm({...contactForm, name: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="request-phone">Téléphone *</Label>
                <Input id="request-phone" type="tel" value={contactForm.phone} onChange={(e) => setContactForm({...contactForm, phone: e.target.value})} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="request-email">Email *</Label>
              <Input id="request-email" type="email" value={contactForm.email} onChange={(e) => setContactForm({...contactForm, email: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="request-company">Entreprise</Label>
              <Input id="request-company" value={contactForm.company} onChange={(e) => setContactForm({...contactForm, company: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="request-message">Message (optionnel)</Label>
              <Textarea id="request-message" value={contactForm.message} onChange={(e) => setContactForm({...contactForm, message: e.target.value})} placeholder="Précisez vos besoins..." rows={3} />
            </div>
            <Button 
              type="submit" 
              className={`w-full bg-gradient-to-r ${selectedRequestPlan?.color || 'from-primary to-primary-dark'} text-white rounded-lg`}
              disabled={isSubmitting}
            >
              {isSubmitting ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />Envoi...</> : "Envoyer ma demande"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
