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
      description: "Services actifs",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Activités",
      value: stats.activities,
      icon: Activity,
      description: "Activités proposées",
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Séjours",
      value: stats.stays,
      icon: Home,
      description: "Séjours disponibles",
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    {
      title: "Promotions",
      value: stats.promotions,
      icon: Percent,
      description: "Offres actives",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
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
      title: "Services et circuits",
      description: "Ajoutez vos offres avec des tarifs, des photos et des informations de réservation claires.",
      url: "/agency/services",
      icon: Package,
    },
    {
      key: "activities",
      title: "Activités et excursions",
      description: "Présentez vos expériences, leurs lieux, leurs disponibilités et leurs conditions.",
      url: "/agency/activities",
      icon: Activity,
    },
    {
      key: "stays",
      title: "Séjours",
      description: "Composez des séjours complets avec contenu, prix et dates disponibles.",
      url: "/agency/stays",
      icon: Home,
    },
    {
      key: "restaurants",
      title: "Restaurant",
      description: "Publiez votre établissement et complétez les informations utiles aux réservations.",
      url: "/agency/restaurants",
      icon: UtensilsCrossed,
    },
    {
      key: "artisans",
      title: "Artisanat et produits",
      description: "Mettez en avant votre savoir-faire et les produits que les clients peuvent commander.",
      url: "/agency/artisans",
      icon: Hammer,
    },
    {
      key: "wellness",
      title: "Bien-être et beauté",
      description: "Ajoutez vos prestations, tarifs et créneaux de rendez-vous.",
      url: "/agency/wellness",
      icon: Sparkles,
    },
    {
      key: "promotions",
      title: "Promotions",
      description: "Créez une offre spéciale pour donner envie aux clients de réserver.",
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
            <h1 className="text-2xl font-bold">Tableau de bord</h1>
            <p className="text-muted-foreground">
              Bienvenue dans votre espace agence
            </p>
          </div>
          {agency && (
            <Badge variant="outline" className="text-sm">
              Votre part sur les ventes en ligne : 90%
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
              <CardTitle className="text-sm font-medium">Total dû à votre agence</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(commissionStats.total)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">En attente de reversement</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">{formatCurrency(commissionStats.pending)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Déjà reversé</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{formatCurrency(commissionStats.paid)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Commissions */}
        {commissions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Commissions récentes</CardTitle>
              <CardDescription>Votre part (90%) sur les ventes réalisées via la plateforme</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Montant Vente</TableHead>
                    <TableHead>Votre part</TableHead>
                    <TableHead>Montant dû</TableHead>
                    <TableHead>Statut</TableHead>
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
                          <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" /> Transfert Jèko en cours</Badge>
                        ) : commission.payout_status === "awaiting_details" ? (
                          <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" /> Coordonnées à compléter</Badge>
                        ) : commission.payout_status === "needs_review" || commission.payout_status === "failed" ? (
                          <Badge variant="destructive">Contacter Bossiz</Badge>
                        ) : commission.payout_status === "not_scheduled" && commission.status === "pending" ? (
                          <Badge variant="secondary">À régler hors reversement Jèko</Badge>
                        ) : commission.status === "pending" ? (
                          <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" /> En attente</Badge>
                        ) : commission.status === "paid" ? (
                          <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" /> Payée</Badge>
                        ) : (
                          <Badge variant="destructive">Annulée</Badge>
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
              Votre checklist partenaire
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
                        {hasStarted ? "Gérer mes offres" : "Ajouter une offre"}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                );
              })}
              {availableOnboardingItems.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Aucune rubrique n’est activée pour votre agence. Contactez l’équipe Bossiz pour configurer votre espace.
                </p>
              )}
            </div>
            <div className="flex flex-col items-start justify-between gap-3 rounded-lg bg-muted/50 p-4 sm:flex-row sm:items-center">
              <div>
                <p className="font-medium">Préparez vos reversements</p>
                <p className="text-sm text-muted-foreground">
                  Vérifiez votre moyen de réception et vos coordonnées dans les paramètres de l’agence.
                </p>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link to="/agency/settings">
                  Configurer mes reversements
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