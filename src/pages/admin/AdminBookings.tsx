import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExportButtons } from "@/components/admin/ExportButtons";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Loader2, Eye, RotateCcw, Undo2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Price } from "@/components/ui/price";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { BookingStatusBadge, PaymentStatusBadge } from "@/components/dashboard/BookingStatusBadge";
import type { Database } from "@/integrations/supabase/types";
import { useTranslation } from "react-i18next";

type AdminBooking = Database["public"]["Tables"]["bookings"]["Row"] & {
  services: { name: string; type: string; agency_id?: string | null } | null;
};
type AdminPassenger = Database["public"]["Tables"]["passengers"]["Row"];
type AdminPayment = Database["public"]["Tables"]["payments"]["Row"];
const errorMessage = (error: unknown, fallback: string) => error instanceof Error ? error.message : fallback;

const bookingStatusBadge = (status: string) => <BookingStatusBadge status={status} />;
const paymentStatusBadge = (status: string) => <PaymentStatusBadge status={status} />;

const AdminBookings = () => {
  const { t } = useTranslation();
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<AdminBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<AdminBooking | null>(null);
  const [detailPassengers, setDetailPassengers] = useState<AdminPassenger[]>([]);
  const [detailPayment, setDetailPayment] = useState<AdminPayment | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<"refund" | "pnr" | "status" | "settle" | null>(null);
  type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";
  const [pendingStatus, setPendingStatus] = useState<BookingStatus>("pending");

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    filterBookings();
  }, [bookings, searchTerm, statusFilter, paymentFilter]);

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select("*, services(name, type)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBookings((data || []) as AdminBooking[]);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterBookings = () => {
    let filtered = [...bookings];

    if (searchTerm) {
      filtered = filtered.filter(
        (b) =>
          b.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          b.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          b.external_ref?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((b) => b.status === statusFilter);
    }

    if (paymentFilter !== "all") {
      filtered = filtered.filter((b) => b.payment_status === paymentFilter);
    }

    setFilteredBookings(filtered);
  };

  const openDetail = async (booking: AdminBooking) => {
    setSelectedBooking(booking);
    setPendingStatus(booking.status);
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailPassengers([]);
    setDetailPayment(null);

    try {
      const [{ data: passengers }, { data: payment }] = await Promise.all([
        supabase.from("passengers").select("*").eq("booking_id", booking.id),
        supabase
          .from("payments")
          .select("*")
          .eq("booking_id", booking.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
      setDetailPassengers((passengers || []) as AdminPassenger[]);
      setDetailPayment((payment || null) as AdminPayment | null);
    } catch (error) {
      console.error("Error loading booking detail:", error);
    } finally {
      setDetailLoading(false);
    }
  };

  const refreshAfterAction = async (bookingId: string) => {
    await fetchBookings();
    const { data } = await supabase
      .from("bookings")
      .select("*, services(name, type)")
      .eq("id", bookingId)
      .single();
    if (data) {
      setSelectedBooking(data as AdminBooking);
      setPendingStatus(data.status);
    }
  };

  const handleRefund = async () => {
    if (!selectedBooking) return;
    setActionLoading("refund");
    try {
      const { data, error } = await supabase.functions.invoke("refund-payment", {
        body: { booking_id: selectedBooking.id },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || t("ux.bo.refundFailed"));

      toast.success(data.refunded ? t("ux.bo.refundCompleted") : t("ux.bo.bookingCancelled"));
      await refreshAfterAction(selectedBooking.id);
    } catch (error: unknown) {
      toast.error(errorMessage(error, "Erreur lors du remboursement"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleSettleOnSite = async () => {
    if (!selectedBooking) return;
    setActionLoading("settle");
    try {
      const { error } = await supabase.rpc("admin_mark_booking_balance_paid", { p_booking_id: selectedBooking.id });
      if (error) throw error;
      toast.success(t("ux.bo.balancePaidSiteRecorded"));
      await refreshAfterAction(selectedBooking.id);
    } catch (error: unknown) {
      toast.error(errorMessage(error, "Impossible d’enregistrer le règlement du solde"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleRelaunchPnr = async () => {
    if (!selectedBooking) return;
    setActionLoading("pnr");
    try {
      const { data, error } = await supabase.functions.invoke("create-pnr", {
        body: { booking_id: selectedBooking.id },
      });
      if (error) throw error;
      if (!data?.success) {
        toast.error(data?.error || t("ux.bo.ticketIssuanceStillNotPossible"));
      } else {
        toast.success(`PNR émis: ${data.pnr}`);
      }
      await refreshAfterAction(selectedBooking.id);
    } catch (error: unknown) {
      toast.error(errorMessage(error, "Erreur lors de la relance du PNR"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusChange = async () => {
    if (!selectedBooking || pendingStatus === selectedBooking.status) return;
    setActionLoading("status");
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status: pendingStatus, updated_at: new Date().toISOString() })
        .eq("id", selectedBooking.id);
      if (error) throw error;
      toast.success(t("ux.bo.statusUpdated"));
      await refreshAfterAction(selectedBooking.id);
    } catch (error: unknown) {
      toast.error(errorMessage(error, "Erreur lors de la mise à jour du statut"));
    } finally {
      setActionLoading(null);
    }
  };

  const margin = (booking: AdminBooking) => {
    if (booking.supplier_cost === null || booking.supplier_cost === undefined) return null;
    return Number(booking.total_price) - Number(booking.supplier_cost);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-96" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("ux.bo.bookingManagement")}</h1>
            <p className="text-muted-foreground">
              {filteredBookings.length} réservation(s) trouvée(s)
            </p>
          </div>
          <ExportButtons data={filteredBookings} filename="reservations" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("ux.bo.filters")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("ux.bo.searchNameEmailPnr")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={t("ux.bo.status")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("ux.bo.allStatuses")}</SelectItem>
                  <SelectItem value="pending">{t("ux.bo.pending2")}</SelectItem>
                  <SelectItem value="confirmed">{t("ux.bo.confirmed2")}</SelectItem>
                  <SelectItem value="completed">{t("ux.bo.completed")}</SelectItem>
                  <SelectItem value="cancelled">{t("ux.bo.cancelled")}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={t("ux.bo.payment")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("ux.bo.allPayments")}</SelectItem>
                  <SelectItem value="pending">{t("ux.bo.pending2")}</SelectItem>
                  <SelectItem value="processing">{t("ux.bo.processing")}</SelectItem>
                  <SelectItem value="partially_paid">{t("ux.bo.depositPaid")}</SelectItem>
                  <SelectItem value="paid">{t("ux.bo.paid")}</SelectItem>
                  <SelectItem value="refunded">{t("ux.bo.refunded")}</SelectItem>
                  <SelectItem value="failed">{t("ux.bo.failed")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("ux.bo.customer")}</TableHead>
                <TableHead>{t("ux.bo.service")}</TableHead>
                <TableHead>{t("ux.bo.date")}</TableHead>
                <TableHead>{t("ux.bo.amount")}</TableHead>
                <TableHead>{t("ux.bo.margin")}</TableHead>
                <TableHead>{t("ux.bo.status")}</TableHead>
                <TableHead>{t("ux.bo.payment")}</TableHead>
                <TableHead>PNR</TableHead>
                <TableHead className="text-right">{t("ux.bo.details")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBookings.map((booking) => {
                const m = margin(booking);
                return (
                  <TableRow key={booking.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openDetail(booking)}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{booking.customer_name}</p>
                        <p className="text-sm text-muted-foreground">{booking.customer_email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {booking.services?.name || "N/A"}
                    </TableCell>
                    <TableCell>
                      {new Date(booking.start_date).toLocaleDateString("fr-FR")}
                    </TableCell>
                    <TableCell className="font-medium">
                      <Price amount={Number(booking.total_price)} fromCurrency={booking.currency} />
                    </TableCell>
                    <TableCell className={m !== null ? "text-success font-medium" : "text-muted-foreground"}>
                      {m !== null ? <Price amount={m} fromCurrency={booking.currency} /> : "-"}
                    </TableCell>
                    <TableCell>{bookingStatusBadge(booking.status)}</TableCell>
                    <TableCell>{paymentStatusBadge(booking.payment_status)}</TableCell>
                    <TableCell>
                      {booking.external_ref || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button aria-label={t("ux.bo.viewDetails")} variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openDetail(booking); }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      </div>

      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selectedBooking && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedBooking.customer_name}</SheetTitle>
                <SheetDescription>
                  {selectedBooking.services?.name || t("ux.bo.service")} · Réservation #{selectedBooking.id.slice(0, 8)}
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-6 mt-6">
                <div className="flex flex-wrap gap-2">
                  {bookingStatusBadge(selectedBooking.status)}
                  {paymentStatusBadge(selectedBooking.payment_status)}
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium break-all">{selectedBooking.customer_email}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t("ux.bo.phone")}</p>
                    <p className="font-medium">{selectedBooking.customer_phone || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t("ux.bo.amountCharged")}</p>
                    <p className="font-medium"><Price amount={Number(selectedBooking.total_price)} fromCurrency={selectedBooking.currency} /></p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t("ux.bo.margin")}</p>
                    <p className="font-medium text-success">
                      {margin(selectedBooking) !== null
                        ? <Price amount={margin(selectedBooking)!} fromCurrency={selectedBooking.currency} />
                        : t("ux.bo.supplierCostUnknown")}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t("ux.bo.pnrReference")}</p>
                    <p className="font-medium font-mono">{selectedBooking.external_ref || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t("ux.bo.created")}</p>
                    <p className="font-medium">{format(new Date(selectedBooking.created_at), "dd MMM yyyy HH:mm", { locale: fr })}</p>
                  </div>
                </div>

                {selectedBooking.notes && (
                  <div className="text-sm">
                    <p className="text-muted-foreground">{t("ux.bo.notes")}</p>
                    <p>{selectedBooking.notes}</p>
                  </div>
                )}

                <Separator />

                <div>
                  <h4 className="font-semibold text-sm mb-2">{t("ux.bo.payment")}</h4>
                  {detailLoading ? (
                    <Skeleton className="h-16" />
                  ) : detailPayment ? (
                    <div className="text-sm space-y-1 bg-muted/50 rounded-lg p-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("ux.bo.transaction")}</span>
                        <span className="font-mono text-xs">{detailPayment.transaction_id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("ux.bo.status")}</span>
                        {paymentStatusBadge(detailPayment.status)}
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("ux.bo.method")}</span>
                        <span>{detailPayment.payment_method}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">IP</span>
                        <span className="font-mono text-xs">{detailPayment.ip_address || "-"}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">{t("ux.bo.noPaymentRecorded")}</p>
                  )}
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold text-sm mb-2">{t("ux.bo.passengersTravelers")}</h4>
                  {detailLoading ? (
                    <Skeleton className="h-16" />
                  ) : detailPassengers.length > 0 ? (
                    <div className="space-y-2">
                      {detailPassengers.map((p) => (
                        <div key={p.id} className="text-sm bg-muted/50 rounded-lg p-3">
                          <p className="font-medium">{p.first_name} {p.last_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {p.document_type || "Document"} {p.document_number ? `· ${p.document_number}` : ""}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">{t("ux.bo.noPassengerRecorded")}</p>
                  )}
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">{t("ux.bo.administratorActions")}</h4>

                  {selectedBooking.payment_status === "partially_paid" && (
                    <div className="rounded-md border p-3 space-y-2">
                      <p className="text-sm">{t("ux.bo.remainingBalance")} <Price amount={selectedBooking.balance_due || 0} fromCurrency={selectedBooking.currency} /></p>
                      <Button className="w-full" disabled={actionLoading !== null} onClick={handleSettleOnSite}>
                        {actionLoading === "settle" && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        {t("ux.bo.confirmSitePayment")}
                      </Button>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Select value={pendingStatus} onValueChange={(v) => setPendingStatus(v as BookingStatus)}>
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">{t("ux.bo.pending2")}</SelectItem>
                        <SelectItem value="confirmed">{t("ux.bo.confirmed")}</SelectItem>
                        <SelectItem value="completed">{t("ux.bo.completed2")}</SelectItem>
                        <SelectItem value="cancelled">{t("ux.bo.cancelled2")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pendingStatus === selectedBooking.status || actionLoading !== null}
                      onClick={handleStatusChange}
                    >
                      {actionLoading === "status" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enregistrer"}
                    </Button>
                  </div>

                  {selectedBooking.services?.type === "flight" && selectedBooking.status !== "confirmed" && selectedBooking.payment_status === "paid" && (
                    <Button
                      variant="outline"
                      className="w-full"
                      disabled={actionLoading !== null}
                      onClick={handleRelaunchPnr}
                    >
                      {actionLoading === "pnr" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RotateCcw className="h-4 w-4 mr-2" />}
                      {t("ux.bo.retryTicketIssuancePnr")}
                    </Button>
                  )}

                  {selectedBooking.payment_status === "paid" && (
                    <Button
                      variant="destructive"
                      className="w-full"
                      disabled={actionLoading !== null}
                      onClick={handleRefund}
                    >
                      {actionLoading === "refund" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Undo2 className="h-4 w-4 mr-2" />}
                      {t("ux.bo.refundCancel")}
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </AdminLayout>
  );
};

export default AdminBookings;
