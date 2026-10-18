import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  CULTURE_CATEGORIES,
  CULTURE_ENTRIES_QUERY_KEY,
  CULTURE_PAGE_QUERY_KEY,
  DEFAULT_CULTURE_PAGE,
  cultureCategory,
  useCultureEntries,
  useCulturePage,
  type CultureCategory,
  type CultureEntry,
  type CulturePageSettings,
} from "@/lib/culture";
import { ExternalLink, Landmark, Pencil, Plus, Star, Trash2 } from "lucide-react";

const emptyEntry = {
  title: "",
  category: "patrimoine" as CultureCategory,
  location: "",
  period: "",
  summary: "",
  content: "",
  image_url: "",
  link_url: "",
  featured: false,
  published: true,
  sort_order: "0",
};

// Gestion de la page éditoriale /culture : en-tête de page et entrées
// (lieux, festivals, traditions...) avec publication et mise à la une.
export default function AdminCulture() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: settings } = useCulturePage();
  const { data: entries, isLoading } = useCultureEntries();

  const [pageForm, setPageForm] = useState<CulturePageSettings>(DEFAULT_CULTURE_PAGE);
  const [savingPage, setSavingPage] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CultureEntry | null>(null);
  const [form, setForm] = useState(emptyEntry);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) setPageForm(settings);
  }, [settings]);

  const showError = (error: unknown) =>
    toast({
      title: "Erreur",
      description: (error as { message?: string })?.message || "Enregistrement impossible",
      variant: "destructive",
    });

  const refreshEntries = () => queryClient.invalidateQueries({ queryKey: CULTURE_ENTRIES_QUERY_KEY });

  const savePage = async () => {
    setSavingPage(true);
    const { error } = await supabase.from("site_config").upsert(
      {
        config_key: "culture_page",
        config_value: { ...pageForm },
        category: "content",
        description: "Page Culture : titre, sous-titre, introduction et image d'en-tête",
      },
      { onConflict: "config_key" },
    );
    setSavingPage(false);
    if (error) return showError(error);
    await queryClient.invalidateQueries({ queryKey: CULTURE_PAGE_QUERY_KEY });
    toast({ title: "Enregistré", description: "L'en-tête de la page Culture est à jour." });
  };

  const openDialog = (entry: CultureEntry | null) => {
    setEditing(entry);
    setForm(
      entry
        ? {
            title: entry.title,
            category: entry.category,
            location: entry.location || "",
            period: entry.period || "",
            summary: entry.summary,
            content: entry.content || "",
            image_url: entry.image_url || "",
            link_url: entry.link_url || "",
            featured: entry.featured,
            published: entry.published,
            sort_order: String(entry.sort_order),
          }
        : { ...emptyEntry, sort_order: String(((entries?.length ?? 0) + 1) * 10) },
    );
    setDialogOpen(true);
  };

  const saveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    const link = form.link_url.trim();
    if (link && !/^https?:\/\//.test(link)) {
      toast({ title: "Lien invalide", description: "Le lien doit commencer par https://", variant: "destructive" });
      return;
    }
    const payload = {
      title: form.title.trim(),
      category: form.category,
      location: form.location.trim() || null,
      period: form.period.trim() || null,
      summary: form.summary.trim(),
      content: form.content.trim() || null,
      image_url: form.image_url || null,
      link_url: link || null,
      featured: form.featured,
      published: form.published,
      sort_order: parseInt(form.sort_order) || 0,
    };
    setSaving(true);
    const { error } = editing
      ? await supabase.from("culture_entries").update(payload).eq("id", editing.id)
      : await supabase.from("culture_entries").insert(payload);
    setSaving(false);
    if (error) return showError(error);
    setDialogOpen(false);
    await refreshEntries();
    toast({ title: "Enregistré", description: editing ? "Entrée mise à jour." : "Entrée ajoutée." });
  };

  const toggle = async (entry: CultureEntry, field: "published" | "featured") => {
    const { error } = await supabase.from("culture_entries").update({ [field]: !entry[field] }).eq("id", entry.id);
    if (error) return showError(error);
    await refreshEntries();
  };

  const deleteEntry = async (entry: CultureEntry) => {
    if (!confirm(`Supprimer « ${entry.title} » ?`)) return;
    const { error } = await supabase.from("culture_entries").delete().eq("id", entry.id);
    if (error) return showError(error);
    await refreshEntries();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Culture</h1>
            <p className="text-muted-foreground">Contenu de la page publique /culture et de la section Culture de l'accueil.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <a href="/culture" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Voir la page
              </a>
            </Button>
            <Button onClick={() => openDialog(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle entrée
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>En-tête de la page</CardTitle>
            <CardDescription>Titre, sous-titre et introduction affichés en haut de /culture (le titre et le sous-titre servent aussi sur l'accueil).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Titre</Label>
                <Input value={pageForm.title} onChange={(e) => setPageForm({ ...pageForm, title: e.target.value })} maxLength={120} />
              </div>
              <div className="space-y-2">
                <Label>Sous-titre</Label>
                <Input value={pageForm.subtitle} onChange={(e) => setPageForm({ ...pageForm, subtitle: e.target.value })} maxLength={200} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Introduction</Label>
              <Textarea rows={3} value={pageForm.intro} onChange={(e) => setPageForm({ ...pageForm, intro: e.target.value })} />
            </div>
            <ImageUpload
              label="Image d'en-tête"
              folder="culture"
              value={pageForm.heroImage}
              onChange={(heroImage) => setPageForm({ ...pageForm, heroImage })}
            />
            <div className="flex justify-end">
              <Button onClick={savePage} disabled={savingPage}>Enregistrer l'en-tête</Button>
            </div>
          </CardContent>
        </Card>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Entrée</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Lieu</TableHead>
                <TableHead>À la une</TableHead>
                <TableHead>Publiée</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">Chargement...</TableCell>
                </TableRow>
              ) : !entries?.length ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    <Landmark className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    Aucune entrée. Ajoutez un lieu, un festival ou une tradition.
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {entry.image_url ? (
                          <img src={entry.image_url} alt="" className="h-10 w-14 rounded object-cover flex-shrink-0" />
                        ) : (
                          <div className="h-10 w-14 rounded bg-muted flex items-center justify-center flex-shrink-0 text-[10px] text-muted-foreground">
                            Sans photo
                          </div>
                        )}
                        <span className="font-medium">{entry.title}</span>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline">{cultureCategory(entry.category).label}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{entry.location || "—"}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={entry.featured ? "Retirer de la une" : "Mettre à la une"}
                        onClick={() => toggle(entry, "featured")}
                      >
                        <Star className={`h-4 w-4 ${entry.featured ? "fill-gold text-gold" : "text-muted-foreground"}`} />
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Switch checked={entry.published} onCheckedChange={() => toggle(entry, "published")} aria-label="Publiée" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" aria-label="Modifier" onClick={() => openDialog(entry)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" aria-label="Supprimer" onClick={() => deleteEntry(entry)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier l'entrée" : "Nouvelle entrée"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={saveEntry} className="space-y-4">
            <div className="space-y-2">
              <Label>Titre</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={160} required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Catégorie</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as CultureCategory })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CULTURE_CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Lieu</Label>
                <Input placeholder="Ex. : Grand-Bassam" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Quand y aller / dates</Label>
                <Input placeholder="Ex. : Fin octobre, chaque année" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Ordre d'affichage</Label>
                <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Résumé (carte)</Label>
              <Textarea rows={2} maxLength={400} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} required />
              <p className="text-xs text-muted-foreground">{form.summary.length}/400</p>
            </div>
            <div className="space-y-2">
              <Label>Texte complet (optionnel)</Label>
              <Textarea rows={6} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
            </div>
            <ImageUpload label="Photo" folder="culture" value={form.image_url} onChange={(image_url) => setForm({ ...form, image_url })} />
            <div className="space-y-2">
              <Label>Lien « En savoir plus » (optionnel)</Label>
              <Input type="url" placeholder="https://..." value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} />
            </div>
            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={form.featured} onCheckedChange={(c) => setForm({ ...form, featured: c })} />
                À la une
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={form.published} onCheckedChange={(c) => setForm({ ...form, published: c })} />
                Publiée
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={saving}>Enregistrer</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
