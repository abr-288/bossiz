import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Smartphone, 
  Monitor, 
  Globe, 
  Download, 
  RefreshCw, 
  Settings, 
  Wifi, 
  Battery, 
  HardDrive,
  Chrome,
  Compass,
  Square,
  Apple,
  Tablet,
  Info
} from "lucide-react";

const Compatibility = () => {
  const [deviceInfo, setDeviceInfo] = useState({
    userAgent: '',
    platform: '',
    language: '',
    cookieEnabled: false,
    jsEnabled: true,
    screenResolution: '',
    connectionType: '',
    memory: ''
  });

  const [compatibility, setCompatibility] = useState({
    isCompatible: true,
    issues: [] as string[],
    recommendations: [] as string[]
  });

  useEffect(() => {
    // Collect device information
    const info = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      jsEnabled: true,
      screenResolution: `${screen.width}x${screen.height}`,
      connectionType: (navigator as any).connection?.effectiveType || 'Unknown',
      memory: (navigator as any).deviceMemory ? `${(navigator as any).deviceMemory}GB` : 'Unknown'
    };
    setDeviceInfo(info);

    // Check compatibility
    checkCompatibility(info);
  }, []);

  const checkCompatibility = (info: any) => {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check browser
    const ua = info.userAgent.toLowerCase();
    let isCompatible = true;

    // Check for old browsers
    if (ua.includes('msie') || ua.includes('trident')) {
      issues.push('Internet Explorer n\'est plus supporté');
      recommendations.push('Utilisez Chrome, Firefox, Safari ou Edge');
      isCompatible = false;
    }

    // Check JavaScript
    if (!info.jsEnabled) {
      issues.push('JavaScript est désactivé');
      recommendations.push('Activez JavaScript dans les paramètres de votre navigateur');
      isCompatible = false;
    }

    // Check cookies
    if (!info.cookieEnabled) {
      issues.push('Les cookies sont désactivés');
      recommendations.push('Activez les cookies pour une meilleure expérience');
    }

    // Check screen resolution
    const [width] = info.screenResolution.split('x').map(Number);
    if (width < 320) {
      issues.push('Écran trop petit (minimum 320px)');
      recommendations.push('Utilisez un appareil avec un écran plus grand');
      isCompatible = false;
    }

    // Check for old iOS
    if (ua.includes('iphone') || ua.includes('ipad')) {
      const iosMatch = ua.match(/os (\d+)_/);
      if (iosMatch && parseInt(iosMatch[1]) < 12) {
        issues.push('Version iOS trop ancienne (minimum iOS 12)');
        recommendations.push('Mettez à jour votre appareil iOS');
        isCompatible = false;
      }
    }

    // Check for old Android
    if (ua.includes('android')) {
      const androidMatch = ua.match(/android (\d+)/);
      if (androidMatch && parseInt(androidMatch[1]) < 6) {
        issues.push('Version Android trop ancienne (minimum Android 6)');
        recommendations.push('Mettez à jour votre appareil Android');
        isCompatible = false;
      }
    }

    setCompatibility({
      isCompatible,
      issues,
      recommendations
    });
  };

  const getBrowserIcon = () => {
    const ua = deviceInfo.userAgent.toLowerCase();
    if (ua.includes('chrome')) return <Chrome className="w-6 h-6" />;
    if (ua.includes('safari')) return <Apple className="w-6 h-6" />;
    if (ua.includes('firefox')) return <Compass className="w-6 h-6" />;
    if (ua.includes('edge')) return <Square className="w-6 h-6" />;
    return <Globe className="w-6 h-6" />;
  };

  const getPlatformIcon = () => {
    const ua = deviceInfo.userAgent.toLowerCase();
    if (ua.includes('iphone') || ua.includes('ipad')) return <Apple className="w-6 h-6" />;
    if (ua.includes('android')) return <Tablet className="w-6 h-6" />;
    if (ua.includes('windows')) return <Monitor className="w-6 h-6" />;
    return <Monitor className="w-6 h-6" />;
  };

  const supportedBrowsers = [
    {
      name: 'Chrome',
      version: '90+',
      icon: <Chrome className="w-8 h-8" />,
      platforms: ['Windows', 'macOS', 'Linux', 'Android', 'iOS'],
      downloadUrl: 'https://www.google.com/chrome/'
    },
    {
      name: 'Safari',
      version: '12+',
      icon: <Apple className="w-8 h-8" />,
      platforms: ['macOS', 'iOS'],
      downloadUrl: 'https://www.apple.com/safari/'
    },
    {
      name: 'Firefox',
      version: '88+',
      icon: <Compass className="w-8 h-8" />,
      platforms: ['Windows', 'macOS', 'Linux', 'Android'],
      downloadUrl: 'https://www.mozilla.org/firefox/'
    },
    {
      name: 'Edge',
      version: '90+',
      icon: <Square className="w-8 h-8" />,
      platforms: ['Windows', 'macOS', 'Android', 'iOS'],
      downloadUrl: 'https://www.microsoft.com/edge/'
    }
  ];

  const troubleshootingSteps = [
    {
      icon: <RefreshCw className="w-5 h-5" />,
      title: 'Rafraîchir la page',
      description: 'Appuyez sur F5 ou Cmd+R pour recharger'
    },
    {
      icon: <Settings className="w-5 h-5" />,
      title: 'Vérifier les paramètres',
      description: 'Activez JavaScript et les cookies'
    },
    {
      icon: <Wifi className="w-5 h-5" />,
      title: 'Vérifier la connexion',
      description: 'Assurez-vous d\'avoir une connexion internet stable'
    },
    {
      icon: <Battery className="w-5 h-5" />,
      title: 'Économiseur d\'énergie',
      description: 'Désactivez temporairement le mode économie'
    },
    {
      icon: <HardDrive className="w-5 h-5" />,
      title: 'Vider le cache',
      description: 'Effacez les données du navigateur'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="container max-w-4xl mx-auto px-4">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            {compatibility.isCompatible ? (
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            ) : (
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            )}
            <h1 className="text-3xl font-bold text-gray-900">
              Page de Compatibilité
            </h1>
          </div>
          <p className="text-lg text-gray-600">
            Vérification de la compatibilité de votre appareil avec B-Reserve
          </p>
        </div>

        {/* Compatibility Status */}
        <Card className={`mb-8 ${compatibility.isCompatible ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'}`}>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${compatibility.isCompatible ? 'text-green-800' : 'text-orange-800'}`}>
              {compatibility.isCompatible ? (
                <>
                  <CheckCircle2 className="w-6 h-6" />
                  Votre appareil est compatible
                </>
              ) : (
                <>
                  <AlertTriangle className="w-6 h-6" />
                  Problèmes de compatibilité détectés
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {compatibility.isCompatible ? (
              <p className="text-green-700">
                Félicitations ! Votre appareil peut utiliser toutes les fonctionnalités de B-Reserve.
              </p>
            ) : (
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-orange-800 mb-2">Problèmes détectés :</h4>
                  <ul className="space-y-1">
                    {compatibility.issues.map((issue, index) => (
                      <li key={index} className="flex items-start gap-2 text-orange-700">
                        <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-orange-800 mb-2">Recommandations :</h4>
                  <ul className="space-y-1">
                    {compatibility.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2 text-orange-700">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Device Information */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-6 h-6" />
              Informations sur votre appareil
            </CardTitle>
            <CardDescription>
              Détails techniques de votre configuration actuelle
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Navigateur</Badge>
                  <span className="text-sm">{getBrowserIcon()}</span>
                  <span className="text-sm font-mono">{deviceInfo.userAgent.substring(0, 50)}...</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Plateforme</Badge>
                  <span className="text-sm">{getPlatformIcon()}</span>
                  <span className="text-sm">{deviceInfo.platform}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Langue</Badge>
                  <span className="text-sm">{deviceInfo.language}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Résolution</Badge>
                  <Monitor className="w-4 h-4" />
                  <span className="text-sm">{deviceInfo.screenResolution}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Connexion</Badge>
                  <Wifi className="w-4 h-4" />
                  <span className="text-sm">{deviceInfo.connectionType}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Mémoire</Badge>
                  <HardDrive className="w-4 h-4" />
                  <span className="text-sm">{deviceInfo.memory}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Supported Browsers */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Navigateurs supportés</CardTitle>
            <CardDescription>
              Pour une expérience optimale, utilisez l'un de ces navigateurs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {supportedBrowsers.map((browser) => (
                <div key={browser.name} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {browser.icon}
                      <h3 className="font-semibold">{browser.name}</h3>
                    </div>
                    <Badge variant="outline">{browser.version}</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Plateformes: {browser.platforms.join(', ')}
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => window.open(browser.downloadUrl, '_blank')}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Télécharger
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Troubleshooting */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Dépannage</CardTitle>
            <CardDescription>
              Solutions aux problèmes courants
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {troubleshootingSteps.map((step, index) => (
                <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    {step.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold">{step.title}</h4>
                    <p className="text-sm text-gray-600">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Alternative Access */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Si vous rencontrez toujours des problèmes, vous pouvez :
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li>Contacter notre support technique</li>
              <li>Utiliser un autre appareil</li>
              <li>Essayer notre version mobile simplifiée</li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <Button 
            onClick={() => window.location.href = '/'}
            className="flex-1"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retour à l'accueil
          </Button>
          <Button 
            variant="outline"
            onClick={() => window.location.reload()}
            className="flex-1"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Recharger la page
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Compatibility;
