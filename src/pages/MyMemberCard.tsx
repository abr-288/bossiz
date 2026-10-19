import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { MemberCard } from "@/components/MemberCard";

interface CardData {
  planId: string;
  planName: string;
  validUntil: string | null;
  holderName: string;
  memberCode: string;
}

// Carte de membre en plein écran, à présenter au personnel ou à un
// partenaire (salon VIP, transfert...) qui scanne le QR code.
const MyMemberCard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [card, setCard] = useState<CardData | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      const [{ data: subs }, { data: profile }] = await Promise.all([
        supabase
          .from("user_subscriptions")
          .select("plan_id, plan_name, end_date")
          .eq("user_id", session.user.id)
          .eq("status", "active")
          .order("end_date", { ascending: false })
          .limit(1),
        supabase.from("profiles").select("full_name, member_code").eq("id", session.user.id).maybeSingle(),
      ]);
      const active = subs?.[0];
      if (active && profile?.member_code) {
        setCard({
          planId: active.plan_id,
          planName: active.plan_name || active.plan_id,
          validUntil: active.end_date,
          holderName: profile.full_name || session.user.email?.split("@")[0] || "",
          memberCode: profile.member_code,
        });
      }
      setLoaded(true);
    };
    void load();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#0B1120] text-white flex flex-col items-center justify-center gap-6 px-4 py-10">
      {!loaded ? (
        <Loader2 className="h-10 w-10 animate-spin" />
      ) : card ? (
        <>
          <MemberCard
            size="lg"
            planId={card.planId}
            planName={card.planName}
            holderName={card.holderName}
            memberCode={card.memberCode}
            validUntil={card.validUntil}
          />
          <p className="max-w-md text-center text-sm text-white/70">{t("ux.memberCard.fullscreenHint")}</p>
        </>
      ) : (
        <p className="text-center text-white/80">{t("ux.memberCard.noActive")}</p>
      )}
      <Button variant="secondary" onClick={() => navigate("/account")}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        {t("ux.memberCard.back")}
      </Button>
    </div>
  );
};

export default MyMemberCard;
