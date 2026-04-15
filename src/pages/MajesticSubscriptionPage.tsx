import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Shield, Key, Check, CheckCircle, CreditCard, Lock, ArrowRight, Star, Zap, Heart, MessageCircle } from "lucide-react";
import { autoConvertAndFormat } from "@/utils/currencyConverter";
import { useAuth } from "@/hooks/useAuthMinimal";

interface MajesticPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
  icon: React.ReactNode;
  color: string;
  popular: boolean;
  trialDays: number;
}

const MajesticSubscriptionPage = () => {
  const navigate = useNavigate();
  const auth = useAuth(); // Permet l'accès sans exiger de paiement
  const [searchParams] = useSearchParams();
  const [selectedPlan, setSelectedPlan] = useState<MajesticPlan | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [processing, setProcessing] = useState(false);

  const planId = searchParams.get('planId');

  // Plans complets avec données directes (pas de dépendance BDD)
  const majesticPlans: MajesticPlan[] = [
    // Plans Majestic Club - Segment Luxe
    {
      id: 'majestic_access',
      name: 'Majestic Access',
      description: 'Accès Premium aux services exclusifs de voyage',
      price: 327323,
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
      price: 655301,
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
      price: 1311258,
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
    // Plans Business - Segment Professionnel
    {
      id: 'business_pro',
      name: 'Business Travel Pro',
      description: 'Solution complète pour voyageurs d\'affaires',
      price: 131126,
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
      id: 'corporate_elite',
      name: 'Corporate Elite',
      description: 'Gestion voyage d\'entreprise optimisée',
      price: 655301,
      features: [
        'Gestion centralisée voyages équipe',
        'Dashboard administrateur complet',
        'Politiques voyage personnalisables',
        'Reporting et analytics détaillés',
        'Support entreprise dédié 24/7',
        'Facturation centralisée simplifiée',
        'Gestion budget voyage automatique',
        'Interface API pour intégration'
      ],
      icon: <Zap className="w-6 h-6" />,
      color: 'from-indigo-400 to-indigo-600',
      popular: false,
      trialDays: 14
    },
    // Plans Personnels - Segment Familial et Social
    {
      id: 'family_explorer',
      name: 'Family Explorer',
      description: 'Voyages en famille simplifiés et économiques',
      price: 98344,
      features: [
        'Réductions familiales -20% réservations',
        'Activités enfants incluses gratuites',
        'Chambres familiales garanties',
        'Transferts familiaux confortables',
        'Assistance familiale 24/7',
        'Assurance voyage famille complète',
        'Guide activités familiales locales',
        'Menu enfants spécial voyage'
      ],
      icon: <Heart className="w-6 h-6" />,
      color: 'from-green-400 to-green-600',
      popular: false,
      trialDays: 5
    },
    // Plans Jeunes et Modernes
    {
      id: 'student_adventure',
      name: 'Student Adventure',
      description: 'Aventure voyage abordable pour étudiants',
      price: 32781,
      features: [
        'Réservations budget optimisées',
        'Réseau auberges/hostels partenaires',
        'Assurance voyage étudiant complète',
        'Guide voyage numérique interactif',
        'Community étudiante voyage',
        'Offres spéciales événements jeunes',
        'WiFi gratuit dans tous hébergements',
        'Apprentissage langues local'
      ],
      icon: <MessageCircle className="w-6 h-6" />,
      color: 'from-orange-400 to-orange-600',
      popular: false,
      trialDays: 3
    },
    {
      id: 'digital_nomad',
      name: 'Digital Nomad Pass',
      description: 'Liberté de travail et voyager sans limites',
      price: 163907,
      features: [
        'Accès espaces coworking mondiaux',
        'WiFi premium illimité partout',
        'Réservations long séjour flexibles',
        'Assistance nomade spécialisée',
        'Community nomade internationale',
        'Services VPN et sécurité inclus',
        'Visas et paperwork assistance',
        'Événements networking nomades'
      ],
      icon: <CreditCard className="w-6 h-6" />,
      color: 'from-teal-400 to-teal-600',
      popular: false,
      trialDays: 10
    }
  ];

  useEffect(() => {
    if (planId) {
      const plan = majesticPlans.find(p => p.id === planId);
      if (plan) {
        setSelectedPlan(plan);
      }
    }
  }, [planId]);

  const handleSubscribe = async (plan: MajesticPlan) => {
    console.log("handleSubscribe appelé avec le plan:", plan);
    console.log("Plan ID:", plan.id);
    console.log("Billing cycle:", billingCycle);
    
    setProcessing(true);
    
    try {
      // Simulation de paiement réussi
      console.log("Début de l'abonnement à:", plan.name);
      
      // Simuler un délai de traitement
      console.log("Attente de 2 secondes...");
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log("Délai terminé");
      
      // Créer l'abonnement localement (sans dépendance BDD)
      const subscription = {
        id: Date.now().toString(),
        planId: plan.id,
        planName: plan.name,
        price: billingCycle === 'yearly' ? plan.price * 12 * 0.8 : plan.price,
        billingCycle,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + (billingCycle === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        trialDays: plan.trialDays,
        features: plan.features
      };
      
      console.log("Abonnement créé:", subscription);
      
      // Stocker l'abonnement dans localStorage
      console.log("Sauvegarde dans localStorage...");
      localStorage.setItem('majestic_subscription', JSON.stringify(subscription));
      console.log("LocalStorage sauvegardé");
      
      // Rediriger vers la page de succès avec une petite pause pour s'assurer que localStorage est bien sauvegardé
      console.log("Navigation vers la page de succès...");
      setTimeout(() => {
        // Créer une version sérialisable du plan (sans les icônes React)
        const serializablePlan = {
          id: plan.id,
          name: plan.name,
          description: plan.description,
          price: plan.price,
          features: plan.features,
          color: plan.color,
          popular: plan.popular,
          trialDays: plan.trialDays
        };
        
        navigate('/majestic-subscription-success', { 
          state: { 
            subscription,
            plan: serializablePlan
          },
          replace: true 
        });
        console.log("Navigation lancée");
      }, 100);
      
    } catch (error) {
      console.error("Erreur lors de l'abonnement:", error);
      alert("Une erreur est survenue lors de l'abonnement. Veuillez réessayer.");
    } finally {
      // Un petit délai pour s'assurer que la navigation a bien commencé
      setTimeout(() => {
        console.log("Réinitialisation de l'état processing");
        setProcessing(false);
      }, 300);
    }
  };

  const calculatePrice = (plan: MajesticPlan) => {
    if (billingCycle === 'yearly') {
      return Math.round(plan.price * 12 * 0.8); // 20% de réduction annuelle
    }
    return plan.price;
  };

  if (selectedPlan) {
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

              <div className="text-center mb-8">
                <div className="text-5xl font-bold text-gray-900 mb-2">
                  {autoConvertAndFormat(calculatePrice(selectedPlan), 'EUR')}
                </div>
                {billingCycle === 'yearly' && (
                  <Badge className="bg-green-500 text-white mb-4">
                    Économisez 20%
                  </Badge>
                )}
                {selectedPlan.trialDays > 0 && (
                  <div className="inline-flex items-center gap-2 text-green-600 mb-4">
                    <CheckCircle className="w-5 h-5" />
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
                <div className="flex justify-between">
                  <span>Cycle:</span>
                  <span className="font-semibold">{billingCycle === 'monthly' ? 'Mensuel' : 'Annuel'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Prix:</span>
                  <span className="font-semibold">{autoConvertAndFormat(calculatePrice(selectedPlan), 'EUR')}</span>
                </div>
                {selectedPlan.trialDays > 0 && (
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
                console.log("selectedPlan:", selectedPlan);
                console.log("processing:", processing);
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

  // Plans listing page - Modern design based on reference model
  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-8 text-center">
          <h1 className="text-5xl font-bold mb-4">
            Choisissez votre plan
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Des plans flexibles pour répondre à vos besoins. Changez ou annulez à tout moment.
          </p>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="py-16 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {majesticPlans.map((plan, index) => (
              <div 
                key={plan.id} 
                className={`relative bg-white border-2 rounded-2xl p-8 transition-all duration-300 hover:shadow-2xl ${
                  plan.popular 
                    ? 'border-blue-500 shadow-xl scale-105' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Le plus populaire
                    </div>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {plan.description}
                  </p>
                  
                  <div className="mb-6">
                    <span className="text-5xl font-bold text-gray-900">
                      {autoConvertAndFormat(plan.price, 'EUR')}
                    </span>
                    <span className="text-gray-600 text-lg">/mois</span>
                  </div>
                  
                  {plan.trialDays > 0 && (
                    <div className="inline-flex items-center gap-2 text-green-600 mb-4">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">{plan.trialDays} jours d'essai gratuit</span>
                    </div>
                  )}
                </div>

                <div className="space-y-4 mb-8">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-green-600" />
                      </div>
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={() => navigate(`/majestic-subscription?planId=${plan.id}`)}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-300 ${
                    plan.popular
                      ? 'bg-blue-500 hover:bg-blue-600 text-white'
                      : 'bg-gray-900 hover:bg-gray-800 text-white'
                  }`}
                >
                  {plan.id === 'majestic_black' ? 'Devenir Black' : 'Commencer'}
                </Button>
              </div>
            ))}
          </div>

          {/* Features Comparison */}
          <div className="mt-20">
            <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
              Comparez les fonctionnalités
            </h2>
            
            <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Fonctionnalités</th>
                    <th className="text-center py-4 px-6 font-semibold text-gray-900">Access</th>
                    <th className="text-center py-4 px-6 font-semibold text-gray-900">Privé</th>
                    <th className="text-center py-4 px-6 font-semibold text-gray-900">Black</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="py-4 px-6 text-gray-700">Assistance 24/7</td>
                    <td className="text-center py-4 px-6">
                      <Check className="w-5 h-5 text-green-500 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-6">
                      <Check className="w-5 h-5 text-green-500 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-6">
                      <Check className="w-5 h-5 text-green-500 mx-auto" />
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-4 px-6 text-gray-700">Conciergerie personnelle</td>
                    <td className="text-center py-4 px-6">
                      <Check className="w-5 h-5 text-green-500 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-6">
                      <Check className="w-5 h-5 text-green-500 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-6">
                      <Check className="w-5 h-5 text-green-500 mx-auto" />
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-4 px-6 text-gray-700">Chef personnel privé</td>
                    <td className="text-center py-4 px-6">
                      <span className="text-gray-400">-</span>
                    </td>
                    <td className="text-center py-4 px-6">
                      <Check className="w-5 h-5 text-green-500 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-6">
                      <Check className="w-5 h-5 text-green-500 mx-auto" />
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-4 px-6 text-gray-700">Yacht et jet privé</td>
                    <td className="text-center py-4 px-6">
                      <span className="text-gray-400">-</span>
                    </td>
                    <td className="text-center py-4 px-6">
                      <Check className="w-5 h-5 text-green-500 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-6">
                      <Check className="w-5 h-5 text-green-500 mx-auto" />
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-4 px-6 text-gray-700">Black Card personnelle</td>
                    <td className="text-center py-4 px-6">
                      <span className="text-gray-400">-</span>
                    </td>
                    <td className="text-center py-4 px-6">
                      <span className="text-gray-400">-</span>
                    </td>
                    <td className="text-center py-4 px-6">
                      <Check className="w-5 h-5 text-green-500 mx-auto" />
                    </td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 text-gray-700">Équipe personnelle dédiée</td>
                    <td className="text-center py-4 px-6">
                      <span className="text-gray-400">-</span>
                    </td>
                    <td className="text-center py-4 px-6">
                      <span className="text-gray-400">-</span>
                    </td>
                    <td className="text-center py-4 px-6">
                      <Check className="w-5 h-5 text-green-500 mx-auto" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-20">
            <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
              Questions fréquentes
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-gray-50 p-6 rounded-xl">
                <h3 className="text-lg font-semibold mb-3 text-gray-900">
                  Puis-je changer de plan ?
                </h3>
                <p className="text-gray-600">
                  Oui, vous pouvez passer à un plan supérieur à tout moment. Les changements prennent effet immédiatement.
                </p>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-xl">
                <h3 className="text-lg font-semibold mb-3 text-gray-900">
                  Comment puis-je annuler ?
                </h3>
                <p className="text-gray-600">
                  Vous pouvez annuler votre abonnement à tout moment depuis votre tableau de bord. L'annulation prend effet à la fin de la période de facturation.
                </p>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-xl">
                <h3 className="text-lg font-semibold mb-3 text-gray-900">
                  Y a-t-il un engagement ?
                </h3>
                <p className="text-gray-600">
                  Non, tous nos plans sont sans engagement. Vous êtes libre de résilier quand vous le souhaitez.
                </p>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-xl">
                <h3 className="text-lg font-semibold mb-3 text-gray-900">
                  Quels modes de paiement sont acceptés ?
                </h3>
                <p className="text-gray-600">
                  Nous acceptons les cartes de crédit, les virements bancaires et les paiements mobiles via CinetPay.
                </p>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-20 text-center bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-12 text-white">
            <h2 className="text-3xl font-bold mb-4">
              Prêt à commencer ?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Rejoignez des milliers de membres qui font confiance à Majestic Club
            </p>
            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => navigate('/subscriptions')}
                className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3"
              >
                Comparer tous les plans
              </Button>
              <Button
                onClick={() => navigate('/majestic-subscription?planId=majestic_prive')}
                className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-3"
              >
                Essayer gratuitement
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MajesticSubscriptionPage;
