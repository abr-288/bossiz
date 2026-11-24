import { useState, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  ClipboardList,
  Crown,
  HeartHandshake,
  Hotel,
  Package,
  RefreshCw,
  Store,
  Users,
  Wallet,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PeriodPicker } from "@/components/admin/PeriodPicker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { supabase } from "@/integrations/supabase/client";
import {
  TASKS,
  activityLabel,
  change,
  formatDay,
  formatXof,
  periodFromPreset,
  useAdminDashboard,
  useAdminPlatformCounts,
  type DashboardData,
  type Period,
  type PlatformCounts,
} from "@/lib/adminFinance";

const PRESETS = ["today", "7d", "30d", "month", "last_month", "year"] as const;
const TABS = ["overview", "community", "evolution", "activities", "bookings"] as const;
type TabKey = (typeof TABS)[number];

// Lignes de tableau resserrées : chaque onglet tient dans la hauteur de
// l'écran, sans dépasser la barre latérale.
const compactTable = "[&_td]:py-2 [&_th]:h-10";

// Variation par rapport à la période précédente : flèche + pourcentage, pour
// ne pas reposer sur la seule couleur.
function Change({ current, previous }: { current: number; previous: number }) {
  const pct = change(current, previous);
  if (pct === null) return <span className="text-xs text-muted-foreground">Pas de comparaison possible</span>;
  const up = pct >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium ${up ? "text-success" : "text-destructive"}`}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {up ? "+" : ""}
      {pct} % <span className="font-normal text-muted-foreground">vs précédente</span>
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
    <Card className="min-w-0">
      <CardContent className="space-y-0.5 p-3">
        <p className="truncate text-sm text-muted-foreground">{title}</p>
        <p className="truncate text-xl font-bold">{value}</p>
        <Change current={current} previous={previous} />
        {hint && <p className="truncate text-xs text-muted-foreground">{hint}</p>}
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
    <Link to={to} className="block min-w-0 rounded-lg border bg-card p-3 transition-colors hover:bg-muted">
      <p className="flex items-center gap-2 truncate text-sm text-muted-foreground">
        <Icon className="h-4 w-4 shrink-0" />
        <span className="truncate">{title}</span>
      </p>
      <p className="mt-0.5 truncate text-xl font-bold">{value}</p>
      <p className="truncate text-xs text-muted-foreground">{hint}</p>
    </Link>
  );
}

function TasksCard({ tasks }: { tasks: DashboardData["tasks"] }) {
  const open = tasks.filter((t) => t.count > 0 && TASKS[t.key]);
  return (
    <Card>
      <CardHeader className="p-3 pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <ClipboardList className="h-4 w-4 text-primary" />À traiter
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        {open.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-success" />
            Rien en attente pour le moment.
          </p>
        ) : (
          <ul className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {open.map((t) => (
              <li key={t.key} className="min-w-0">
                <Link
                  to={TASKS[t.key].href}
                  className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm transition-colors hover:bg-muted"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <Badge variant="secondary" className="shrink-0">
                      {t.count}
                    </Badge>
                    <span className="truncate">{TASKS[t.key].label(t.count)}</span>
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

const fr = (n: number) => n.toLocaleString("fr-FR");

// Nouveaux sur la période, comparés à la période précédente de même durée.
function NewCount({ current, previous }: { current: number; previous: number }) {
  const diff = current - previous;
  return (
    <span className="truncate text-xs text-muted-foreground">
      <span className="font-medium text-foreground">+{fr(current)}</span> sur la période
      {previous > 0 || current > 0 ? (
        <span className={diff >= 0 ? "text-success" : "text-destructive"}>
          {" "}
          ({diff >= 0 ? "+" : ""}
          {fr(diff)} vs précédente)
        </span>
      ) : null}
    </span>
  );
}

function CountTile({
  icon: Icon,
  title,
  value,
  to,
  children,
}: {
  icon: typeof Users;
  title: string;
  value: number;
  to: string;
  children?: ReactNode;
}) {
  return (
    <Link
      to={to}
      className="flex min-w-0 flex-col gap-0.5 rounded-lg border bg-card p-3 transition-colors hover:bg-muted"
    >
      <span className="flex items-center gap-2 truncate text-sm text-muted-foreground">
        <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden />
        <span className="truncate">{title}</span>
      </span>
      <span className="truncate text-2xl font-bold">{fr(value)}</span>
      {children}
    </Link>
  );
}

function PlatformTiles({ counts }: { counts: PlatformCounts }) {
  const { users, partners, subscribers, impact_members, catalog } = counts;
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
      <CountTile icon={Users} title="Utilisateurs inscrits" value={users.total} to="/admin/users">
        <NewCount current={users.new} previous={users.prev_new} />
        <span className="truncate text-xs text-muted-foreground">
          {fr(users.clients)} clients · {fr(users.active_30d)} actifs sur 30 j
        </span>
      </CountTile>
      <CountTile icon={Store} title="Partenaires" value={partners.total} to="/admin/agencies">
        <NewCount current={partners.new} previous={partners.prev_new} />
        <span className="truncate text-xs text-muted-foreground">
          {fr(partners.active)} actifs · {fr(partners.inactive)} inactifs
          {partners.pending_applications ? ` · ${fr(partners.pending_applications)} candidature(s)` : ""}
        </span>
      </CountTile>
      <CountTile icon={Crown} title="Abonnés en cours" value={subscribers.active} to="/admin/subscriptions">
        <NewCount current={subscribers.new} previous={subscribers.prev_new} />
      </CountTile>
      <CountTile icon={HeartHandshake} title="Membres Bossiz Impact" value={impact_members.total} to="/admin/impact">
        <NewCount current={impact_members.new} previous={impact_members.prev_new} />
      </CountTile>
      <CountTile icon={Package} title="Offres en ligne" value={catalog.services_online} to="/admin/services">
        <span className="truncate text-xs text-muted-foreground">
          Sur {fr(catalog.services_total)} offres enregistrées
        </span>
      </CountTile>
    </div>
  );
}

function CommunityDetails({ counts }: { counts: PlatformCounts }) {
  const { users, partners, catalog } = counts;
  const rows: [string, number][] = [
    ["Clients", users.clients],
    ["Comptes partenaires", users.partner_accounts],
    ["Administrateurs", users.admins],
    ["Connectés sur les 30 derniers jours", users.active_30d],
    ["Entreprises clientes actives", catalog.companies],
    ["Inscrits à la newsletter", catalog.newsletter],
  ];
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="p-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-primary" />
            Utilisateurs
          </CardTitle>
          <CardDescription>À date, comptes supprimés exclus.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table className={compactTable}>
            <TableBody>
              {rows.map(([label, value]) => (
                <TableRow key={label}>
                  <TableCell>{label}</TableCell>
                  <TableCell className="text-right font-medium">{fr(value)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 p-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4 text-primary" />
              Partenaires par catégorie
            </CardTitle>
            <CardDescription>
              {fr(partners.active)} actifs dont {fr(partners.visible)} visibles sur le site.
            </CardDescription>
          </div>
          {partners.pending_applications > 0 && (
            <Button variant="outline" size="sm" asChild>
              <Link to="/admin/partner-applications">
                {fr(partners.pending_applications)} candidature(s)
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {partners.by_category.length === 0 ? (
            <p className="px-4 pb-4 text-sm text-muted-foreground">Aucun partenaire pour le moment.</p>
          ) : (
            <Table className={compactTable}>
              <TableHeader>
                <TableRow>
                  <TableHead>Catégorie</TableHead>
                  <TableHead className="text-right">Actifs</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {partners.by_category.map((c) => (
                  <TableRow key={`${c.key}-${c.label}`}>
                    <TableCell className={c.total ? "font-medium" : "text-muted-foreground"}>{c.label}</TableCell>
                    <TableCell className="text-right">{fr(c.active)}</TableCell>
                    <TableCell className="text-right">{fr(c.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PlatformSection({ period, detailed = false }: { period: Period; detailed?: boolean }) {
  const { data, isLoading, isError } = useAdminPlatformCounts(period);
  if (isLoading) return <Skeleton className="h-28" />;
  if (isError || !data)
    return (
      <Card>
        <CardContent className="p-3 text-sm text-muted-foreground">
          Impossible de charger le nombre d'utilisateurs et de partenaires.
        </CardContent>
      </Card>
    );
  return (
    <div className="space-y-4">
      <PlatformTiles counts={data} />
      {detailed && <CommunityDetails counts={data} />}
    </div>
  );
}

function OverviewTab({ data, period }: { data: DashboardData; period: Period }) {
  return (
    <div className="space-y-4">
      <PlatformSection period={period} />
      <TasksCard tasks={data.tasks} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          title="Ventes"
          value={formatXof(data.totals.volume)}
          current={data.totals.volume}
          previous={data.totals.prev_volume}
          hint="Commandes validées, toutes activités"
        />
        <Kpi
          title="Gains Conciergerie Bossiz"
          value={formatXof(data.totals.gain)}
          current={data.totals.gain}
          previous={data.totals.prev_gain}
          hint={`Dont abonnements ${formatXof(data.totals.gain_subscriptions)}`}
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
          hint="Paiements en ligne réussis"
        />
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <BalanceCard
          icon={Wallet}
          title="À reverser aux partenaires"
          value={formatXof(data.balances.due_to_partners)}
          hint={
            data.balances.payout_issues
              ? `À date · ${data.balances.payout_issues} reversement(s) bloqué(s)`
              : "À date, tous partenaires"
          }
          to="/admin/commissions?tab=payouts"
        />
        <BalanceCard
          icon={Hotel}
          title="Hôtels sur place : à encaisser"
          value={formatXof(data.balances.onsite_to_collect)}
          hint="À date, commissions dues à Conciergerie Bossiz"
          to="/admin/hotel-commissions"
        />
        <BalanceCard
          icon={HeartHandshake}
          title="Bossiz Impact collecté"
          value={formatXof(data.totals.impact)}
          hint="Sur la période, hors ventes"
          to="/admin/impact"
        />
      </div>
    </div>
  );
}

function EvolutionTab({ data }: { data: DashboardData }) {
  const [metric, setMetric] = useState<"volume" | "gain">("volume");
  const label = metric === "volume" ? "Ventes" : "Gains Conciergerie Bossiz";
  const tick = (period: string) =>
    data.granularity === "month"
      ? formatDay(period, { day: undefined, year: "2-digit" })
      : formatDay(period, { year: undefined });

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 space-y-0 p-4 sm:flex-row sm:items-start sm:justify-between">
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
          <ToggleGroupItem value="gain">Gains Conciergerie Bossiz</ToggleGroupItem>
        </ToggleGroup>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <ResponsiveContainer width="100%" height={340}>
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

function ActivitiesTab({ data }: { data: DashboardData }) {
  return (
    <Card>
      <CardHeader className="p-4">
        <CardTitle className="text-base">Par activité</CardTitle>
        <CardDescription>
          Commandes validées (confirmées, terminées ou payées). Restaurants : valeur estimée (ticket moyen × couverts).
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {data.activities.length === 0 ? (
          <p className="px-4 pb-4 text-sm text-muted-foreground">Aucune activité sur cette période.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table className={compactTable}>
              <TableHeader>
                <TableRow>
                  <TableHead>Activité</TableHead>
                  <TableHead className="text-right">Commandes</TableHead>
                  <TableHead className="text-right">En attente</TableHead>
                  <TableHead className="text-right">Ventes</TableHead>
                  <TableHead className="text-right">Gains Conciergerie Bossiz</TableHead>
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
                          <span className="ml-1 text-xs font-normal text-muted-foreground">(hors ventes)</span>
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

const BOOKING_STATUS: Record<string, { label: string; tone: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "En attente", tone: "secondary" },
  confirmed: { label: "Confirmée", tone: "default" },
  completed: { label: "Terminée", tone: "outline" },
  cancelled: { label: "Annulée", tone: "destructive" },
};

const PAYMENT_STATUS: Record<string, string> = {
  paid: "Payée",
  partially_paid: "Acompte payé",
  pending: "Non payée",
  processing: "Paiement en cours",
  refunded: "Remboursée",
  failed: "Paiement échoué",
};

function BookingsTab() {
  const {
    data = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["admin-recent-bookings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("id, customer_name, total_price, status, payment_status, created_at, services:service_id (type, name)")
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 p-4">
        <div>
          <CardTitle className="text-base">Dernières réservations</CardTitle>
          <CardDescription>Vols, hôtels, voitures, séjours, activités et événements.</CardDescription>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to="/admin/bookings">
            Toutes les réservations
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <p className="px-4 pb-4 text-sm text-muted-foreground">Chargement…</p>
        ) : isError ? (
          <p className="px-4 pb-4 text-sm text-muted-foreground">Impossible de charger les réservations.</p>
        ) : data.length === 0 ? (
          <p className="px-4 pb-4 text-sm text-muted-foreground">Aucune réservation.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table className={compactTable}>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Prestation</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((b) => {
                  const st = BOOKING_STATUS[b.status] ?? { label: b.status, tone: "outline" as const };
                  return (
                    <TableRow key={b.id}>
                      <TableCell className="whitespace-nowrap">{formatDay(b.created_at)}</TableCell>
                      <TableCell className="max-w-[200px] truncate font-medium">{b.customer_name ?? "—"}</TableCell>
                      <TableCell className="max-w-[260px] truncate">
                        {b.services?.name ?? "—"}
                        {b.services?.type && (
                          <span className="ml-1 text-xs text-muted-foreground">({activityLabel(b.services.type)})</span>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right">{formatXof(b.total_price)}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge variant={st.tone}>{st.label}</Badge>
                        <span className="ml-2 text-xs text-muted-foreground">
                          {PAYMENT_STATUS[b.payment_status] ?? b.payment_status}
                        </span>
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

const AdminOverview = () => {
  const [params, setParams] = useSearchParams();
  const tab: TabKey = TABS.includes(params.get("tab") as TabKey) ? (params.get("tab") as TabKey) : "overview";
  const [period, setPeriod] = useState<Period>(() => periodFromPreset("30d"));
  const { data, isLoading, isError, isFetching, refetch } = useAdminDashboard(period);

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight">Tableau de bord</h1>
            <p className="truncate text-sm text-muted-foreground">
              {data
                ? `Du ${formatDay(data.from)} au ${formatDay(data.to)}, comparé au ${formatDay(data.prev_from)} – ${formatDay(data.prev_to)}`
                : "Toutes les activités de Conciergerie Bossiz"}
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

        <Tabs value={tab} onValueChange={(v) => setParams(v === "overview" ? {} : { tab: v }, { replace: true })}>
          <TabsList className="h-auto flex-wrap justify-start">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="community">Utilisateurs & partenaires</TabsTrigger>
            <TabsTrigger value="evolution">Évolution</TabsTrigger>
            <TabsTrigger value="activities">Par activité</TabsTrigger>
            <TabsTrigger value="bookings">Dernières réservations</TabsTrigger>
          </TabsList>

          {tab === "bookings" ? (
            <TabsContent value="bookings" className="mt-4">
              <BookingsTab />
            </TabsContent>
          ) : tab === "community" ? (
            <TabsContent value="community" className="mt-4">
              <PlatformSection period={period} detailed />
            </TabsContent>
          ) : isLoading ? (
            <div className="mt-4 space-y-3">
              <Skeleton className="h-32" />
              <Skeleton className="h-48" />
            </div>
          ) : isError || !data ? (
            <Card className="mt-4">
              <CardContent className="py-8 text-center text-muted-foreground">
                Impossible de charger le tableau de bord. Réessayez dans un instant.
              </CardContent>
            </Card>
          ) : (
            <>
              <TabsContent value="overview" className="mt-4">
                <OverviewTab data={data} period={period} />
              </TabsContent>
              <TabsContent value="evolution" className="mt-4">
                <EvolutionTab data={data} />
              </TabsContent>
              <TabsContent value="activities" className="mt-4">
                <ActivitiesTab data={data} />
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminOverview;
