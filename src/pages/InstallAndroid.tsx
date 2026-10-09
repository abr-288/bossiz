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
import { useTranslation } from "react-i18next";

const APK_DOWNLOAD_URL = '/downloads/bossiz.apk';

const InstallAndroid = () => {
  const { t } = useTranslation();
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
      icon: <Zap className="w-5 h-5 text-info" />,
      title: t("ux.installAndroid.fast"),
      description: t("ux.installAndroid.fastDesc")
    },
    {
      icon: <Shield className="w-5 h-5 text-success" />,
      title: t("ux.installAndroid.secure"),
      description: t("ux.installAndroid.secureDesc")
    },
    {
      icon: <Star className="w-5 h-5 text-warning-foreground" />,
      title: t("ux.installAndroid.push"),
      description: t("ux.installAndroid.pushDesc")
    },
    {
      icon: <Download className="w-5 h-5 text-primary" />,
      title: t("ux.installAndroid.offline"),
      description: t("ux.installAndroid.offlineDesc")
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
          {t("ux.installAndroid.back")}
        </Button>

        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-success rounded-2xl mb-6 shadow-lg">
              <Smartphone className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              {t("ux.installAndroid.title")}
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t("ux.installAndroid.subtitle")}
            </p>
          </div>

          {/* Statut de compatibilité */}
          <div className="mb-8">
            {installStatus === 'checking' && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {t("ux.installAndroid.checking")}
                </AlertDescription>
              </Alert>
            )}
            
            {installStatus === 'compatible' && (
              <Alert className="border-success/30 bg-success/10">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <AlertDescription className="text-success">
                  🎉 Votre appareil est parfaitement compatible ! Installation directe disponible.
                </AlertDescription>
              </Alert>
            )}
            
            {installStatus === 'incompatible' && (
              <Alert className="border-warning-foreground/20 bg-warning">
                <AlertCircle className="h-4 w-4 text-warning-foreground" />
                <AlertDescription className="text-warning-foreground">
                  {t("ux.installAndroid.useChrome")}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Téléchargement direct de l'APK */}
          <Card className="shadow-xl border-0 mb-8 border-2 border-success/30">
            <CardHeader className="text-center pb-6">
              <Badge className="mx-auto mb-3 bg-success hover:bg-success">{t("ux.installAndroid.recommended")}</Badge>
              <div className="inline-flex items-center justify-center w-16 h-16 bg-success rounded-xl mb-4">
                <Download className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-foreground mb-2">
                {t("ux.installAndroid.apk")}
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                {t("ux.installAndroid.notOnStore")}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button
                asChild
                className="w-full py-4 text-lg font-semibold bg-gradient-to-r from-success to-success/80 hover:from-success/90 hover:to-success transition-all duration-slow ease-standard shadow-lg mb-6"
                size="lg"
              >
                <a href={APK_DOWNLOAD_URL} download>
                  <Download className="w-5 h-5 mr-2" />
                  {t("ux.installAndroid.downloadApk")}
                </a>
              </Button>

              <div className="rounded-lg bg-info/10 border border-info/30 p-4">
                <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Settings className="w-4 h-4 text-info" />
                  {t("ux.installAndroid.before")}
                </h4>
                <ol className="space-y-1.5 text-sm text-foreground list-decimal list-inside">
                  <li>Ouvrez le fichier téléchargé depuis vos notifications ou "Téléchargements"</li>
                  <li>Android affichera un avertissement "source inconnue" — c'est normal pour toute app installée hors Play Store</li>
                  <li>Appuyez sur "Paramètres" dans l'avertissement, puis autorisez l'installation depuis cette source</li>
                  <li>{t("ux.installAndroid.goBackConfirm")}</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Carte d'installation PWA (alternative) */}
            <Card className="shadow-xl border-0">
              <CardHeader className="text-center pb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-xl mb-4">
                  <Smartphone className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold text-foreground mb-2">
                  {t("ux.installAndroid.pwaAlt")}
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  {t("ux.installAndroid.pwaAltDesc")}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                    <span className="text-foreground">{t("ux.installAndroid.instant")}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                    <span className="text-foreground">{t("ux.installAndroid.autoUpdate")}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                    <span className="text-foreground">{t("ux.installAndroid.storage")}</span>
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
                  {isInstalled ? t("ux.installAndroid.already") : isInstallable ? t("ux.installAndroid.installNow") : t("ux.installAndroid.seeInstructions")}
                </Button>
              </CardContent>
            </Card>

            {/* Carte des fonctionnalités */}
            <Card className="shadow-xl border-0">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-foreground mb-2">
                  {t("ux.installAndroid.features")}
                </CardTitle>
                <CardDescription>
                  {t("ux.installAndroid.featuresDesc")}
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
                {t("ux.installAndroid.instructions")}
              </CardTitle>
              <CardDescription>
                {t("ux.installAndroid.instructionsDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Badge variant="secondary">1</Badge>
                    {t("ux.installAndroid.pwa")}
                  </h4>
                  <ol className="space-y-2 text-sm text-muted-foreground">
                    <li>1. Cliquez sur "Installer Maintenant"</li>
                    <li>{t("ux.installAndroid.pwaStep2")}</li>
                    <li>3. L'icône apparaîtra sur votre écran d'accueil</li>
                    <li>4. Profitez de l'application complète !</li>
                  </ol>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Badge variant="secondary">2</Badge>
                    {t("ux.installAndroid.manual")}
                  </h4>
                  <ol className="space-y-2 text-sm text-muted-foreground">
                    <li>{t("ux.installAndroid.manual1")}</li>
                    <li>2. Sélectionnez "Installer l'application"</li>
                    <li>3. Ou "Ajouter à l'écran d'accueil"</li>
                    <li>{t("ux.installAndroid.manual4")}</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configuration système requise */}
          <Card className="shadow-xl border-0">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-foreground mb-2">
                {t("ux.installAndroid.requirements")}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center p-4 rounded-lg bg-muted">
                  <h4 className="font-semibold text-foreground mb-2">{t("ux.installAndroid.system")}</h4>
                  <p className="text-sm text-muted-foreground">{t("ux.installAndroid.androidVersion")}</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted">
                  <h4 className="font-semibold text-foreground mb-2">Espace</h4>
                  <p className="text-sm text-muted-foreground">{t("ux.installAndroid.space")}</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted">
                  <h4 className="font-semibold text-foreground mb-2">{t("ux.installAndroid.network")}</h4>
                  <p className="text-sm text-muted-foreground">{t("ux.installAndroid.networkDesc")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer actions */}
          <div className="text-center">
            <p className="text-muted-foreground mb-4">
              {t("ux.installAndroid.help")}
            </p>
            <Button
              variant="outline"
              onClick={() => window.open('https://wa.me/2250700000000', '_blank')}
              className="border-success text-success hover:bg-success/10"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              {t("ux.installAndroid.whatsapp")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstallAndroid;
