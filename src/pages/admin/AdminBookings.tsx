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

const bookingStatusBadge = (status: string) => <BookingStatusBadge status={status} />;
const paymentStatusBadge = (status: string) => <PaymentStatusBadge status={status} />;

const AdminBookings = () => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [detailPassengers, setDetailPassengers] = useState<any[]>([]);
  const [detailPayment, setDetailPayment] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<"refund" | "pnr" | "status" | null>(null);
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
      setBookings(data || []);
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

  const openDetail = async (booking: any) => {
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
      setDetailPassengers(passengers || []);
      setDetailPayment(payment || null);
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
      setSelectedBooking(data);
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
      if (!data?.success) throw new Error(data?.error || "Échec du remboursement");

      toast.success(data.refunded ? "Remboursement effectué" : "Réservation annulée");
      await refreshAfterAction(selectedBooking.id);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors du remboursement");
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
        toast.error(data?.error || "Émission du billet toujours impossible");
      } else {
        toast.success(`PNR émis: ${data.pnr}`);
      }
      await refreshAfterAction(selectedBooking.id);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la relance du PNR");
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
      toast.success("Statut mis à jour");
      await refreshAfterAction(selectedBooking.id);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la mise à jour du statut");
    } finally {
      setActionLoading(null);
    }
  };

  const margin = (booking: any) => {
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
            <h1 className="text-3xl font-bold tracking-tight">Gestion des Réservations</h1>
            <p className="text-muted-foreground">
              {filteredBookings.length} réservation(s) trouvée(s)
            </p>
          </div>
          <ExportButtons data={filteredBookings} filename="reservations" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filtres</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher (nom, email, PNR...)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="confirmed">Confirmées</SelectItem>
                  <SelectItem value="completed">Terminées</SelectItem>
                  <SelectItem value="cancelled">Annulées</SelectItem>
                </SelectContent>
              </Select>

              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Paiement" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les paiements</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="processing">En traitement</SelectItem>
                  <SelectItem value="paid">Payé</SelectItem>
                  <SelectItem value="refunded">Remboursé</SelectItem>
                  <SelectItem value="failed">Échoué</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Marge</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Paiement</TableHead>
                <TableHead>PNR</TableHead>
                <TableHead className="text-right">Détail</TableHead>
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
                    <TableCell className={m !== null ? "text-emerald-600 font-medium" : "text-muted-foreground"}>
                      {m !== null ? <Price amount={m} fromCurrency={booking.currency} /> : "-"}
                    </TableCell>
                    <TableCell>{bookingStatusBadge(booking.status)}</TableCell>
                    <TableCell>{paymentStatusBadge(booking.payment_status)}</TableCell>
                    <TableCell>
                      {booking.external_ref || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openDetail(booking); }}>
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
                  {selectedBooking.services?.name || "Service"} · Réservation #{selectedBooking.id.slice(0, 8)}
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
                    <p className="text-muted-foreground">Téléphone</p>
                    <p className="font-medium">{selectedBooking.customer_phone || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Montant facturé</p>
                    <p className="font-medium"><Price amount={Number(selectedBooking.total_price)} fromCurrency={selectedBooking.currency} /></p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Marge</p>
                    <p className="font-medium text-emerald-600">
                      {margin(selectedBooking) !== null
                        ? <Price amount={margin(selectedBooking)!} fromCurrency={selectedBooking.currency} />
                        : "Coût fournisseur inconnu"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">PNR / référence</p>
                    <p className="font-medium font-mono">{selectedBooking.external_ref || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Créée le</p>
                    <p className="font-medium">{format(new Date(selectedBooking.created_at), "dd MMM yyyy HH:mm", { locale: fr })}</p>
                  </div>
                </div>

                {selectedBooking.notes && (
                  <div className="text-sm">
                    <p className="text-muted-foreground">Notes</p>
                    <p>{selectedBooking.notes}</p>
                  </div>
                )}

                <Separator />

                <div>
                  <h4 className="font-semibold text-sm mb-2">Paiement</h4>
                  {detailLoading ? (
                    <Skeleton className="h-16" />
                  ) : detailPayment ? (
                    <div className="text-sm space-y-1 bg-muted/50 rounded-lg p-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Transaction</span>
                        <span className="font-mono text-xs">{detailPayment.transaction_id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Statut</span>
                        {paymentStatusBadge(detailPayment.status)}
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Méthode</span>
                        <span>{detailPayment.payment_method}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">IP</span>
                        <span className="font-mono text-xs">{detailPayment.ip_address || "-"}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Aucun paiement enregistré</p>
                  )}
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold text-sm mb-2">Passagers / voyageurs</h4>
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
                    <p className="text-sm text-muted-foreground">Aucun passager enregistré</p>
                  )}
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Actions administrateur</h4>

                  <div className="flex items-center gap-2">
                    <Select value={pendingStatus} onValueChange={(v) => setPendingStatus(v as BookingStatus)}>
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">En attente</SelectItem>
                        <SelectItem value="confirmed">Confirmée</SelectItem>
                        <SelectItem value="completed">Terminée</SelectItem>
                        <SelectItem value="cancelled">Annulée</SelectItem>
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
                      Relancer l'émission du billet (PNR)
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
                      Rembourser et annuler
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
