import { useTranslation } from "react-i18next";
import { Banknote, Clock, Receipt, Wallet, TrendingUp, FileWarning } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { FinanceSummary } from "@/hooks/usePartnerData";
import { formatAmount } from "@/lib/partnerFormat";

// Totaux de agency_finance_summary(), affichés à l'identique sur le tableau
// de bord et dans la rubrique Finances.
export function FinanceSummaryCards({
  summary,
  loading,
  compact = false,
}: {
  summary: FinanceSummary | undefined;
  loading?: boolean;
  compact?: boolean;
}) {
  const { t } = useTranslation();
  const items = [
    { key: "gross", icon: TrendingUp, value: summary?.gross },
    { key: "commission", icon: Receipt, value: summary?.commission },
    { key: "net", icon: Wallet, value: summary?.net, highlight: true },
    ...(compact
      ? []
      : [
          { key: "paid_out", icon: Banknote, value: summary?.paid_out },
          { key: "pending_payout", icon: Clock, value: summary?.pending_payout },
          ...(summary && summary.due_to_bossiz > 0
            ? [{ key: "due_to_bossiz", icon: FileWarning, value: summary.due_to_bossiz }]
            : []),
        ]),
  ];

  return (
    <div className={`grid gap-3 sm:grid-cols-2 ${compact ? "lg:grid-cols-3" : "lg:grid-cols-3 xl:grid-cols-6"}`}>
      {items.map(({ key, icon: Icon, value, highlight }) => (
        <Card key={key} className={highlight ? "border-primary/40" : undefined}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
              <span>{t(`ux.partner.finances.totals.${key}`)}</span>
              <Icon className="h-4 w-4 shrink-0" />
            </div>
            <p className={`mt-1 text-xl font-bold ${highlight ? "text-primary" : ""}`}>
              {loading || value === undefined ? "…" : formatAmount(value)}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
