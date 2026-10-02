import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Cookie, ChevronDown, ChevronUp } from "lucide-react";
import { useCookieConsent } from "@/hooks/useCookieConsent";

// Bandeau de consentement cookies - Loi ivoirienne n°2013-450 (ARTCI) et
// RGPD pour les visiteurs européens. Les cookies essentiels tournent déjà
// sans consentement (session, sécurité) ; ce bandeau ne bloque que
// "préférences" et "analytique", désactivés tant que l'utilisateur n'a pas
// répondu.
export function CookieConsentBanner() {
  const { hasResponded, acceptAll, rejectNonEssential, savePreferences } = useCookieConsent();
  const [expanded, setExpanded] = useState(false);
  const [preferences, setPreferences] = useState(false);
  const [analytics, setAnalytics] = useState(false);

  if (hasResponded) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Consentement aux cookies"
      className="fixed inset-x-0 bottom-0 z-[100] border-t border-border bg-card shadow-lg animate-in slide-in-from-bottom-5"
    >
      <div className="site-container py-4 md:py-5">
        <div className="flex flex-col md:flex-row md:items-start gap-4">
          <div className="flex gap-3 flex-1 min-w-0">
            <Cookie className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-sm text-foreground space-y-1">
              <p>
                Nous utilisons des cookies essentiels au fonctionnement du site, et - avec votre accord -
                des cookies de préférence et d'analyse pour améliorer votre expérience. Voir notre{" "}
                <Link to="/politique-cookies" className="underline hover:text-primary">
                  politique des cookies
                </Link>.
              </p>
              {expanded && (
                <div className="pt-3 space-y-3 max-w-xl">
                  <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
                    <div>
                      <p className="font-medium text-sm">Essentiels</p>
                      <p className="text-xs text-muted-foreground">Connexion, sécurité, panier de réservation. Toujours actifs.</p>
                    </div>
                    <Switch checked disabled aria-label="Cookies essentiels (toujours actifs)" />
                  </div>
                  <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
                    <div>
                      <Label htmlFor="cookie-pref" className="font-medium text-sm cursor-pointer">Préférences</Label>
                      <p className="text-xs text-muted-foreground">Langue, devise, mode sombre.</p>
                    </div>
                    <Switch id="cookie-pref" checked={preferences} onCheckedChange={setPreferences} />
                  </div>
                  <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
                    <div>
                      <Label htmlFor="cookie-analytics" className="font-medium text-sm cursor-pointer">Analytique</Label>
                      <p className="text-xs text-muted-foreground">Mesure d'audience anonymisée pour améliorer le site.</p>
                    </div>
                    <Switch id="cookie-analytics" checked={analytics} onCheckedChange={setAnalytics} />
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground pt-1"
              >
                {expanded ? "Réduire" : "Personnaliser"}
                {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
            {expanded ? (
              <Button onClick={() => savePreferences({ preferences, analytics })} className="whitespace-nowrap">
                Enregistrer mes choix
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={rejectNonEssential} className="whitespace-nowrap">
                  Refuser les non-essentiels
                </Button>
                <Button onClick={acceptAll} className="whitespace-nowrap">
                  Accepter tout
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
