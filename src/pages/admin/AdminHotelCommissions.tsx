import { Fragment, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { getEdgeFunctionErrorMessage } from "@/lib/getEdgeFunctionErrorMessage";
import { formatFcfa } from "@/lib/hotels";
import { ChevronDown, ChevronRight, Download, FileText } from "lucide-react";

interface SummaryRow {
  agency_id: string;
  agency_name: string;
  stays_count: number;
  stays_amount: number;
  commission_amount: number;
  bookings: { bookingId: string; hotel: string; customer: string; checkIn: string; checkOut: string; total: number }[];
  invoice_id: string | null;
  invoice_status: string | null;
  invoice_due_at: string | null;
  invoiced_amount: number | null;
}

const previousMonth = () => {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const shortDate = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

// Commission de 10 % sur les séjours d'hôtel payés sur place (contrat
// hébergement, art. 6.3) : récapitulatif du mois par hôtel, émission de la
// facture (envoyée par email à l'hôtel) et suivi du paiement.
export default function AdminHotelCommissions() {
  const queryClient = useQueryClient();
  const [month, setMonth] = useState(previousMonth());
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const period = `${month}-01`;

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-hotel-onsite-commissions", period],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_hotel_onsite_commissions", { p_period: period });
      if (error) throw error;
      return (data || []) as unknown as SummaryRow[];
    },
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin-hotel-onsite-commissions", period] });

  const issue = async (row: SummaryRow) => {
    if (!confirm(`Émettre la facture de ${formatFcfa(row.commission_amount)} pour ${row.agency_name} et l'envoyer par email ?`)) return;
    setBusy(row.agency_id);
    try {
      const { data: invoiceId, error } = await supabase.rpc("admin_issue_hotel_onsite_invoice", {
        p_agency_id: row.agency_id,
        p_period: period,
      });
      if (error) throw error;
      const { data: sent, error: sendError } = await supabase.functions.invoke("send-hotel-commission-invoice", {
        body: { invoiceId },
      });
      if (sendError || !sent?.success) {
        const message = sendError ? await getEdgeFunctionErrorMessage(sendError) : sent?.error;
        toast.warning(`Facture émise, mais l'email n'est pas parti : ${message || "erreur inconnue"}`);
      } else {
        toast.success("Facture émise et envoyée à l'hôtel.");
      }
      await refresh();
    } catch (err) {
      toast.error((err as { message?: string })?.message || "Émission impossible");
    } finally {
      setBusy(null);
    }
  };

  const setStatus = async (row: SummaryRow, status: "paid" | "cancelled" | "issued") => {
    if (!row.invoice_id) return;
    if (status === "cancelled" && !confirm("Annuler cette facture ? Elle pourra être réémise.")) return;
    setBusy(row.agency_id);
    const { error } = await supabase.rpc("admin_set_hotel_onsite_invoice_status", { p_invoice_id: row.invoice_id, p_status: status });
    setBusy(null);
    if (error) return toast.error(error.message);
    await refresh();
  };

  const exportCsv = () => {
    const lines = [["Hôtel", "Réservation", "Établissement", "Client", "Arrivée", "Départ", "Montant (FCFA)", "Commission 10 % (FCFA)"]];
    for (const row of data ?? []) {
      for (const b of row.bookings) {
        lines.push([row.agency_name, b.bookingId.slice(0, 8).toUpperCase(), b.hotel, b.customer, b.checkIn, b.checkOut, String(b.total), String(Math.round(b.total * 0.1))]);
      }
    }
    const csv = lines.map((l) => l.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";")).join("\n");
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `commissions-hotels-sur-place-${month}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalCommission = (data ?? []).reduce((sum, r) => sum + Number(r.commission_amount), 0);
  const currentMonth = new Date().toISOString().slice(0, 7);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Commissions hôtels – paiement sur place</h1>
            <p className="text-muted-foreground">
              10 % des séjours payés à l'hôtel dont le départ tombe dans le mois, hors annulations et non-présentations déclarées.
            </p>
          </div>
          <div className="flex items-end gap-2">
            <div className="space-y-1">
              <Label htmlFor="commission-month" className="text-xs">Mois</Label>
              <Input id="commission-month" type="month" value={month} max={currentMonth} onChange={(e) => e.target.value && setMonth(e.target.value)} />
            </div>
            <Button variant="outline" onClick={exportCsv} disabled={!data?.length}>
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>
          </div>
        </div>

        {month >= currentMonth && (
          <p className="text-sm text-muted-foreground">Mois en cours : le récapitulatif évolue jusqu'à la fin du mois ; la facture s'émet le mois suivant.</p>
        )}

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>Hôtel</TableHead>
                <TableHead>Séjours</TableHead>
                <TableHead>Montant des séjours</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead>Facture</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8">Chargement...</TableCell></TableRow>
              ) : error ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-destructive">{(error as Error).message}</TableCell></TableRow>
              ) : !data?.length ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    Aucun séjour payé sur place pour ce mois.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row) => (
                  <Fragment key={row.agency_id}>
                    <TableRow>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Détail" onClick={() => setExpanded(expanded === row.agency_id ? null : row.agency_id)}>
                          {expanded === row.agency_id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </Button>
                      </TableCell>
                      <TableCell className="font-medium">{row.agency_name}</TableCell>
                      <TableCell>{row.stays_count}</TableCell>
                      <TableCell>{formatFcfa(Number(row.stays_amount))}</TableCell>
                      <TableCell className="font-semibold">{formatFcfa(Number(row.commission_amount))}</TableCell>
                      <TableCell>
                        {row.invoice_status === "paid" ? (
                          <Badge>Réglée</Badge>
                        ) : row.invoice_status === "issued" ? (
                          <div className="space-y-0.5">
                            <Badge variant="secondary">Émise · échéance {row.invoice_due_at ? shortDate(row.invoice_due_at) : "—"}</Badge>
                            {row.invoiced_amount != null && Number(row.invoiced_amount) !== Number(row.commission_amount) && (
                              <p className="text-xs text-destructive">Facturé {formatFcfa(Number(row.invoiced_amount))} : le récapitulatif a changé depuis.</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Non émise</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        {!row.invoice_id && (
                          <Button size="sm" disabled={busy === row.agency_id || month >= currentMonth || row.stays_count === 0} onClick={() => issue(row)}>
                            Émettre et envoyer
                          </Button>
                        )}
                        {row.invoice_status === "issued" && (
                          <>
                            <Button size="sm" variant="outline" disabled={busy === row.agency_id} onClick={() => setStatus(row, "paid")}>Marquer réglée</Button>
                            <Button size="sm" variant="ghost" disabled={busy === row.agency_id} onClick={() => setStatus(row, "cancelled")}>Annuler</Button>
                          </>
                        )}
                        {row.invoice_status === "paid" && (
                          <Button size="sm" variant="ghost" disabled={busy === row.agency_id} onClick={() => setStatus(row, "issued")}>Remettre à régler</Button>
                        )}
                      </TableCell>
                    </TableRow>
                    {expanded === row.agency_id && (
                      <TableRow>
                        <TableCell />
                        <TableCell colSpan={6}>
                          <ul className="space-y-1 text-sm py-1">
                            {row.bookings.map((b) => (
                              <li key={b.bookingId} className="flex flex-wrap justify-between gap-2">
                                <span>
                                  {b.bookingId.slice(0, 8).toUpperCase()} · {b.customer} · {b.hotel} · {shortDate(b.checkIn)} → {shortDate(b.checkOut)}
                                </span>
                                <span>{formatFcfa(b.total)} → {formatFcfa(Math.round(b.total * 0.1))}</span>
                              </li>
                            ))}
                          </ul>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {!!data?.length && (
          <p className="text-sm text-right">Total des commissions du mois : <strong>{formatFcfa(totalCommission)}</strong></p>
        )}
      </div>
    </AdminLayout>
  );
}
