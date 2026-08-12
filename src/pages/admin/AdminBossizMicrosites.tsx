import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, Plus, Trash2 } from "lucide-react";
import { useBossizMicrositeContent, type BossizMicrositeContent } from "@/hooks/useBossizMicrositeContent";
import { useBossizConfig, type BossizSiteConfig, type BossizGlobalConfig } from "@/hooks/useBossizConfig";
import type { BossizCountry } from "@/components/bossiz/BossizSiteLayout";
import { BOSSIZ_ICON_NAMES, getBossizIcon } from "@/data/bossizIconMap";

type ServiceItem = BossizMicrositeContent["servicesList"][number];
type AdditionalServiceItem = BossizMicrositeContent["additionalServicesList"][number];
type PlanItem = BossizMicrositeContent["monthlyPlansList"][number];
type ShortStayItem = BossizMicrositeContent["shortStayPlansList"][number];
type TestimonialItem = BossizMicrositeContent["testimonialsList"][number];
type GlobalStatItem = BossizGlobalConfig["globalStats"][number];
type PortalServiceItem = BossizGlobalConfig["services"][number];
type CompanyValueItem = BossizGlobalConfig["companyValues"][number];
type SiteStatItem = BossizSiteConfig["stats"][number];

// Correspondance entre les codes pays utilisés partout ailleurs (ci/sn) et
// les identifiants historiques de la table bossiz_sites_config.
const SITE_ID_BY_COUNTRY: Record<BossizCountry, string> = {
  ci: "cote-d-ivoire",
  sn: "senegal",
};

function MicrositeContentForm({ country }: { country: BossizCountry }) {
  const { content, loading, updateContent } = useBossizMicrositeContent(country);
  const [form, setForm] = useState<BossizMicrositeContent | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (content) setForm(content);
  }, [content]);

  if (loading || !form) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    await updateContent(form);
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Identité</CardTitle>
          <CardDescription>Sous-titre affiché dans l'en-tête et le pied de page</CardDescription>
        </CardHeader>
        <CardContent>
          <Label>Tagline</Label>
          <Input value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bannière d'accueil (héro)</CardTitle>
          <CardDescription>Texte affiché sur la photo en page d'accueil</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Eyebrow (petit texte au-dessus du titre)</Label>
            <Input value={form.hero.eyebrow} onChange={(e) => setForm({ ...form, hero: { ...form.hero, eyebrow: e.target.value } })} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Titre ligne 1</Label>
              <Input value={form.hero.titleLine1} onChange={(e) => setForm({ ...form, hero: { ...form.hero, titleLine1: e.target.value } })} />
            </div>
            <div>
              <Label>Titre ligne 2 (couleur or)</Label>
              <Input value={form.hero.titleLine2} onChange={(e) => setForm({ ...form, hero: { ...form.hero, titleLine2: e.target.value } })} />
            </div>
          </div>
          <div>
            <Label>Sous-titre</Label>
            <Textarea rows={2} value={form.hero.subtitle} onChange={(e) => setForm({ ...form, hero: { ...form.hero, subtitle: e.target.value } })} />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {(["clients", "partners", "availability"] as const).map((key) => (
              <div key={key} className="space-y-2 border rounded-lg p-3">
                <Label className="text-xs uppercase text-muted-foreground">{key}</Label>
                <Input
                  placeholder="Valeur (ex: 800+)"
                  value={form.hero.stats[key].value}
                  onChange={(e) => setForm({ ...form, hero: { ...form.hero, stats: { ...form.hero.stats, [key]: { ...form.hero.stats[key], value: e.target.value } } } })}
                />
                <Input
                  placeholder="Libellé"
                  value={form.hero.stats[key].label}
                  onChange={(e) => setForm({ ...form, hero: { ...form.hero, stats: { ...form.hero.stats, [key]: { ...form.hero.stats[key], label: e.target.value } } } })}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Citation (philosophie)</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea rows={2} value={form.philosophy} onChange={(e) => setForm({ ...form, philosophy: e.target.value })} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Page « À propos »</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Titre</Label>
            <Input value={form.about.title} onChange={(e) => setForm({ ...form, about: { ...form.about, title: e.target.value } })} />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea rows={2} value={form.about.description} onChange={(e) => setForm({ ...form, about: { ...form.about, description: e.target.value } })} />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {(["trust", "availability", "excellence"] as const).map((key) => (
              <div key={key} className="space-y-2 border rounded-lg p-3">
                <Label className="text-xs uppercase text-muted-foreground">{key}</Label>
                <Input
                  placeholder="Titre"
                  value={form.about.values[key].title}
                  onChange={(e) => setForm({ ...form, about: { ...form.about, values: { ...form.about.values, [key]: { ...form.about.values[key], title: e.target.value } } } })}
                />
                <Textarea
                  rows={3}
                  placeholder="Texte"
                  value={form.about.values[key].text}
                  onChange={(e) => setForm({ ...form, about: { ...form.about, values: { ...form.about.values, [key]: { ...form.about.values[key], text: e.target.value } } } })}
                />
              </div>
            ))}
          </div>
          <div>
            <Label>Texte du bouton</Label>
            <Input value={form.about.cta} onChange={(e) => setForm({ ...form, about: { ...form.about, cta: e.target.value } })} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Page « Services »</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Eyebrow</Label>
            <Input value={form.services.eyebrow} onChange={(e) => setForm({ ...form, services: { ...form.services, eyebrow: e.target.value } })} />
          </div>
          <div>
            <Label>Titre</Label>
            <Input value={form.services.title} onChange={(e) => setForm({ ...form, services: { ...form.services, title: e.target.value } })} />
          </div>
          <div>
            <Label>Sous-titre</Label>
            <Textarea rows={2} value={form.services.subtitle} onChange={(e) => setForm({ ...form, services: { ...form.services, subtitle: e.target.value } })} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Services principaux</CardTitle>
          <CardDescription>Les 4 grandes cartes de services affichées en haut de la page Services</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {form.servicesList.map((service, index) => (
            <ServiceItemEditor
              key={index}
              service={service}
              onChange={(updated) => {
                const list = [...form.servicesList];
                list[index] = updated;
                setForm({ ...form, servicesList: list });
              }}
              onRemove={() => setForm({ ...form, servicesList: form.servicesList.filter((_, i) => i !== index) })}
            />
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setForm({
                ...form,
                servicesList: [...form.servicesList, { id: `service-${Date.now()}`, icon: "Star", title: "", description: "", features: [] }],
              })
            }
          >
            <Plus className="mr-2 h-4 w-4" /> Ajouter un service
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Services additionnels</CardTitle>
          <CardDescription>Les petites cartes de services complémentaires</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {form.additionalServicesList.map((service, index) => (
            <AdditionalServiceItemEditor
              key={index}
              service={service}
              onChange={(updated) => {
                const list = [...form.additionalServicesList];
                list[index] = updated;
                setForm({ ...form, additionalServicesList: list });
              }}
              onRemove={() => setForm({ ...form, additionalServicesList: form.additionalServicesList.filter((_, i) => i !== index) })}
            />
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setForm({
                ...form,
                additionalServicesList: [...form.additionalServicesList, { id: `extra-${Date.now()}`, icon: "Star", title: "", items: [] }],
              })
            }
          >
            <Plus className="mr-2 h-4 w-4" /> Ajouter un service additionnel
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Témoignages</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Titre de la section</Label>
            <Input value={form.testimonialsTitle} onChange={(e) => setForm({ ...form, testimonialsTitle: e.target.value })} />
          </div>
          {form.testimonialsList.map((testimonial, index) => (
            <TestimonialItemEditor
              key={index}
              testimonial={testimonial}
              onChange={(updated) => {
                const list = [...form.testimonialsList];
                list[index] = updated;
                setForm({ ...form, testimonialsList: list });
              }}
              onRemove={() => setForm({ ...form, testimonialsList: form.testimonialsList.filter((_, i) => i !== index) })}
            />
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setForm({
                ...form,
                testimonialsList: [...form.testimonialsList, { name: "", role: "", content: "", location: "" }],
              })
            }
          >
            <Plus className="mr-2 h-4 w-4" /> Ajouter un témoignage
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Les témoignages eux-mêmes restent gérés dans le code pour l'instant.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appel à l'action « Contact »</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Titre</Label>
            <Input value={form.contactCta.title} onChange={(e) => setForm({ ...form, contactCta: { ...form.contactCta, title: e.target.value } })} />
          </div>
          <div>
            <Label>Texte du bouton</Label>
            <Input value={form.contactCta.button} onChange={(e) => setForm({ ...form, contactCta: { ...form.contactCta, button: e.target.value } })} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Coordonnées</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {"phone" in form.contact || country === "ci" ? (
            <div>
              <Label>Téléphone (laisser vide pour masquer)</Label>
              <Input
                value={form.contact.phone ?? ""}
                onChange={(e) => setForm({ ...form, contact: { ...form.contact, phone: e.target.value, phoneHref: `tel:${e.target.value.replace(/\s/g, "")}` } })}
              />
            </div>
          ) : null}
          <div>
            <Label>Email</Label>
            <Input value={form.contact.email} onChange={(e) => setForm({ ...form, contact: { ...form.contact, email: e.target.value } })} />
          </div>
          <div className="md:col-span-2">
            <Label>Adresse</Label>
            <Input value={form.contact.address} onChange={(e) => setForm({ ...form, contact: { ...form.contact, address: e.target.value } })} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Page « Formules »</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Titre</Label>
            <Input value={form.plans.title} onChange={(e) => setForm({ ...form, plans: { ...form.plans, title: e.target.value } })} />
          </div>
          <div>
            <Label>Sous-titre</Label>
            <Textarea rows={2} value={form.plans.subtitle} onChange={(e) => setForm({ ...form, plans: { ...form.plans, subtitle: e.target.value } })} />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label>Libellé "formules mensuelles"</Label>
              <Input value={form.plans.monthlyLabel} onChange={(e) => setForm({ ...form, plans: { ...form.plans, monthlyLabel: e.target.value } })} />
            </div>
            <div>
              <Label>Libellé "séjours courts"</Label>
              <Input value={form.plans.shortStayLabel} onChange={(e) => setForm({ ...form, plans: { ...form.plans, shortStayLabel: e.target.value } })} />
            </div>
            <div>
              <Label>Badge "recommandée"</Label>
              <Input value={form.plans.recommendedLabel} onChange={(e) => setForm({ ...form, plans: { ...form.plans, recommendedLabel: e.target.value } })} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Formules mensuelles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {form.monthlyPlansList.map((plan, index) => (
            <PlanItemEditor
              key={index}
              plan={plan}
              showFeatured
              onChange={(updated) => {
                const list = [...form.monthlyPlansList];
                list[index] = updated;
                setForm({ ...form, monthlyPlansList: list });
              }}
              onRemove={() => setForm({ ...form, monthlyPlansList: form.monthlyPlansList.filter((_, i) => i !== index) })}
            />
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setForm({ ...form, monthlyPlansList: [...form.monthlyPlansList, { name: "", detail: "", featured: false }] })}
          >
            <Plus className="mr-2 h-4 w-4" /> Ajouter une formule mensuelle
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Séjours courts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {form.shortStayPlansList.map((plan, index) => (
            <PlanItemEditor
              key={index}
              plan={plan}
              onChange={(updated) => {
                const list = [...form.shortStayPlansList];
                list[index] = { name: updated.name, detail: updated.detail };
                setForm({ ...form, shortStayPlansList: list });
              }}
              onRemove={() => setForm({ ...form, shortStayPlansList: form.shortStayPlansList.filter((_, i) => i !== index) })}
            />
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setForm({ ...form, shortStayPlansList: [...form.shortStayPlansList, { name: "", detail: "" }] })}
          >
            <Plus className="mr-2 h-4 w-4" /> Ajouter un séjour court
          </Button>
        </CardContent>
      </Card>

      <div className="sticky bottom-4 flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg" className="shadow-lg">
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Enregistrer
        </Button>
      </div>
    </div>
  );
}

function IconPicker({ value, onChange }: { value: string; onChange: (name: string) => void }) {
  const Icon = getBossizIcon(value);
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-40">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" />
          <SelectValue />
        </div>
      </SelectTrigger>
      <SelectContent>
        {BOSSIZ_ICON_NAMES.map((name) => {
          const OptionIcon = getBossizIcon(name);
          return (
            <SelectItem key={name} value={name}>
              <div className="flex items-center gap-2">
                <OptionIcon className="h-4 w-4" /> {name}
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}

function ListTextField({ label, values, onChange }: { label: string; values: string[]; onChange: (values: string[]) => void }) {
  return (
    <div>
      <Label>{label} (une par ligne)</Label>
      <Textarea
        rows={3}
        value={values.join("\n")}
        onChange={(e) => onChange(e.target.value.split("\n"))}
      />
    </div>
  );
}

function ServiceItemEditor({ service, onChange, onRemove }: { service: ServiceItem; onChange: (s: ServiceItem) => void; onRemove: () => void }) {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1">
          <IconPicker value={service.icon} onChange={(icon) => onChange({ ...service, icon })} />
          <Input placeholder="Titre" value={service.title} onChange={(e) => onChange({ ...service, title: e.target.value })} />
        </div>
        <Button variant="ghost" size="icon" onClick={onRemove}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
      <Textarea placeholder="Description" rows={2} value={service.description} onChange={(e) => onChange({ ...service, description: e.target.value })} />
      <ListTextField label="Points clés" values={service.features} onChange={(features) => onChange({ ...service, features })} />
    </div>
  );
}

function AdditionalServiceItemEditor({ service, onChange, onRemove }: { service: AdditionalServiceItem; onChange: (s: AdditionalServiceItem) => void; onRemove: () => void }) {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1">
          <IconPicker value={service.icon} onChange={(icon) => onChange({ ...service, icon })} />
          <Input placeholder="Titre" value={service.title} onChange={(e) => onChange({ ...service, title: e.target.value })} />
        </div>
        <Button variant="ghost" size="icon" onClick={onRemove}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
      <ListTextField label="Éléments" values={service.items} onChange={(items) => onChange({ ...service, items })} />
    </div>
  );
}

function PlanItemEditor({ plan, onChange, onRemove, showFeatured }: { plan: PlanItem | ShortStayItem; onChange: (p: PlanItem) => void; onRemove: () => void; showFeatured?: boolean }) {
  const featured = "featured" in plan ? plan.featured : false;
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <Input placeholder="Nom" value={plan.name} onChange={(e) => onChange({ name: e.target.value, detail: plan.detail, featured })} className="flex-1" />
        <Button variant="ghost" size="icon" onClick={onRemove}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
      <Textarea placeholder="Détail" rows={2} value={plan.detail} onChange={(e) => onChange({ name: plan.name, detail: e.target.value, featured })} />
      {showFeatured && (
        <div className="flex items-center gap-2">
          <Switch checked={featured} onCheckedChange={(checked) => onChange({ name: plan.name, detail: plan.detail, featured: checked })} />
          <Label>Formule mise en avant (badge "recommandée")</Label>
        </div>
      )}
    </div>
  );
}

function TestimonialItemEditor({ testimonial, onChange, onRemove }: { testimonial: TestimonialItem; onChange: (t: TestimonialItem) => void; onRemove: () => void }) {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="grid gap-3 md:grid-cols-2 flex-1">
          <Input placeholder="Nom" value={testimonial.name} onChange={(e) => onChange({ ...testimonial, name: e.target.value })} />
          <Input placeholder="Rôle" value={testimonial.role} onChange={(e) => onChange({ ...testimonial, role: e.target.value })} />
        </div>
        <Button variant="ghost" size="icon" onClick={onRemove}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
      <Textarea placeholder="Témoignage" rows={2} value={testimonial.content} onChange={(e) => onChange({ ...testimonial, content: e.target.value })} />
      <Input placeholder="Localisation" value={testimonial.location} onChange={(e) => onChange({ ...testimonial, location: e.target.value })} />
    </div>
  );
}

function GlobalStatItemEditor({ stat, onChange, onRemove }: { stat: GlobalStatItem; onChange: (s: GlobalStatItem) => void; onRemove: () => void }) {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1">
          <IconPicker value={stat.icon} onChange={(icon) => onChange({ ...stat, icon })} />
          <Input placeholder="Valeur (ex: 8000+)" value={stat.value} onChange={(e) => onChange({ ...stat, value: e.target.value })} />
        </div>
        <Button variant="ghost" size="icon" onClick={onRemove}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
      <Input placeholder="Libellé" value={stat.label} onChange={(e) => onChange({ ...stat, label: e.target.value })} />
      <Input placeholder="Description courte" value={stat.description} onChange={(e) => onChange({ ...stat, description: e.target.value })} />
    </div>
  );
}

function PortalServiceItemEditor({ service, onChange, onRemove }: { service: PortalServiceItem; onChange: (s: PortalServiceItem) => void; onRemove: () => void }) {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <Input placeholder="Titre" value={service.title} onChange={(e) => onChange({ ...service, title: e.target.value })} className="flex-1" />
        <Button variant="ghost" size="icon" onClick={onRemove}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
      <Textarea placeholder="Description" rows={2} value={service.description} onChange={(e) => onChange({ ...service, description: e.target.value })} />
      <ListTextField label="Points clés" values={service.features} onChange={(features) => onChange({ ...service, features })} />
      <div className="grid gap-3 md:grid-cols-2">
        <Input placeholder="Dégradé (ex: from-blue-500 to-blue-600)" value={service.color} onChange={(e) => onChange({ ...service, color: e.target.value })} />
        <Input placeholder="URL image" value={service.image} onChange={(e) => onChange({ ...service, image: e.target.value })} />
      </div>
    </div>
  );
}

function CompanyValueItemEditor({ value, onChange, onRemove }: { value: CompanyValueItem; onChange: (v: CompanyValueItem) => void; onRemove: () => void }) {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1">
          <IconPicker value={value.icon} onChange={(icon) => onChange({ ...value, icon })} />
          <Input placeholder="Titre" value={value.title} onChange={(e) => onChange({ ...value, title: e.target.value })} />
        </div>
        <Button variant="ghost" size="icon" onClick={onRemove}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
      <Textarea placeholder="Description" rows={2} value={value.description} onChange={(e) => onChange({ ...value, description: e.target.value })} />
      <Input placeholder="Dégradé (ex: from-blue-500 to-blue-600)" value={value.color} onChange={(e) => onChange({ ...value, color: e.target.value })} />
    </div>
  );
}

function PortalGlobalForm({
  globalConfig,
  loading,
  onSave,
}: {
  globalConfig: BossizGlobalConfig;
  loading: boolean;
  onSave: (updates: Partial<BossizGlobalConfig>) => Promise<void>;
}) {
  const [form, setForm] = useState<BossizGlobalConfig | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (globalConfig) setForm(globalConfig);
  }, [globalConfig]);

  if (loading || !form) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Bannière d'accueil du portail</CardTitle>
          <CardDescription>Contenu affiché sur la page qui liste les sites Bossiz (CI/SN)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Titre</Label>
            <Input value={form.hero.title} onChange={(e) => setForm({ ...form, hero: { ...form.hero, title: e.target.value } })} />
          </div>
          <div>
            <Label>Sous-titre</Label>
            <Input value={form.hero.subtitle} onChange={(e) => setForm({ ...form, hero: { ...form.hero, subtitle: e.target.value } })} />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea rows={2} value={form.hero.description} onChange={(e) => setForm({ ...form, hero: { ...form.hero, description: e.target.value } })} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Statistiques globales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {form.globalStats.map((stat, index) => (
            <GlobalStatItemEditor
              key={index}
              stat={stat}
              onChange={(updated) => {
                const list = [...form.globalStats];
                list[index] = updated;
                setForm({ ...form, globalStats: list });
              }}
              onRemove={() => setForm({ ...form, globalStats: form.globalStats.filter((_, i) => i !== index) })}
            />
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setForm({ ...form, globalStats: [...form.globalStats, { value: "", label: "", description: "", icon: "Star" }] })}
          >
            <Plus className="mr-2 h-4 w-4" /> Ajouter une statistique
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Services (grille principale)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {form.services.map((service, index) => (
            <PortalServiceItemEditor
              key={index}
              service={service}
              onChange={(updated) => {
                const list = [...form.services];
                list[index] = updated;
                setForm({ ...form, services: list });
              }}
              onRemove={() => setForm({ ...form, services: form.services.filter((_, i) => i !== index) })}
            />
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setForm({
                ...form,
                services: [...form.services, { id: `service-${Date.now()}`, title: "", description: "", features: [], color: "from-primary to-primary-dark", image: "" }],
              })
            }
          >
            <Plus className="mr-2 h-4 w-4" /> Ajouter un service
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Valeurs de l'entreprise</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {form.companyValues.map((value, index) => (
            <CompanyValueItemEditor
              key={index}
              value={value}
              onChange={(updated) => {
                const list = [...form.companyValues];
                list[index] = updated;
                setForm({ ...form, companyValues: list });
              }}
              onRemove={() => setForm({ ...form, companyValues: form.companyValues.filter((_, i) => i !== index) })}
            />
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setForm({
                ...form,
                companyValues: [...form.companyValues, { id: `value-${Date.now()}`, title: "", description: "", color: "from-primary to-primary-dark", icon: "Shield" }],
              })
            }
          >
            <Plus className="mr-2 h-4 w-4" /> Ajouter une valeur
          </Button>
        </CardContent>
      </Card>

      <div className="sticky bottom-4 flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg" className="shadow-lg">
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Enregistrer
        </Button>
      </div>
    </div>
  );
}

function SiteCardForm({
  site,
  loading,
  onSave,
}: {
  site: BossizSiteConfig | undefined;
  loading: boolean;
  onSave: (updates: Partial<BossizSiteConfig>) => Promise<void>;
}) {
  const [form, setForm] = useState<BossizSiteConfig | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (site) setForm(site);
  }, [site]);

  if (loading || !form) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Carte sur le portail Bossiz</CardTitle>
        <CardDescription>
          Ce qui s'affiche pour ce pays sur la page qui liste tous les sites Bossiz (/bossiz)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Titre</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <Label>Sous-titre</Label>
            <Input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
          </div>
        </div>
        <div>
          <Label>Tagline</Label>
          <Input value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} />
        </div>
        <div>
          <Label>Description</Label>
          <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Localisation</Label>
            <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </div>
          <div>
            <Label>URL de l'image</Label>
            <Input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} />
          </div>
        </div>

        <ListTextField label="Services affichés" values={form.features} onChange={(features) => setForm({ ...form, features })} />
        <ListTextField label="Points forts" values={form.highlights} onChange={(highlights) => setForm({ ...form, highlights })} />

        <div className="space-y-2">
          <Label>Statistiques de la carte</Label>
          {form.stats.map((stat, index) => (
            <div key={index} className="flex items-center gap-2 border rounded-lg p-3">
              <IconPicker
                value={stat.icon}
                onChange={(icon) => {
                  const list = [...form.stats];
                  list[index] = { ...list[index], icon };
                  setForm({ ...form, stats: list });
                }}
              />
              <Input
                placeholder="Valeur"
                value={stat.value}
                onChange={(e) => {
                  const list = [...form.stats];
                  list[index] = { ...list[index], value: e.target.value };
                  setForm({ ...form, stats: list });
                }}
              />
              <Input
                placeholder="Libellé"
                value={stat.label}
                onChange={(e) => {
                  const list = [...form.stats];
                  list[index] = { ...list[index], label: e.target.value };
                  setForm({ ...form, stats: list });
                }}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setForm({ ...form, stats: form.stats.filter((_, i) => i !== index) })}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setForm({ ...form, stats: [...form.stats, { value: "", label: "", icon: "Star" } as SiteStatItem] })}
          >
            <Plus className="mr-2 h-4 w-4" /> Ajouter une statistique
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Téléphone</Label>
            <Input value={form.contact.phone} onChange={(e) => setForm({ ...form, contact: { ...form.contact, phone: e.target.value } })} />
          </div>
          <div>
            <Label>Email</Label>
            <Input value={form.contact.email} onChange={(e) => setForm({ ...form, contact: { ...form.contact, email: e.target.value } })} />
          </div>
          <div className="md:col-span-2">
            <Label>Adresse</Label>
            <Input value={form.contact.address} onChange={(e) => setForm({ ...form, contact: { ...form.contact, address: e.target.value } })} />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <Label>Dégradé principal</Label>
            <Input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} placeholder="from-orange-600 to-red-600" />
          </div>
          <div>
            <Label>Dégradé de fond</Label>
            <Input value={form.bgColor} onChange={(e) => setForm({ ...form, bgColor: e.target.value })} placeholder="from-orange-50 via-white to-red-50" />
          </div>
          <div>
            <Label>Couleur de bordure</Label>
            <Input value={form.borderColor} onChange={(e) => setForm({ ...form, borderColor: e.target.value })} placeholder="border-orange-200" />
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-2 h-3.5 w-3.5" />}
            Enregistrer la carte
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminBossizMicrosites() {
  const { sites, globalConfig, loading: portalLoading, updateSiteConfig, updateGlobalConfig } = useBossizConfig();

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Contenu Bossiz</h1>
          <p className="text-muted-foreground">
            Gérez ici tout le contenu Bossiz en un seul endroit : le portail global qui liste les
            sites (/bossiz), et le contenu propre à chaque site Conciergerie (Côte d'Ivoire et Sénégal).
          </p>
        </div>

        <Tabs defaultValue="global">
          <TabsList>
            <TabsTrigger value="global">Portail global</TabsTrigger>
            <TabsTrigger value="ci">Côte d'Ivoire</TabsTrigger>
            <TabsTrigger value="sn">Sénégal</TabsTrigger>
          </TabsList>
          <TabsContent value="global" className="mt-6">
            <PortalGlobalForm globalConfig={globalConfig} loading={portalLoading} onSave={updateGlobalConfig} />
          </TabsContent>
          <TabsContent value="ci" className="mt-6">
            <SiteCardForm
              site={sites.find((s) => s.id === SITE_ID_BY_COUNTRY.ci)}
              loading={portalLoading}
              onSave={(updates) => updateSiteConfig(SITE_ID_BY_COUNTRY.ci, updates)}
            />
            <MicrositeContentForm country="ci" />
          </TabsContent>
          <TabsContent value="sn" className="mt-6">
            <SiteCardForm
              site={sites.find((s) => s.id === SITE_ID_BY_COUNTRY.sn)}
              loading={portalLoading}
              onSave={(updates) => updateSiteConfig(SITE_ID_BY_COUNTRY.sn, updates)}
            />
            <MicrositeContentForm country="sn" />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
