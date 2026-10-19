import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { Search, DollarSign, Clock, CheckCircle, Building2, Settings, Car } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n/config";

interface Commission {
  id: string;
  agency_id: string;
  booking_id: string | null;
  source_type: string;
  source_id: string | null;
  booking_amount: number;
  commission_rate: number;
  commission_amount: number;
  status: string;
  paid_at: string | null;
  payout_status: string;
  payout_due_at: string | null;
  payout_error: string | null;
  created_at: string;
  agency_name?: string;
}

const sourceLabels: Record<string, string> = {
  get service_booking() { return i18n.t("ux.bo.bookingFlightHotelCarStay"); },
  get restaurant_reservation() { return i18n.t("ux.bo.restaurant"); },
  get wellness_booking() { return i18n.t("ux.bo.wellnessBeauty"); },
  get artisan_order() { return i18n.t("ux.bo.artisan"); },
};

const payoutStatusLabels: Record<string, string> = {
  not_scheduled: "Hors reversement auto",
  get awaiting_details() { return i18n.t("ux.bo.missingDetails"); },
  get ready() { return i18n.t("ux.bo.payOut"); },
  get processing() { return i18n.t("ux.bo.progressAtJKo"); },
  get paid() { return i18n.t("ux.bo.paidOut"); },
  get failed() { return i18n.t("ux.bo.failure"); },
  get needs_review() { return i18n.t("ux.bo.checkAtJKo"); },
};

interface Stats {
  total: number;
  pending: number;
  paid: number;
}

export default function AdminCommissions() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, paid: 0 });

  useEffect(() => {
    fetchCommissions();
  }, []);

  const fetchCommissions = async () => {
    try {
      const { data, error } = await supabase
        .from("commissions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch agency names
      const agencyIds = [...new Set((data || []).map(c => c.agency_id))];
      const { data: agencies } = await supabase
        .from("agencies")
        .select("id, name")
        .in("id", agencyIds);

      const agencyMap = new Map(agencies?.map(a => [a.id, a.name]) || []);

      const commissionsWithNames = (data || []).map(c => ({
        ...c,
        agency_name: agencyMap.get(c.agency_id) || "N/A",
      }));

      setCommissions(commissionsWithNames);

      // Calculate stats
      const total = commissionsWithNames.reduce((sum, c) => sum + c.commission_amount, 0);
      const pending = commissionsWithNames
        .filter(c => c.status === "pending")
        .reduce((sum, c) => sum + c.commission_amount, 0);
      const paid = commissionsWithNames
        .filter(c => c.status === "paid")
        .reduce((sum, c) => sum + c.commission_amount, 0);

      setStats({ total, pending, paid });
    } catch (error) {
      console.error("Error fetching commissions:", error);
      toast({
        title: t("ux.bo.error"),
        description: t("ux.bo.unableLoadCommissions"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const updateData: any = { status };
      if (status === "paid") {
        updateData.paid_at = new Date().toISOString();
        updateData.payout_status = "paid";
      }

      const { error } = await supabase
        .from("commissions")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;

      toast({
        title: t("ux.bo.success"),
        description: t("ux.bo.statusUpdated"),
      });
      fetchCommissions();
    } catch (error) {
      console.error("Error updating commission:", error);
      toast({
        title: t("ux.bo.error"),
        description: t("ux.bo.unableUpdateStatus"),
        variant: "destructive",
      });
    }
  };

  const filteredCommissions = commissions.filter((commission) => {
    const reference = commission.booking_id || commission.source_id || "";
    const matchesSearch =
      commission.agency_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reference.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || commission.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" /> {t("ux.bo.pending2")}</Badge>;
      case "paid":
        return <Badge variant="default" className="bg-success text-success-foreground"><CheckCircle className="h-3 w-3 mr-1" /> {t("ux.bo.paid2")}</Badge>;
      case "cancelled":
        return <Badge variant="destructive">{t("ux.bo.cancelled2")}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{t("ux.bo.commissionManagement")}</h1>
            <p className="text-muted-foreground">
              {t("ux.bo.trackSharesOwedAgenciesTheir")}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/admin/agencies">
                <Settings className="h-4 w-4 mr-2" />
                {t("ux.bo.agencySettings")}
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/admin/car-partner-plans">
                <Car className="h-4 w-4 mr-2" />
                {t("ux.bo.carPlans")}
              </Link>
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground -mt-2">
          {t("ux.bo.paymentsCollectedViaJKo")}
          {t("ux.bo.paymentsMadeDirectlyPartnerNot")}
        </p>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t("ux.bo.totalOwedAgencies")}</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.total)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t("ux.bo.payOut")}</CardTitle>
              <Clock className="h-4 w-4 text-warning-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning-foreground">{formatCurrency(stats.pending)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t("ux.bo.alreadyPaidOut")}</CardTitle>
              <CheckCircle className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{formatCurrency(stats.paid)}</div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("ux.bo.search")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t("ux.bo.filterStatus")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("ux.bo.allStatuses")}</SelectItem>
              <SelectItem value="pending">{t("ux.bo.pending2")}</SelectItem>
              <SelectItem value="paid">{t("ux.bo.paid3")}</SelectItem>
              <SelectItem value="cancelled">{t("ux.bo.cancelled")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("ux.bo.agency")}</TableHead>
                <TableHead>{t("ux.bo.type")}</TableHead>
                <TableHead>{t("ux.bo.booking")}</TableHead>
                <TableHead>{t("ux.bo.saleAmount")}</TableHead>
                <TableHead>{t("ux.bo.agencyShare")}</TableHead>
                <TableHead>{t("ux.bo.amountOwedAgency")}</TableHead>
                <TableHead>{t("ux.bo.payoutStatus")}</TableHead>
                <TableHead>{t("ux.bo.date")}</TableHead>
                <TableHead className="text-right">{t("ux.bo.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    {t("ux.bo.loading")}
                  </TableCell>
                </TableRow>
              ) : filteredCommissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    <Building2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    {t("ux.bo.noCommissionFound")}
                  </TableCell>
                </TableRow>
              ) : (
                filteredCommissions.map((commission) => (
                  <TableRow key={commission.id}>
                    <TableCell className="font-medium">{commission.agency_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{sourceLabels[commission.source_type] || commission.source_type}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {(commission.booking_id || commission.source_id || "—").slice(0, 8)}...
                    </TableCell>
                    <TableCell>{formatCurrency(commission.booking_amount)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{commission.commission_rate}%</Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(commission.commission_amount)}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {getStatusBadge(commission.status)}
                        <p className="text-xs text-muted-foreground">
                          {payoutStatusLabels[commission.payout_status] || commission.payout_status}
                        </p>
                        {commission.payout_due_at && commission.payout_status !== "paid" && (
                          <p className="text-xs text-muted-foreground">
                            Échéance : {format(new Date(commission.payout_due_at), "dd MMM yyyy HH:mm", { locale: fr })}
                          </p>
                        )}
                        {commission.payout_error && (
                          <p className="text-xs text-destructive">{commission.payout_error}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(commission.created_at), "dd MMM yyyy", { locale: fr })}
                    </TableCell>
                    <TableCell className="text-right">
                      {commission.status === "pending" && !["ready", "processing", "needs_review"].includes(commission.payout_status) && (
                        <Button
                          size="sm"
                          onClick={() => updateStatus(commission.id, "paid")}
                        >
                          {t("ux.bo.markAsPaid")}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
}
