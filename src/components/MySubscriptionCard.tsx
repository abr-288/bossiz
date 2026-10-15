import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Crown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { currentLocaleTag } from "@/lib/dateLocale";
import { autoConvertAndFormat } from "@/utils/currencyConverter";

interface UserSubscription {
  id: string;
  plan_id: string;
  plan_name: string | null;
  status: string;
  billing_cycle: string;
  end_date: string | null;
  amount_paid: number | null;
  currency: string | null;
}

const STATUS_BADGE: Record<string, string> = {
  active: "bg-success/10 text-success border-success/30",
  pending: "bg-warning/10 text-warning-foreground border-warning/30",
  expired: "bg-muted text-muted-foreground",
  cancelled: "bg-muted text-muted-foreground",
};

// Abonnement Bossiz du client : l'actif s'il y en a un, sinon le plus récent
// (une tentative de paiement non aboutie, ou un abonnement terminé).
export function MySubscriptionCard({ userId }: { userId: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("user_subscriptions")
        .select("id, plan_id, plan_name, status, billing_cycle, end_date, amount_paid, currency")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);
      const rows = (data as unknown as UserSubscription[]) || [];
      setSubscription(rows.find((row) => row.status === "active") || rows[0] || null);
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{subscription.plan_name || subscription.plan_id}</span>
                <Badge variant="outline" className={STATUS_BADGE[subscription.status]}>
                  {statusLabel[subscription.status] || subscription.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {subscription.billing_cycle === "yearly" ? t("ux.account.subYearly") : t("ux.account.subMonthly")}
                {subscription.status === "active" && subscription.amount_paid
                  ? ` · ${autoConvertAndFormat(Number(subscription.amount_paid), subscription.currency || "XOF")}`
                  : ""}
                {subscription.end_date && subscription.status === "active" &&
                  ` · ${t("ux.account.subValidUntil", { date: formatDate(subscription.end_date) })}`}
                {subscription.end_date && (subscription.status === "expired" || subscription.status === "cancelled") &&
                  ` · ${t("ux.account.subEndedOn", { date: formatDate(subscription.end_date) })}`}
              </p>
            </div>
            {subscription.status !== "active" && (
              <Button onClick={() => navigate(`/subscription-payment?planId=${subscription.plan_id}`)}>
                {subscription.status === "pending" ? t("ux.account.subRetry") : t("ux.account.subRenew")}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
