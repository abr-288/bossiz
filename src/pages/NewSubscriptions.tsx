import { useState } from "react";
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
import { autoConvertAndFormat } from "@/utils/currencyConverter";
import { useAuth } from "@/hooks/useAuthMinimal";
import { 
  Check, X, Star, Users, Clock, Shield, Zap, ArrowRight, 
  Crown, Sparkles, TrendingUp, Award, Gift, CreditCard,
  ChevronRight, CheckCircle2, MessageCircle, Phone, Lock
} from "lucide-react";

const REQUEST_ONLY_PLANS = ["visa", "billets", "events"];

interface SubscriptionPlanDB {
  id: string;
  plan_id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  currency: string;
  features: string[];
  icon: string;
  color: string;
  popular: boolean;
  trial_days: number;
  created_at: string;
  updated_at: string;
}

interface ContactForm {
  name: string;
  email: string;
  phone: string;
  company: string;
  message: string;
}

interface RequestPlan {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

export default function NewSubscriptions() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [selectedRequestPlan, setSelectedRequestPlan] = useState<RequestPlan | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contactForm, setContactForm] = useState<ContactForm>({
    name: "",
    email: "",
    phone: "",
    company: "",
    message: ""
  });

  // const { content: heroSection } = useContentManagement('hero_section');

  const openWhatsApp = (message: string) => {
    const phoneNumber = "237690000000"; // Remplacer par le numéro réel
    const whatsappMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${phoneNumber}?text=${whatsappMessage}`, '_blank');
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simuler l'envoi du formulaire
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Demande envoyée",
        description: "Nous vous contacterons dans les plus brefs délais",
      });
      
      setSelectedRequestPlan(null);
      setContactForm({
        name: "",
        email: "",
        phone: "",
        company: "",
        message: ""
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer votre demande",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPrice = (price: number) => {
    return autoConvertAndFormat(price);
  };

  const handlePlanSelect = (planId: string) => {
    if (REQUEST_ONLY_PLANS.includes(planId)) {
      // Gérer les plans sur demande
      const planData: RequestPlan = {
        id: planId,
        name: planId.charAt(0).toUpperCase() + planId.slice(1),
        description: `Plan ${planId} sur demande`,
        icon: <CreditCard className="w-6 h-6" />,
        color: "from-blue-500 to-purple-600"
      };
      setSelectedRequestPlan(planData);
    } else {
      // Rediriger vers la page de paiement
      navigate(`/majestic-subscription?planId=${planId}`);
    }
  };

  // Plans statiques complets - 8 plans au total
  const majesticPlans = [
    // Plans Majestic Club - Segment Luxe
    {
      id: "majestic_access",
      name: "Majestic Access",
      description: "Accès Premium aux services exclusifs",
      price: 327323,
      currency: "XOF",
      features: [
        "Assistance 24/7 prioritaire",
        "Conciergerie personnelle",
        "Accès aux lounges VIP",
        "Transport premium",
        "Support dédié"
      ],
      icon: <Crown className="w-6 h-6" />,
      color: "from-yellow-400 to-yellow-600",
      popular: false,
      trialDays: 7
    },
    {
      id: "majestic_prive",
      name: "Majestic Privé",
      description: "Expérience ultra-exclusive et personnalisée",
      price: 655301,
      currency: "XOF",
      features: [
        "Tout Majestic Access +",
        "Chef personnel privé",
        "Yacht et jet privé",
        "Événements exclusifs",
        "Conseiller dédié 24/7"
      ],
      icon: <Shield className="w-6 h-6" />,
      color: "from-purple-400 to-purple-600",
      popular: true,
      trialDays: 14
    },
    {
      id: "majestic_black",
      name: "Majestic Black",
      description: "Le nec plus ultra du voyage de luxe",
      price: 1311258,
      currency: "XOF",
      features: [
        "Tout Majestic Privé +",
        "Black Card personnelle",
        "Accès illimité partout",
        "Équipe personnelle dédiée",
        "Sécurité VIP rapprochée"
      ],
      icon: <Lock className="w-6 h-6" />,
      color: "from-gray-800 to-black",
      popular: false,
      trialDays: 30
    },
    // Plans Business - Segment Professionnel
    {
      id: "business_pro",
      name: "Business Travel Pro",
      description: "Solution complète pour voyageurs d'affaires",
      price: 131126,
      currency: "XOF",
      features: [
        "Réservations prioritaires vols/hôtels",
        "Transferts aéroport premium",
        "Accès salons d'aéroport partout",
        "Support business 24/7 dédié",
        "Gestion complète dépenses voyage",
        "Assurance voyage professionnelle",
        "WiFi haut débit illimité"
      ],
      icon: <Star className="w-6 h-6" />,
      color: "from-blue-400 to-blue-600",
      popular: false,
      trialDays: 7
    },
    {
      id: "corporate_elite",
      name: "Corporate Elite",
      description: "Gestion voyage d'entreprise optimisée",
      price: 655301,
      currency: "XOF",
      features: [
        "Gestion centralisée voyages équipe",
        "Dashboard administrateur complet",
        "Politiques voyage personnalisables",
        "Reporting et analytics détaillés",
        "Support entreprise dédié 24/7",
        "Facturation centralisée simplifiée",
        "Gestion budget voyage automatique"
      ],
      icon: <Zap className="w-6 h-6" />,
      color: "from-indigo-400 to-indigo-600",
      popular: false,
      trialDays: 14
    },
    // Plans Personnels - Segment Familial et Social
    {
      id: "family_explorer",
      name: "Family Explorer",
      description: "Voyages en famille simplifiés et économiques",
      price: 98344,
      currency: "XOF",
      features: [
        "Réductions familiales -20% réservations",
        "Activités enfants incluses gratuites",
        "Chambres familiales garanties",
        "Transferts familiaux confortables",
        "Assistance familiale 24/7",
        "Assurance voyage famille complète",
        "Guide activités familiales locales"
      ],
      icon: <Users className="w-6 h-6" />,
      color: "from-green-400 to-green-600",
      popular: false,
      trialDays: 5
    },
    // Plans Jeunes et Modernes
    {
      id: "student_adventure",
      name: "Student Adventure",
      description: "Aventure voyage abordable pour étudiants",
      price: 32781,
      currency: "XOF",
      features: [
        "Réservations budget optimisées",
        "Réseau auberges/hostels partenaires",
        "Assurance voyage étudiant complète",
        "Guide voyage numérique interactif",
        "Community étudiante voyage",
        "Offres spéciales événements jeunes",
        "WiFi gratuit dans tous hébergements"
      ],
      icon: <Award className="w-6 h-6" />,
      color: "from-orange-400 to-orange-600",
      popular: false,
      trialDays: 3
    },
    {
      id: "digital_nomad",
      name: "Digital Nomad Pass",
      description: "Liberté de travail et voyager sans limites",
      price: 163907,
      currency: "XOF",
      features: [
        "Accès espaces coworking mondiaux",
        "WiFi premium illimité partout",
        "Réservations long séjour flexibles",
        "Assistance nomade spécialisée",
        "Community nomade internationale",
        "Services VPN et sécurité inclus",
        "Événements networking nomades"
      ],
      icon: <TrendingUp className="w-6 h-6" />,
      color: "from-teal-400 to-teal-600",
      popular: false,
      trialDays: 10
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Navbar />
      
      <main className="pt-20">
        {/* Section Hero */}
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700">
            <div className="absolute inset-0 bg-black/20"></div>
          </div>
          
          <div className="relative z-10 container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center max-w-5xl mx-auto text-white"
            >
              <Badge className="mb-6 bg-yellow-400 text-black hover:bg-yellow-300">
                <Sparkles className="w-4 h-4 mr-2" />
                OFFRE SPÉCIALE LIMITÉE
              </Badge>
              
              <h1 className="text-5xl md:text-6xl font-bold mb-6">
                Transformez Votre Expérience de Voyage
              </h1>
              
              <p className="text-xl md:text-2xl mb-12 text-blue-100">
                Plus de 1000 clients nous font déjà confiance. Rejoignez l'élite qui accède à un monde d'opportunités illimitées.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold px-8 py-4 text-lg rounded-full shadow-2xl hover:shadow-yellow-500/50 transition-all duration-300 hover:scale-105"
                  onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  <Crown className="w-5 h-5 mr-2" />
                  Découvrir Nos Offres
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white text-white hover:bg-white hover:text-blue-600 font-bold px-8 py-4 text-lg rounded-full transition-all duration-300"
                  onClick={() => openWhatsApp("Conseil personnalisé")}
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Parler à un Conseiller
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Section Plans Unifiés */}
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {majesticPlans.map((plan, index) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className={`h-full bg-white border-2 hover:shadow-2xl transition-all duration-300 ${
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
                        {formatPrice(plan.price)}
                      </div>
                      <p className="text-xs text-gray-500">
                        par mois
                      </p>
                      <div className="mt-3 inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        {plan.trialDays} jours d'essai
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <ul className="space-y-2 mb-6">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="flex items-center text-gray-700 text-sm">
                            <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <Button
                        onClick={() => handlePlanSelect(plan.id)}
                        className={`w-full py-3 px-4 rounded-lg font-semibold bg-gradient-to-r ${plan.color} hover:opacity-90 text-white transition-all duration-300`}
                      >
                        {plan.id === 'majestic_prive' ? 'Devenir Privé' : 
                         plan.id === 'majestic_black' ? 'Devenir Black' : 'Commencer'}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Section FAQ */}
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
              Remplissez ce formulaire et notre équipe vous contactera rapidement.
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
