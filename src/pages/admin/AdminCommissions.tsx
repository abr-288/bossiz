import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Car, Download, Hotel, Info, Search, Settings } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PeriodPicker } from "@/components/admin/PeriodPicker";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { downloadCsv, toCsv } from "@/lib/csv";
import {
  ONSITE_STATUS,
  PAYOUT_FILTERS,
  canMarkPaid,
  formatDay,
  formatXof,
  payoutState,
  periodFromPreset,
  sourceLabel,
  useAdminFinanceTransactions,
  type FinanceTransaction,
  type Period,
} from "@/lib/adminFinance";

const PRESETS = ["7d", "30d", "month", "last_month", "year", "all"] as const;
const PAGE = 100;

const sum = (rows: FinanceTransaction[], key: "gross_amount" | "commission_amount" | "net_amount") =>
  rows.reduce((s, r) => s + Number(r[key] ?? 0), 0);

function Stat({ title, value, hint }: { title: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardContent className="space-y-1 p-4">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function Explainer() {
  return (
    <div className="flex gap-3 rounded-lg border bg-muted/40 p-4 text-sm">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <div className="space-y-1">
        <p>
          <strong>Paiement en ligne (Jèko)</strong> : Bossiz encaisse le montant total, garde sa commission (le taux du
          partenaire, 10 % par défaut) et reverse le reste au partenaire.
        </p>
        <p>
          <strong>Hôtel payé sur place</strong> : l'hôtel encaisse le client et doit la commission à Bossiz, facturée
          chaque mois.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Onglet « Gains Bossiz »
// ---------------------------------------------------------------------------
function GainsTab() {
  const [period, setPeriod] = useState<Period>(() => periodFromPreset("month"));
  const { data = [], isLoading, isError } = useAdminFinanceTransactions(period);
  const rows = useMemo(() => data.filter((r) => r.status !== "cancelled"), [data]);

  const online = rows.filter((r) => r.collection === "online");
  const onsite = rows.filter((r) => r.collection === "on_site");
  const onsiteOpen = onsite.filter((r) => r.status !== "paid");

  const byPartner = useMemo(() => {
    const map = new Map<string, { name: string; gross: number; gain: number; lines: number }>();
    for (const r of rows) {
      const key = r.agency_id ?? "—";
      const cur = map.get(key) ?? { name: r.agency_name ?? "Partenaire supprimé", gross: 0, gain: 0, lines: 0 };
      cur.gross += Number(r.gross_amount);
      cur.gain += Number(r.commission_amount);
      cur.lines += 1;
      map.set(key, cur);
    }
    return [...map.values()].sort((a, b) => b.gain - a.gain);
  }, [rows]);

  const byType = useMemo(() => {
    const map = new Map<string, { gross: number; gain: number; lines: number }>();
    for (const r of rows) {
      const key = sourceLabel(r.source_type);
      const cur = map.get(key) ?? { gross: 0, gain: 0, lines: 0 };
      cur.gross += Number(r.gross_amount);
      cur.gain += Number(r.commission_amount);
      cur.lines += 1;
      map.set(key, cur);
    }
    return [...map.entries()].sort((a, b) => b[1].gain - a[1].gain);
  }, [rows]);

  const exportCsv = () =>
    downloadCsv(
      `gains-bossiz-${period.from || "debut"}-${period.to || "aujourdhui"}.csv`,
      toCsv(
        rows.map((r) => ({
          date: formatDay(r.transaction_date),
          partner: r.agency_name,
          type: sourceLabel(r.source_type),
          label: r.label,
          reference: r.reference,
          collection: r.collection === "online" ? "En ligne" : "Sur place",
          gross: Number(r.gross_amount),
          rate: Number(r.commission_rate),
          gain: Number(r.commission_amount),
        })),
        [
          { key: "date", label: "Date" },
          { key: "partner", label: "Partenaire" },
          { key: "type", label: "Type" },
          { key: "label", label: "Prestation" },
          { key: "reference", label: "Référence" },
          { key: "collection", label: "Encaissement" },
          { key: "gross", label: "Vente (FCFA)" },
          { key: "rate", label: "Taux Bossiz (%)" },
          { key: "gain", label: "Gain Bossiz (FCFA)" },
        ],
      ),
    );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <PeriodPicker value={period} onChange={setPeriod} presets={[...PRESETS]} />
        <Button variant="outline" size="sm" onClick={exportCsv} disabled={rows.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Exporter (CSV)
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Chargement…</p>
      ) : isError ? (
        <p className="text-muted-foreground">
          Impossible de charger les commissions. Vérifiez que la migration 20261030000000 a bien été exécutée.
        </p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat
              title="Gains Bossiz sur les partenaires"
              value={formatXof(sum(rows, "commission_amount"))}
              hint={`${rows.length} vente(s) de partenaires`}
            />
            <Stat title="Dont paiements en ligne" value={formatXof(sum(online, "commission_amount"))} />
            <Stat
              title="Dont hôtels payés sur place"
              value={formatXof(sum(onsite, "commission_amount"))}
              hint={
                onsiteOpen.length
                  ? `${formatXof(sum(onsiteOpen, "commission_amount"))} pas encore encaissés`
                  : undefined
              }
            />
            <Stat title="Ventes des partenaires" value={formatXof(sum(rows, "gross_amount"))} />
          </div>

          <p className="text-xs text-muted-foreground">
            Les marges sur les réservations sans partenaire (vols, hôtels et voitures via nos fournisseurs) et les
            abonnements sont comptés dans les gains du{" "}
            <Link to="/admin" className="underline underline-offset-2">
              tableau de bord
            </Link>
            .
          </p>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Par partenaire</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {byPartner.length === 0 ? (
                  <p className="px-6 pb-6 text-sm text-muted-foreground">
                    Aucune vente de partenaire sur cette période.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Partenaire</TableHead>
                          <TableHead className="text-right">Nb de ventes</TableHead>
                          <TableHead className="text-right">Montant des ventes</TableHead>
                          <TableHead className="text-right">Gain Bossiz</TableHead>
                          <TableHead className="text-right">Taux moyen</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {byPartner.map((p) => (
                          <TableRow key={p.name}>
                            <TableCell className="font-medium">{p.name}</TableCell>
                            <TableCell className="text-right">{p.lines}</TableCell>
                            <TableCell className="whitespace-nowrap text-right">{formatXof(p.gross)}</TableCell>
                            <TableCell className="whitespace-nowrap text-right font-medium">
                              {formatXof(p.gain)}
                            </TableCell>
                            <TableCell className="text-right">
                              {p.gross
                                ? `${((p.gain / p.gross) * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`
                                : "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Par type de vente</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {byType.length === 0 ? (
                  <p className="px-6 pb-6 text-sm text-muted-foreground">—</p>
                ) : (
                  <Table>
                    <TableBody>
                      {byType.map(([label, v]) => (
                        <TableRow key={label}>
                          <TableCell>
                            {label}
                            <span className="block text-xs text-muted-foreground">
                              {v.lines} vente(s) · {formatXof(v.gross)}
                            </span>
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-right font-medium">
                            {formatXof(v.gain)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          {onsite.length > 0 && (
            <Card>
              <CardHeader className="flex flex-col gap-2 space-y-0 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-base">Hôtels payés sur place</CardTitle>
                  <CardDescription>Commissions dues par les hôtels à Bossiz.</CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/admin/hotel-commissions">
                    <Hotel className="mr-2 h-4 w-4" />
                    Gérer les factures
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fin du séjour</TableHead>
                        <TableHead>Hôtel</TableHead>
                        <TableHead className="text-right">Séjour</TableHead>
                        <TableHead className="text-right">Commission</TableHead>
                        <TableHead>Statut</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {onsite.map((r) => {
                        const st = ONSITE_STATUS[r.status] ?? { label: r.status, tone: "outline" as const };
                        return (
                          <TableRow key={r.transaction_id}>
                            <TableCell className="whitespace-nowrap">{formatDay(r.transaction_date)}</TableCell>
                            <TableCell>
                              {r.agency_name}
                              <span className="block text-xs text-muted-foreground">
                                {r.label} · {r.reference}
                              </span>
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-right">{formatXof(r.gross_amount)}</TableCell>
                            <TableCell className="whitespace-nowrap text-right">
                              {formatXof(r.commission_amount)}
                              <span className="block text-xs text-muted-foreground">{Number(r.commission_rate)} %</span>
                            </TableCell>
                            <TableCell>
                              <Badge variant={st.tone}>{st.label}</Badge>
                              {r.status === "issued" && r.payout_due_at && (
                                <span className="block text-xs text-muted-foreground">
                                  échéance {formatDay(r.payout_due_at)}
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Onglet « Reversements partenaires »
// ---------------------------------------------------------------------------
function PayoutsTab({ initialStatus }: { initialStatus: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState<Period>(() => periodFromPreset("all"));
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(initialStatus);
  const [limit, setLimit] = useState(PAGE);
  const [toMark, setToMark] = useState<FinanceTransaction | null>(null);
  const [saving, setSaving] = useState(false);
  const { data = [], isLoading, isError } = useAdminFinanceTransactions(period);

  const online = useMemo(() => data.filter((r) => r.collection === "online"), [data]);
  const pending = online.filter((r) => r.status === "pending");
  const blocked = pending.filter((r) => payoutState(r).key === "blocked");
  const paid = online.filter((r) => payoutState(r).key === "paid");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return online.filter((r) => {
      if (status !== "all" && payoutState(r).key !== status) return false;
      if (!q) return true;
      return [r.agency_name, r.reference, r.label].some((v) => v?.toLowerCase().includes(q));
    });
  }, [online, search, status]);

  const markPaid = async () => {
    if (!toMark) return;
    setSaving(true);
    const { error } = await supabase
      .from("commissions")
      .update({ status: "paid", paid_at: new Date().toISOString(), payout_status: "paid" })
      .eq("id", toMark.transaction_id.replace(/^commission:/, ""));
    setSaving(false);
    setToMark(null);
    if (error) {
      toast({ title: "Erreur", description: "Impossible de mettre à jour ce reversement.", variant: "destructive" });
      return;
    }
    toast({ title: "Reversement enregistré", description: `${toMark.agency_name} : ${formatXof(toMark.net_amount)}` });
    queryClient.invalidateQueries({ queryKey: ["admin-finance-transactions"] });
    queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
  };

  const exportCsv = () =>
    downloadCsv(
      `reversements-partenaires-${period.from || "debut"}-${period.to || "aujourdhui"}.csv`,
      toCsv(
        filtered.map((r) => {
          const st = payoutState(r);
          return {
            date: formatDay(r.transaction_date),
            partner: r.agency_name,
            type: sourceLabel(r.source_type),
            label: r.label,
            reference: r.reference,
            gross: Number(r.gross_amount),
            gain: Number(r.commission_amount),
            net: Number(r.net_amount),
            status: st.label,
            detail: st.hint ?? "",
            paid_at: r.paid_at ? formatDay(r.paid_at) : "",
            payout_reference: r.payout_reference ?? "",
          };
        }),
        [
          { key: "date", label: "Date" },
          { key: "partner", label: "Partenaire" },
          { key: "type", label: "Type" },
          { key: "label", label: "Prestation" },
          { key: "reference", label: "Référence" },
          { key: "gross", label: "Vente (FCFA)" },
          { key: "gain", label: "Part Bossiz (FCFA)" },
          { key: "net", label: "À verser au partenaire (FCFA)" },
          { key: "status", label: "Statut" },
          { key: "detail", label: "Détail" },
          { key: "paid_at", label: "Versé le" },
          { key: "payout_reference", label: "Référence de versement" },
        ],
      ),
    );

  return (
    <div className="space-y-4">
      {isLoading ? (
        <p className="text-muted-foreground">Chargement…</p>
      ) : isError ? (
        <p className="text-muted-foreground">
          Impossible de charger les reversements. Vérifiez que la migration 20261030000000 a bien été exécutée.
        </p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat
              title="À reverser aux partenaires"
              value={formatXof(sum(pending, "net_amount"))}
              hint={`${pending.length} vente(s) en attente de versement`}
            />
            <Stat
              title="Bloqués"
              value={formatXof(sum(blocked, "net_amount"))}
              hint={blocked.length ? `${blocked.length} reversement(s) à débloquer` : "Aucun blocage"}
            />
            <Stat title="Déjà versé" value={formatXof(sum(paid, "net_amount"))} hint={`${paid.length} versement(s)`} />
          </div>

          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Partenaire, prestation, référence"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setLimit(PAGE);
                  }}
                  className="pl-9"
                />
              </div>
              <Select
                value={status}
                onValueChange={(v) => {
                  setStatus(v);
                  setLimit(PAGE);
                }}
              >
                <SelectTrigger className="w-[200px]" aria-label="Statut">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  {PAYOUT_FILTERS.map((f) => (
                    <SelectItem key={f.key} value={f.key}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <PeriodPicker value={period} onChange={setPeriod} presets={[...PRESETS]} />
            </div>
            <Button variant="outline" size="sm" onClick={exportCsv} disabled={filtered.length === 0}>
              <Download className="mr-2 h-4 w-4" />
              Exporter (CSV)
            </Button>
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Partenaire</TableHead>
                  <TableHead>Prestation</TableHead>
                  <TableHead className="text-right">Vente</TableHead>
                  <TableHead className="text-right">Part Bossiz</TableHead>
                  <TableHead className="text-right">À verser au partenaire</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">
                    <span className="sr-only">Action</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                      Aucun reversement ne correspond à ces filtres.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.slice(0, limit).map((r) => {
                    const st = payoutState(r);
                    return (
                      <TableRow key={r.transaction_id}>
                        <TableCell className="whitespace-nowrap">{formatDay(r.transaction_date)}</TableCell>
                        <TableCell className="font-medium">{r.agency_name ?? "—"}</TableCell>
                        <TableCell>
                          {r.label}
                          <span className="block text-xs text-muted-foreground">
                            {sourceLabel(r.source_type)} · réf. {r.reference}
                          </span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-right">{formatXof(r.gross_amount)}</TableCell>
                        <TableCell className="whitespace-nowrap text-right">
                          {formatXof(r.commission_amount)}
                          <span className="block text-xs text-muted-foreground">{Number(r.commission_rate)} %</span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-right font-semibold">
                          {formatXof(r.net_amount)}
                        </TableCell>
                        <TableCell className="min-w-[180px]">
                          <Badge variant={st.tone}>{st.label}</Badge>
                          {st.key === "paid" && r.paid_at ? (
                            <span className="block text-xs text-muted-foreground">
                              le {formatDay(r.paid_at)}
                              {r.payout_reference ? ` · ${r.payout_reference}` : ""}
                            </span>
                          ) : (
                            st.hint && (
                              <span
                                className={`block text-xs ${st.key === "blocked" ? "text-destructive" : "text-muted-foreground"}`}
                              >
                                {st.hint}
                              </span>
                            )
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {canMarkPaid(r) && (
                            <Button size="sm" variant="outline" onClick={() => setToMark(r)}>
                              Marquer versé
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
          {filtered.length > limit && (
            <div className="text-center">
              <Button variant="outline" onClick={() => setLimit((l) => l + PAGE)}>
                Afficher plus ({filtered.length - limit} restant{filtered.length - limit > 1 ? "s" : ""})
              </Button>
            </div>
          )}
        </>
      )}

      <AlertDialog open={!!toMark} onOpenChange={(open) => !open && setToMark(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer le versement ?</AlertDialogTitle>
            <AlertDialogDescription>
              À faire uniquement après avoir viré {toMark ? formatXof(toMark.net_amount) : ""} à{" "}
              {toMark?.agency_name ?? "ce partenaire"} en dehors de Jèko. Le partenaire verra ce montant comme versé
              dans sa rubrique Finances.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={markPaid} disabled={saving}>
              J'ai effectué le virement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function AdminCommissions() {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") === "payouts" ? "payouts" : "gains";
  const status = params.get("status") ?? "all";

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold">Commissions</h1>
            <p className="text-muted-foreground">
              Ce que Bossiz gagne sur chaque vente et ce qui revient aux partenaires.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/admin/agencies">
                <Settings className="mr-2 h-4 w-4" />
                Paramètres des partenaires
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/admin/car-partner-plans">
                <Car className="mr-2 h-4 w-4" />
                Formules voitures
              </Link>
            </Button>
          </div>
        </div>

        <Explainer />

        <Tabs
          value={tab}
          onValueChange={(v) => setParams(v === "payouts" ? { tab: "payouts" } : {}, { replace: true })}
        >
          <TabsList>
            <TabsTrigger value="gains">Gains Bossiz</TabsTrigger>
            <TabsTrigger value="payouts">Reversements partenaires</TabsTrigger>
          </TabsList>
          <TabsContent value="gains" className="mt-4">
            <GainsTab />
          </TabsContent>
          <TabsContent value="payouts" className="mt-4">
            <PayoutsTab key={status} initialStatus={status} />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
