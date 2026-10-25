import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { CONTRIBUTION_STATUS, formatImpactDate, formatXof, impactMethodLabel } from "@/lib/impact";

export type ImpactTransaction = Database["public"]["Functions"]["impact_admin_transactions"]["Returns"][number];

const ALL = "all";

function useImpactTransactions(
  campaignId: string,
  filters: { status: string; from: string; to: string; search: string },
) {
  return useQuery({
    queryKey: ["impact-admin-transactions", campaignId, filters],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("impact_admin_transactions", {
        p_campaign_id: campaignId,
        p_status: filters.status === ALL ? null : filters.status,
        p_from: filters.from || null,
        p_to: filters.to || null,
        p_search: filters.search || null,
      });
      if (error) throw error;
      return data ?? [];
    },
  });
}

// Transactions : aucune action ne permet de marquer une contribution payée,
// seul le webhook vérifié du prestataire le fait. Le remboursement
// s'enregistre après le remboursement réel chez le prestataire.
export function ImpactTransactionsPanel({ campaignId }: { campaignId: string }) {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ status: ALL, from: "", to: "", search: "" });
  const [selected, setSelected] = useState<ImpactTransaction | null>(null);
  const [refunding, setRefunding] = useState(false);
  const [reason, setReason] = useState("");
  const [providerRef, setProviderRef] = useState("");
  const { data: rows = [], isLoading, isError } = useImpactTransactions(campaignId, filters);

  const refund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setRefunding(true);
    const { data, error } = await supabase.rpc("impact_admin_refund", {
      p_contribution_id: selected.contribution_id,
      p_reason: reason,
      p_provider_reference: providerRef,
    });
    setRefunding(false);
    if (error) return toast.error(error.message);
    const r = (data ?? {}) as {
      smiles_reversed?: number;
      smiles_already_used?: number;
      benefits_already_used?: number;
    };
    toast.success(
      `Remboursement enregistré. Smiles retirés : ${r.smiles_reversed ?? 0}` +
        (r.smiles_already_used ? `, déjà utilisés : ${r.smiles_already_used}` : "") +
        (r.benefits_already_used ? `, avantages déjà utilisés : ${r.benefits_already_used}` : "") +
        ".",
    );
    setSelected(null);
    setReason("");
    setProviderRef("");
    queryClient.invalidateQueries({ queryKey: ["impact-admin-transactions"] });
    queryClient.invalidateQueries({ queryKey: ["impact-admin-overview"] });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Select value={filters.status} onValueChange={(status) => setFilters({ ...filters, status })}>
          <SelectTrigger aria-label="Statut">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Tous les statuts</SelectItem>
            {Object.entries(CONTRIBUTION_STATUS).map(([value, s]) => (
              <SelectItem key={value} value={value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="date"
          aria-label="Du"
          value={filters.from}
          onChange={(e) => setFilters({ ...filters, from: e.target.value })}
        />
        <Input
          type="date"
          aria-label="Au"
          value={filters.to}
          onChange={(e) => setFilters({ ...filters, to: e.target.value })}
        />
        <Input
          placeholder="Référence, membre, e-mail…"
          aria-label="Rechercher"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Référence</TableHead>
                <TableHead>Contributeur</TableHead>
                <TableHead>Formule</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead>Moyen</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading || isError || rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    {isLoading ? "Chargement…" : isError ? "Transactions indisponibles." : "Aucune transaction."}
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((t) => {
                  const s = CONTRIBUTION_STATUS[t.status] ?? { label: t.status, tone: "outline" as const };
                  return (
                    <TableRow key={t.contribution_id} className="cursor-pointer" onClick={() => setSelected(t)}>
                      <TableCell className="font-mono text-xs">{t.reference}</TableCell>
                      <TableCell>
                        {t.contributor_name}
                        {t.member_reference && (
                          <span className="block text-xs text-muted-foreground">{t.member_reference}</span>
                        )}
                      </TableCell>
                      <TableCell>{t.offer_name}</TableCell>
                      <TableCell className="whitespace-nowrap text-right">{formatXof(t.amount_xof)}</TableCell>
                      <TableCell>{impactMethodLabel(t.payment_method)}</TableCell>
                      <TableCell>
                        <Badge variant={s.tone}>{s.label}</Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs">
                        {formatImpactDate(t.paid_at ?? t.created_at, true)}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Contribution {selected?.reference}</DialogTitle>
            <DialogDescription>{selected?.contributor_name}</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 text-sm">
              <dl className="grid grid-cols-[10rem_1fr] gap-x-3 gap-y-1">
                <dt className="text-muted-foreground">Statut</dt>
                <dd>{CONTRIBUTION_STATUS[selected.status]?.label ?? selected.status}</dd>
                <dt className="text-muted-foreground">Montant</dt>
                <dd>{formatXof(selected.amount_xof)}</dd>
                <dt className="text-muted-foreground">Formule</dt>
                <dd>{selected.offer_name}</dd>
                <dt className="text-muted-foreground">Membre</dt>
                <dd>{selected.member_reference ?? "—"}</dd>
                <dt className="text-muted-foreground">E-mail</dt>
                <dd>{selected.contributor_email ?? "—"}</dd>
                <dt className="text-muted-foreground">Créée le</dt>
                <dd>{formatImpactDate(selected.created_at, true)}</dd>
                <dt className="text-muted-foreground">Payée le</dt>
                <dd>{formatImpactDate(selected.paid_at, true)}</dd>
                <dt className="text-muted-foreground">Moyen</dt>
                <dd>{impactMethodLabel(selected.payment_method)}</dd>
                <dt className="text-muted-foreground">Transaction Jèko</dt>
                <dd className="break-all font-mono text-xs">{selected.provider_transaction_id ?? "—"}</dd>
                <dt className="text-muted-foreground">Statut prestataire</dt>
                <dd>
                  {selected.provider_status ?? "—"} (paiement : {selected.payment_status ?? "—"})
                </dd>
                {selected.refunded_at && (
                  <>
                    <dt className="text-muted-foreground">Remboursée le</dt>
                    <dd>
                      {formatImpactDate(selected.refunded_at, true)} · réf. {selected.refund_reference} ·{" "}
                      {selected.refund_reason}
                    </dd>
                  </>
                )}
              </dl>

              {selected.status === "paid" && (
                <form onSubmit={refund} className="space-y-3 rounded-md border border-destructive/30 p-3">
                  <p className="font-medium">Enregistrer un remboursement</p>
                  <p className="text-xs text-muted-foreground">
                    Effectuez d'abord le remboursement chez le prestataire (Jèko), puis indiquez sa référence. Les
                    avantages non utilisés sont retirés et les Smiles Impact encore disponibles sont débités ; ce qui a
                    déjà été utilisé vous est signalé.
                  </p>
                  <div className="space-y-1">
                    <Label htmlFor="rf-ref">Référence du remboursement chez le prestataire</Label>
                    <Input id="rf-ref" value={providerRef} onChange={(e) => setProviderRef(e.target.value)} required />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="rf-reason">Motif</Label>
                    <Textarea
                      id="rf-reason"
                      rows={2}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" variant="destructive" disabled={refunding}>
                    Enregistrer le remboursement
                  </Button>
                </form>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
