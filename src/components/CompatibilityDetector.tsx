import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, X } from "lucide-react";

interface CompatibilityDetectorProps {
  children: React.ReactNode;
  onCompatibilityCheck?: (isCompatible: boolean) => void;
}

const CompatibilityDetector = ({ children, onCompatibilityCheck }: CompatibilityDetectorProps) => {
  const [showWarning, setShowWarning] = useState(false);
  const [compatibilityIssues, setCompatibilityIssues] = useState<string[]>([]);
  const [isCompatible, setIsCompatible] = useState(true);

  useEffect(() => {
    const checkCompatibility = () => {
      const issues: string[] = [];
      let compatible = true;

      // Check for old browsers - be very permissive for site access
      const ua = navigator.userAgent.toLowerCase();
      
      // Only block truly incompatible browsers (Internet Explorer)
      if (ua.includes('msie') || ua.includes('trident')) {
        issues.push('Internet Explorer n\'est plus supporté - certaines fonctionnalités pourraient être limitées');
        // Still allow access but with warning
        compatible = true;
      }

      // Check cookies - only warn, don't block
      if (!navigator.cookieEnabled) {
        issues.push('Les cookies sont désactivés - certaines fonctionnalités pourraient être limitées');
      }

      // Check screen resolution - only warn for very small screens
      const width = screen.width;
      if (width < 320) {
        issues.push('Écran très petit - certaines fonctionnalités pourraient être limitées');
      }

      // Check for very old iOS - only warn
      if (ua.includes('iphone') || ua.includes('ipad')) {
        const iosMatch = ua.match(/os (\d+)_/);
        if (iosMatch && parseInt(iosMatch[1]) < 12) {
          issues.push('Version iOS ancienne détectée - les téléchargements pourraient être limités');
        }
      }

      // Check for very old Android - only warn
      if (ua.includes('android')) {
        const androidMatch = ua.match(/android (\d+)/);
        if (androidMatch && parseInt(androidMatch[1]) < 6) {
          issues.push('Version Android ancienne détectée - les téléchargements pourraient être limités');
        }
      }

      // Check for very old browsers - only warn, don't block
      const isVeryOldBrowser = 
        ua.includes('chrome/1') || 
        ua.includes('chrome/2') || 
        ua.includes('chrome/3') || 
        ua.includes('firefox/1') || 
        ua.includes('firefox/2') || 
        ua.includes('safari/1') || 
        ua.includes('safari/2') || 
        ua.includes('safari/3');

      if (isVeryOldBrowser) {
        issues.push('Navigateur très ancien détecté - les téléchargements pourraient être limités');
      }

      // Always allow access to the site
      compatible = true;

      setCompatibilityIssues(issues);
      setIsCompatible(compatible);
      
      // Show warning for non-critical issues
      if (issues.length > 0 && compatible) {
        setShowWarning(true);
      }

      // Notify parent component
      if (onCompatibilityCheck) {
        onCompatibilityCheck(compatible);
      }

      // No automatic redirect - allow access to all users
      // Users can access the site regardless of compatibility issues
      // Warnings will be shown for limitations but no blocking

      return compatible;
    };

    const compatible = checkCompatibility();

    // Store compatibility check result
    sessionStorage.setItem('breserve-compatibility-checked', 'true');
    sessionStorage.setItem('breserve-is-compatible', compatible.toString());
  }, [onCompatibilityCheck]);

  // Don't show anything on compatibility page itself
  if (window.location.pathname === '/compatibility') {
    return <>{children}</>;
  }

  return (
    <>
      {/* Compatibility Warning Banner */}
      {showWarning && compatibilityIssues.length > 0 && (
        <Alert className="mb-4 border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <div className="flex-1">
            <AlertDescription className="text-orange-800">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold mb-1">Attention : Problèmes de compatibilité détectés</p>
                  <ul className="text-sm space-y-1">
                    {compatibilityIssues.map((issue, index) => (
                      <li key={index}>· {issue}</li>
                    ))}
                  </ul>
                  <div className="flex gap-2 mt-3">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => window.location.href = '/compatibility'}
                    >
                      Vérifier la compatibilité
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => setShowWarning(false)}
                    >
                      Ignorer
                    </Button>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="ghost"
                  className="ml-2"
                  onClick={() => setShowWarning(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </AlertDescription>
          </div>
        </Alert>
      )}

      {/* Critical Error Overlay */}
      {!isCompatible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 text-center">
            <AlertTriangle className="h-12 w-12 text-orange-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Appareil non compatible</h2>
            <p className="text-gray-600 mb-4">
              Votre appareil ou navigateur n'est pas compatible avec B-Reserve. 
              Vous allez être redirigé vers la page de compatibilité.
            </p>
            <div className="space-y-2 text-sm text-gray-500">
              <p>Redirection automatique dans 3 secondes...</p>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => window.location.href = '/compatibility'}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Aller maintenant
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Render children if compatible */}
      {isCompatible && children}
    </>
  );
};

export default CompatibilityDetector;
