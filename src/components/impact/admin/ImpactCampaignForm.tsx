import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { IMPACT_PAYMENT_METHODS, type ImpactListItem } from "@/lib/impact";

type Campaign = Tables<"impact_campaigns">;

const toLocal = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};
const fromLocal = (value: string) => (value ? new Date(value).toISOString() : null);
const list = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

// Éditeur de liste (utilisation des fonds, étapes, FAQ).
function ListEditor<T extends object>({
  label,
  items,
  onChange,
  empty,
  fields,
}: {
  label: string;
  items: T[];
  onChange: (items: T[]) => void;
  empty: T;
  fields: { key: keyof T; placeholder: string; type?: "text" | "number" | "textarea" | "checkbox" }[];
}) {
  return (
    <div className="space-y-2 rounded-md border p-3">
      <p className="text-sm font-medium">{label}</p>
      {items.map((item, i) => (
        <div key={i} className="flex gap-2 rounded bg-muted/40 p-2">
          <div className="grid flex-1 gap-2 sm:grid-cols-2">
            {fields.map((f) => {
              const value = item[f.key] as unknown;
              const set = (v: unknown) => onChange(items.map((x, j) => (j === i ? { ...x, [f.key]: v } : x)));
              if (f.type === "checkbox") {
                return (
                  <label key={String(f.key)} className="flex items-center gap-2 text-sm">
                    <Checkbox checked={value === true} onCheckedChange={(c) => set(c === true)} />
                    {f.placeholder}
                  </label>
                );
              }
              if (f.type === "textarea") {
                return (
                  <Textarea
                    key={String(f.key)}
                    className="sm:col-span-2"
                    rows={2}
                    placeholder={f.placeholder}
                    aria-label={f.placeholder}
                    value={String(value ?? "")}
                    onChange={(e) => set(e.target.value)}
                  />
                );
              }
              return (
                <Input
                  key={String(f.key)}
                  type={f.type === "number" ? "number" : "text"}
                  placeholder={f.placeholder}
                  aria-label={f.placeholder}
                  value={value == null ? "" : String(value)}
                  onChange={(e) =>
                    set(f.type === "number" ? (e.target.value ? Number(e.target.value) : null) : e.target.value)
                  }
                />
              );
            })}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Retirer"
            onClick={() => onChange(items.filter((_, j) => j !== i))}
          >
            <X className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...items, { ...empty }])}>
        <Plus className="mr-1 h-3.5 w-3.5" />
        Ajouter
      </Button>
    </div>
  );
}

export function ImpactCampaignForm({ campaign }: { campaign: Campaign }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(campaign);
  const [saving, setSaving] = useState(false);

  useEffect(() => setForm(campaign), [campaign]);

  const set = <K extends keyof Campaign>(key: K, value: Campaign[K]) => setForm((f) => ({ ...f, [key]: value }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.status === "active" && campaign.status !== "active") {
      const ok = confirm(
        "Ouvrir la campagne au public ?\n\nVérifiez avant : conditions du programme, formules, avantages et Smiles validés par la direction, moyens de paiement réellement activés sur Jèko.",
      );
      if (!ok) return;
    }
    setSaving(true);
    const { id: _id, created_at: _c, updated_at: _u, ...payload } = form;
    const { error } = await supabase.from("impact_campaigns").update(payload).eq("id", campaign.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Campagne enregistrée.");
    queryClient.invalidateQueries({ queryKey: ["impact-admin-campaigns"] });
  };

  return (
    <form onSubmit={save} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Statut et objectifs</CardTitle>
          <CardDescription>
            Brouillon : invisible. Active : contributions ouvertes (entre les dates). Suspendue / terminée : visible,
            sans contribution.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label>Statut</Label>
            <Select value={form.status} onValueChange={(v) => set("status", v)}>
              <SelectTrigger aria-label="Statut">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Brouillon</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspendue</SelectItem>
                <SelectItem value="closed">Terminée</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="c-goal">Objectif (FCFA)</Label>
            <Input
              id="c-goal"
              type="number"
              min={1}
              value={form.goal_xof}
              onChange={(e) => set("goal_xof", Number(e.target.value))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="c-members">Membres visés</Label>
            <Input
              id="c-members"
              type="number"
              min={1}
              value={form.target_members ?? ""}
              onChange={(e) => set("target_members", e.target.value ? Number(e.target.value) : null)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="c-min">Contribution minimale (FCFA)</Label>
            <Input
              id="c-min"
              type="number"
              min={100}
              value={form.min_contribution_xof}
              onChange={(e) => set("min_contribution_xof", Number(e.target.value))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="c-max">Contribution maximale (FCFA, facultatif)</Label>
            <Input
              id="c-max"
              type="number"
              value={form.max_contribution_xof ?? ""}
              onChange={(e) => set("max_contribution_xof", e.target.value ? Number(e.target.value) : null)}
            />
          </div>
          <label className="flex items-center gap-2 self-end pb-2 text-sm">
            <Switch checked={form.allow_free_amount} onCheckedChange={(c) => set("allow_free_amount", c)} />
            Contribution libre autorisée
          </label>
          <div className="space-y-2">
            <Label htmlFor="c-start">Début</Label>
            <Input
              id="c-start"
              type="datetime-local"
              value={toLocal(form.starts_at)}
              onChange={(e) => set("starts_at", fromLocal(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="c-end">Fin</Label>
            <Input
              id="c-end"
              type="datetime-local"
              value={toLocal(form.ends_at)}
              onChange={(e) => set("ends_at", fromLocal(e.target.value))}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Présentation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="c-name">Nom de la campagne</Label>
              <Input id="c-name" value={form.name} onChange={(e) => set("name", e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-slug">Adresse (/bossiz-impact/…)</Label>
              <Input id="c-slug" value={form.slug} onChange={(e) => set("slug", e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-tag">Slogan principal</Label>
              <Input id="c-tag" value={form.tagline ?? ""} onChange={(e) => set("tagline", e.target.value || null)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-tag2">Slogan secondaire</Label>
              <Input
                id="c-tag2"
                value={form.secondary_tagline ?? ""}
                onChange={(e) => set("secondary_tagline", e.target.value || null)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="c-summary">Résumé</Label>
            <Textarea
              id="c-summary"
              rows={2}
              value={form.summary ?? ""}
              onChange={(e) => set("summary", e.target.value || null)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="c-desc">Objectif de la campagne (texte)</Label>
            <Textarea
              id="c-desc"
              rows={6}
              value={form.description ?? ""}
              onChange={(e) => set("description", e.target.value || null)}
            />
            <p className="text-xs text-muted-foreground">
              Paragraphes séparés par une ligne vide, « ## » pour un intertitre, « - » pour une liste.
            </p>
          </div>
          <ListEditor<ImpactListItem>
            label="Utilisation prévue des fonds"
            items={list<ImpactListItem>(form.funding_uses)}
            onChange={(items) => set("funding_uses", items as unknown as Campaign["funding_uses"])}
            empty={{ title: "", description: "", amount_xof: null }}
            fields={[
              { key: "title", placeholder: "Poste (ex. Infrastructure informatique)" },
              { key: "amount_xof", placeholder: "Montant prévu (FCFA)", type: "number" },
              { key: "description", placeholder: "Description", type: "textarea" },
            ]}
          />
          <ListEditor<ImpactListItem>
            label="Étapes financées"
            items={list<ImpactListItem>(form.milestones)}
            onChange={(items) => set("milestones", items as unknown as Campaign["milestones"])}
            empty={{ title: "", description: "", target_xof: null, done: false }}
            fields={[
              { key: "title", placeholder: "Étape" },
              { key: "target_xof", placeholder: "Palier (FCFA)", type: "number" },
              { key: "description", placeholder: "Description", type: "textarea" },
              { key: "done", placeholder: "Réalisée", type: "checkbox" },
            ]}
          />
          <ListEditor<{ question: string; answer: string }>
            label="Questions fréquentes (en plus des réponses standard)"
            items={list<{ question: string; answer: string }>(form.faq)}
            onChange={(items) => set("faq", items as unknown as Campaign["faq"])}
            empty={{ question: "", answer: "" }}
            fields={[
              { key: "question", placeholder: "Question" },
              { key: "answer", placeholder: "Réponse", type: "textarea" },
            ]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Avantages, paiement et conditions</CardTitle>
          <CardDescription>
            Les conditions doivent être publiées pour que les contributions soient acceptées.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="c-validity">Validité des avantages et Smiles (mois)</Label>
              <Input
                id="c-validity"
                type="number"
                min={1}
                max={120}
                value={form.benefits_validity_months}
                onChange={(e) => set("benefits_validity_months", Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-flights">Smiles sur les billets d'avion à partir de (FCFA)</Label>
              <Input
                id="c-flights"
                type="number"
                min={1}
                value={form.smiles_flights_min_xof ?? ""}
                onChange={(e) => set("smiles_flights_min_xof", e.target.value ? Number(e.target.value) : null)}
              />
              <p className="text-xs text-muted-foreground">
                Contribution minimale pour utiliser ses Smiles Impact sur un billet d'avion. Vide : jamais.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-from">Point de départ de la validité (facultatif)</Label>
              <Input
                id="c-from"
                type="date"
                value={form.benefits_valid_from ?? ""}
                onChange={(e) => set("benefits_valid_from", e.target.value || null)}
              />
              <p className="text-xs text-muted-foreground">Vide : à partir de la confirmation du paiement.</p>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Moyens de paiement activés sur le compte Jèko</Label>
            <div className="flex flex-wrap gap-4">
              {IMPACT_PAYMENT_METHODS.map((m) => (
                <label key={m.value} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={form.accepted_methods.includes(m.value)}
                    onCheckedChange={(c) =>
                      set(
                        "accepted_methods",
                        c ? [...form.accepted_methods, m.value] : form.accepted_methods.filter((x) => x !== m.value),
                      )
                    }
                  />
                  {m.label}
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Ne cochez que les opérateurs réellement activés sur le compte marchand : ils sont affichés aux
              contributeurs.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2 sm:col-span-3">
              <Label htmlFor="c-entity">Entité qui collecte les fonds</Label>
              <Input
                id="c-entity"
                placeholder="Raison sociale, forme, siège, RCCM"
                value={form.legal_entity ?? ""}
                onChange={(e) => set("legal_entity", e.target.value || null)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-email">E-mail de contact</Label>
              <Input
                id="c-email"
                type="email"
                value={form.contact_email ?? ""}
                onChange={(e) => set("contact_email", e.target.value || null)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-phone">Téléphone de contact</Label>
              <Input
                id="c-phone"
                value={form.contact_phone ?? ""}
                onChange={(e) => set("contact_phone", e.target.value || null)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-terms-v">Version des conditions</Label>
              <Input
                id="c-terms-v"
                value={form.terms_version}
                onChange={(e) => set("terms_version", e.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="c-terms">Conditions générales du programme</Label>
            <Textarea
              id="c-terms"
              rows={10}
              value={form.terms ?? ""}
              onChange={(e) => set("terms", e.target.value || null)}
            />
            <p className="text-xs text-muted-foreground">
              À faire valider par un juriste : entité, objet, utilisation des fonds, caractère volontaire, avantages et
              expiration, annulation et remboursement, réclamations, données personnelles. Changez la version à chaque
              modification : chaque contribution enregistre la version acceptée.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          Enregistrer la campagne
        </Button>
      </div>
    </form>
  );
}
