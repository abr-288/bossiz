import { Fragment, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, Download, Info } from "lucide-react";
import { AgencyLayout } from "@/components/agency/AgencyLayout";
import { FinanceSummaryCards } from "@/components/agency/FinanceSummaryCards";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import {
  monthPeriod,
  parseFinanceSummary,
  useCommissionRateHistory,
  useFinanceSummary,
  useFinanceTransactions,
  yearPeriod,
  type FinancePeriod,
  type FinanceTransaction,
} from "@/hooks/usePartnerData";
import { usePartnerPortal } from "@/hooks/usePartnerPortal";
import { formatAmount, formatDate, formatMonth, formatRate } from "@/lib/partnerFormat";
import { buildStatementHtml, printStatement } from "@/lib/partnerStatement";

const TABS = ["revenue", "commissions", "payouts", "statements"] as const;
type FinanceTab = (typeof TABS)[number];

const PERIODS = ["this_month", "last_month", "this_year", "all"] as const;
type PeriodKey = (typeof PERIODS)[number];

const periodFor = (key: PeriodKey): FinancePeriod =>
  key === "this_month"
    ? monthPeriod(0)
    : key === "last_month"
      ? monthPeriod(-1)
      : key === "this_year"
        ? yearPeriod()
        : { from: null, to: null };

const statusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" =>
  status === "paid"
    ? "default"
    : status === "cancelled"
      ? "destructive"
      : status === "pending"
        ? "outline"
        : "secondary";

export default function AgencyFinances() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const tab: FinanceTab = TABS.includes(tabParam as FinanceTab) ? (tabParam as FinanceTab) : "revenue";
  const [periodKey, setPeriodKey] = useState<PeriodKey>("this_month");
  const period = periodFor(periodKey);

  const summary = useFinanceSummary(period);
  const transactions = useFinanceTransactions(period);
  const rows = transactions.data ?? [];

  const changeTab = (value: string) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", value);
    setSearchParams(next, { replace: true });
  };

  return (
    <AgencyLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t("ux.partner.finances.title")}</h1>
            <p className="text-muted-foreground">{t("ux.partner.finances.subtitle")}</p>
          </div>
          {tab !== "statements" && (
            <Select value={periodKey} onValueChange={(v) => setPeriodKey(v as PeriodKey)}>
              <SelectTrigger className="w-full sm:w-48" aria-label={t("ux.partner.finances.period")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIODS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {t(`ux.partner.finances.periods.${p}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {tab !== "statements" && <FinanceSummaryCards summary={summary.data} loading={summary.isLoading} />}

        <Tabs value={tab} onValueChange={changeTab}>
          <TabsList className="h-auto flex-wrap">
            {TABS.map((key) => (
              <TabsTrigger key={key} value={key}>
                {t(`ux.partner.menu.finances_${key}`)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {transactions.isError ? (
          <p className="py-10 text-center text-muted-foreground">{t("ux.partner.loadError")}</p>
        ) : tab === "revenue" ? (
          <RevenueTab rows={rows} loading={transactions.isLoading} />
        ) : tab === "commissions" ? (
          <CommissionsTab rows={rows} loading={transactions.isLoading} />
        ) : tab === "payouts" ? (
          <PayoutsTab rows={rows} loading={transactions.isLoading} />
        ) : (
          <StatementsTab />
        )}
      </div>
    </AgencyLayout>
  );
}

function EmptyRow({ colSpan, loading }: { colSpan: number; loading: boolean }) {
  const { t } = useTranslation();
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="py-10 text-center text-muted-foreground">
        {loading ? t("ux.partner.loading") : t("ux.partner.finances.empty")}
      </TableCell>
    </TableRow>
  );
}

function TxStatus({ tx }: { tx: FinanceTransaction }) {
  const { t } = useTranslation();
  return <Badge variant={statusVariant(tx.status)}>{t(`ux.partner.finances.status.${tx.status}`)}</Badge>;
}

function RevenueTab({ rows, loading }: { rows: FinanceTransaction[]; loading: boolean }) {
  const { t } = useTranslation();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("ux.partner.menu.finances_revenue")}</CardTitle>
        <CardDescription>{t("ux.partner.finances.revenueHelp")}</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("ux.partner.finances.date")}</TableHead>
              <TableHead>{t("ux.partner.finances.reference")}</TableHead>
              <TableHead>{t("ux.partner.finances.service")}</TableHead>
              <TableHead>{t("ux.partner.finances.collection")}</TableHead>
              <TableHead className="text-right">{t("ux.partner.finances.gross")}</TableHead>
              <TableHead>{t("ux.partner.finances.statusLabel")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <EmptyRow colSpan={6} loading={loading} />
            ) : (
              rows.map((tx) => (
                <TableRow key={tx.transaction_id} className={tx.status === "cancelled" ? "text-muted-foreground" : ""}>
                  <TableCell className="whitespace-nowrap">{formatDate(tx.transaction_date)}</TableCell>
                  <TableCell className="font-mono text-xs">{tx.reference}</TableCell>
                  <TableCell>{tx.label}</TableCell>
                  <TableCell>{t(`ux.partner.finances.collections.${tx.collection}`)}</TableCell>
                  <TableCell className="whitespace-nowrap text-right font-medium">
                    {formatAmount(tx.gross_amount)}
                  </TableCell>
                  <TableCell>
                    <TxStatus tx={tx} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// Détail du calcul, vérifiable ligne par ligne.
function CommissionDetail({ tx }: { tx: FinanceTransaction }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-1 rounded-md bg-muted/50 p-3 text-sm">
      <p>
        {t("ux.partner.finances.detail.commission", {
          gross: formatAmount(tx.gross_amount),
          rate: formatRate(tx.commission_rate),
          commission: formatAmount(tx.commission_amount),
        })}
      </p>
      <p>
        {t("ux.partner.finances.detail.net", {
          gross: formatAmount(tx.gross_amount),
          commission: formatAmount(tx.commission_amount),
          net: formatAmount(tx.net_amount),
        })}
      </p>
      <p className="text-muted-foreground">
        {tx.rate_effective_from
          ? t("ux.partner.finances.detail.rateSince", { date: formatDate(tx.rate_effective_from) })
          : t("ux.partner.finances.detail.rateDefault")}
      </p>
      <p className="text-muted-foreground">{t(`ux.partner.finances.detail.collection_${tx.collection}`)}</p>
    </div>
  );
}

function CommissionsTab({ rows, loading }: { rows: FinanceTransaction[]; loading: boolean }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState<string | null>(null);
  const rates = useCommissionRateHistory();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{t("ux.partner.menu.finances_commissions")}</CardTitle>
          <CardDescription>{t("ux.partner.finances.commissionsHelp")}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("ux.partner.finances.date")}</TableHead>
                <TableHead>{t("ux.partner.finances.service")}</TableHead>
                <TableHead className="text-right">{t("ux.partner.finances.gross")}</TableHead>
                <TableHead className="text-right">{t("ux.partner.finances.rate")}</TableHead>
                <TableHead className="text-right">{t("ux.partner.finances.commission")}</TableHead>
                <TableHead className="text-right">{t("ux.partner.finances.net")}</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <EmptyRow colSpan={7} loading={loading} />
              ) : (
                rows.map((tx) => {
                  const expanded = open === tx.transaction_id;
                  return (
                    <Fragment key={tx.transaction_id}>
                      <TableRow className={tx.status === "cancelled" ? "text-muted-foreground line-through" : ""}>
                        <TableCell className="whitespace-nowrap">{formatDate(tx.transaction_date)}</TableCell>
                        <TableCell>
                          {tx.label}
                          <span className="block font-mono text-xs text-muted-foreground">{tx.reference}</span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-right">{formatAmount(tx.gross_amount)}</TableCell>
                        <TableCell className="whitespace-nowrap text-right">{formatRate(tx.commission_rate)}</TableCell>
                        <TableCell className="whitespace-nowrap text-right">
                          {formatAmount(tx.commission_amount)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-right font-semibold">
                          {formatAmount(tx.net_amount)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setOpen(expanded ? null : tx.transaction_id)}
                            aria-expanded={expanded}
                          >
                            {t("ux.partner.finances.detailButton")}
                            {expanded ? (
                              <ChevronUp className="ml-1 h-4 w-4" />
                            ) : (
                              <ChevronDown className="ml-1 h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                      {expanded && (
                        <TableRow>
                          <TableCell colSpan={7}>
                            <CommissionDetail tx={tx} />
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("ux.partner.finances.rateHistory")}</CardTitle>
          <CardDescription>{t("ux.partner.finances.rateHistoryHelp")}</CardDescription>
        </CardHeader>
        <CardContent>
          {(rates.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("ux.partner.finances.detail.rateDefault")}</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {(rates.data ?? []).map((r, index) => (
                <li key={r.effective_from} className="flex justify-between gap-4">
                  <span>
                    {t("ux.partner.finances.rateFrom", { date: formatDate(r.effective_from) })}
                    {index === 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {t("ux.partner.finances.current")}
                      </Badge>
                    )}
                  </span>
                  <span className="font-medium">{formatRate(r.platform_rate)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PayoutsTab({ rows, loading }: { rows: FinanceTransaction[]; loading: boolean }) {
  const { t } = useTranslation();
  const online = rows.filter((tx) => tx.collection === "online" && tx.status !== "cancelled");
  const done = online.filter((tx) => tx.status === "paid");
  const waiting = online.filter((tx) => tx.status === "pending");
  const toPay = rows.filter((tx) => tx.collection === "on_site" && tx.status !== "paid");
  const missingDetails = waiting.some((tx) => tx.payout_status === "awaiting_details");

  return (
    <div className="space-y-4">
      {missingDetails && (
        <div className="flex items-start gap-2 rounded-lg border border-warning-foreground/20 bg-warning p-3 text-sm text-warning-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            {t("ux.partner.finances.missingPayoutDetails")}{" "}
            <Link to="/agency/settings" className="font-medium underline">
              {t("ux.partner.menu.settings")}
            </Link>
          </p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("ux.partner.finances.payouts.pending")}</CardTitle>
          <CardDescription>{t("ux.partner.finances.payouts.pendingHelp")}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("ux.partner.finances.service")}</TableHead>
                <TableHead>{t("ux.partner.finances.payouts.dueAt")}</TableHead>
                <TableHead>{t("ux.partner.finances.statusLabel")}</TableHead>
                <TableHead className="text-right">{t("ux.partner.finances.net")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {waiting.length === 0 ? (
                <EmptyRow colSpan={4} loading={loading} />
              ) : (
                waiting.map((tx) => (
                  <TableRow key={tx.transaction_id}>
                    <TableCell>
                      {tx.label}
                      <span className="block text-xs text-muted-foreground">{formatDate(tx.transaction_date)}</span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {tx.payout_due_at ? formatDate(tx.payout_due_at) : t("ux.partner.finances.payouts.notScheduled")}
                    </TableCell>
                    <TableCell>
                      <Badge variant={tx.payout_status === "failed" ? "destructive" : "outline"}>
                        {t(`ux.partner.finances.payoutStatus.${tx.payout_status ?? "not_scheduled"}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right font-semibold">
                      {formatAmount(tx.net_amount)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("ux.partner.finances.payouts.done")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("ux.partner.finances.service")}</TableHead>
                <TableHead>{t("ux.partner.finances.payouts.paidAt")}</TableHead>
                <TableHead>{t("ux.partner.finances.reference")}</TableHead>
                <TableHead className="text-right">{t("ux.partner.finances.net")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {done.length === 0 ? (
                <EmptyRow colSpan={4} loading={loading} />
              ) : (
                done.map((tx) => (
                  <TableRow key={tx.transaction_id}>
                    <TableCell>{tx.label}</TableCell>
                    <TableCell className="whitespace-nowrap">{formatDate(tx.paid_at)}</TableCell>
                    <TableCell className="font-mono text-xs">{tx.payout_reference || tx.reference}</TableCell>
                    <TableCell className="whitespace-nowrap text-right font-semibold">
                      {formatAmount(tx.net_amount)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {toPay.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("ux.partner.finances.payouts.dueToBossiz")}</CardTitle>
            <CardDescription>{t("ux.partner.finances.payouts.dueToBossizHelp")}</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("ux.partner.finances.service")}</TableHead>
                  <TableHead>{t("ux.partner.finances.statusLabel")}</TableHead>
                  <TableHead>{t("ux.partner.finances.payouts.dueAt")}</TableHead>
                  <TableHead className="text-right">{t("ux.partner.finances.commission")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {toPay.map((tx) => (
                  <TableRow key={tx.transaction_id}>
                    <TableCell>
                      {tx.label}
                      <span className="block text-xs text-muted-foreground">{formatDate(tx.transaction_date)}</span>
                    </TableCell>
                    <TableCell>
                      <TxStatus tx={tx} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{formatDate(tx.payout_due_at)}</TableCell>
                    <TableCell className="whitespace-nowrap text-right font-semibold">
                      {formatAmount(tx.commission_amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatementsTab() {
  const { t } = useTranslation();
  const { data: portal } = usePartnerPortal();
  const all = useFinanceTransactions({ from: null, to: null });
  const [printing, setPrinting] = useState<string | null>(null);

  // Mois ayant au moins une transaction, du plus récent au plus ancien.
  const months = useMemo(() => {
    const set = new Set<string>();
    for (const tx of all.data ?? []) set.add(`${tx.transaction_date.slice(0, 7)}-01`);
    return [...set].sort().reverse();
  }, [all.data]);

  const download = async (monthStart: string) => {
    setPrinting(monthStart);
    const [y, m] = monthStart.split("-").map(Number);
    const last = new Date(y, m, 0).getDate();
    const period = { p_from: monthStart, p_to: `${monthStart.slice(0, 7)}-${String(last).padStart(2, "0")}` };
    // Relevé construit à partir des mêmes fonctions que l'écran.
    const [summaryRes, txRes] = await Promise.all([
      supabase.rpc("agency_finance_summary", period),
      supabase.rpc("agency_finance_transactions", period),
    ]);
    setPrinting(null);
    if (summaryRes.error || txRes.error) {
      toast.error(t("ux.partner.loadError"));
      return;
    }
    const html = buildStatementHtml({
      partnerName: portal?.name ?? "",
      periodLabel: formatMonth(monthStart),
      summary: parseFinanceSummary(summaryRes.data),
      transactions: txRes.data ?? [],
    });
    if (!printStatement(html)) toast.error(t("ux.partner.finances.statements.popupBlocked"));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("ux.partner.menu.finances_statements")}</CardTitle>
        <CardDescription>{t("ux.partner.finances.statements.help")}</CardDescription>
      </CardHeader>
      <CardContent>
        {all.isLoading ? (
          <p className="text-sm text-muted-foreground">{t("ux.partner.loading")}</p>
        ) : months.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("ux.partner.finances.empty")}</p>
        ) : (
          <ul className="divide-y">
            {months.map((month) => (
              <li key={month} className="flex items-center justify-between gap-4 py-3">
                <span className="font-medium capitalize">{formatMonth(month)}</span>
                <Button variant="outline" size="sm" onClick={() => download(month)} disabled={printing === month}>
                  <Download className="mr-2 h-4 w-4" />
                  {t("ux.partner.finances.statements.download")}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
