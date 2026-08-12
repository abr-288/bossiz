import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { usePWA } from '@/hooks/usePWA';
import {
  Smartphone,
  Download,
  CheckCircle2,
  AlertCircle,
  Shield,
  Zap,
  Star,
  ArrowLeft,
  ExternalLink,
  Settings
} from 'lucide-react';

const APK_DOWNLOAD_URL = '/downloads/bossiz.apk';

const InstallAndroid = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isInstallable, isInstalled, install } = usePWA();
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

  const handleInstall = async () => {
    if (isInstallable) {
      // Déclenche le vrai prompt d'installation PWA natif du navigateur
      await install();
    } else {
      // Pas de prompt disponible (déjà installée, ou navigateur non compatible) :
      // on renvoie vers les instructions manuelles détaillées.
      navigate('/install');
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
                  Utilisez Google Chrome pour une installation optimale, ou téléchargez directement l'APK ci-dessous.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Téléchargement direct de l'APK */}
          <Card className="shadow-xl border-0 mb-8 border-2 border-green-500/30">
            <CardHeader className="text-center pb-6">
              <Badge className="mx-auto mb-3 bg-green-600 hover:bg-green-600">Recommandé</Badge>
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl mb-4">
                <Download className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                Télécharger l'APK
              </CardTitle>
              <CardDescription className="text-gray-600">
                L'application n'est pas encore sur le Play Store — téléchargez directement le fichier d'installation depuis ce site.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button
                asChild
                className="w-full py-4 text-lg font-semibold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-lg mb-6"
                size="lg"
              >
                <a href={APK_DOWNLOAD_URL} download>
                  <Download className="w-5 h-5 mr-2" />
                  Télécharger le fichier APK
                </a>
              </Button>

              <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Settings className="w-4 h-4 text-blue-600" />
                  Avant d'installer
                </h4>
                <ol className="space-y-1.5 text-sm text-gray-700 list-decimal list-inside">
                  <li>Ouvrez le fichier téléchargé depuis vos notifications ou "Téléchargements"</li>
                  <li>Android affichera un avertissement "source inconnue" — c'est normal pour toute app installée hors Play Store</li>
                  <li>Appuyez sur "Paramètres" dans l'avertissement, puis autorisez l'installation depuis cette source</li>
                  <li>Revenez en arrière et confirmez l'installation</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Carte d'installation PWA (alternative) */}
            <Card className="shadow-xl border-0">
              <CardHeader className="text-center pb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl mb-4">
                  <Smartphone className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                  Alternative : Installation PWA
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Depuis votre navigateur, sans télécharger de fichier
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
                  disabled={isInstalled}
                  variant="outline"
                  className="w-full py-4 text-lg font-semibold border-2"
                  size="lg"
                >
                  <Download className="w-5 h-5 mr-2" />
                  {isInstalled ? 'Déjà installée' : isInstallable ? 'Installer Maintenant' : 'Voir les instructions'}
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
                    Installation manuelle
                  </h4>
                  <ol className="space-y-2 text-sm text-gray-600">
                    <li>1. Ouvrez le menu Chrome (⋮ en haut à droite)</li>
                    <li>2. Sélectionnez "Installer l'application"</li>
                    <li>3. Ou "Ajouter à l'écran d'accueil"</li>
                    <li>4. Confirmez pour terminer</li>
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
                  <p className="text-sm text-gray-600">~20 MB disponibles</p>
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
