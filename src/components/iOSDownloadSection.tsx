import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Smartphone, 
  Download, 
  Apple, 
  QrCode, 
  CheckCircle,
  ExternalLink,
  Shield,
  Zap,
  Monitor
} from "lucide-react";
import { useTranslation } from "react-i18next";

const iOSDownloadSection = () => {
  const { t } = useTranslation();
  const [showQR, setShowQR] = useState(false);
  const [downloadStats, setDownloadStats] = useState({
    ios: 0,
    android: 0
  });
  const [detectedOS, setDetectedOS] = useState<string>('');

  // Fonction pour détecter le système d'exploitation
  const detectOS = () => {
    const userAgent = navigator.userAgent;
    
    // Détection iOS
    if (/iPad|iPhone|iPod/.test(userAgent)) {
      return 'ios';
    }
    
    // Détection Android
    if (/Android/.test(userAgent)) {
      return 'android';
    }
    
    // Détection Windows
    if (/Win/.test(userAgent)) {
      return 'windows';
    }
    
    // Détection macOS
    if (/Mac/.test(userAgent) && !(/iPad|iPhone|iPod/.test(userAgent))) {
      return 'mac';
    }
    
    // Détection Linux
    if (/Linux/.test(userAgent) && !(/Android/.test(userAgent))) {
      return 'linux';
    }
    
    return 'unknown';
  };

  // Simuler des stats de téléchargement et détecter le système
  useEffect(() => {
    const stats = localStorage.getItem('downloadStats');
    if (stats) {
      setDownloadStats(JSON.parse(stats));
    }
    
    // Détecter le système au chargement
    const os = detectOS();
    setDetectedOS(os);
  }, []);

  const handleDownloadClick = (platform: 'ios' | 'android') => {
    const newStats = {
      ...downloadStats,
      [platform]: downloadStats[platform] + 1
    };
    setDownloadStats(newStats);
    localStorage.setItem('downloadStats', JSON.stringify(newStats));
  };

  const appStoreUrl = "https://apps.apple.com/app/b-reserve/id123456789";
  const playStoreUrl = "https://play.google.com/store/apps/details?id=com.breserve.app";
  const qrCodeUrl = "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=" + encodeURIComponent(appStoreUrl);

  // Fonction pour installer l'app selon le système détecté
  const handleUniversalInstall = () => {
    const os = detectOS();
    
    switch (os) {
      case 'ios':
        // Rediriger vers l'App Store
        window.open(appStoreUrl, '_blank');
        setTimeout(() => {
          alert(t('iosDownload.alerts.redirectAppStore'));
        }, 500);
        handleDownloadClick('ios');
        break;

      case 'android':
        // Rediriger vers Google Play
        window.open(playStoreUrl, '_blank');
        setTimeout(() => {
          alert(t('iosDownload.alerts.redirectPlayStore'));
        }, 500);
        handleDownloadClick('android');
        break;
        
      case 'windows':
      case 'mac':
      case 'linux':
        // Afficher les options pour desktop
        showDesktopOptions();
        break;
        
      default:
        // Afficher les options pour système inconnu
        showDesktopOptions();
        break;
    }
  };

  // Fonction pour afficher les options desktop
  const showDesktopOptions = () => {
    if (confirm(t('iosDownload.alerts.choosePlatform'))) {
      window.open(appStoreUrl, '_blank');
      handleDownloadClick('ios');
    } else {
      window.open(playStoreUrl, '_blank');
      handleDownloadClick('android');
    }
  };

  // Fonction pour installer l'app depuis l'App Store (spécifique iOS)
  const handleAppInstall = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    if (isIOS) {
      window.open(appStoreUrl, '_blank');
      setTimeout(() => {
        alert(t('iosDownload.alerts.redirectAppStore'));
      }, 500);
    } else {
      alert(t('iosDownload.alerts.iosOnly'));
    }
  };

  // Fonction pour obtenir le texte du système détecté
  const getDetectedOSText = () => {
    switch (detectedOS) {
      case 'ios': return t('iosDownload.detected.ios');
      case 'android': return t('iosDownload.detected.android');
      case 'windows': return t('iosDownload.detected.windows');
      case 'mac': return t('iosDownload.detected.mac');
      case 'linux': return t('iosDownload.detected.linux');
      default: return t('iosDownload.detected.unknown');
    }
  };

  // Fonction pour obtenir l'icône du système détecté
  const getDetectedOSIcon = () => {
    switch (detectedOS) {
      case 'ios': return <Apple className="w-4 h-4" />;
      case 'android': return <Smartphone className="w-4 h-4" />;
      default: return <Monitor className="w-4 h-4" />;
    }
  };

  return (
    <section className="py-20 bg-gradient-to-br from-blue-50 via-white to-purple-50 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="h-full w-full" style={{
          backgroundImage: `radial-gradient(circle at 3px 3px, rgb(59 130 246 / 0.1) 3px, transparent 3px)`,
          backgroundSize: '100px 100px'
        }}></div>
      </div>
      
      {/* Floating Elements */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-transparent rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-40 h-40 bg-gradient-to-br from-purple-400/20 to-transparent rounded-full blur-3xl animate-pulse delay-1000"></div>
      
      <div className="site-container relative z-10">
        <div className="text-center mb-12">
          <div className="inline-block mb-6">
            <Badge className="bg-blue-100 text-blue-800 border-blue-200 px-6 py-3">
              <Apple className="w-6 h-6 mr-3" />
              <span className="text-lg font-semibold">{t('iosDownload.badge')}</span>
            </Badge>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 leading-tight">
            {t('iosDownload.title')}
            <span className="block text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 bg-clip-text text-transparent mt-2">
              {t('iosDownload.titleHighlight')}
            </span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            {t('iosDownload.subtitle')}
          </p>
          
          {/* Système détecté */}
          {detectedOS && (
            <div className="mt-4 inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-md border border-gray-200">
              {getDetectedOSIcon()}
              <span className="text-sm font-medium text-gray-700">{getDetectedOSText()}</span>
            </div>
          )}
        </div>

        {/* Bouton Universel de Téléchargement */}
        <div className="max-w-md mx-auto mb-12">
          <Card className="border-2 border-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 transition-all duration-300 hover:shadow-2xl hover:scale-105 group bg-white shadow-lg">
            <CardContent className="p-8 text-center">
              <div className="mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Download className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('iosDownload.smart.title')}</h3>
                <p className="text-gray-600">{t('iosDownload.smart.subtitle')}</p>
              </div>

              <Button
                size="lg"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-2xl font-black py-6 text-lg border-4 border-white hover:border-gray-200 rounded-xl relative overflow-hidden group"
                onClick={handleUniversalInstall}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                <div className="relative z-10 flex items-center justify-center">
                  <Download className="w-6 h-6 mr-3" />
                  {detectedOS === 'ios' ? t('iosDownload.smart.ctaIOS') :
                   detectedOS === 'android' ? t('iosDownload.smart.ctaAndroid') :
                   t('iosDownload.smart.ctaGeneric')}
                </div>
              </Button>

              <p className="text-sm text-gray-500 mt-4">
                {detectedOS === 'ios' ? t('iosDownload.smart.hintIOS') :
                 detectedOS === 'android' ? t('iosDownload.smart.hintAndroid') :
                 t('iosDownload.smart.hintGeneric')}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* iOS Download Card */}
          <Card className="border-2 border-gray-200 hover:border-blue-300 transition-all duration-300 hover:shadow-2xl hover:scale-105 group bg-white shadow-lg">
            <CardContent className="p-8 text-center">
              <div className="mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Apple className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">iOS</h3>
                <p className="text-gray-600 mb-4">{t('iosDownload.ios.devices')}</p>
              </div>

              <div className="space-y-4">
                <Button
                  size="lg"
                  className="w-full bg-gradient-to-r from-black to-gray-900 text-white hover:from-gray-800 hover:to-gray-700 transition-all duration-300 shadow-2xl font-black py-6 text-lg border-4 border-white hover:border-gray-200 rounded-xl relative overflow-hidden group"
                  onClick={() => {
                    handleDownloadClick('ios');
                    handleAppInstall();
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                  <div className="relative z-10 flex items-center justify-center">
                    <Download className="w-6 h-6 mr-3" />
                    {t('iosDownload.smart.ctaIOS')}
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="w-full border-2 border-gray-300 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all duration-300 transform hover:scale-105 font-bold py-6 text-lg"
                  onClick={() => setShowQR(!showQR)}
                >
                  <QrCode className="w-6 h-6 mr-3" />
                  {showQR ? t('iosDownload.ios.hideQR') : t('iosDownload.ios.scanQR')}
                </Button>
              </div>

              {/* QR Code Modal */}
              {showQR && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600 mb-3">{t('iosDownload.ios.qrHint')}</p>
                  <img
                    src={qrCodeUrl}
                    alt={t('iosDownload.ios.qrAlt')}
                    className="w-32 h-32 mx-auto"
                  />
                </div>
              )}

              {/* Download Stats */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                  <Download className="w-4 h-4" />
                  <span>{t('iosDownload.downloadsCount', { count: downloadStats.ios })}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Android Download Card */}
          <Card className="border-2 border-gray-200 hover:border-green-300 transition-all duration-300 hover:shadow-2xl hover:scale-105 group bg-white shadow-lg">
            <CardContent className="p-8 text-center">
              <div className="mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-green-700 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Smartphone className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Android</h3>
                <p className="text-gray-600 mb-4">{t('iosDownload.android.devices')}</p>
              </div>

              <div className="space-y-4">
                <Button
                  size="lg"
                  className="w-full bg-green-600 text-white hover:bg-green-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl font-bold py-6 text-lg"
                  onClick={() => {
                    handleDownloadClick('android');
                    window.open(playStoreUrl, '_blank');
                  }}
                >
                  <Download className="w-6 h-6 mr-3" />
                  {t('iosDownload.android.ctaDownload')}
                </Button>

                <Button
                  variant="outline"
                  className="w-full border-2 border-gray-300 hover:border-green-300 hover:text-green-600 hover:bg-green-50 transition-all duration-300 transform hover:scale-105 font-bold py-6 text-lg"
                  onClick={() => window.open(playStoreUrl, '_blank')}
                >
                  <ExternalLink className="w-6 h-6 mr-3" />
                  {t('iosDownload.android.ctaView')}
                </Button>
              </div>

              {/* Download Stats */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                  <Download className="w-4 h-4" />
                  <span>{t('iosDownload.downloadsCount', { count: downloadStats.android })}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('iosDownload.features.fast.title')}</h3>
            <p className="text-gray-600">{t('iosDownload.features.fast.description')}</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('iosDownload.features.secure.title')}</h3>
            <p className="text-gray-600">{t('iosDownload.features.secure.description')}</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('iosDownload.features.reliable.title')}</h3>
            <p className="text-gray-600">{t('iosDownload.features.reliable.description')}</p>
          </div>
        </div>

        {/* Instructions Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">{t('iosDownload.instructions.title')}</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Apple className="w-5 h-5" />
                {t('iosDownload.instructions.iosTitle')}
              </h4>
              <ol className="space-y-3 text-gray-600">
                {(t('iosDownload.instructions.iosSteps', { returnObjects: true }) as string[]).map((step, i) => (
                  <li key={i}>{i + 1}. {step}</li>
                ))}
              </ol>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                Android
              </h4>
              <ol className="space-y-3 text-gray-600">
                {(t('iosDownload.instructions.androidSteps', { returnObjects: true }) as string[]).map((step, i) => (
                  <li key={i}>{i + 1}. {step}</li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default iOSDownloadSection;
