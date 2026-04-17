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
  Zap
} from "lucide-react";

const iOSDownloadSection = () => {
  const [showQR, setShowQR] = useState(false);
  const [downloadStats, setDownloadStats] = useState({
    ios: 0,
    android: 0
  });

  // Simuler des stats de téléchargement
  useEffect(() => {
    const stats = localStorage.getItem('downloadStats');
    if (stats) {
      setDownloadStats(JSON.parse(stats));
    }
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
  const qrCodeUrl = "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=" + encodeURIComponent(appStoreUrl);

  // Fonction pour installer l'app depuis l'App Store
  const handleAppInstall = () => {
    // Vérifier si l'utilisateur est sur iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    if (isIOS) {
      // Ouvrir l'App Store avec une expérience native
      window.open(appStoreUrl, '_blank');
      
      // Afficher une notification de succès
      setTimeout(() => {
        alert('📱 Redirection vers l\'App Store en cours...\nL\'installation commencera automatiquement !');
      }, 500);
    } else {
      // Afficher un message pour les utilisateurs non-iOS
      alert('📱 Cette application est réservée aux appareils iOS (iPhone/iPad).\nVeuillez utiliser un appareil iOS pour installer cette application.');
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
              <span className="text-lg font-semibold">Application Mobile</span>
            </Badge>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 leading-tight">
            Téléchargez B-Reserve
            <span className="block text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 bg-clip-text text-transparent mt-2">
              SUR VOTRE MOBILE
            </span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Accédez à tous nos services de réservation directement depuis votre smartphone
          </p>
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
                <p className="text-gray-600 mb-4">iPhone & iPad</p>
              </div>
              
              <div className="space-y-4">
                <Button 
                  size="lg"
                  className="w-full bg-gradient-to-r from-black to-gray-900 text-white hover:from-gray-800 hover:to-gray-700 transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-3xl font-black py-6 text-lg border-4 border-white hover:border-gray-200 rounded-xl animate-pulse hover:animate-none relative overflow-hidden group"
                  onClick={() => {
                    handleDownloadClick('ios');
                    handleAppInstall();
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                  <div className="relative z-10 flex items-center justify-center">
                    <Download className="w-6 h-6 mr-3" />
                    📱 Installer l'App
                  </div>
                </Button>
                
                <Button 
                  variant="outline"
                  className="w-full border-2 border-gray-300 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all duration-300 transform hover:scale-105 font-bold py-6 text-lg"
                  onClick={() => setShowQR(!showQR)}
                >
                  <QrCode className="w-6 h-6 mr-3" />
                  {showQR ? 'Masquer le QR Code' : 'Scanner le QR Code'}
                </Button>
              </div>

              {/* QR Code Modal */}
              {showQR && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600 mb-3">Scannez ce QR Code avec votre appareil iOS</p>
                  <img 
                    src={qrCodeUrl}
                    alt="QR Code pour télécharger B-Reserve sur iOS"
                    className="w-32 h-32 mx-auto"
                  />
                </div>
              )}

              {/* Download Stats */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                  <Download className="w-4 h-4" />
                  <span>{downloadStats.ios} téléchargements</span>
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
                <p className="text-gray-600 mb-4">Téléphones & Tablettes</p>
              </div>
              
              <div className="space-y-4">
                <Button 
                  size="lg"
                  className="w-full bg-green-600 text-white hover:bg-green-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl font-bold py-6 text-lg"
                  onClick={() => handleDownloadClick('android')}
                >
                  <Download className="w-6 h-6 mr-3" />
                  Télécharger sur Google Play
                </Button>
                
                <Button 
                  variant="outline"
                  className="w-full border-2 border-gray-300 hover:border-green-300 hover:text-green-600 hover:bg-green-50 transition-all duration-300 transform hover:scale-105 font-bold py-6 text-lg"
                  onClick={() => window.open('https://play.google.com/store/apps/details?id=com.breserve.app', '_blank')}
                >
                  <ExternalLink className="w-6 h-6 mr-3" />
                  Voir sur Google Play
                </Button>
              </div>

              {/* Download Stats */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                  <Download className="w-4 h-4" />
                  <span>{downloadStats.android} téléchargements</span>
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Rapide</h3>
            <p className="text-gray-600">Performance optimisée pour tous les appareils</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Sécurisé</h3>
            <p className="text-gray-600">Paiements sécurisés et protection des données</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Fiable</h3>
            <p className="text-gray-600">Disponible 24/7 où que vous soyez</p>
          </div>
        </div>

        {/* Instructions Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Comment installer ?</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Apple className="w-5 h-5" />
                iOS (iPhone/iPad)
              </h4>
              <ol className="space-y-3 text-gray-600">
                <li>1. Scannez le QR Code avec votre appareil photo</li>
                <li>2. Cliquez sur "Ouvrir dans l'App Store"</li>
                <li>3. Tapez sur "Obtenir" pour installer</li>
                <li>4. L'icône B-Reserve apparaîtra sur votre écran d'accueil</li>
              </ol>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                Android
              </h4>
              <ol className="space-y-3 text-gray-600">
                <li>1. Cliquez sur le bouton de téléchargement</li>
                <li>2. Suivez les instructions de Google Play</li>
                <li>3. Acceptez les permissions nécessaires</li>
                <li>4. L'application s'installera automatiquement</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default iOSDownloadSection;
