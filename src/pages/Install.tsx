import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Smartphone, Check, Wifi, Zap, Bell, Apple, Chrome, Share2, MoreVertical, Plus, ArrowDown, Shield, Clock, Globe } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import InstallDropdown from "@/components/InstallDropdown";
import { usePWA } from "@/hooks/usePWA";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import Logo from "@/components/Logo";
import heroImage from "@/assets/ordinateur.jpg";

const Install = () => {
  const { isInstallable, isInstalled, install } = usePWA();
  const { isSupported, permission, requestPermission, subscribe, sendNotification } = usePushNotifications();

  // Detect device type
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);
  const isMobile = isIOS || isAndroid;

  const handleInstallClick = async () => {
    const success = await install();
    if (success) {
      console.log('App installed successfully');
    }
  };

  const handleEnableNotifications = async () => {
    const granted = await requestPermission();
    if (granted) {
      await subscribe();
      sendNotification('Notifications activées', {
        body: 'Vous recevrez désormais des notifications pour vos réservations',
        tag: 'welcome'
      });
    }
  };

  const features = [
    {
      icon: Zap,
      title: "Ultra rapide",
      description: "Chargement instantané, même avec une connexion lente"
    },
    {
      icon: Wifi,
      title: "Mode hors-ligne",
      description: "Consultez vos réservations sans internet"
    },
    {
      icon: Bell,
      title: "Notifications",
      description: "Alertes de prix et rappels de voyage"
    },
    {
      icon: Shield,
      title: "Sécurisé",
      description: "Données chiffrées et paiements protégés"
    },
    {
      icon: Clock,
      title: "Toujours à jour",
      description: "Mises à jour automatiques en arrière-plan"
    },
    {
      icon: Globe,
      title: "Multi-plateforme",
      description: "Fonctionne sur tous vos appareils"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col pt-16">
      <Navbar />
      
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-white py-16 md:py-24 overflow-hidden">
        <img src={heroImage} alt="Installer B-Reserve" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/85 to-primary/80" />
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ 
            backgroundImage: 'radial-gradient(circle at 25px 25px, white 2px, transparent 0)',
            backgroundSize: '50px 50px'
          }} />
        </div>
        
        <div className="container max-w-4xl px-4 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            {/* App Icon Preview */}
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-3xl shadow-2xl mx-auto mb-8 flex items-center justify-center"
            >
              <Logo variant="dark" showWordmark={false} className="w-16 h-16 md:w-24 md:h-24" />
            </motion.div>

            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              Installez B-Reserve
            </h1>
            <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-8">
              Accédez à vos voyages en un clic depuis votre écran d'accueil
            </p>

            {isInstalled ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="inline-flex items-center gap-2 bg-green-500/20 border border-green-400/30 rounded-full px-6 py-3"
              >
                <Check className="w-5 h-5 text-green-300" />
                <span className="font-medium">Application installée</span>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <InstallDropdown 
                  size="lg"
                  className="bg-white text-primary hover:bg-white/90 shadow-lg h-14 px-6 text-lg font-semibold"
                />
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>

      <div className="flex-1 bg-gradient-to-b from-background to-muted/20 py-10 md:py-16">
        <div className="container max-w-4xl px-4">
          
          {/* Installation Instructions */}
          {!isInstalled && !isInstallable && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid gap-6 mb-12"
            >
              {/* iOS Instructions */}
              <Card className={cn(
                "overflow-hidden transition-all duration-300",
                isIOS && "ring-2 ring-primary shadow-lg"
              )}>
                <CardHeader className="bg-gradient-to-r from-slate-900 to-slate-800 text-white">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                      <Apple className="w-7 h-7" />
                    </div>
                    <div>
                      <CardTitle className="text-white">iPhone & iPad</CardTitle>
                      <CardDescription className="text-white/70">Installation via Safari</CardDescription>
                    </div>
                    {isIOS && (
                      <span className="ml-auto bg-primary px-3 py-1 rounded-full text-xs font-medium">
                        Votre appareil
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="font-bold text-primary">1</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Ouvrez dans Safari</p>
                        <p className="text-sm text-muted-foreground">Assurez-vous d'utiliser le navigateur Safari</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="font-bold text-primary">2</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium flex items-center gap-2">
                          Appuyez sur Partager
                          <Share2 className="w-4 h-4 text-primary" />
                        </p>
                        <p className="text-sm text-muted-foreground">L'icône carrée avec une flèche vers le haut</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="font-bold text-primary">3</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium flex items-center gap-2">
                          Sur l'écran d'accueil
                          <Plus className="w-4 h-4 text-primary" />
                        </p>
                        <p className="text-sm text-muted-foreground">Faites défiler et sélectionnez cette option</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                        <Check className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Confirmez avec "Ajouter"</p>
                        <p className="text-sm text-muted-foreground">L'application apparaîtra sur votre écran d'accueil</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Android Instructions */}
              <Card className={cn(
                "overflow-hidden transition-all duration-300",
                isAndroid && "ring-2 ring-primary shadow-lg"
              )}>
                <CardHeader className="bg-gradient-to-r from-green-600 to-green-500 text-white">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                      <Chrome className="w-7 h-7" />
                    </div>
                    <div>
                      <CardTitle className="text-white">Android</CardTitle>
                      <CardDescription className="text-white/70">Installation via Chrome</CardDescription>
                    </div>
                    {isAndroid && (
                      <span className="ml-auto bg-white/20 px-3 py-1 rounded-full text-xs font-medium">
                        Votre appareil
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                        <span className="font-bold text-green-600">1</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Ouvrez dans Chrome</p>
                        <p className="text-sm text-muted-foreground">Utilisez le navigateur Google Chrome</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                        <span className="font-bold text-green-600">2</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium flex items-center gap-2">
                          Ouvrez le menu
                          <MoreVertical className="w-4 h-4 text-green-600" />
                        </p>
                        <p className="text-sm text-muted-foreground">Les trois points en haut à droite</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                        <span className="font-bold text-green-600">3</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium flex items-center gap-2">
                          Installer l'application
                          <Download className="w-4 h-4 text-green-600" />
                        </p>
                        <p className="text-sm text-muted-foreground">Ou "Ajouter à l'écran d'accueil"</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                        <Check className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Confirmez l'installation</p>
                        <p className="text-sm text-muted-foreground">L'application sera ajoutée automatiquement</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Features Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-12"
          >
            <h2 className="text-2xl font-bold text-center mb-8">Pourquoi installer B-Reserve ?</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="bg-card border rounded-xl p-4 text-center hover:shadow-md transition-shadow"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-1">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Notifications Card */}
          {isSupported && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-primary" />
                    Notifications push
                  </CardTitle>
                  <CardDescription>
                    Restez informé de vos réservations et offres spéciales
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {permission === 'granted' ? (
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                      <Check className="w-5 h-5" />
                      <span className="font-medium">Notifications activées</span>
                    </div>
                  ) : permission === 'denied' ? (
                    <div className="text-sm text-muted-foreground bg-muted p-4 rounded-lg">
                      Les notifications ont été refusées. Vous pouvez les réactiver dans les paramètres de votre navigateur.
                    </div>
                  ) : (
                    <>
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <p className="text-sm mb-3">Recevez des alertes pour :</p>
                        <ul className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                          <li className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-primary" />
                            Confirmations
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-primary" />
                            Rappels de voyage
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-primary" />
                            Offres exclusives
                          </li>
                        </ul>
                      </div>
                      <Button onClick={handleEnableNotifications} className="w-full" size="lg">
                        <Bell className="mr-2 h-5 w-5" />
                        Activer les notifications
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Install;