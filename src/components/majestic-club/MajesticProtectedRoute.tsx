import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Lock } from 'lucide-react';
import { useMajesticSubscription } from '@/hooks/useMajesticSubscription';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface MajesticProtectedRouteProps {
  children: ReactNode;
  requiredFeature?: 'concierge' | 'properties' | 'chat' | 'black';
  fallback?: ReactNode;
}

export const MajesticProtectedRoute = ({ 
  children, 
  requiredFeature,
  fallback 
}: MajesticProtectedRouteProps) => {
  const { loading, hasAccess, hasFeatureAccess, getAccessLevel } = useMajesticSubscription();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !hasAccess) {
      navigate('/majestic-access');
    }
  }, [loading, hasAccess, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A192F] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37] mx-auto mb-4" />
          <p className="text-[#F5F5F5]">Vérification de votre accès...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return fallback || (
      <div className="min-h-screen bg-[#0A192F] flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-[#D4AF37]/20 bg-[#0A192F]/90 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-[#D4AF37]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-[#D4AF37]" />
            </div>
            <CardTitle className="text-[#F5F5F5]">Accès Restreint</CardTitle>
            <CardDescription className="text-[#F5F5F5]/70">
              Cette fonctionnalité nécessite un abonnement Majestic Club actif
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button 
              onClick={() => navigate('/majestic-access')}
              className="w-full bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-[#0A192F]"
            >
              Obtenir l'Accès
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (requiredFeature && !hasFeatureAccess(requiredFeature)) {
    const currentLevel = getAccessLevel();
    const featureMessages = {
      properties: 'Les propriétés exclusives nécessitent un abonnement Privé ou Black',
      black: 'Cette fonctionnalité est réservée aux membres Black Card',
      concierge: 'Les services de conciergerie nécessitent un abonnement Majestic',
      chat: 'Le chat VIP nécessite un abonnement Majestic'
    };

    return (
      <div className="min-h-screen bg-[#0A192F] flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-[#D4AF37]/20 bg-[#0A192F]/90 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-[#D4AF37]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-[#D4AF37]" />
            </div>
            <CardTitle className="text-[#F5F5F5]">Niveau d'Accès Insuffisant</CardTitle>
            <CardDescription className="text-[#F5F5F5]/70">
              {featureMessages[requiredFeature]}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-3">
            <p className="text-sm text-[#F5F5F5]/60">
              Votre niveau actuel: <span className="text-[#D4AF37] font-semibold">
                {currentLevel === 'access' ? 'Access' : 
                 currentLevel === 'access_prive' ? 'Privé' : 
                 currentLevel === 'access_black' ? 'Black' : 'Aucun'}
              </span>
            </p>
            <Button 
              onClick={() => navigate('/majestic-access')}
              className="w-full bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-[#0A192F]"
            >
              Mettre à Niveau
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};
