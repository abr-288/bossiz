import { AdminLayout } from "@/components/admin/AdminLayout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Price } from "@/components/ui/price";
import { PaymentStatusBadge } from "@/components/dashboard/BookingStatusBadge";
import { toast } from "sonner";
import { CreditCard, TrendingUp, Clock, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useTranslation } from "react-i18next";

const AdminPayments = () => {
  const { t } = useTranslation();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchPayments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error(t("ux.bo.errorWhileLoadingPayments"));
    } else {
      setPayments(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const filtered = statusFilter === "all"
    ? payments
    : payments.filter(p => p.status === statusFilter);

  const totalPaid = payments.filter(p => p.status === "completed" || p.status === "paid").reduce((s, p) => s + Number(p.amount), 0);
  const totalPending = payments.filter(p => p.status === "pending").reduce((s, p) => s + Number(p.amount), 0);
  const totalFailed = payments.filter(p => p.status === "failed").reduce((s, p) => s + Number(p.amount), 0);

  const statusBadge = (status: string) => <PaymentStatusBadge status={status} />;

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-28" />)}
          </div>
          <Skeleton className="h-96" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("ux.bo.payments")}</h1>
          <p className="text-muted-foreground">{t("ux.bo.trackingAllPlatformPayments")}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t("ux.bo.totalCollected")}</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold"><Price amount={totalPaid} fromCurrency="XOF" /></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t("ux.bo.pending")}</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold"><Price amount={totalPending} fromCurrency="XOF" /></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t("ux.bo.failed2")}</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold"><Price amount={totalFailed} fromCurrency="XOF" /></div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>{t("ux.bo.paymentHistory")}</CardTitle>
                <CardDescription>{filtered.length} paiement(s)</CardDescription>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("ux.bo.all")}</SelectItem>
                  <SelectItem value="paid">{t("ux.bo.paid")}</SelectItem>
                  <SelectItem value="pending">{t("ux.bo.pending2")}</SelectItem>
                  <SelectItem value="processing">{t("ux.bo.processing")}</SelectItem>
                  <SelectItem value="failed">{t("ux.bo.failed")}</SelectItem>
                  <SelectItem value="refunded">{t("ux.bo.refunded")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("ux.bo.transactionId")}</TableHead>
                  <TableHead>{t("ux.bo.amount")}</TableHead>
                  <TableHead>{t("ux.bo.method")}</TableHead>
                  <TableHead>{t("ux.bo.provider")}</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>{t("ux.bo.status")}</TableHead>
                  <TableHead>{t("ux.bo.date")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      {t("ux.bo.noPaymentFound")}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-xs">{p.transaction_id || p.id.slice(0, 8)}</TableCell>
                      <TableCell className="font-semibold"><Price amount={Number(p.amount)} fromCurrency={p.currency || "XOF"} /></TableCell>
                      <TableCell>{p.payment_method}</TableCell>
                      <TableCell>{p.payment_provider}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{p.ip_address || "-"}</TableCell>
                      <TableCell>{statusBadge(p.status)}</TableCell>
                      <TableCell>{format(new Date(p.created_at), "dd MMM yyyy HH:mm", { locale: fr })}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminPayments;
