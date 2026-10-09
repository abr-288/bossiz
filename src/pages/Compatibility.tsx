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
import { useTranslation } from "react-i18next";

const Compatibility = () => {
  const { t } = useTranslation();
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
      recommendations.push(t("ux.compat.useBrowser"));
      isCompatible = false;
    }

    // Check JavaScript
    if (!info.jsEnabled) {
      issues.push(t("ux.compat.noJs"));
      recommendations.push(t("ux.compat.noJsFix"));
      isCompatible = false;
    }

    // Check cookies
    if (!info.cookieEnabled) {
      issues.push(t("ux.compat.noCookies"));
      recommendations.push(t("ux.compat.noCookiesFix"));
    }

    // Check screen resolution
    const [width] = info.screenResolution.split('x').map(Number);
    if (width < 320) {
      issues.push(t("ux.compat.smallScreen"));
      recommendations.push(t("ux.compat.smallScreenFix"));
      isCompatible = false;
    }

    // Check for old iOS
    if (ua.includes('iphone') || ua.includes('ipad')) {
      const iosMatch = ua.match(/os (\d+)_/);
      if (iosMatch && parseInt(iosMatch[1]) < 12) {
        issues.push(t("ux.compat.oldIos"));
        recommendations.push(t("ux.compat.oldIosFix"));
        isCompatible = false;
      }
    }

    // Check for old Android
    if (ua.includes('android')) {
      const androidMatch = ua.match(/android (\d+)/);
      if (androidMatch && parseInt(androidMatch[1]) < 6) {
        issues.push(t("ux.compat.oldAndroid"));
        recommendations.push(t("ux.compat.oldAndroidFix"));
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
      title: t("ux.compat.refresh"),
      description: t("ux.compat.refreshDesc")
    },
    {
      icon: <Settings className="w-5 h-5" />,
      title: t("ux.compat.checkSettings"),
      description: t("ux.compat.checkSettingsDesc")
    },
    {
      icon: <Wifi className="w-5 h-5" />,
      title: t("ux.compat.checkConnection"),
      description: t("ux.misc.stableConnection")
    },
    {
      icon: <Battery className="w-5 h-5" />,
      title: t("ux.misc.powerSaver"),
      description: t("ux.compat.powerSaveDesc")
    },
    {
      icon: <HardDrive className="w-5 h-5" />,
      title: t("ux.compat.clearCache"),
      description: t("ux.compat.clearCacheDesc")
    }
  ];

  return (
    <div className="min-h-screen bg-muted/40 py-8">
      <div className="container max-w-4xl mx-auto px-4">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            {compatibility.isCompatible ? (
              <CheckCircle2 className="w-8 h-8 text-success" />
            ) : (
              <AlertTriangle className="w-8 h-8 text-warning-foreground" />
            )}
            <h1 className="text-3xl font-bold text-foreground">
              {t("ux.compat.title")}
            </h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Vérification de la compatibilité de votre appareil avec Bossiz+
          </p>
        </div>

        {/* Compatibility Status */}
        <Card className={`mb-8 ${compatibility.isCompatible ? 'border-success/30 bg-success/10' : 'border-warning-foreground/20 bg-warning'}`}>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${compatibility.isCompatible ? 'text-success' : 'text-warning-foreground'}`}>
              {compatibility.isCompatible ? (
                <>
                  <CheckCircle2 className="w-6 h-6" />
                  {t("ux.compat.ok")}
                </>
              ) : (
                <>
                  <AlertTriangle className="w-6 h-6" />
                  {t("ux.compat.issues")}
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {compatibility.isCompatible ? (
              <p className="text-success">
                {t("ux.compat.okDesc")}
              </p>
            ) : (
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-warning-foreground mb-2">{t("ux.compat.issuesList")}</h4>
                  <ul className="space-y-1">
                    {compatibility.issues.map((issue, index) => (
                      <li key={index} className="flex items-start gap-2 text-warning-foreground">
                        <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-warning-foreground mb-2">Recommandations :</h4>
                  <ul className="space-y-1">
                    {compatibility.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2 text-warning-foreground">
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
              {t("ux.compat.deviceInfo")}
            </CardTitle>
            <CardDescription>
              {t("ux.compat.deviceInfoDesc")}
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
                  <Badge variant="outline">{t("ux.compat.resolution")}</Badge>
                  <Monitor className="w-4 h-4" />
                  <span className="text-sm">{deviceInfo.screenResolution}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{t("ux.compat.connection")}</Badge>
                  <Wifi className="w-4 h-4" />
                  <span className="text-sm">{deviceInfo.connectionType}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{t("ux.compat.memory")}</Badge>
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
            <CardTitle>{t("ux.compat.browsers")}</CardTitle>
            <CardDescription>
              {t("ux.compat.browsersDesc")}
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
                  <p className="text-sm text-muted-foreground mb-3">
                    Plateformes: {browser.platforms.join(', ')}
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => window.open(browser.downloadUrl, '_blank')}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {t("ux.compat.download")}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Troubleshooting */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{t("ux.compat.troubleshoot")}</CardTitle>
            <CardDescription>
              {t("ux.compat.troubleshootDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {troubleshootingSteps.map((step, index) => (
                <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-info/10 flex items-center justify-center flex-shrink-0">
                    {step.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold">{step.title}</h4>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
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
            {t("ux.compat.stillIssues")}
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li>{t("ux.compat.contactSupport")}</li>
              <li>{t("ux.compat.otherDevice")}</li>
              <li>{t("ux.compat.lite")}</li>
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
            {t("ux.compat.backHome")}
          </Button>
          <Button 
            variant="outline"
            onClick={() => window.location.reload()}
            className="flex-1"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {t("ux.compat.reload")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Compatibility;
