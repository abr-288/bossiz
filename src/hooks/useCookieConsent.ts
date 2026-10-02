import { useCallback, useEffect, useState } from "react";

// Consentement cookies (Loi ivoirienne n°2013-450 / ARTCI + RGPD pour les
// visiteurs européens). Les cookies "essentiels" (session, sécurité) sont
// toujours actifs et ne demandent pas de consentement. "Préférences" et
// "Analytique" sont désactivés par défaut tant que l'utilisateur n'a pas
// répondu - c'est le bandeau qui déclenche le premier choix.

export type CookieCategory = "essential" | "preferences" | "analytics";

export interface CookieConsent {
  essential: true;
  preferences: boolean;
  analytics: boolean;
  decidedAt: string;
}

const STORAGE_KEY = "bossiz-cookie-consent";
const CONSENT_VERSION = 1;

function readStoredConsent(): CookieConsent | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.version !== CONSENT_VERSION) return null;
    return parsed.consent as CookieConsent;
  } catch {
    return null;
  }
}

function writeStoredConsent(consent: CookieConsent) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: CONSENT_VERSION, consent }));
  } catch {
    // Stockage indisponible (navigation privée stricte, etc.) : le bandeau
    // réapparaîtra à la visite suivante, ce n'est pas bloquant.
  }
}

export function useCookieConsent() {
  const [consent, setConsent] = useState<CookieConsent | null>(() => readStoredConsent());

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setConsent(readStoredConsent());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const save = useCallback((partial: { preferences: boolean; analytics: boolean }) => {
    const next: CookieConsent = {
      essential: true,
      preferences: partial.preferences,
      analytics: partial.analytics,
      decidedAt: new Date().toISOString(),
    };
    writeStoredConsent(next);
    setConsent(next);
  }, []);

  const acceptAll = useCallback(() => save({ preferences: true, analytics: true }), [save]);
  const rejectNonEssential = useCallback(() => save({ preferences: false, analytics: false }), [save]);

  return {
    consent,
    hasResponded: consent !== null,
    acceptAll,
    rejectNonEssential,
    savePreferences: save,
  };
}
