import { useEffect, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { autoConvertAndFormat } from "@/utils/currencyConverter";

interface PaidSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  plan_name: string | null;
  status: string;
  billing_cycle: string;
  start_date: string | null;
  end_date: string | null;
  amount_paid: number | null;
  currency: string | null;
}

interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
}

const STATUS_BADGE: Record<string, string> = {
  active: "bg-success/10 text-success border-success/30",
  expired: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/10 text-destructive border-destructive/30",
};

// Abonnements payés en ligne (user_subscriptions activés par le webhook
// Jèko). Les tentatives non payées ('pending') ne sont pas listées.
export function PaidSubscriptionsTable({ refreshKey }: { refreshKey: number }) {
  const { t } = useTranslation();
  const [rows, setRows] = useState<PaidSubscription[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const { data } = await supabase
        .from("user_subscriptions")
        .select("id, user_id, plan_id, plan_name, status, billing_cycle, start_date, end_date, amount_paid, currency")
        .in("status", ["active", "expired", "cancelled"])
        .order("start_date", { ascending: false })
        .limit(200);
      const subscriptions = (data as unknown as PaidSubscription[]) || [];
      setRows(subscriptions);

      const userIds = [...new Set(subscriptions.map((s) => s.user_id))];
      if (userIds.length > 0) {
        const { data: profileRows } = await supabase.from("profiles").select("id, full_name, phone").in("id", userIds);
        setProfiles(Object.fromEntries((profileRows || []).map((p) => [p.id, p])));
      }
      setIsLoading(false);
    };
    void load();
  }, [refreshKey]);

  const statusLabel: Record<string, string> = {
    active: t("ux.bo.subActive"),
    expired: t("ux.bo.subExpired"),
    cancelled: t("ux.bo.subCancelled"),
  };
  const formatDate = (iso: string | null) => (iso ? format(new Date(iso), "dd MMM yyyy", { locale: fr }) : "-");

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {t("ux.bo.paidSubsTitle")} ({rows.length})
        </CardTitle>
        <CardDescription>{t("ux.bo.paidSubsDesc")}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">{t("ux.bo.noPaidSubs")}</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("ux.bo.subClient")}</TableHead>
                  <TableHead>{t("ux.bo.offer")}</TableHead>
                  <TableHead>{t("ux.bo.subPeriod")}</TableHead>
                  <TableHead>{t("ux.bo.subAmount")}</TableHead>
                  <TableHead>{t("ux.bo.status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => {
                  const profile = profiles[row.user_id];
                  return (
                    <TableRow key={row.id}>
                      <TableCell>
                        <p className="font-medium">{profile?.full_name || row.user_id.slice(0, 8)}</p>
                        {profile?.phone && <p className="text-xs text-muted-foreground">{profile.phone}</p>}
                      </TableCell>
                      <TableCell>
                        <p>{row.plan_name || row.plan_id}</p>
                        <p className="text-xs text-muted-foreground">
                          {row.billing_cycle === "yearly" ? t("ux.account.subYearly") : t("ux.account.subMonthly")}
                        </p>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(row.start_date)} → {formatDate(row.end_date)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {row.amount_paid ? autoConvertAndFormat(Number(row.amount_paid), row.currency || "XOF") : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={STATUS_BADGE[row.status]}>
                          {statusLabel[row.status] || row.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
