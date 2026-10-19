import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Smiles « utilisation de l'application » et parrainage, sans action du client :
// - un lien de parrainage (?ref=BZXXXXXX) est mémorisé jusqu'à la connexion,
//   puis appliqué au compte (nouveaux clients uniquement, vérifié en base) ;
// - la visite du jour est enregistrée une fois par jour (le serveur refuse
//   de toute façon un second gain le même jour).
const REF_KEY = "bossiz_referral_code";
const REF_PATTERN = /^BZ[0-9A-F]{6}$/i;

const storage = {
  get: (key: string) => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set: (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch {
      // stockage indisponible : on retentera à la prochaine visite
    }
  },
  remove: (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch {
      // idem
    }
  },
};

export default function LoyaltyAutoCheckin() {
  const { t } = useTranslation();
  const { search } = useLocation();

  useEffect(() => {
    const ref = new URLSearchParams(search).get("ref");
    if (ref && REF_PATTERN.test(ref)) storage.set(REF_KEY, ref.toUpperCase());
  }, [search]);

  useEffect(() => {
    let running = false;

    const run = async (userId: string) => {
      if (running) return;
      running = true;
      try {
        const referral = storage.get(REF_KEY);
        if (referral) {
          const { data, error } = await supabase.rpc("loyalty_apply_referral", { p_code: referral });
          if (!error) {
            storage.remove(REF_KEY);
            if ((data as { ok?: boolean } | null)?.ok) toast.success(t("ux.smiles.referralApplied"));
          }
        }

        const today = new Date().toISOString().slice(0, 10);
        const key = `bossiz_checkin_${userId}`;
        if (storage.get(key) === today) return;
        const { data, error } = await supabase.rpc("loyalty_daily_checkin");
        if (error) return;
        storage.set(key, today);
        const result = data as { awarded: boolean; points?: number; bonus?: number; streak: number } | null;
        if (result?.awarded) {
          toast.success(t("ux.smiles.checkinToast", { points: (result.points ?? 0) + (result.bonus ?? 0), streak: result.streak }));
        }
      } finally {
        running = false;
      }
    };

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) void run(session.user.id);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) void run(session.user.id);
    });
    return () => subscription.unsubscribe();
  }, [t]);

  return null;
}
