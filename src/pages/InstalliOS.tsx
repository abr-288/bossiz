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
  ExternalLink,
  Apple
} from 'lucide-react';
import { useTranslation } from "react-i18next";

const InstalliOS = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [isiOS, setIsiOS] = useState(false);
  const [isSafari, setIsSafari] = useState(false);
  const [installStatus, setInstallStatus] = useState<'checking' | 'compatible' | 'incompatible'>('checking');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Détection du navigateur et de l'appareil
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    const isSafariBrowser = /safari/.test(userAgent) && !/chrome/.test(userAgent);
    
    setIsiOS(isIOSDevice);
    setIsSafari(isSafariBrowser);
    
    if (isIOSDevice && isSafariBrowser) {
      setInstallStatus('compatible');
    } else {
      setInstallStatus('incompatible');
    }

    // Écouter l'événement beforeinstallprompt pour PWA
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = () => {
    // iOS/Safari ne déclenche jamais beforeinstallprompt : l'installation se
    // fait uniquement via Partager > Sur l'écran d'accueil. On renvoie donc
    // vers les instructions détaillées plutôt qu'un App Store inexistant.
    navigate('/install');
  };

  const features = [
    {
      icon: <Zap className="w-5 h-5 text-info" />,
      title: t("ux.installIos.fast"),
      description: t("ux.installIos.fastDesc")
    },
    {
      icon: <Shield className="w-5 h-5 text-success" />,
      title: t("ux.installIos.secure"),
      description: t("ux.installIos.secureDesc")
    },
    {
      icon: <Star className="w-5 h-5 text-warning-foreground" />,
      title: "Face ID & Touch ID",
      description: t("ux.installIos.biometric")
    },
    {
      icon: <Download className="w-5 h-5 text-primary" />,
      title: t("ux.installIos.offline"),
      description: t("ux.installIos.offlineDesc")
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted/40 via-muted/20 to-muted/20">
      <div className="container mx-auto px-4 py-8">
        {/* Bouton de retour */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-8 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("ux.installIos.back")}
        </Button>

        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-2xl mb-6 shadow-lg">
              <Apple className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              {t("ux.installIos.title")}
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t("ux.installIos.subtitle")}
            </p>
          </div>

          {/* Statut de compatibilité */}
          <div className="mb-8">
            {installStatus === 'checking' && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {t("ux.installIos.checking")}
                </AlertDescription>
              </Alert>
            )}
            
            {installStatus === 'compatible' && (
              <Alert className="border-success/30 bg-success/10">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <AlertDescription className="text-success">
                  🎉 Votre appareil iOS est parfaitement compatible ! Installation directe disponible.
                </AlertDescription>
              </Alert>
            )}
            
            {installStatus === 'incompatible' && (
              <Alert className="border-warning-foreground/20 bg-warning">
                <AlertCircle className="h-4 w-4 text-warning-foreground" />
                <AlertDescription className="text-warning-foreground">
                  Ouvrez ce lien dans Safari sur votre iPhone ou iPad pour installer l'application
                  (Chrome et les autres navigateurs iOS ne permettent pas l'installation).
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Carte d'installation */}
            <Card className="shadow-xl border-0">
              <CardHeader className="text-center pb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-xl mb-4">
                  <Download className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold text-foreground mb-2">
                  {t("ux.installIos.native")}
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  {t("ux.installIos.nativeDesc")}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                    <span className="text-foreground">{t("ux.installIos.instant")}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                    <span className="text-foreground">{t("ux.installIos.autoUpdate")}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                    <span className="text-foreground">{t("ux.installIos.optimised")}</span>
                  </div>
                </div>
                
                <Button
                  onClick={handleInstall}
                  className="w-full py-4 text-lg font-semibold bg-action hover:bg-action-hover transition-all duration-slow ease-standard shadow-lg"
                  size="lg"
                >
                  <Download className="w-5 h-5 mr-2" />
                  {t("ux.installIos.seeInstructions")}
                </Button>
              </CardContent>
            </Card>

            {/* Carte des fonctionnalités */}
            <Card className="shadow-xl border-0">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-foreground mb-2">
                  {t("ux.installIos.features")}
                </CardTitle>
                <CardDescription>
                  {t("ux.installIos.featuresDesc")}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-4 p-3 rounded-lg bg-muted">
                      {feature.icon}
                      <div>
                        <h4 className="font-semibold text-foreground mb-1">
                          {feature.title}
                        </h4>
                        <p className="text-sm text-muted-foreground">
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
              <CardTitle className="text-2xl font-bold text-foreground mb-2">
                {t("ux.installIos.instructions")}
              </CardTitle>
              <CardDescription>
                {t("ux.installIos.instructionsDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Badge variant="secondary">1</Badge>
                    {t("ux.installIos.pwa")}
                  </h4>
                  <ol className="space-y-2 text-sm text-muted-foreground">
                    <li>{t("ux.installIos.step1")}</li>
                    <li>{t("ux.installIos.step2")}</li>
                    <li>3. Cliquez sur "Partager" (icône carré avec flèche)</li>
                    <li>4. Faites défiler et cliquez "Sur l'écran d'accueil"</li>
                    <li>5. Confirmez avec "Ajouter"</li>
                    <li>6. L'icône apparaîtra sur votre écran d'accueil</li>
                  </ol>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Badge variant="secondary">?</Badge>
                    {t("ux.installIos.notWorking")}
                  </h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Le bouton "Sur l'écran d'accueil" n'apparaît pas : vérifiez que vous êtes bien dans Safari, pas dans Chrome ou l'appli d'une autre appli (WhatsApp, etc.)</li>
                    <li>• L'icône est absente après l'ajout : elle peut se trouver sur une page d'accueil suivante, faites glisser vers la gauche</li>
                    <li>{t("ux.installIos.tip3")}</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configuration système requise */}
          <Card className="shadow-xl border-0 mb-8">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-foreground mb-2">
                {t("ux.installIos.requirements")}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center p-4 rounded-lg bg-muted">
                  <h4 className="font-semibold text-foreground mb-2">{t("ux.installIos.system")}</h4>
                  <p className="text-sm text-muted-foreground">{t("ux.installIos.iosVersion")}</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted">
                  <h4 className="font-semibold text-foreground mb-2">Espace</h4>
                  <p className="text-sm text-muted-foreground">{t("ux.installIos.space")}</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted">
                  <h4 className="font-semibold text-foreground mb-2">{t("ux.installIos.network")}</h4>
                  <p className="text-sm text-muted-foreground">{t("ux.installIos.networkDesc")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer actions */}
          <div className="text-center">
            <p className="text-muted-foreground mb-4">
              {t("ux.installIos.help")}
            </p>
            <Button
              variant="outline"
              onClick={() => window.open('https://wa.me/2250700000000', '_blank')}
              className="border-info text-info hover:bg-info/10"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              {t("ux.installIos.whatsapp")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstalliOS;
