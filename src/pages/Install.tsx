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
import { useTranslation } from "react-i18next";
import { MOTION } from "@/lib/motion";

const Install = () => {
  const { t } = useTranslation();
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
      sendNotification(t("ux.install.notifOn"), {
        body: t("ux.install.notifOnDesc"),
        tag: 'welcome'
      });
    }
  };

  const features = [
    {
      icon: Zap,
      title: t("ux.install.fast"),
      description: t("ux.install.fastDesc")
    },
    {
      icon: Wifi,
      title: t("ux.install.offline"),
      description: t("ux.install.offlineDesc")
    },
    {
      icon: Bell,
      title: "Notifications",
      description: t("ux.install.alertsDesc")
    },
    {
      icon: Shield,
      title: t("ux.install.secure"),
      description: t("ux.install.secureDesc")
    },
    {
      icon: Clock,
      title: t("ux.install.upToDate"),
      description: t("ux.install.upToDateDesc")
    },
    {
      icon: Globe,
      title: "Multi-plateforme",
      description: t("ux.install.allDevices")
    }
  ];

  return (
    <div className="min-h-screen flex flex-col pt-16">
      <Navbar />
      
      {/* Hero Section */}
      <div className="relative bg-brand text-brand-foreground py-16 md:py-24 overflow-hidden">
        <img src={heroImage} alt={t("ux.install.title")} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-brand/85" />
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
            transition={{ duration: MOTION.slow }}
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
              {t("ux.install.titleShort")}
            </h1>
            <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-8">
              {t("ux.install.subtitle")}
            </p>

            {isInstalled ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="inline-flex items-center gap-2 bg-success/15 border border-success/30 rounded-full px-6 py-3"
              >
                <Check className="w-5 h-5 text-green-300" />
                <span className="font-medium">{t("ux.install.installed")}</span>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <InstallDropdown 
                  size="lg"
                  className="bg-white text-brand hover:bg-white/90 shadow-lg h-14 px-6 text-lg font-semibold"
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
                "overflow-hidden transition-all duration-slow ease-standard",
                isIOS && "ring-2 ring-primary shadow-lg"
              )}>
                <CardHeader className="bg-brand text-white">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                      <Apple className="w-7 h-7" />
                    </div>
                    <div>
                      <CardTitle className="text-white">iPhone & iPad</CardTitle>
                      <CardDescription className="text-white/70">{t("ux.install.viaSafari")}</CardDescription>
                    </div>
                    {isIOS && (
                      <span className="ml-auto bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-xs font-medium">
                        {t("ux.install.yourDevice")}
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
                        <p className="font-medium">{t("ux.install.openSafari")}</p>
                        <p className="text-sm text-muted-foreground">{t("ux.install.useSafari")}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="font-bold text-primary">2</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium flex items-center gap-2">
                          {t("ux.install.tapShare")}
                          <Share2 className="w-4 h-4 text-primary" />
                        </p>
                        <p className="text-sm text-muted-foreground">{t("ux.install.shareIcon")}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="font-bold text-primary">3</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium flex items-center gap-2">
                          {t("ux.install.addHome")}
                          <Plus className="w-4 h-4 text-primary" />
                        </p>
                        <p className="text-sm text-muted-foreground">{t("ux.install.scrollSelect")}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                        <Check className="w-5 h-5 text-success" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{t("ux.install.confirmAdd")}</p>
                        <p className="text-sm text-muted-foreground">{t("ux.install.appears")}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Android Instructions */}
              <Card className={cn(
                "overflow-hidden transition-all duration-slow ease-standard",
                isAndroid && "ring-2 ring-primary shadow-lg"
              )}>
                <CardHeader className="bg-gradient-to-r from-success to-success/80 text-success-foreground">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                      <Chrome className="w-7 h-7" />
                    </div>
                    <div>
                      <CardTitle className="text-white">Android</CardTitle>
                      <CardDescription className="text-white/70">{t("ux.install.viaChrome")}</CardDescription>
                    </div>
                    {isAndroid && (
                      <span className="ml-auto bg-white/20 px-3 py-1 rounded-full text-xs font-medium">
                        {t("ux.install.yourDevice")}
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                        <span className="font-bold text-success">1</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{t("ux.install.openChrome")}</p>
                        <p className="text-sm text-muted-foreground">{t("ux.install.useChrome")}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                        <span className="font-bold text-success">2</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium flex items-center gap-2">
                          {t("ux.install.openMenu")}
                          <MoreVertical className="w-4 h-4 text-success" />
                        </p>
                        <p className="text-sm text-muted-foreground">{t("ux.install.threeDots")}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                        <span className="font-bold text-success">3</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium flex items-center gap-2">
                          {t("ux.install.installApp")}
                          <Download className="w-4 h-4 text-success" />
                        </p>
                        <p className="text-sm text-muted-foreground">{t("ux.install.orAddHome")}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                        <Check className="w-5 h-5 text-success" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{t("ux.install.confirmInstall")}</p>
                        <p className="text-sm text-muted-foreground">{t("ux.install.autoAdded")}</p>
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
            <h2 className="text-2xl font-bold text-center mb-8">{t("ux.install.why")}</h2>
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
                    {t("ux.install.push")}
                  </CardTitle>
                  <CardDescription>
                    {t("ux.install.pushDesc")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {permission === 'granted' ? (
                    <div className="flex items-center gap-2 text-success bg-success/10 p-4 rounded-lg">
                      <Check className="w-5 h-5" />
                      <span className="font-medium">{t("ux.install.notifOn")}</span>
                    </div>
                  ) : permission === 'denied' ? (
                    <div className="text-sm text-muted-foreground bg-muted p-4 rounded-lg">
                      {t("ux.install.denied")}
                    </div>
                  ) : (
                    <>
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <p className="text-sm mb-3">{t("ux.install.alertsFor")}</p>
                        <ul className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                          <li className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-primary" />
                            {t("ux.install.confirmations")}
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-primary" />
                            {t("ux.install.reminders")}
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-primary" />
                            {t("ux.install.offers")}
                          </li>
                        </ul>
                      </div>
                      <Button onClick={handleEnableNotifications} className="w-full" size="lg">
                        <Bell className="mr-2 h-5 w-5" />
                        {t("ux.install.enableNotif")}
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