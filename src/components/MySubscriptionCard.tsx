import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Crown, FileText, Loader2, Maximize2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { currentLocaleTag } from "@/lib/dateLocale";
import { autoConvertAndFormat } from "@/utils/currencyConverter";
import { useSubscriptionReceipt } from "@/hooks/useSubscriptionReceipt";
import { MemberCard } from "@/components/MemberCard";

interface UserSubscription {
  id: string;
  plan_id: string;
  plan_name: string | null;
  status: string;
  billing_cycle: string;
  end_date: string | null;
  last_payment_date: string | null;
  amount_paid: number | null;
  currency: string | null;
}

const STATUS_BADGE: Record<string, string> = {
  active: "bg-success/10 text-success border-success/30",
  pending: "bg-warning/10 text-warning-foreground border-warning/30",
  expired: "bg-muted text-muted-foreground",
  cancelled: "bg-muted text-muted-foreground",
};

// Le bouton « Renouveler » apparaît sur un abonnement actif à partir de
// RENEW_WINDOW_DAYS jours de l'échéance (Jèko ne permet pas de prélèvement
// récurrent : le client renouvelle lui-même, sans perdre de jours).
const RENEW_WINDOW_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

// Abonnement Bossiz du client : l'actif qui court le plus loin s'il y en a
// un (un renouvellement anticipé crée une période qui suit la précédente),
// sinon le plus récent (tentative non aboutie, ou abonnement terminé).
export function MySubscriptionCard({ userId }: { userId: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { generateReceipt, isGenerating } = useSubscriptionReceipt();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [features, setFeatures] = useState<string[]>([]);
  const [holder, setHolder] = useState<{ name: string; memberCode: string } | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("user_subscriptions")
        .select("id, plan_id, plan_name, status, billing_cycle, end_date, last_payment_date, amount_paid, currency")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);
      const rows = (data as unknown as UserSubscription[]) || [];
      const active = rows
        .filter((row) => row.status === "active")
        .sort((a, b) => (b.end_date ?? "").localeCompare(a.end_date ?? ""))[0];
      const shown = active || rows[0] || null;
      setSubscription(shown);

      if (shown && shown.status !== "pending") {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, member_code")
          .eq("id", userId)
          .maybeSingle();
        if (profile?.member_code) {
          setHolder({ name: profile.full_name || "", memberCode: profile.member_code });
        }
      }

      if (shown?.status === "active") {
        const { data: plan } = await supabase
          .from("subscription_plans")
          .select("features")
          .eq("plan_id", shown.plan_id)
          .maybeSingle();
        setFeatures(((plan?.features as string[] | null) || []).slice(0, 6));
      }
      setLoaded(true);
    };
    void load();
  }, [userId]);

  if (!loaded) return null;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(currentLocaleTag(), { day: "numeric", month: "long", year: "numeric" });

  const statusLabel: Record<string, string> = {
    active: t("ux.account.subActive"),
    pending: t("ux.account.subPending"),
    expired: t("ux.account.subExpired"),
    cancelled: t("ux.account.subCancelled"),
  };

  const daysLeft =
    subscription?.status === "active" && subscription.end_date
      ? Math.ceil((new Date(subscription.end_date).getTime() - Date.now()) / DAY_MS)
      : null;
  const canRenew = subscription
    ? subscription.status !== "active" || (daysLeft !== null && daysLeft <= RENEW_WINDOW_DAYS)
    : false;
  const hasReceipt = !!subscription?.last_payment_date && subscription.status !== "pending";

  return (
    <Card className="mb-6 backdrop-blur-sm bg-card/80 border-primary/10 shadow-xl">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Crown className="h-5 w-5 text-primary" />
          {t("ux.account.subTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!subscription ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">{t("ux.account.subNone")}</p>
            <Button variant="outline" onClick={() => navigate("/")}>
              {t("ux.account.subDiscover")}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {holder && subscription.status !== "pending" && (
              <div className="flex flex-col items-center gap-3 sm:items-start">
                <MemberCard
                  planId={subscription.plan_id}
                  planName={subscription.plan_name || subscription.plan_id}
                  holderName={holder.name}
                  memberCode={holder.memberCode}
                  validUntil={subscription.end_date}
                  expired={subscription.status !== "active"}
                />
                {subscription.status === "active" && (
                  <Button variant="outline" size="sm" onClick={() => navigate("/ma-carte")}>
                    <Maximize2 className="mr-2 h-4 w-4" />
                    {t("ux.memberCard.showFullscreen")}
                  </Button>
                )}
              </div>
            )}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{subscription.plan_name || subscription.plan_id}</span>
                  <Badge variant="outline" className={STATUS_BADGE[subscription.status]}>
                    {statusLabel[subscription.status] || subscription.status}
                  </Badge>
                  {daysLeft !== null && daysLeft <= RENEW_WINDOW_DAYS && (
                    <Badge variant="outline" className="bg-warning/10 text-warning-foreground border-warning/30">
                      {t("ux.account.subExpiresSoon", { count: Math.max(daysLeft, 0) })}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {subscription.billing_cycle === "yearly" ? t("ux.account.subYearly") : t("ux.account.subMonthly")}
                  {subscription.status === "active" && subscription.amount_paid
                    ? ` · ${autoConvertAndFormat(Number(subscription.amount_paid), subscription.currency || "XOF")}`
                    : ""}
                  {subscription.end_date &&
                    subscription.status === "active" &&
                    ` · ${t("ux.account.subValidUntil", { date: formatDate(subscription.end_date) })}`}
                  {subscription.end_date &&
                    (subscription.status === "expired" || subscription.status === "cancelled") &&
                    ` · ${t("ux.account.subEndedOn", { date: formatDate(subscription.end_date) })}`}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {hasReceipt && (
                  <Button
                    variant="outline"
                    disabled={isGenerating}
                    onClick={() => generateReceipt(subscription.id, "paid")}
                  >
                    {isGenerating ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <FileText className="mr-2 h-4 w-4" />
                    )}
                    {t("ux.account.subReceipt")}
                  </Button>
                )}
                {canRenew && (
                  <Button onClick={() => navigate(`/subscription-payment?planId=${subscription.plan_id}`)}>
                    {subscription.status === "pending" ? t("ux.account.subRetry") : t("ux.account.subRenew")}
                  </Button>
                )}
              </div>
            </div>

            {features.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">{t("ux.account.subAdvantages")}</p>
                <ul className="grid sm:grid-cols-2 gap-1.5">
                  {features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-success shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
