import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Cookie, ChevronDown, ChevronUp } from "lucide-react";
import { useCookieConsent } from "@/hooks/useCookieConsent";
import { useTranslation } from "react-i18next";

// Bandeau de consentement cookies - Loi ivoirienne n°2013-450 (ARTCI) et
// RGPD pour les visiteurs européens. Les cookies essentiels tournent déjà
// sans consentement (session, sécurité) ; ce bandeau ne bloque que
// "préférences" et "analytique", désactivés tant que l'utilisateur n'a pas
// répondu.
// Pages de compte où le bandeau masquait le bouton de validation sur mobile :
// il réapparaît à la page suivante.
const HIDDEN_ON = ["/reset-password", "/forgot-password", "/auth"];

export function CookieConsentBanner() {
  const { t } = useTranslation();
  const { hasResponded, acceptAll, rejectNonEssential, savePreferences } = useCookieConsent();
  const [expanded, setExpanded] = useState(false);
  const [preferences, setPreferences] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const { pathname } = useLocation();

  if (hasResponded || HIDDEN_ON.includes(pathname)) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={t("ux.cookies.dialogLabel")}
      className="fixed inset-x-0 bottom-0 z-banner border-t border-border bg-card shadow-lg animate-in slide-in-from-bottom-5"
    >
      <div className="site-container py-4 md:py-5">
        <div className="flex flex-col md:flex-row md:items-start gap-4">
          <div className="flex gap-3 flex-1 min-w-0">
            <Cookie className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-sm text-foreground space-y-1">
              <p>
                {t("ux.cookies.intro")}{" "}
                <Link to="/politique-cookies" className="underline hover:text-primary">
                  {t("ux.cookies.policyLink")}
                </Link>.
              </p>
              {expanded && (
                <div className="pt-3 space-y-3 max-w-xl">
                  <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
                    <div>
                      <p className="font-medium text-sm">{t("ux.cookies.essential")}</p>
                      <p className="text-xs text-muted-foreground">{t("ux.cookies.essentialDesc")}</p>
                    </div>
                    <Switch checked disabled aria-label={t("ux.cookies.essentialLabel")} />
                  </div>
                  <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
                    <div>
                      <Label htmlFor="cookie-pref" className="font-medium text-sm cursor-pointer">{t("ux.cookies.preferences")}</Label>
                      <p className="text-xs text-muted-foreground">{t("ux.cookies.preferencesDesc")}</p>
                    </div>
                    <Switch id="cookie-pref" checked={preferences} onCheckedChange={setPreferences} />
                  </div>
                  <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
                    <div>
                      <Label htmlFor="cookie-analytics" className="font-medium text-sm cursor-pointer">{t("ux.cookies.analytics")}</Label>
                      <p className="text-xs text-muted-foreground">{t("ux.cookies.analyticsDesc")}</p>
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
                {expanded ? t("ux.cookies.collapse") : t("ux.cookies.customize")}
                {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
            {expanded ? (
              <Button onClick={() => savePreferences({ preferences, analytics })} className="whitespace-nowrap">
                {t("ux.cookies.save")}
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={rejectNonEssential} className="whitespace-nowrap">
                  {t("ux.cookies.reject")}
                </Button>
                <Button onClick={acceptAll} className="whitespace-nowrap">
                  {t("ux.cookies.accept")}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
