import { useEffect, useState } from "react";
import { AgencyLayout } from "@/components/agency/AgencyLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Package, Activity, Home, Percent, TrendingUp, DollarSign, Clock, CheckCircle, ArrowRight, UtensilsCrossed, Hammer, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useTranslation } from "react-i18next";

interface Stats {
  services: number;
  activities: number;
  stays: number;
  promotions: number;
  restaurants: number;
  artisans: number;
  wellness: number;
}

type OnboardingFeature = keyof Stats;

interface Commission {
  id: string;
  booking_amount: number;
  commission_rate: number;
  commission_amount: number;
  status: string;
  payout_status: string;
  payout_due_at: string | null;
  created_at: string;
}

interface AgencyInfo {
  id: string;
  name: string;
}

export default function AgencyDashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<Stats>({
    services: 0,
    activities: 0,
    stays: 0,
    promotions: 0,
    restaurants: 0,
    artisans: 0,
    wellness: 0,
  });
  const [agency, setAgency] = useState<AgencyInfo | null>(null);
  const [enabledFeatures, setEnabledFeatures] = useState<Record<string, boolean>>({});
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [commissionStats, setCommissionStats] = useState({ total: 0, pending: 0, paid: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get agency info
      const { data: agencyData } = await supabase
        .from("agencies")
        .select("id, name, enabled_features")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (!agencyData) {
        setLoading(false);
        return;
      }
      setAgency(agencyData);
      const featureFlags = agencyData.enabled_features;
      setEnabledFeatures(
        featureFlags && typeof featureFlags === "object" && !Array.isArray(featureFlags)
          ? Object.fromEntries(
              Object.entries(featureFlags).filter((entry): entry is [string, boolean] => typeof entry[1] === "boolean"),
            )
          : {},
      );

      // Fetch counts and commissions in parallel
      const [servicesRes, activitiesRes, staysRes, promotionsRes, restaurantsRes, artisansRes, wellnessRes, commissionsRes] = await Promise.all([
        supabase.from("services").select("id", { count: "exact" }).eq("agency_id", agencyData.id),
        supabase.from("activities").select("id", { count: "exact" }).eq("agency_id", agencyData.id),
        supabase.from("stays").select("id", { count: "exact" }).eq("agency_id", agencyData.id),
        supabase.from("promotions").select("id", { count: "exact" }).eq("agency_id", agencyData.id),
        supabase.from("restaurants").select("id", { count: "exact" }).eq("agency_id", agencyData.id),
        supabase.from("artisans").select("id", { count: "exact" }).eq("agency_id", agencyData.id),
        supabase.from("wellness_services").select("id", { count: "exact" }).eq("agency_id", agencyData.id),
        supabase.from("commissions").select("*").eq("agency_id", agencyData.id).order("created_at", { ascending: false }).limit(10),
      ]);

      setStats({
        services: servicesRes.count || 0,
        activities: activitiesRes.count || 0,
        stays: staysRes.count || 0,
        promotions: promotionsRes.count || 0,
        restaurants: restaurantsRes.count || 0,
        artisans: artisansRes.count || 0,
        wellness: wellnessRes.count || 0,
      });

      const commissionsData = commissionsRes.data || [];
      setCommissions(commissionsData);

      // Calculate commission stats
      const total = commissionsData.reduce((sum, c) => sum + c.commission_amount, 0);
      const pending = commissionsData.filter(c => c.status === "pending").reduce((sum, c) => sum + c.commission_amount, 0);
      const paid = commissionsData.filter(c => c.status === "paid").reduce((sum, c) => sum + c.commission_amount, 0);
      setCommissionStats({ total, pending, paid });

      setLoading(false);
    };

    fetchData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const statCards = [
    {
      title: "Services",
      value: stats.services,
      icon: Package,
      description: t("ux.bo.activeServices"),
      color: "text-info",
      bgColor: "bg-info/10",
    },
    {
      title: t("ux.bo.activities"),
      value: stats.activities,
      icon: Activity,
      description: t("ux.bo.activitiesOffered"),
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: t("ux.bo.stays"),
      value: stats.stays,
      icon: Home,
      description: t("ux.bo.availableStays"),
      color: "text-warning-foreground",
      bgColor: "bg-warning",
    },
    {
      title: "Promotions",
      value: stats.promotions,
      icon: Percent,
      description: t("ux.bo.activeOffers"),
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
  ];

  const onboardingItems: {
    key: OnboardingFeature;
    title: string;
    description: string;
    url: string;
    icon: typeof Package;
  }[] = [
    {
      key: "services",
      title: t("ux.bo.servicesTours"),
      description: t("ux.bo.addOffersPricesPhotosClear"),
      url: "/agency/services",
      icon: Package,
    },
    {
      key: "activities",
      title: t("ux.bo.activitiesExcursions"),
      description: t("ux.bo.presentExperiencesTheirLocationsAvailability"),
      url: "/agency/activities",
      icon: Activity,
    },
    {
      key: "stays",
      title: t("ux.bo.stays"),
      description: t("ux.bo.buildCompleteStaysContentPrices"),
      url: "/agency/stays",
      icon: Home,
    },
    {
      key: "restaurants",
      title: t("ux.bo.restaurant"),
      description: t("ux.bo.publishVenueFillInformationUseful"),
      url: "/agency/restaurants",
      icon: UtensilsCrossed,
    },
    {
      key: "artisans",
      title: t("ux.bo.craftsProducts"),
      description: t("ux.bo.showcaseKnowHowProductsCustomers"),
      url: "/agency/artisans",
      icon: Hammer,
    },
    {
      key: "wellness",
      title: t("ux.bo.wellnessBeauty2"),
      description: t("ux.bo.addServicesPricesAppointmentSlots"),
      url: "/agency/wellness",
      icon: Sparkles,
    },
    {
      key: "promotions",
      title: "Promotions",
      description: t("ux.bo.createSpecialOfferMakeCustomers"),
      url: "/agency/promotions",
      icon: Percent,
    },
  ];
  const availableOnboardingItems = onboardingItems.filter((item) => enabledFeatures[item.key] !== false);
  const startedItemsCount = availableOnboardingItems.filter((item) => stats[item.key] > 0).length;

  return (
    <AgencyLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">{t("ux.bo.dashboard")}</h1>
            <p className="text-muted-foreground">
              {t("ux.bo.welcomeAgencySpace")}
            </p>
          </div>
          {agency && (
            <Badge variant="outline" className="text-sm">
              {t("ux.bo.shareOnlineSales90")}
            </Badge>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card) => (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <div className={`p-2 rounded-lg ${card.bgColor}`}>
                  <card.icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? "..." : card.value}
                </div>
                <p className="text-xs text-muted-foreground">{card.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Commission Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t("ux.bo.totalOwedAgency")}</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(commissionStats.total)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t("ux.bo.awaitingPayout")}</CardTitle>
              <Clock className="h-4 w-4 text-warning-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning-foreground">{formatCurrency(commissionStats.pending)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t("ux.bo.alreadyPaidOut")}</CardTitle>
              <CheckCircle className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{formatCurrency(commissionStats.paid)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Commissions */}
        {commissions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("ux.bo.recentCommissions")}</CardTitle>
              <CardDescription>{t("ux.bo.share90SalesMadeThrough")}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("ux.bo.date")}</TableHead>
                    <TableHead>{t("ux.bo.saleAmount")}</TableHead>
                    <TableHead>{t("ux.bo.share")}</TableHead>
                    <TableHead>{t("ux.bo.amountOwed")}</TableHead>
                    <TableHead>{t("ux.bo.status")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commissions.map((commission) => (
                    <TableRow key={commission.id}>
                      <TableCell className="text-sm">
                        {format(new Date(commission.created_at), "dd MMM yyyy", { locale: fr })}
                      </TableCell>
                      <TableCell>{formatCurrency(commission.booking_amount)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{commission.commission_rate}%</Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(commission.commission_amount)}
                      </TableCell>
                      <TableCell>
                        {commission.payout_status === "processing" ? (
                          <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" /> {t("ux.bo.jKoTransferProgress")}</Badge>
                        ) : commission.payout_status === "awaiting_details" ? (
                          <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" /> {t("ux.bo.detailsComplete")}</Badge>
                        ) : commission.payout_status === "needs_review" || commission.payout_status === "failed" ? (
                          <Badge variant="destructive">{t("ux.bo.contactBossiz")}</Badge>
                        ) : commission.payout_status === "not_scheduled" && commission.status === "pending" ? (
                          <Badge variant="secondary">{t("ux.bo.settleOutsideJKoPayout")}</Badge>
                        ) : commission.status === "pending" ? (
                          <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" /> {t("ux.bo.pending2")}</Badge>
                        ) : commission.status === "paid" ? (
                          <Badge variant="default" className="bg-success text-success-foreground"><CheckCircle className="h-3 w-3 mr-1" /> {t("ux.bo.paid2")}</Badge>
                        ) : (
                          <Badge variant="destructive">{t("ux.bo.cancelled2")}</Badge>
                        )}
                        {commission.payout_due_at && commission.payout_status !== "paid" && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Échéance : {format(new Date(commission.payout_due_at), "dd MMM HH:mm", { locale: fr })}
                          </p>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {t("ux.bo.partnerChecklist")}
            </CardTitle>
            <CardDescription>
              Avancement : {startedItemsCount} rubrique{startedItemsCount > 1 ? "s" : ""} commencée{startedItemsCount > 1 ? "s" : ""} sur {availableOnboardingItems.length} accessible{availableOnboardingItems.length > 1 ? "s" : ""}. Ajoutez une offre puis complétez ses informations avant sa mise en ligne.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {availableOnboardingItems.map((item) => {
                const hasStarted = stats[item.key] > 0;
                return (
                  <div key={item.key} className="flex flex-col gap-3 rounded-lg border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <item.icon className="h-5 w-5 shrink-0 text-primary" />
                        <h3 className="font-medium">{item.title}</h3>
                      </div>
                      <Badge variant={hasStarted ? "default" : "secondary"}>
                        {loading ? "..." : hasStarted ? `${stats[item.key]} ajoutée${stats[item.key] > 1 ? "s" : ""}` : "À démarrer"}
                      </Badge>
                    </div>
                    <p className="flex-1 text-sm text-muted-foreground">{item.description}</p>
                    <Button asChild variant={hasStarted ? "outline" : "default"} size="sm" className="w-full">
                      <Link to={item.url}>
                        {hasStarted ? t("ux.bo.manageMyOffers") : t("ux.bo.addOffer")}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                );
              })}
              {availableOnboardingItems.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  {t("ux.bo.noSectionEnabledAgencyContact")}
                </p>
              )}
            </div>
            <div className="flex flex-col items-start justify-between gap-3 rounded-lg bg-muted/50 p-4 sm:flex-row sm:items-center">
              <div>
                <p className="font-medium">{t("ux.bo.getPayoutsReady")}</p>
                <p className="text-sm text-muted-foreground">
                  {t("ux.bo.checkPayoutMethodDetailsAgency")}
                </p>
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
      </div>
    </AgencyLayout>
  );
}