import { useState } from "react";
import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  ClipboardList,
  HeartHandshake,
  Hotel,
  RefreshCw,
  Wallet,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { DashboardCustomizer } from "@/components/admin/DashboardCustomizer";
import { CustomizableDashboard } from "@/components/admin/CustomizableDashboard";
import { PeriodPicker } from "@/components/admin/PeriodPicker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useAdminStats } from "@/hooks/useAdminStats";
import { useDashboardPreferences } from "@/hooks/useDashboardPreferences";
import {
  TASKS,
  activityLabel,
  change,
  formatDay,
  formatXof,
  periodFromPreset,
  useAdminDashboard,
  type DashboardData,
  type Period,
} from "@/lib/adminFinance";

const PRESETS = ["today", "7d", "30d", "month", "last_month", "year"] as const;

// Variation par rapport à la période précédente : flèche + pourcentage, pour
// ne pas reposer sur la seule couleur.
function Change({ current, previous }: { current: number; previous: number }) {
  const pct = change(current, previous);
  if (pct === null) return <span className="text-xs text-muted-foreground">Pas de période précédente comparable</span>;
  const up = pct >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium ${up ? "text-success" : "text-destructive"}`}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {up ? "+" : ""}
      {pct} % <span className="font-normal text-muted-foreground">vs période précédente</span>
    </span>
  );
}

function Kpi({
  title,
  value,
  previous,
  current,
  hint,
}: {
  title: string;
  value: string;
  current: number;
  previous: number;
  hint?: string;
}) {
  return (
    <Card>
      <CardContent className="space-y-1 p-4">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
        <Change current={current} previous={previous} />
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function TasksCard({ tasks }: { tasks: DashboardData["tasks"] }) {
  const open = tasks.filter((t) => t.count > 0 && TASKS[t.key]);
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ClipboardList className="h-4 w-4 text-primary" />À traiter
        </CardTitle>
      </CardHeader>
      <CardContent>
        {open.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-success" />
            Rien en attente pour le moment.
          </p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {open.map((t) => (
              <li key={t.key}>
                <Link
                  to={TASKS[t.key].href}
                  className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm transition-colors hover:bg-muted"
                >
                  <span className="flex items-center gap-2">
                    <Badge variant="secondary">{t.count}</Badge>
                    {TASKS[t.key].label(t.count)}
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function EvolutionChart({ data }: { data: DashboardData }) {
  const [metric, setMetric] = useState<"volume" | "gain">("volume");
  const label = metric === "volume" ? "Ventes" : "Gains Bossiz";
  const tick = (period: string) =>
    data.granularity === "month"
      ? formatDay(period, { day: undefined, year: "2-digit" })
      : formatDay(period, { year: undefined });

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="text-base">Évolution : {label.toLowerCase()}</CardTitle>
          <CardDescription>{data.granularity === "month" ? "Par mois" : "Par jour"}, en FCFA</CardDescription>
        </div>
        <ToggleGroup
          type="single"
          size="sm"
          variant="outline"
          value={metric}
          onValueChange={(v) => v && setMetric(v as "volume" | "gain")}
        >
          <ToggleGroupItem value="volume">Ventes</ToggleGroupItem>
          <ToggleGroupItem value="gain">Gains Bossiz</ToggleGroupItem>
        </ToggleGroup>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data.series} margin={{ left: 0, right: 8 }}>
            <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
            <XAxis
              dataKey="period"
              tickFormatter={tick}
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              minTickGap={16}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              width={48}
              tickFormatter={(v: number) =>
                Math.abs(v) >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)} M` : `${Math.round(v / 1000)} k`
              }
            />
            <Tooltip
              cursor={{ fill: "hsl(var(--muted))" }}
              labelFormatter={(p: string) => tick(p)}
              formatter={(v: number) => [formatXof(v), label]}
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
              }}
            />
            <Bar dataKey={metric} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function ActivitiesTable({ data }: { data: DashboardData }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Par activité</CardTitle>
        <CardDescription>
          Commandes validées (confirmées, terminées ou payées). Restaurants : valeur estimée (ticket moyen × couverts).
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {data.activities.length === 0 ? (
          <p className="px-6 pb-6 text-sm text-muted-foreground">Aucune activité sur cette période.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Activité</TableHead>
                  <TableHead className="text-right">Commandes</TableHead>
                  <TableHead className="text-right">En attente</TableHead>
                  <TableHead className="text-right">Ventes</TableHead>
                  <TableHead className="text-right">Gains Bossiz</TableHead>
                  <TableHead className="text-right">Ventes vs précédente</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.activities.map((a) => {
                  const pct = change(a.volume, a.prev_volume);
                  return (
                    <TableRow key={a.activity}>
                      <TableCell className="font-medium">
                        {activityLabel(a.activity)}
                        {a.activity === "impact" && (
                          <span className="block text-xs font-normal text-muted-foreground">
                            Fonds collectés, hors total des ventes
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">{a.orders.toLocaleString("fr-FR")}</TableCell>
                      <TableCell className="text-right">
                        {a.pending ? a.pending.toLocaleString("fr-FR") : "—"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right">{formatXof(a.volume)}</TableCell>
                      <TableCell className="whitespace-nowrap text-right">{a.gain ? formatXof(a.gain) : "—"}</TableCell>
                      <TableCell className="whitespace-nowrap text-right text-sm">
                        {pct === null ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          <span className={pct >= 0 ? "text-success" : "text-destructive"}>
                            {pct >= 0 ? "▲ +" : "▼ "}
                            {pct} %
                          </span>
                        )}
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

function BalanceCard({
  icon: Icon,
  title,
  value,
  hint,
  to,
}: {
  icon: typeof Wallet;
  title: string;
  value: string;
  hint: string;
  to: string;
}) {
  return (
    <Link to={to} className="block rounded-lg border bg-card p-4 transition-colors hover:bg-muted">
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="h-4 w-4" />
        {title}
      </p>
      <p className="mt-1 text-xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </Link>
  );
}

// Détail historique des réservations (vols, hôtels, voitures, séjours) avec
// les widgets personnalisables existants.
function BookingsDetail() {
  const { stats, loading, refetch } = useAdminStats();
  const { activeLayout, loading: layoutLoading } = useDashboardPreferences();
  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Réservations : vue détaillée</h2>
          <p className="text-sm text-muted-foreground">
            Vols, hôtels, voitures, séjours et événements depuis le début, mis à jour en temps réel.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DashboardCustomizer />
          <Button variant="outline" size="sm" onClick={refetch} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
        </div>
      </div>
      {loading || layoutLoading ? (
        <Skeleton className="h-64" />
      ) : (
        <CustomizableDashboard widgetsConfig={activeLayout?.widgetsConfig || []} stats={stats} />
      )}
    </section>
  );
}

const AdminOverview = () => {
  const [period, setPeriod] = useState<Period>(() => periodFromPreset("30d"));
  const { data, isLoading, isError, isFetching, refetch } = useAdminDashboard(period);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
            <p className="text-muted-foreground">
              {data
                ? `Du ${formatDay(data.from)} au ${formatDay(data.to)}, comparé au ${formatDay(data.prev_from)} – ${formatDay(data.prev_to)}`
                : "Toutes les activités de Bossiz"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <PeriodPicker value={period} onChange={setPeriod} presets={[...PRESETS]} />
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
              Actualiser
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-28" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-28" />
              ))}
            </div>
            <Skeleton className="h-80" />
          </div>
        ) : isError || !data ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Impossible de charger le tableau de bord. Vérifiez que la migration 20261030000000 a bien été exécutée,
              puis réessayez.
            </CardContent>
          </Card>
        ) : (
          <>
            <TasksCard tasks={data.tasks} />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Kpi
                title="Ventes"
                value={formatXof(data.totals.volume)}
                current={data.totals.volume}
                previous={data.totals.prev_volume}
                hint="Valeur des commandes validées, toutes activités"
              />
              <Kpi
                title="Gains Bossiz"
                value={formatXof(data.totals.gain)}
                current={data.totals.gain}
                previous={data.totals.prev_gain}
                hint={`Commissions, marges et abonnements (dont abonnements ${formatXof(data.totals.gain_subscriptions)})`}
              />
              <Kpi
                title="Commandes validées"
                value={data.totals.orders.toLocaleString("fr-FR")}
                current={data.totals.orders}
                previous={data.totals.prev_orders}
                hint={data.totals.pending ? `${data.totals.pending.toLocaleString("fr-FR")} en attente` : undefined}
              />
              <Kpi
                title="Encaissé via Jèko"
                value={formatXof(data.totals.collected)}
                current={data.totals.collected}
                previous={data.totals.prev_collected}
                hint="Paiements en ligne réussis, Impact compris"
              />
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <BalanceCard
                icon={Wallet}
                title="À reverser aux partenaires"
                value={formatXof(data.balances.due_to_partners)}
                hint={
                  data.balances.payout_issues
                    ? `À date · dont ${data.balances.payout_issues} reversement(s) bloqué(s)`
                    : "À date, tous partenaires"
                }
                to="/admin/commissions?tab=payouts"
              />
              <BalanceCard
                icon={Hotel}
                title="Commissions hôtels sur place à encaisser"
                value={formatXof(data.balances.onsite_to_collect)}
                hint="À date, dues par les hôtels à Bossiz"
                to="/admin/hotel-commissions"
              />
              <BalanceCard
                icon={HeartHandshake}
                title="Bossiz Impact collecté"
                value={formatXof(data.totals.impact)}
                hint="Sur la période, contributions confirmées"
                to="/admin/impact"
              />
            </div>

            <EvolutionChart data={data} />
            <ActivitiesTable data={data} />
          </>
        )}

        <BookingsDetail />
      </div>
    </AdminLayout>
  );
};

export default AdminOverview;
