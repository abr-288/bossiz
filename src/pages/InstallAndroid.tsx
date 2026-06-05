import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Smartphone, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Shield, 
  Zap,
  Star,
  ArrowLeft,
  ExternalLink
} from 'lucide-react';

const InstallAndroid = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAndroid, setIsAndroid] = useState(false);
  const [isChrome, setIsChrome] = useState(false);
  const [installStatus, setInstallStatus] = useState<'checking' | 'compatible' | 'incompatible'>('checking');

  useEffect(() => {
    // Détection du navigateur et de l'appareil
    const userAgent = navigator.userAgent.toLowerCase();
    const isAndroidDevice = /android/.test(userAgent);
    const isChromeBrowser = /chrome/.test(userAgent) && !/edg/.test(userAgent);
    
    setIsAndroid(isAndroidDevice);
    setIsChrome(isChromeBrowser);
    
    if (isAndroidDevice && isChromeBrowser) {
      setInstallStatus('compatible');
    } else {
      setInstallStatus('incompatible');
    }
  }, []);

  const handleInstall = () => {
    if (installStatus === 'compatible') {
      // Installation PWA pour Android
      window.open('/install-android-pwa', '_blank');
    } else {
      // Redirection vers le Play Store
      window.open('https://play.google.com/store/apps/details?id=com.bossiz.conciergerie', '_blank');
    }
  };

  const features = [
    {
      icon: <Zap className="w-5 h-5 text-blue-600" />,
      title: "Installation Rapide",
      description: "Installation en moins de 30 secondes"
    },
    {
      icon: <Shield className="w-5 h-5 text-green-600" />,
      title: "100% Sécurisée",
      description: "Application vérifiée et sécurisée"
    },
    {
      icon: <Star className="w-5 h-5 text-yellow-600" />,
      title: "Notifications Push",
      description: "Alertes instantanées sur votre mobile"
    },
    {
      icon: <Download className="w-5 h-5 text-purple-600" />,
      title: "Hors Ligne",
      description: "Fonctionne sans connexion internet"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <div className="container mx-auto px-4 py-8">
        {/* Bouton de retour */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-8 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Button>

        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl mb-6 shadow-lg">
              <Smartphone className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Installation Android
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Installez Bossiz Conciergerie sur votre appareil Android pour accéder à tous nos services premium
            </p>
          </div>

          {/* Statut de compatibilité */}
          <div className="mb-8">
            {installStatus === 'checking' && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Vérification de la compatibilité de votre appareil...
                </AlertDescription>
              </Alert>
            )}
            
            {installStatus === 'compatible' && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  🎉 Votre appareil est parfaitement compatible ! Installation directe disponible.
                </AlertDescription>
              </Alert>
            )}
            
            {installStatus === 'incompatible' && (
              <Alert className="border-orange-200 bg-orange-50">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  Utilisez Google Chrome pour une installation optimale ou visitez le Play Store.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Carte d'installation */}
            <Card className="shadow-xl border-0">
              <CardHeader className="text-center pb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl mb-4">
                  <Download className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                  Installation Directe
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Installation PWA native pour Android
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700">Installation instantanée</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700">Mises à jour automatiques</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700">Espace de stockage optimisé</span>
                  </div>
                </div>
                
                <Button
                  onClick={handleInstall}
                  className="w-full py-4 text-lg font-semibold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-lg"
                  size="lg"
                >
                  <Download className="w-5 h-5 mr-2" />
                  {installStatus === 'compatible' ? 'Installer Maintenant' : 'Visiter Play Store'}
                </Button>
              </CardContent>
            </Card>

            {/* Carte des fonctionnalités */}
            <Card className="shadow-xl border-0">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                  Fonctionnalités Exclusives
                </CardTitle>
                <CardDescription>
                  Profitez de toutes les fonctionnalités premium
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-4 p-3 rounded-lg bg-gray-50">
                      {feature.icon}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">
                          {feature.title}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Instructions détaillées */}
          <Card className="shadow-xl border-0 mb-8">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                Instructions d'Installation
              </CardTitle>
              <CardDescription>
                Suivez ces étapes simples pour installer l'application
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Badge variant="secondary">1</Badge>
                    Installation PWA
                  </h4>
                  <ol className="space-y-2 text-sm text-gray-600">
                    <li>1. Cliquez sur "Installer Maintenant"</li>
                    <li>2. Confirmez l'installation</li>
                    <li>3. L'icône apparaîtra sur votre écran d'accueil</li>
                    <li>4. Profitez de l'application complète !</li>
                  </ol>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Badge variant="secondary">2</Badge>
                    Alternative Play Store
                  </h4>
                  <ol className="space-y-2 text-sm text-gray-600">
                    <li>1. Ouvrez Google Play Store</li>
                    <li>2. Recherchez "Bossiz Conciergerie"</li>
                    <li>3. Cliquez sur "Installer"</li>
                    <li>4. Attendez la fin de l'installation</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configuration système requise */}
          <Card className="shadow-xl border-0">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                Configuration Requise
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center p-4 rounded-lg bg-gray-50">
                  <h4 className="font-semibold text-gray-900 mb-2">Système</h4>
                  <p className="text-sm text-gray-600">Android 6.0 ou supérieur</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-gray-50">
                  <h4 className="font-semibold text-gray-900 mb-2">Espace</h4>
                  <p className="text-sm text-gray-600">50 MB disponibles</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-gray-50">
                  <h4 className="font-semibold text-gray-900 mb-2">Réseau</h4>
                  <p className="text-sm text-gray-600">4G/5G ou WiFi</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer actions */}
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              Besoin d'aide ? Contactez notre support technique
            </p>
            <Button
              variant="outline"
              onClick={() => window.open('https://wa.me/2250700000000', '_blank')}
              className="border-green-600 text-green-600 hover:bg-green-50"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Support WhatsApp
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstallAndroid;
