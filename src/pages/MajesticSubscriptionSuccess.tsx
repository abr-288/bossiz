import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Crown, Shield, Lock, ArrowRight, Home, User, CreditCard, AlertCircle } from "lucide-react";
import { autoConvertAndFormat } from "@/utils/currencyConverter";
import { useAuth } from "@/hooks/useAuthMinimal";

interface SubscriptionData {
  id: string;
  planId: string;
  planName: string;
  price: number;
  billingCycle: string;
  startDate: string;
  endDate: string;
  status: string;
  trialDays: number;
  features: string[];
}

const MajesticSubscriptionSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [countdown, setCountdown] = useState(10);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Vérifier si l'utilisateur est authentifié
    const checkAuth = () => {
      try {
        const authenticated = auth.isAuthenticated();
        setIsAuthenticated(authenticated);
      } catch (error) {
        console.error("Erreur lors de la vérification de l'authentification:", error);
        setIsAuthenticated(false);
      }
    };

    checkAuth();

    try {
      const state = location.state as { subscription: SubscriptionData; plan: any };
      
      if (state?.subscription) {
        console.log("Données reçues du state:", state.subscription);
        setSubscription(state.subscription);
      } else {
        // Vérifier localStorage
        const storedSubscription = localStorage.getItem('majestic_subscription');
        if (storedSubscription) {
          console.log("Données récupérées du localStorage:", JSON.parse(storedSubscription));
          setSubscription(JSON.parse(storedSubscription));
        } else {
          console.error("Aucune donnée d'abonnement trouvée");
        }
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des données:", error);
      // Tenter de récupérer depuis localStorage en cas d'erreur
      const storedSubscription = localStorage.getItem('majestic_subscription');
      if (storedSubscription) {
        try {
          setSubscription(JSON.parse(storedSubscription));
        } catch (parseError) {
          console.error("Erreur lors du parsing du localStorage:", parseError);
        }
      }
    }
  }, [location.state, auth]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'majestic_access':
        return <Crown className="w-8 h-8" />;
      case 'majestic_prive':
        return <Shield className="w-8 h-8" />;
      case 'majestic_black':
        return <Lock className="w-8 h-8" />;
      default:
        return <Crown className="w-8 h-8" />;
    }
  };

  const getPlanColor = (planId: string) => {
    switch (planId) {
      case 'majestic_access':
        return 'from-yellow-400 to-yellow-600';
      case 'majestic_prive':
        return 'from-purple-400 to-purple-600';
      case 'majestic_black':
        return 'from-gray-800 to-black';
      default:
        return 'from-blue-400 to-blue-600';
    }
  };

  const handleGoToDashboard = () => {
    navigate('/majestic-dashboard');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleManageSubscription = () => {
    navigate('/majestic-club');
  };

  // Si l'utilisateur n'est pas connecté, afficher un message neutre
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white p-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-500/20 mb-6">
            <AlertCircle className="w-12 h-12 text-blue-500" />
          </div>
          <h1 className="text-3xl font-serif mb-4">Veuillez vous connecter</h1>
          <p className="text-xl text-gray-300 mb-2">
            Pour accéder à votre abonnement, vous devez d'abord vous connecter à votre compte.
          </p>
          <p className="text-gray-400 mb-8">
            Connectez-vous pour profiter de tous les avantages de votre abonnement Majestic Club.
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => navigate('/login')} className="bg-blue-600 hover:bg-blue-700">
              Se connecter
            </Button>
            <Button onClick={handleGoHome} variant="outline" className="border-gray-600 text-white hover:bg-gray-800">
              Retour à l'accueil
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white p-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4">Aucun abonnement trouvé</h1>
          <p className="text-gray-400 mb-8">Il semble qu'il n'y ait pas d'information d'abonnement disponible.</p>
          <Button onClick={handleGoHome} className="bg-blue-600 hover:bg-blue-700">
            Retour à l'accueil
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 mb-6">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          <h1 className="text-4xl font-serif mb-4">
            Félicitations! 🎉
          </h1>
          <p className="text-xl text-gray-300 mb-2">
            Votre abonnement {subscription.planName} est maintenant actif
          </p>
          <p className="text-gray-400">
            Bienvenue dans le Majestic Club - L'excellence redéfinie
          </p>
        </div>

        {/* Subscription Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-3">
                {getPlanIcon(subscription.planId)}
                Détails de l'abonnement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-400">Plan:</span>
                <span className="font-semibold text-white">{subscription.planName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Cycle:</span>
                <span className="font-semibold text-white">
                  {subscription.billingCycle === 'monthly' ? 'Mensuel' : 'Annuel'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Prix:</span>
                <span className="font-semibold text-white">
                  {autoConvertAndFormat(subscription.price, 'EUR')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Statut:</span>
                <Badge className="bg-green-500 text-white">
                  Actif
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Début:</span>
                <span className="font-semibold text-white">
                  {new Date(subscription.startDate).toLocaleDateString('fr-FR')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Fin:</span>
                <span className="font-semibold text-white">
                  {new Date(subscription.endDate).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">
                Avantages inclus
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {subscription.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Trial Information */}
        {subscription.trialDays > 0 && (
          <Card className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 backdrop-blur-sm border-blue-800 mb-8">
            <CardContent className="text-center p-6">
              <h3 className="text-xl font-semibold mb-2 text-white">
                🎁 Période d'essai active
              </h3>
              <p className="text-gray-300">
                Profitez de {subscription.trialDays} jours d'essai gratuit pour découvrir tous les avantages de votre abonnement.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Button
            onClick={handleGoToDashboard}
            className={`bg-gradient-to-r ${getPlanColor(subscription.planId)} hover:opacity-90 text-white h-14 font-semibold`}
          >
            <User className="w-5 h-5 mr-2" />
            Tableau de bord
          </Button>
          
          <Button
            onClick={handleManageSubscription}
            variant="outline"
            className="border-gray-600 text-white hover:bg-gray-800 h-14 font-semibold"
          >
            <CreditCard className="w-5 h-5 mr-2" />
            Gérer l'abonnement
          </Button>
          
          <Button
            onClick={handleGoHome}
            variant="ghost"
            className="text-gray-400 hover:text-white h-14 font-semibold"
          >
            <Home className="w-5 h-5 mr-2" />
            Accueil
          </Button>
        </div>

        {/* Countdown */}
        <div className="text-center">
          <p className="text-gray-400 text-sm">
            Redirection automatique vers le tableau de bord dans {countdown} secondes...
          </p>
        </div>

        {/* Additional Info */}
        <Card className="bg-gray-900/30 backdrop-blur-sm border-gray-800 mt-8">
          <CardContent className="text-center p-6">
            <h3 className="text-lg font-semibold mb-4 text-white">
              Que faire maintenant ?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              <div>
                <h4 className="font-semibold mb-2 text-yellow-400">🚀 Commencez immédiatement</h4>
                <p className="text-gray-300 text-sm">
                  Accédez à votre tableau de bord pour utiliser tous les services premium.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-purple-400">📞 Contactez le support</h4>
                <p className="text-gray-300 text-sm">
                  Notre équipe est disponible 24/7 pour vous assister.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MajesticSubscriptionSuccess;
