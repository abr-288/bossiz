import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { BENEFIT_TYPES, describeBenefit, formatXof } from "@/lib/impact";

type Offer = Tables<"impact_offers">;
type Benefit = Tables<"impact_benefits">;
type Service = Tables<"impact_eligible_services">;

const num = (v: string) => (v.trim() === "" ? null : Number(v));
const toLocal = (iso: string | null) => (iso ? new Date(iso).toISOString().slice(0, 16) : "");
const fromLocal = (v: string) => (v ? new Date(v).toISOString() : null);

// Suppression refusée par la base dès qu'une offre ou un avantage a servi
// (historique conservé) : on propose alors de le désactiver.
const deleteError = (code?: string) =>
  code === "23503" ? "Déjà utilisé par des contributions : désactivez-le plutôt que de le supprimer." : null;

export function ImpactOffersManager({ campaignId }: { campaignId: string }) {
  const queryClient = useQueryClient();
  const data = useQuery({
    queryKey: ["impact-admin-offers", campaignId],
    queryFn: async () => {
      const [offers, benefits, services] = await Promise.all([
        supabase.from("impact_offers").select("*").eq("campaign_id", campaignId).order("sort_order"),
        supabase.from("impact_benefits").select("*").order("sort_order"),
        supabase.from("impact_eligible_services").select("*").order("sort_order"),
      ]);
      const error = offers.error || benefits.error || services.error;
      if (error) throw error;
      return { offers: offers.data ?? [], benefits: benefits.data ?? [], services: services.data ?? [] };
    },
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["impact-admin-offers", campaignId] });

  const [offer, setOffer] = useState<Partial<Offer> | null>(null);
  const [benefit, setBenefit] = useState<Partial<Benefit> | null>(null);

  const saveOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offer) return;
    const payload = {
      campaign_id: campaignId,
      name: offer.name ?? "",
      description: offer.description || null,
      min_amount_xof: Number(offer.min_amount_xof),
      max_amount_xof: offer.max_amount_xof ?? null,
      smiles_awarded: Number(offer.smiles_awarded ?? 0),
      smiles_percent: offer.smiles_percent ?? null,
      validity_months: offer.validity_months ?? null,
      available_from: offer.available_from ?? null,
      available_until: offer.available_until ?? null,
      max_members: offer.max_members ?? null,
      terms: offer.terms || null,
      is_active: offer.is_active ?? true,
      sort_order: Number(offer.sort_order ?? 100),
    };
    const { error } = offer.id
      ? await supabase.from("impact_offers").update(payload).eq("id", offer.id)
      : await supabase.from("impact_offers").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Formule enregistrée. Elle s'applique aux nouvelles contributions.");
    setOffer(null);
    refresh();
  };

  const saveBenefit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!benefit) return;
    const payload = {
      offer_id: benefit.offer_id!,
      title: benefit.title ?? "",
      description: benefit.description || null,
      benefit_type: benefit.benefit_type ?? "other",
      value: benefit.value ?? null,
      max_discount_xof: benefit.max_discount_xof ?? null,
      uses_per_member: Number(benefit.uses_per_member ?? 1),
      eligible_services: benefit.eligible_services ?? [],
      cumulable: benefit.cumulable ?? false,
      exclusions: benefit.exclusions || null,
      conditions: benefit.conditions || null,
      is_active: benefit.is_active ?? true,
      sort_order: Number(benefit.sort_order ?? 100),
    };
    const { error } = benefit.id
      ? await supabase.from("impact_benefits").update(payload).eq("id", benefit.id)
      : await supabase.from("impact_benefits").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Avantage enregistré. Les membres déjà inscrits gardent les conditions acceptées.");
    setBenefit(null);
    refresh();
  };

  const remove = async (table: "impact_offers" | "impact_benefits", id: string, label: string) => {
    if (!confirm(`Supprimer « ${label} » ?`)) return;
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) return toast.error(deleteError(error.code) ?? error.message);
    refresh();
  };

  if (data.isLoading) return <p className="text-muted-foreground">Chargement…</p>;
  if (!data.data) return <p className="text-muted-foreground">Formules indisponibles.</p>;
  const { offers, benefits, services } = data.data;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Montants, Smiles et avantages sont à valider par la direction. Une modification ne concerne que les
          contributions futures.
        </p>
        <Button onClick={() => setOffer({ is_active: true, smiles_awarded: 0, sort_order: (offers.length + 1) * 10 })}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle formule
        </Button>
      </div>

      {offers.map((o) => {
        const own = benefits.filter((b) => b.offer_id === o.id);
        return (
          <Card key={o.id}>
            <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  {o.name}
                  {!o.is_active && <Badge variant="outline">Inactive</Badge>}
                </CardTitle>
                <CardDescription>
                  {formatXof(o.min_amount_xof)}
                  {o.max_amount_xof != null ? ` à ${formatXof(o.max_amount_xof)}` : " et plus"} ·{" "}
                  {o.smiles_percent ? `${o.smiles_percent} % en Smiles` : ""}
                  {o.smiles_percent && o.smiles_awarded ? " + " : ""}
                  {o.smiles_awarded || !o.smiles_percent ? `${o.smiles_awarded.toLocaleString("fr-FR")} Smiles` : ""}
                  {o.max_members ? ` · ${o.max_members} membres max.` : ""}
                </CardDescription>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" aria-label="Modifier la formule" onClick={() => setOffer(o)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Supprimer la formule"
                  onClick={() => remove("impact_offers", o.id, o.name)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {own.length === 0 && <p className="text-sm text-muted-foreground">Aucun avantage défini.</p>}
              {own.map((b) => (
                <div key={b.id} className="flex items-start justify-between gap-3 rounded-md bg-muted/40 p-3 text-sm">
                  <div>
                    <p className="font-medium">
                      {b.title} {!b.is_active && <Badge variant="outline">Inactif</Badge>}
                    </p>
                    <p className="text-muted-foreground">{describeBenefit(b)}</p>
                    <p className="text-xs text-muted-foreground">
                      Services :{" "}
                      {b.eligible_services.length
                        ? b.eligible_services.map((k) => services.find((s) => s.key === k)?.label ?? k).join(", ")
                        : "aucun (à définir)"}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" aria-label="Modifier l'avantage" onClick={() => setBenefit(b)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Supprimer l'avantage"
                      onClick={() => remove("impact_benefits", b.id, b.title)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setBenefit({
                    offer_id: o.id,
                    benefit_type: "percent_discount",
                    uses_per_member: 1,
                    is_active: true,
                    eligible_services: [],
                  })
                }
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                Ajouter un avantage
              </Button>
            </CardContent>
          </Card>
        );
      })}

      <Dialog open={!!offer} onOpenChange={(o) => !o && setOffer(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{offer?.id ? "Modifier la formule" : "Nouvelle formule"}</DialogTitle>
          </DialogHeader>
          {offer && (
            <form onSubmit={saveOffer} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="o-name">Nom</Label>
                <Input
                  id="o-name"
                  value={offer.name ?? ""}
                  onChange={(e) => setOffer({ ...offer, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="o-desc">Description</Label>
                <Textarea
                  id="o-desc"
                  rows={2}
                  value={offer.description ?? ""}
                  onChange={(e) => setOffer({ ...offer, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="o-min">Montant minimal (FCFA)</Label>
                <Input
                  id="o-min"
                  type="number"
                  min={100}
                  value={offer.min_amount_xof ?? ""}
                  onChange={(e) => setOffer({ ...offer, min_amount_xof: Number(e.target.value) })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="o-max">Montant maximal (facultatif)</Label>
                <Input
                  id="o-max"
                  type="number"
                  value={offer.max_amount_xof ?? ""}
                  onChange={(e) => setOffer({ ...offer, max_amount_xof: num(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="o-percent">% du montant en Smiles</Label>
                <Input
                  id="o-percent"
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  value={offer.smiles_percent ?? ""}
                  onChange={(e) => setOffer({ ...offer, smiles_percent: num(e.target.value) || null })}
                />
                <p className="text-xs text-muted-foreground">
                  1 Smile par FCFA. Ex. : 50 % de 10 000 FCFA = 5 000 Smiles.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="o-smiles">Smiles fixes en plus</Label>
                <Input
                  id="o-smiles"
                  type="number"
                  min={0}
                  value={offer.smiles_awarded ?? 0}
                  onChange={(e) => setOffer({ ...offer, smiles_awarded: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="o-validity">Validité (mois, vide = campagne)</Label>
                <Input
                  id="o-validity"
                  type="number"
                  min={1}
                  max={120}
                  value={offer.validity_months ?? ""}
                  onChange={(e) => setOffer({ ...offer, validity_months: num(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="o-from">Disponible à partir du</Label>
                <Input
                  id="o-from"
                  type="datetime-local"
                  value={toLocal(offer.available_from ?? null)}
                  onChange={(e) => setOffer({ ...offer, available_from: fromLocal(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="o-until">Disponible jusqu'au</Label>
                <Input
                  id="o-until"
                  type="datetime-local"
                  value={toLocal(offer.available_until ?? null)}
                  onChange={(e) => setOffer({ ...offer, available_until: fromLocal(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="o-maxm">Nombre maximal de membres</Label>
                <Input
                  id="o-maxm"
                  type="number"
                  min={1}
                  value={offer.max_members ?? ""}
                  onChange={(e) => setOffer({ ...offer, max_members: num(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="o-sort">Ordre d'affichage</Label>
                <Input
                  id="o-sort"
                  type="number"
                  value={offer.sort_order ?? 100}
                  onChange={(e) => setOffer({ ...offer, sort_order: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="o-terms">Conditions commerciales de la formule</Label>
                <Textarea
                  id="o-terms"
                  rows={3}
                  value={offer.terms ?? ""}
                  onChange={(e) => setOffer({ ...offer, terms: e.target.value })}
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={offer.is_active ?? true}
                  onCheckedChange={(c) => setOffer({ ...offer, is_active: c })}
                />
                Active
              </label>
              <div className="flex justify-end gap-2 sm:col-span-2">
                <Button type="button" variant="outline" onClick={() => setOffer(null)}>
                  Annuler
                </Button>
                <Button type="submit">Enregistrer</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!benefit} onOpenChange={(o) => !o && setBenefit(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{benefit?.id ? "Modifier l'avantage" : "Nouvel avantage"}</DialogTitle>
          </DialogHeader>
          {benefit && (
            <BenefitForm
              benefit={benefit}
              services={services}
              onChange={setBenefit}
              onSubmit={saveBenefit}
              onCancel={() => setBenefit(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BenefitForm({
  benefit,
  services,
  onChange,
  onSubmit,
  onCancel,
}: {
  benefit: Partial<Benefit>;
  services: Service[];
  onChange: (b: Partial<Benefit>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}) {
  const selected = benefit.eligible_services ?? [];
  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="b-title">Intitulé</Label>
        <Input
          id="b-title"
          value={benefit.title ?? ""}
          onChange={(e) => onChange({ ...benefit, title: e.target.value })}
          required
        />
      </div>
      <div className="space-y-2">
        <Label>Type</Label>
        <Select
          value={benefit.benefit_type ?? "other"}
          onValueChange={(v) => onChange({ ...benefit, benefit_type: v })}
        >
          <SelectTrigger aria-label="Type d'avantage">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {BENEFIT_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="b-value">Valeur (% ou FCFA)</Label>
        <Input
          id="b-value"
          type="number"
          min={0}
          value={benefit.value ?? ""}
          onChange={(e) => onChange({ ...benefit, value: num(e.target.value) })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="b-cap">Plafond de réduction (FCFA)</Label>
        <Input
          id="b-cap"
          type="number"
          min={0}
          value={benefit.max_discount_xof ?? ""}
          onChange={(e) => onChange({ ...benefit, max_discount_xof: num(e.target.value) })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="b-uses">Utilisations par membre</Label>
        <Input
          id="b-uses"
          type="number"
          min={1}
          value={benefit.uses_per_member ?? 1}
          onChange={(e) => onChange({ ...benefit, uses_per_member: Number(e.target.value) })}
        />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label>Services concernés</Label>
        <div className="grid gap-2 sm:grid-cols-2">
          {services.map((s) => (
            <label key={s.key} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={selected.includes(s.key)}
                onCheckedChange={(c) =>
                  onChange({
                    ...benefit,
                    eligible_services: c ? [...selected, s.key] : selected.filter((k) => k !== s.key),
                  })
                }
              />
              {s.label}
              {!s.is_enabled && <span className="text-xs text-muted-foreground">(service non activé)</span>}
            </label>
          ))}
        </div>
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="b-desc">Description</Label>
        <Textarea
          id="b-desc"
          rows={2}
          value={benefit.description ?? ""}
          onChange={(e) => onChange({ ...benefit, description: e.target.value })}
        />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="b-cond">Conditions d'éligibilité</Label>
        <Textarea
          id="b-cond"
          rows={2}
          value={benefit.conditions ?? ""}
          onChange={(e) => onChange({ ...benefit, conditions: e.target.value })}
        />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="b-excl">Exclusions</Label>
        <Textarea
          id="b-excl"
          rows={2}
          value={benefit.exclusions ?? ""}
          onChange={(e) => onChange({ ...benefit, exclusions: e.target.value })}
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <Switch checked={benefit.cumulable ?? false} onCheckedChange={(c) => onChange({ ...benefit, cumulable: c })} />
        Cumulable avec d'autres promotions
      </label>
      <label className="flex items-center gap-2 text-sm">
        <Switch checked={benefit.is_active ?? true} onCheckedChange={(c) => onChange({ ...benefit, is_active: c })} />
        Actif
      </label>
      <p className="text-xs text-muted-foreground sm:col-span-2">
        Validation : l'avantage est appliqué par l'équipe Conciergerie Bossiz, qui vérifie l'éligibilité du membre dans
        l'onglet Membres avant de l'enregistrer sur la commande.
      </p>
      <div className="flex justify-end gap-2 sm:col-span-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit">Enregistrer</Button>
      </div>
    </form>
  );
}
