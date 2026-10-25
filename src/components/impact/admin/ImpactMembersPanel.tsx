import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { BENEFIT_STATE, describeBenefit, formatImpactDate, formatXof, type ImpactBenefitSummary } from "@/lib/impact";

interface MemberBenefit {
  id: string;
  title: string;
  details: ImpactBenefitSummary;
  uses_allowed: number;
  uses: number;
  valid_from: string;
  expires_at: string;
  state: string;
  revoked_reason: string | null;
  history: {
    id: string;
    used_at: string;
    service_key: string;
    order_reference: string;
    discount_xof: number;
    note: string | null;
    cancelled_at: string | null;
    cancel_reason: string | null;
  }[];
}

interface MemberDetail {
  member: { id: string; reference: string; name: string | null };
  smiles_balance: number;
  benefits: MemberBenefit[];
}

export function ImpactMembersPanel({ campaignId }: { campaignId: string }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [reference, setReference] = useState<string | null>(null);
  const [using, setUsing] = useState<MemberBenefit | null>(null);

  const members = useQuery({
    queryKey: ["impact-admin-members", campaignId, query],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("impact_admin_members", {
        p_campaign_id: campaignId,
        p_search: query || null,
      });
      if (error) throw error;
      return data ?? [];
    },
  });

  const detail = useQuery({
    queryKey: ["impact-admin-member", reference],
    enabled: !!reference,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("impact_admin_member_benefits", { p_member_reference: reference! });
      if (error) throw error;
      return data as unknown as MemberDetail | null;
    },
  });
  const refreshDetail = () => queryClient.invalidateQueries({ queryKey: ["impact-admin-member", reference] });

  const revoke = async (b: MemberBenefit) => {
    const reason = prompt(`Motif du retrait de « ${b.title} » (obligatoire) :`);
    if (!reason?.trim()) return;
    const { error } = await supabase.rpc("impact_admin_revoke_benefit", {
      p_member_benefit_id: b.id,
      p_reason: reason,
    });
    if (error) return toast.error(error.message);
    toast.success("Avantage retiré (opération journalisée).");
    refreshDetail();
  };

  const cancelUse = async (useId: string) => {
    const reason = prompt("Motif de l'annulation de cette utilisation (obligatoire) :");
    if (!reason?.trim()) return;
    const { error } = await supabase.rpc("impact_admin_cancel_benefit_use", { p_use_id: useId, p_reason: reason });
    if (error) return toast.error(error.message);
    toast.success("Utilisation annulée.");
    refreshDetail();
  };

  return (
    <div className="space-y-6">
      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          const value = search.trim();
          if (/^MI-\d{5,}$/i.test(value)) setReference(value.toUpperCase());
          setQuery(value);
        }}
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-10"
            placeholder="Référence MI-xxxxx, nom ou e-mail"
            aria-label="Rechercher un membre"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button type="submit">Rechercher</Button>
      </form>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Membre</TableHead>
                <TableHead className="text-right">Contributions</TableHead>
                <TableHead className="text-right">Avantages disponibles</TableHead>
                <TableHead className="text-right">Smiles</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {(members.data ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    {members.isLoading ? "Chargement…" : "Aucun membre."}
                  </TableCell>
                </TableRow>
              ) : (
                (members.data ?? []).map((m) => (
                  <TableRow key={m.member_id}>
                    <TableCell>
                      <p className="font-medium">{m.display_name ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">
                        {m.member_reference} · {m.email ?? "compte supprimé"}
                      </p>
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {formatXof(m.paid_xof)} ({m.contributions})
                    </TableCell>
                    <TableCell className="text-right">{m.open_benefits}</TableCell>
                    <TableCell className="text-right">{m.smiles_balance.toLocaleString("fr-FR")}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => setReference(m.member_reference)}>
                        Avantages
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {reference && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {detail.data?.member.name ?? reference} · {reference}
            </CardTitle>
            <CardDescription>
              {detail.data
                ? `Solde Smiles : ${detail.data.smiles_balance.toLocaleString("fr-FR")}. Vérifiez l'état d'un avantage avant de l'appliquer à une commande.`
                : detail.isLoading
                  ? "Chargement…"
                  : "Membre introuvable."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {detail.data?.benefits.length === 0 && <p className="text-sm text-muted-foreground">Aucun avantage.</p>}
            {detail.data?.benefits.map((b) => {
              const state = BENEFIT_STATE[b.state] ?? { label: b.state, tone: "outline" as const };
              return (
                <div key={b.id} className="space-y-2 rounded-md border p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">{b.title}</p>
                    <Badge variant={state.tone}>{state.label}</Badge>
                  </div>
                  <p className="text-muted-foreground">{describeBenefit(b.details)}</p>
                  <p className="text-xs text-muted-foreground">
                    Utilisé {b.uses}/{b.uses_allowed} · du {formatImpactDate(b.valid_from)} au{" "}
                    {formatImpactDate(b.expires_at)}
                    {b.revoked_reason ? ` · retiré : ${b.revoked_reason}` : ""}
                  </p>
                  {b.history.length > 0 && (
                    <ul className="space-y-1 text-xs">
                      {b.history.map((h) => (
                        <li key={h.id} className="flex flex-wrap items-center justify-between gap-2">
                          <span className={h.cancelled_at ? "line-through text-muted-foreground" : undefined}>
                            {formatImpactDate(h.used_at, true)} · {h.service_key} · commande {h.order_reference} ·{" "}
                            {formatXof(h.discount_xof)}
                            {h.cancel_reason ? ` (annulée : ${h.cancel_reason})` : ""}
                          </span>
                          {!h.cancelled_at && (
                            <Button
                              variant="link"
                              size="sm"
                              className="h-auto p-0 text-xs"
                              onClick={() => cancelUse(h.id)}
                            >
                              Annuler
                            </Button>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" disabled={b.state !== "available"} onClick={() => setUsing(b)}>
                      Appliquer à une commande
                    </Button>
                    {b.state !== "revoked" && (
                      <Button size="sm" variant="ghost" onClick={() => revoke(b)}>
                        Retirer
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <UseBenefitDialog benefit={using} onClose={() => setUsing(null)} onDone={refreshDetail} />
    </div>
  );
}

function UseBenefitDialog({
  benefit,
  onClose,
  onDone,
}: {
  benefit: MemberBenefit | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [service, setService] = useState("");
  const [order, setOrder] = useState("");
  const [discount, setDiscount] = useState("0");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const services = useQuery({
    queryKey: ["impact-admin-services"],
    queryFn: async () => {
      const { data, error } = await supabase.from("impact_eligible_services").select("*").order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });
  const eligible = (services.data ?? []).filter(
    (s) => s.is_enabled && benefit?.details.eligible_services?.includes(s.key),
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!benefit || saving) return;
    setSaving(true);
    const { error } = await supabase.rpc("impact_admin_use_benefit", {
      p_member_benefit_id: benefit.id,
      p_service_key: service,
      p_order_reference: order,
      p_discount_xof: Number(discount),
      p_note: note || null,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Avantage appliqué à la commande.");
    setOrder("");
    setDiscount("0");
    setNote("");
    onClose();
    onDone();
  };

  return (
    <Dialog open={!!benefit} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Appliquer « {benefit?.title} »</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label>Service</Label>
            <Select value={service} onValueChange={setService}>
              <SelectTrigger aria-label="Service">
                <SelectValue placeholder={eligible.length ? "Choisir" : "Aucun service activé pour cet avantage"} />
              </SelectTrigger>
              <SelectContent>
                {eligible.map((s) => (
                  <SelectItem key={s.key} value={s.key}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="u-order">Référence de la commande</Label>
            <Input
              id="u-order"
              value={order}
              onChange={(e) => setOrder(e.target.value)}
              minLength={2}
              maxLength={120}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="u-discount">Réduction accordée (FCFA)</Label>
            <Input
              id="u-discount"
              type="number"
              min={0}
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              required
            />
            {benefit?.details.max_discount_xof != null && (
              <p className="text-xs text-muted-foreground">Plafond : {formatXof(benefit.details.max_discount_xof)}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="u-note">Note</Label>
            <Textarea id="u-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={saving || !service}>
              Appliquer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
