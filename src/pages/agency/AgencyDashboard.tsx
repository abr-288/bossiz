import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  CalendarCheck,
  Car,
  Hammer,
  Home,
  Hotel,
  Inbox,
  Map,
  Package,
  Percent,
  Sparkles,
  Star,
  TrendingUp,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { AgencyLayout } from "@/components/agency/AgencyLayout";
import { FinanceSummaryCards } from "@/components/agency/FinanceSummaryCards";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { monthPeriod, useFinanceSummary, usePartnerOrders, usePartnerReviews } from "@/hooks/usePartnerData";
import { usePartnerPortal } from "@/hooks/usePartnerPortal";
import { formatAmount, formatMonth } from "@/lib/partnerFormat";
import { modulePath, type PortalModule } from "@/lib/partnerPortal";

// Rubriques du catalogue et table où compter les offres publiées.
const CATALOG: Record<string, { table: string; serviceType?: string; icon: typeof Package }> = {
  catalog_hotels: { table: "services", serviceType: "hotel", icon: Hotel },
  catalog_cars: { table: "services", serviceType: "car", icon: Car },
  catalog_tours: { table: "services", serviceType: "tour", icon: Map },
  catalog_activities: { table: "activities", icon: Activity },
  catalog_stays: { table: "stays", icon: Home },
  catalog_restaurants: { table: "restaurants", icon: UtensilsCrossed },
  catalog_artisans: { table: "artisans", icon: Hammer },
  catalog_wellness: { table: "wellness_services", icon: Sparkles },
  promotions: { table: "promotions", icon: Percent },
};

type CatalogTable =
  "services" | "activities" | "stays" | "restaurants" | "artisans" | "wellness_services" | "promotions";

const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

function useCatalogCounts(agencyId: string | undefined, modules: PortalModule[]) {
  const catalogModules = modules.filter((m) => CATALOG[m.key]);
  return useQuery({
    queryKey: ["partner-catalog-counts", agencyId, catalogModules.map((m) => m.key).join(",")],
    enabled: !!agencyId,
    queryFn: async () => {
      const entries = await Promise.all(
        catalogModules.map(async (m) => {
          const def = CATALOG[m.key];
          let query = supabase
            .from(def.table as CatalogTable)
            .select("id", { count: "exact", head: true })
            .eq("agency_id", agencyId!);
          if (def.serviceType) query = query.eq("type", def.serviceType as "hotel" | "car" | "tour");
          const { count } = await query;
          return [m.key, count ?? 0] as const;
        }),
      );
      return Object.fromEntries(entries) as Record<string, number>;
    },
  });
}

const TABS = ["overview", "revenue", "setup"] as const;
type TabKey = (typeof TABS)[number];

export default function AgencyDashboard() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const tab: TabKey = TABS.includes(params.get("tab") as TabKey) ? (params.get("tab") as TabKey) : "overview";
  const { data: portal } = usePartnerPortal();
  const month = monthPeriod(0);
  const summary = useFinanceSummary(month);
  const { data: orders = [], isLoading: ordersLoading } = usePartnerOrders();
  const { data: reviews = [] } = usePartnerReviews();
  const modules = portal?.modules ?? [];
  const counts = useCatalogCounts(portal?.agency_id, modules);

  const today = todayIso();
  const todayOrders = orders.filter((o) => o.service_date === today && o.status !== "cancelled");
  const newOrders = orders.filter((o) => o.bucket === "new");
  const inProgress = orders.filter((o) => o.bucket === "in_progress");
  const published = reviews.filter((r) => r.status === "approved");
  const average = published.length ? published.reduce((s, r) => s + r.rating, 0) / published.length : null;
  const catalogModules = modules.filter((m) => CATALOG[m.key] && m.enabled);
  const startedCount = catalogModules.filter((m) => (counts.data?.[m.key] ?? 0) > 0).length;

  const kpis = [
    {
      key: "today",
      icon: CalendarCheck,
      value: ordersLoading ? "…" : String(todayOrders.length),
      to: "/agency/orders?tab=in_progress",
    },
    { key: "new", icon: Inbox, value: ordersLoading ? "…" : String(newOrders.length), to: "/agency/orders?tab=new" },
    {
      key: "monthNet",
      icon: Wallet,
      value: summary.data ? formatAmount(summary.data.net) : "…",
      to: "/agency/finances?tab=revenue",
    },
    {
      key: "rating",
      icon: Star,
      value: average === null ? "—" : `${average.toFixed(1)} / 5`,
      to: "/agency/reviews",
    },
  ];

  return (
    <AgencyLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold">{t("ux.bo.dashboard")}</h1>
          <p className="text-muted-foreground">{t("ux.bo.welcomeAgencySpace")}</p>
        </div>

        {/* Onglets : chaque partie tient dans la hauteur de l'écran. */}
        <Tabs value={tab} onValueChange={(v) => setParams(v === "overview" ? {} : { tab: v }, { replace: true })}>
          <TabsList className="h-auto flex-wrap justify-start">
            <TabsTrigger value="overview">{t("ux.partner.dashboard.tabs.overview")}</TabsTrigger>
            <TabsTrigger value="revenue">{t("ux.partner.dashboard.tabs.revenue")}</TabsTrigger>
            <TabsTrigger value="setup">{t("ux.partner.dashboard.tabs.setup")}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {kpis.map((kpi) => (
                <Link
                  key={kpi.key}
                  to={kpi.to}
                  className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Card className="h-full transition-colors hover:bg-muted/40">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
                        <span>{t(`ux.partner.dashboard.kpi.${kpi.key}`)}</span>
                        <kpi.icon className="h-4 w-4 shrink-0" />
                      </div>
                      <p className="mt-1 text-2xl font-bold">{kpi.value}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t("ux.partner.dashboard.todayTitle")}</CardTitle>
                </CardHeader>
                <CardContent>
                  {todayOrders.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t("ux.partner.dashboard.todayEmpty")}</p>
                  ) : (
                    <ul className="divide-y text-sm">
                      {todayOrders.slice(0, 6).map((o) => (
                        <li key={`${o.order_kind}-${o.order_id}`} className="flex justify-between gap-3 py-2">
                          <span className="min-w-0">
                            <span className="block truncate font-medium">{o.title}</span>
                            <span className="text-muted-foreground">
                              {o.customer_name || "—"}
                              {o.service_time ? ` · ${o.service_time.slice(0, 5)}` : ""}
                            </span>
                          </span>
                          <Badge variant="outline">{t(`ux.partner.status.${o.status}`)}</Badge>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <TrendingUp className="h-4 w-4" />
                    {t("ux.partner.dashboard.stats")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-muted-foreground">{t("ux.partner.orders.tabs.in_progress")}</dt>
                      <dd className="text-xl font-semibold">{inProgress.length}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">{t("ux.partner.dashboard.monthTransactions")}</dt>
                      <dd className="text-xl font-semibold">{summary.data?.transactions ?? "…"}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">{t("ux.partner.reviews.published")}</dt>
                      <dd className="text-xl font-semibold">{published.length}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">{t("ux.partner.finances.totals.pending_payout")}</dt>
                      <dd className="text-xl font-semibold">
                        {summary.data ? formatAmount(summary.data.pending_payout) : "…"}
                      </dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="revenue" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle className="capitalize">
                    {t("ux.partner.dashboard.monthRevenue", { month: formatMonth(month.from!) })}
                  </CardTitle>
                  <CardDescription>{t("ux.partner.dashboard.monthRevenueHelp")}</CardDescription>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link to="/agency/finances?tab=commissions">
                    {t("ux.partner.dashboard.seeFinances")}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                <FinanceSummaryCards summary={summary.data} loading={summary.isLoading} compact />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="setup" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>{t("ux.bo.partnerChecklist")}</CardTitle>
                <CardDescription>
                  {t("ux.partner.dashboard.checklist", { started: startedCount, total: catalogModules.length })}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {catalogModules.map((m) => {
                    const def = CATALOG[m.key];
                    const count = counts.data?.[m.key] ?? 0;
                    const to = modulePath(m.key) ?? "/agency";
                    return (
                      <div key={m.key} className="flex flex-col gap-3 rounded-lg border p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <def.icon className="h-5 w-5 shrink-0 text-primary" />
                            <h3 className="font-medium">{t(`ux.partner.menu.${m.key}`)}</h3>
                          </div>
                          <Badge variant={count > 0 ? "default" : "secondary"}>
                            {counts.isLoading
                              ? "…"
                              : count > 0
                                ? t("ux.partner.dashboard.added", { count })
                                : t("ux.partner.dashboard.toStart")}
                          </Badge>
                        </div>
                        <Button
                          asChild
                          variant={count > 0 ? "outline" : "default"}
                          size="sm"
                          className="mt-auto w-full"
                        >
                          <Link to={to}>
                            {count > 0 ? t("ux.bo.manageMyOffers") : t("ux.bo.addOffer")}
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    );
                  })}
                  {catalogModules.length === 0 && (
                    <p className="text-sm text-muted-foreground">{t("ux.bo.noSectionEnabledAgencyContact")}</p>
                  )}
                </div>
                <div className="flex flex-col items-start justify-between gap-3 rounded-lg bg-muted/50 p-4 sm:flex-row sm:items-center">
                  <div>
                    <p className="font-medium">{t("ux.bo.getPayoutsReady")}</p>
                    <p className="text-sm text-muted-foreground">{t("ux.bo.checkPayoutMethodDetailsAgency")}</p>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link to="/agency/settings">
                      {t("ux.bo.setUpMyPayouts")}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AgencyLayout>
  );
}
