import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import { autoConvertAndFormat } from "@/utils/currencyConverter";
import { useAuth } from "@/hooks/useAuthMinimal";
import { 
  Building2, Crown, FileCheck, Plane, Check, MessageCircle, ArrowRight,
  Star, Shield, Clock, Users, Sparkles, Briefcase, GraduationCap,
  CalendarDays, Heart, Loader2, CreditCard, Zap, Key, Diamond, Gem,
  Banknote, Wallet, TrendingUp, Award, Gift, ChevronLeft, ChevronRight,
  Lock, CheckCircle2, Phone
} from "lucide-react";

const REQUEST_ONLY_PLANS = ["visa", "billets", "events"];

interface SubscriptionPlanDB {
  id: string;
  plan_id: string;
  name: string;
  subtitle: string | null;
  description: string;
  icon: string;
  price: string;
  price_note: string | null;
  features: string[] | null;
  popular: boolean | null;
  color: string | null;
  sort_order: number | null;
  is_active: boolean | null;
  trial_days: number | null;
}

interface MajesticPlan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  icon: React.ReactNode;
  color: string;
  popular: boolean;
  trialDays: number;
}

interface ContactForm {
  name: string;
  email: string;
  phone: string;
  company: string;
  message: string;
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
  Shield: <Shield className="h-6 w-6" />,
  Lock: <Lock className="h-6 w-6" />,
  Zap: <Zap className="h-6 w-6" />,
  Key: <Key className="h-6 w-6" />,
  Diamond: <Diamond className="h-6 w-6" />,
  Gem: <Gem className="h-6 w-6" />,
};

const UnifiedSubscriptions = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  
  const [viewMode, setViewMode] = useState<'standard' | 'majestic'>('standard');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [processing, setProcessing] = useState(false);
  
  // États pour les plans standards
  const [standardPlans, setStandardPlans] = useState<any[]>([]);
  const [isLoadingStandard, setIsLoadingStandard] = useState(true);
  const [selectedRequestPlan, setSelectedRequestPlan] = useState<any>(null);
  const [contactForm, setContactForm] = useState<ContactForm>({
    name: "",
    email: "",
    phone: "",
    company: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Plans Majestic (données directes)
  const majesticPlans: MajesticPlan[] = [
    {
      id: 'majestic_access',
      name: 'Majestic Access',
      description: 'Accès Premium aux services exclusifs de voyage',
      monthlyPrice: 49900,
      yearlyPrice: 499000,
      features: [
        'Assistance voyage 24/7 prioritaire',
        'Conciergerie personnelle voyage',
        'Réservations prioritaires vols/hôtels',
        'Accès lounges VIP aéroports',
        'Transport premium véhicules luxe',
        'Support dédié multilingue',
        'Assurance voyage premium',
        'Gestion bagages prioritaire'
      ],
      icon: <Crown className="w-6 h-6" />,
      color: 'from-yellow-400 to-yellow-600',
      popular: false,
      trialDays: 7
    },
    {
      id: 'majestic_prive',
      name: 'Majestic Privé',
      description: 'Expérience ultra-exclusive et personnalisée',
      monthlyPrice: 99900,
      yearlyPrice: 999000,
      features: [
        'Tout Majestic Access +',
        'Chef personnel privé en voyage',
        'Yacht et jet privé disponibles',
        'Événements exclusifs privés',
        'Conseiller voyage dédié 24/7',
        'Assistance mondiale illimitée',
        'Réservations restaurants étoilés',
        'Expériences sur-mesure'
      ],
      icon: <Shield className="w-6 h-6" />,
      color: 'from-purple-400 to-purple-600',
      popular: true,
      trialDays: 14
    },
    {
      id: 'majestic_black',
      name: 'Majestic Black',
      description: 'Le nec plus ultra du voyage de luxe',
      monthlyPrice: 199900,
      yearlyPrice: 1999000,
      features: [
        'Tout Majestic Privé +',
        'Black Card voyage personnelle',
        'Accès illimité partout dans le monde',
        'Équipe personnelle dédiée voyage',
        'Investissements exclusifs voyage',
        'Hébergements privés exclusifs',
        'Sécurité rapprochée VIP',
        'Partenariats privilégiés mondiaux'
      ],
      icon: <Lock className="w-6 h-6" />,
      color: 'from-gray-800 to-black',
      popular: false,
      trialDays: 30
    },
    {
      id: 'business_pro',
      name: 'Business Travel Pro',
      description: 'Solution complète pour voyageurs d\'affaires',
      monthlyPrice: 29900,
      yearlyPrice: 299000,
      features: [
        'Réservations prioritaires vols/hôtels',
        'Transferts aéroport premium',
        'Accès salons d\'aéroport partout',
        'Support business 24/7 dédié',
        'Gestion complète dépenses voyage',
        'Assurance voyage professionnelle',
        'WiFi haut débit illimité',
        'Réservations espaces meeting'
      ],
      icon: <Star className="w-6 h-6" />,
      color: 'from-blue-400 to-blue-600',
      popular: false,
      trialDays: 7
    },
    {
      id: 'family_explorer',
      name: 'Family Explorer',
      description: 'Voyages en famille simplifiés et économiques',
      monthlyPrice: 19900,
      yearlyPrice: 199000,
      features: [
        'Réductions familiales -20% réservations',
        'Activités enfants incluses gratuites',
        'Chambres familiales garanties',
        'Transferts familiaux confortables',
        'Assistance familiale 24/7',
        'Assurance voyage famille complète',
        'Guide activités familiales locales'
      ],
      icon: <Users className="w-6 h-6" />,
      color: 'from-green-400 to-green-600',
      popular: false,
      trialDays: 7
    }
  ];

  // Charger les plans standards depuis Supabase
  useEffect(() => {
    const fetchStandardPlans = async () => {
      try {
        const { data, error } = await supabase
          .from("subscription_plans")
          .select("*")
          .eq("is_active", true)
          .order("sort_order", { ascending: true });

        if (error) throw error;
        
        const transformedPlans = data?.map(plan => ({
          ...plan,
          icon: ICON_MAP[plan.icon] || <Crown className="h-6 w-6" />,
          features: plan.features || []
        })) || [];
        
        setStandardPlans(transformedPlans);
      } catch (error) {
        console.error("Error fetching standard plans:", error);
      } finally {
        setIsLoadingStandard(false);
      }
    };

    fetchStandardPlans();
  }, []);

  // Gérer le plan sélectionné depuis les paramètres URL
  useEffect(() => {
    const planId = searchParams.get('planId');
    if (planId) {
      // Chercher dans les plans standards
      const standardPlan = standardPlans.find(p => p.plan_id === planId);
      // Chercher dans les plans Majestic
      const majesticPlan = majesticPlans.find(p => p.id === planId);
      
      if (standardPlan) {
        setSelectedPlan(standardPlan);
        setViewMode('standard');
      } else if (majesticPlan) {
        setSelectedPlan(majesticPlan);
        setViewMode('majestic');
      }
    }
  }, [searchParams, standardPlans]);

  const isRequestOnlyPlan = (planId: string): boolean => REQUEST_ONLY_PLANS.includes(planId);

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

  const handleSubscribe = async (plan: any) => {
    console.log("handleSubscribe appelé avec le plan:", plan);
    console.log("View mode:", viewMode);
    
    setProcessing(true);
    
    try {
      if (viewMode === 'standard') {
        // Plan standard - rediriger vers le paiement
        if (isRequestOnlyPlan(plan.plan_id)) {
          setSelectedRequestPlan(plan);
        } else {
          navigate(`/subscription-payment?planId=${plan.plan_id}`);
        }
      } else {
        // Plan Majestic - simulation de paiement
        console.log("Début de l'abonnement à:", plan.name);
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const subscription = {
          id: Date.now().toString(),
          planId: plan.id,
          planName: plan.name,
          price: billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice,
          billingCycle,
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + (billingCycle === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          trialDays: plan.trialDays,
          features: plan.features
        };
        
        localStorage.setItem('majestic_subscription', JSON.stringify(subscription));
        
        setTimeout(() => {
          navigate('/majestic-subscription-success', { 
            state: { 
              subscription,
              plan: {
                id: plan.id,
                name: plan.name,
                description: plan.description,
                price: plan.price,
                features: plan.features,
                color: plan.color,
                popular: plan.popular,
                trialDays: plan.trialDays
              }
            },
            replace: true 
          });
        }, 100);
      }
    } catch (error: any) {
      console.error("Erreur lors de l'abonnement:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'abonnement. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const calculatePrice = (plan: MajesticPlan) => {
    if (billingCycle === 'yearly') {
      return plan.yearlyPrice; // Prix annuel déjà calculé avec réduction
    }
    return plan.monthlyPrice; // Prix mensuel
  };

  const openWhatsApp = (planName: string) => {
    const message = encodeURIComponent(`Bonjour, je suis intéressé(e) par l'offre "${planName}" de Bossiz Conciergerie. Pouvez-vous me donner plus d'informations ?`);
    window.open(`https://wa.me/2250700000000?text=${message}`, "_blank");
  };

  if (selectedPlan && !selectedRequestPlan) {
    return (
      <div className="min-h-screen bg-white text-gray-900 p-8">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate('/subscriptions')}
            className="mb-6 text-gray-600 hover:text-gray-900"
          >
            <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
            Retour aux abonnements
          </Button>

          <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 shadow-xl">
            <div className="text-center mb-8">
              <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${selectedPlan.color} flex items-center justify-center mx-auto mb-4`}>
                <div className="text-white">{selectedPlan.icon}</div>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {selectedPlan.name}
              </h1>
              <p className="text-gray-600 text-sm mb-6">
                {selectedPlan.description}
              </p>
              
              {viewMode === 'majestic' && (
                <div className="flex justify-center gap-4 mb-6">
                  <Button
                    variant={billingCycle === 'monthly' ? 'default' : 'outline'}
                    onClick={() => setBillingCycle('monthly')}
                    className={billingCycle === 'monthly' ? 'bg-gray-900 text-white' : 'border-gray-300 text-gray-700'}
                  >
                    Mensuel
                  </Button>
                  <Button
                    variant={billingCycle === 'yearly' ? 'default' : 'outline'}
                    onClick={() => setBillingCycle('yearly')}
                    className={billingCycle === 'yearly' ? 'bg-gray-900 text-white' : 'border-gray-300 text-gray-700'}
                  >
                    Annuel (-20%)
                  </Button>
                </div>
              )}

              <div className="text-center mb-8">
                <div className="text-5xl font-bold text-gray-900 mb-2">
                  {viewMode === 'majestic' 
                    ? autoConvertAndFormat(calculatePrice(selectedPlan), 'EUR')
                    : selectedPlan.price
                  }
                </div>
                {viewMode === 'majestic' && billingCycle === 'yearly' && (
                  <Badge className="bg-green-500 text-white mb-4">
                    Économisez 20%
                  </Badge>
                )}
                {viewMode === 'majestic' && selectedPlan.trialDays > 0 && (
                  <div className="inline-flex items-center gap-2 text-green-600 mb-4">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-medium">{selectedPlan.trialDays} jours d'essai gratuit</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4 text-gray-900">Ce qui est inclus :</h3>
              <ul className="space-y-3">
                {selectedPlan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-green-600" />
                    </div>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg mb-6">
              <h4 className="text-lg font-semibold mb-4 text-gray-900">Résumé de l'abonnement</h4>
              <div className="space-y-2 text-gray-700">
                <div className="flex justify-between">
                  <span>Plan:</span>
                  <span className="font-semibold">{selectedPlan.name}</span>
                </div>
                {viewMode === 'majestic' && (
                  <div className="flex justify-between">
                    <span>Cycle:</span>
                    <span className="font-semibold">{billingCycle === 'monthly' ? 'Mensuel' : 'Annuel'}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Prix:</span>
                  <span className="font-semibold">
                    {viewMode === 'majestic' 
                      ? autoConvertAndFormat(calculatePrice(selectedPlan), 'EUR')
                      : selectedPlan.price
                    }
                  </span>
                </div>
                {viewMode === 'majestic' && selectedPlan.trialDays > 0 && (
                  <div className="flex justify-between">
                    <span>Période d'essai:</span>
                    <span className="font-semibold">{selectedPlan.trialDays} jours</span>
                  </div>
                )}
              </div>
            </div>

            <Button
              onClick={() => {
                console.log("Bouton cliqué!");
                handleSubscribe(selectedPlan);
              }}
              disabled={processing}
              className={`w-full py-4 px-6 rounded-lg font-semibold transition-all duration-300 ${
                selectedPlan.id === 'majestic_black'
                  ? 'bg-gray-900 hover:bg-gray-800 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Traitement en cours...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5 mr-2" />
                  {selectedPlan.id === 'majestic_black' ? 'Devenir Black' : 'Souscrire maintenant'}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>

            <div className="mt-6 text-center text-gray-600 text-sm">
              <p>Abonnement sans engagement. Annulez à tout moment.</p>
              <p>Paiement sécurisé via CinetPay</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background">
      {/* Header avec navigation entre modes */}
      <div className="relative bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white py-28 lg:py-32 overflow-hidden">
        {/* Background animated elements */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-20 right-20 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute bottom-10 left-1/3 w-40 h-40 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-2000" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-8 text-center">
          {/* Titre principal avec animation */}
          <motion.h1 
            className="text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-black mb-8 lg:mb-12 leading-tight bg-gradient-to-r from-white via-yellow-200 to-white bg-clip-text text-transparent"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            NOS ABONNEMENTS
          </motion.h1>
          
          {/* Sous-titre amélioré */}
          <motion.p 
            className="text-2xl md:text-3xl lg:text-4xl text-gray-200 max-w-5xl mx-auto mb-12 lg:mb-16 leading-relaxed font-light"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            Découvrez nos formules premium adaptées à vos besoins
            <br />
            <span className="text-yellow-300 font-semibold text-3xl md:text-4xl lg:text-5xl">De l'essentiel au luxe absolu</span>
          </motion.p>
          
          {/* Sélecteur de mode amélioré */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex justify-center gap-6 mb-8"
          >
            <Button
              size="lg"
              variant={viewMode === 'standard' ? 'default' : 'outline'}
              onClick={() => setViewMode('standard')}
              className={`px-8 py-4 text-lg font-semibold transition-all duration-300 transform hover:scale-105 ${
                viewMode === 'standard' 
                  ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 shadow-2xl shadow-yellow-400/30 border-2 border-yellow-300' 
                  : 'border-2 border-white/30 text-white hover:bg-white/10 backdrop-blur-sm'
              }`}
            >
              Plans Standards
            </Button>
            <Button
              size="lg"
              variant={viewMode === 'majestic' ? 'default' : 'outline'}
              onClick={() => setViewMode('majestic')}
              className={`px-8 py-4 text-lg font-semibold transition-all duration-300 transform hover:scale-105 ${
                viewMode === 'majestic' 
                  ? 'bg-gradient-to-r from-purple-400 to-pink-500 text-white shadow-2xl shadow-purple-400/30 border-2 border-purple-300' 
                  : 'border-2 border-white/30 text-white hover:bg-white/10 backdrop-blur-sm'
              }`}
            >
              Club Majestic
            </Button>
          </motion.div>
          
          {/* Indicateurs visuels */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1 }}
            className="flex justify-center gap-8 text-sm text-gray-300"
          >
            <span>Pas d'engagement</span>
            <span>Annulation à tout moment</span>
            <span>Support 24/7</span>
          </motion.div>
        </div>
      </div>

      <Navbar />
      
      <main className="pt-32">
        {viewMode === 'standard' ? (
          /* Plans Standards */
          <section className="py-16 px-8">
            <div className="max-w-7xl mx-auto">
              {/* Sélecteur de cycle de facturation pour les plans standards */}
              <div className="flex justify-center mb-12">
                <div className="bg-white rounded-lg shadow-lg p-1 flex">
                  <Button
                    variant={billingCycle === 'monthly' ? 'default' : 'ghost'}
                    onClick={() => setBillingCycle('monthly')}
                    className={`px-8 py-3 ${billingCycle === 'monthly' ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    Facturation Mensuelle
                  </Button>
                  <Button
                    variant={billingCycle === 'yearly' ? 'default' : 'ghost'}
                    onClick={() => setBillingCycle('yearly')}
                    className={`px-8 py-3 ${billingCycle === 'yearly' ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    Facturation Annuelle
                    <Badge className="ml-2 bg-green-500 text-white">
                      -20%
                    </Badge>
                  </Button>
                </div>
              </div>

              {isLoadingStandard ? (
                <div className="flex justify-center items-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : standardPlans.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-muted-foreground">Aucun plan disponible actuellement.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {standardPlans.map((plan, index) => (
                    <motion.div
                      key={plan.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className={`group h-full overflow-hidden border-2 border-border/50 hover:border-secondary/50 shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer hover-lift rounded-2xl bg-gradient-card relative ${plan.popular ? 'ring-2 ring-primary' : ''}`}>
                        {plan.popular && (
                          <div className="absolute top-3 right-3 z-20">
                            <Badge className="bg-primary text-primary-foreground">
                              <Star className="w-3 h-3 mr-1" />
                              Populaire
                            </Badge>
                          </div>
                        )}
                        
                        <CardHeader className="text-center pb-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary/20 to-primary/10 flex items-center justify-center mx-auto mb-3">
                            {plan.icon}
                          </div>
                          <CardTitle className="text-xl font-bold text-foreground mb-2">
                            {plan.name}
                          </CardTitle>
                          {plan.subtitle && (
                            <p className="text-sm text-muted-foreground mb-3">
                              {plan.subtitle}
                            </p>
                          )}
                          <div className="text-3xl font-bold text-foreground mb-1">
                            {billingCycle === 'yearly' 
                              ? `${Math.round(parseInt(plan.price) * 10)} XOF/an`
                              : `${plan.price} XOF/mois`
                            }
                          </div>
                          {billingCycle === 'yearly' && (
                            <Badge className="bg-green-500 text-white mb-4">
                              Économisez 20%
                            </Badge>
                          )}
                          {plan.price_note && (
                            <p className="text-sm text-muted-foreground">
                              {plan.price_note}
                            </p>
                          )}
                        </CardHeader>
                        
                        <CardContent className="pt-0">
                          <ul className="space-y-2 mb-6">
                            {plan.features.map((feature, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm">
                                <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                <span className="text-muted-foreground">{feature}</span>
                              </li>
                            ))}
                          </ul>
                          
                          <Button
                            onClick={() => handleSubscribe(plan)}
                            className="w-full group-hover:scale-105 transition-transform"
                            size="lg"
                          >
                            {isRequestOnlyPlan(plan.plan_id) ? (
                              <>
                                <MessageCircle className="w-4 h-4 mr-2" />
                                Demander un devis
                              </>
                            ) : (
                              <>
                                <CreditCard className="w-4 h-4 mr-2" />
                                Souscrire
                              </>
                            )}
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </section>
        ) : (
          /* Plans Majestic */
          <section className="py-16 px-8">
            <div className="max-w-7xl mx-auto">
              {/* Sélecteur de cycle de facturation */}
              <div className="flex justify-center mb-12">
                <div className="bg-white rounded-lg shadow-lg p-1 flex">
                  <Button
                    variant={billingCycle === 'monthly' ? 'default' : 'ghost'}
                    onClick={() => setBillingCycle('monthly')}
                    className={`px-8 py-3 ${billingCycle === 'monthly' ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    Facturation Mensuelle
                  </Button>
                  <Button
                    variant={billingCycle === 'yearly' ? 'default' : 'ghost'}
                    onClick={() => setBillingCycle('yearly')}
                    className={`px-8 py-3 ${billingCycle === 'yearly' ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    Facturation Annuelle
                    <Badge className="ml-2 bg-green-500 text-white">
                      -20%
                    </Badge>
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {majesticPlans.map((plan, index) => (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className={`relative bg-white border-2 rounded-2xl p-8 transition-all duration-300 hover:shadow-2xl ${
                      plan.popular ? 'border-purple-500' : 'border-gray-300'
                    } ${plan.popular ? 'hover:border-purple-600' : 'hover:border-gray-400'}`}>
                      {plan.popular && (
                        <div className="absolute top-0 right-0 bg-purple-500 text-white px-3 py-1 text-xs font-bold shadow-lg z-10">
                          Le plus populaire
                        </div>
                      )}
                      
                      <CardHeader className="text-center pb-4">
                        <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${plan.color} flex items-center justify-center mx-auto mb-3`}>
                          {plan.icon}
                        </div>
                        <CardTitle className="text-xl font-bold text-gray-900 mb-2">
                          {plan.name}
                        </CardTitle>
                        <p className="text-sm text-gray-600 mb-3">
                          {plan.description}
                        </p>
                        <div className="text-3xl font-bold text-gray-900 mb-1">
                          {autoConvertAndFormat(calculatePrice(plan), 'EUR')}
                        </div>
                        {billingCycle === 'yearly' && (
                          <Badge className="bg-green-500 text-white mb-4">
                            Économisez 20%
                          </Badge>
                        )}
                        {plan.trialDays > 0 && (
                          <div className="inline-flex items-center gap-2 text-green-600 mb-4">
                            <CheckCircle2 className="w-5 h-5" />
                            <span className="font-medium">{plan.trialDays} jours d'essai gratuit</span>
                          </div>
                        )}
                      </CardHeader>
                      
                      <CardContent className="pt-0">
                        <ul className="space-y-3 mb-6">
                          {plan.features.map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-3">
                              <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <Check className="w-3 h-3 text-green-600" />
                              </div>
                              <span className="text-gray-700 text-sm">{feature}</span>
                            </li>
                          ))}
                        </ul>
                        
                        <Button
                          onClick={() => handleSubscribe(plan)}
                          disabled={processing}
                          className={`w-full py-4 px-6 rounded-lg font-semibold transition-all duration-300 ${
                            plan.id === 'majestic_black'
                              ? 'bg-gray-900 hover:bg-gray-800 text-white'
                              : 'bg-blue-500 hover:bg-blue-600 text-white'
                          }`}
                        >
                          {processing ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Traitement...
                            </>
                          ) : (
                            <>
                              <CreditCard className="w-5 h-5 mr-2" />
                              {plan.id === 'majestic_black' ? 'Devenir Black' : 'Souscrire maintenant'}
                              <ArrowRight className="w-5 h-5 ml-2" />
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />

      {/* Dialog pour les plans de contact uniquement */}
      {selectedRequestPlan && (
        <Dialog open={!!selectedRequestPlan} onOpenChange={(open) => !open && setSelectedRequestPlan(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Demande de devis - {selectedRequestPlan.name}
              </DialogTitle>
              <DialogDescription>
                Remplissez ce formulaire pour recevoir une offre personnalisée
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nom complet</Label>
                  <Input
                    id="name"
                    value={contactForm.name}
                    onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={contactForm.email}
                    onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    value={contactForm.phone}
                    onChange={(e) => setContactForm(prev => ({ ...prev, phone: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="company">Entreprise (optionnel)</Label>
                  <Input
                    id="company"
                    value={contactForm.company}
                    onChange={(e) => setContactForm(prev => ({ ...prev, company: e.target.value }))}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={contactForm.message}
                  onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                  rows={4}
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Phone className="w-4 h-4 mr-2" />
                      Envoyer la demande
                    </>
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setSelectedRequestPlan(null)}
                >
                  Annuler
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default UnifiedSubscriptions;
