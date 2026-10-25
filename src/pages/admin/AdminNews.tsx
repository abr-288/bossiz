import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { slugify } from "@/lib/culture";
import {
  DEFAULT_NEWS_PAGE,
  NEWS_CATEGORIES,
  NEWS_PAGE_QUERY_KEY,
  NEWS_POSTS_QUERY_KEY,
  formatNewsDate,
  isNewsPostLive,
  isSafeNewsLink,
  newsCategory,
  useNewsPage,
  useNewsPosts,
  type NewsCategory,
  type NewsPageSettings,
  type NewsPost,
} from "@/lib/news";
import { ExternalLink, Newspaper, Pencil, Plus, Star, Trash2 } from "lucide-react";

// Date locale « AAAA-MM-JJTHH:MM » pour <input type="datetime-local">.
const toLocalInput = (iso: string) => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const emptyPost = () => ({
  title: "",
  slug: "",
  category: "annonce" as NewsCategory,
  excerpt: "",
  content: "",
  cover_image_url: "",
  cover_caption: "",
  cta_label: "",
  cta_url: "",
  pinned: false,
  published: false,
  published_at: toLocalInput(new Date().toISOString()),
});

// Gestion de la page /actualites : en-tête, articles, publication
// (immédiate ou programmée) et mise à la une.
export default function AdminNews() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: settings } = useNewsPage();
  const { data: posts, isLoading } = useNewsPosts();

  const [pageForm, setPageForm] = useState<NewsPageSettings>(DEFAULT_NEWS_PAGE);
  const [savingPage, setSavingPage] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<NewsPost | null>(null);
  const [form, setForm] = useState(emptyPost);
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

  const refresh = () => queryClient.invalidateQueries({ queryKey: NEWS_POSTS_QUERY_KEY });

  const savePage = async () => {
    setSavingPage(true);
    const { error } = await supabase.from("site_config").upsert(
      {
        config_key: "news_page",
        config_value: { ...pageForm },
        category: "content",
        description: "Page Actualités : titre et sous-titre",
      },
      { onConflict: "config_key" },
    );
    setSavingPage(false);
    if (error) return showError(error);
    await queryClient.invalidateQueries({ queryKey: NEWS_PAGE_QUERY_KEY });
    toast({ title: "Enregistré", description: "L'en-tête de la page Actualités est à jour." });
  };

  const openDialog = (post: NewsPost | null) => {
    setEditing(post);
    setForm(
      post
        ? {
            title: post.title,
            slug: post.slug,
            category: post.category as NewsCategory,
            excerpt: post.excerpt,
            content: post.content || "",
            cover_image_url: post.cover_image_url || "",
            cover_caption: post.cover_caption || "",
            cta_label: post.cta_label || "",
            cta_url: post.cta_url || "",
            pinned: post.pinned,
            published: post.published,
            published_at: toLocalInput(post.published_at),
          }
        : emptyPost(),
    );
    setDialogOpen(true);
  };

  const savePost = async (e: React.FormEvent) => {
    e.preventDefault();
    const slug = slugify(form.slug.trim() || form.title);
    if (!slug) {
      toast({ title: "Adresse invalide", description: "Indiquez un titre.", variant: "destructive" });
      return;
    }
    const ctaLabel = form.cta_label.trim();
    const ctaUrl = form.cta_url.trim();
    if ((ctaLabel && !ctaUrl) || (ctaUrl && !ctaLabel) || (ctaUrl && !isSafeNewsLink(ctaUrl))) {
      toast({
        title: "Bouton d'action incomplet",
        description: "Indiquez un texte et un lien commençant par / (page du site) ou https://.",
        variant: "destructive",
      });
      return;
    }
    const publishedAt = new Date(form.published_at);
    if (Number.isNaN(publishedAt.getTime())) {
      toast({ title: "Date invalide", variant: "destructive" });
      return;
    }
    const payload = {
      title: form.title.trim(),
      slug,
      category: form.category,
      excerpt: form.excerpt.trim(),
      content: form.content.trim() || null,
      cover_image_url: form.cover_image_url.trim() || null,
      cover_caption: form.cover_caption.trim() || null,
      cta_label: ctaLabel || null,
      cta_url: ctaUrl || null,
      pinned: form.pinned,
      published: form.published,
      published_at: publishedAt.toISOString(),
    };
    setSaving(true);
    const { error } = editing
      ? await supabase.from("news_posts").update(payload).eq("id", editing.id)
      : await supabase.from("news_posts").insert(payload);
    setSaving(false);
    if (error) {
      if ((error as { code?: string }).code === "23505") {
        toast({
          title: "Adresse déjà utilisée",
          description: `Un autre article utilise déjà l'adresse /actualites/${slug}.`,
          variant: "destructive",
        });
        return;
      }
      return showError(error);
    }
    setDialogOpen(false);
    await refresh();
    toast({ title: "Enregistré", description: editing ? "Article mis à jour." : "Article ajouté." });
  };

  const toggle = async (post: NewsPost, field: "published" | "pinned") => {
    const { error } = await supabase
      .from("news_posts")
      .update({ [field]: !post[field] })
      .eq("id", post.id);
    if (error) return showError(error);
    await refresh();
  };

  const deletePost = async (post: NewsPost) => {
    if (!confirm(`Supprimer « ${post.title} » ?`)) return;
    const { error } = await supabase.from("news_posts").delete().eq("id", post.id);
    if (error) return showError(error);
    await refresh();
  };

  const status = (post: NewsPost) =>
    !post.published ? (
      <Badge variant="outline">Brouillon</Badge>
    ) : isNewsPostLive(post) ? (
      <Badge>En ligne</Badge>
    ) : (
      <Badge variant="secondary">Programmé</Badge>
    );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Actualités</h1>
            <p className="text-muted-foreground">Articles de la page publique /actualites.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <a href="/actualites" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Voir la page
              </a>
            </Button>
            <Button onClick={() => openDialog(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvel article
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>En-tête de la page</CardTitle>
            <CardDescription>Titre et sous-titre affichés en haut de /actualites.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="news-page-title">Titre</Label>
                <Input
                  id="news-page-title"
                  value={pageForm.title}
                  onChange={(e) => setPageForm({ ...pageForm, title: e.target.value })}
                  maxLength={120}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="news-page-subtitle">Sous-titre</Label>
                <Input
                  id="news-page-subtitle"
                  value={pageForm.subtitle}
                  onChange={(e) => setPageForm({ ...pageForm, subtitle: e.target.value })}
                  maxLength={200}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={savePage} disabled={savingPage}>
                Enregistrer l'en-tête
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Article</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>À la une</TableHead>
                <TableHead>Publié</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : !posts?.length ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    <Newspaper className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    Aucun article. Annoncez une nouveauté, un partenaire ou un événement.
                  </TableCell>
                </TableRow>
              ) : (
                posts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {post.cover_image_url ? (
                          <img
                            src={post.cover_image_url}
                            alt=""
                            className="h-10 w-14 rounded object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="h-10 w-14 rounded bg-muted flex items-center justify-center flex-shrink-0 text-[10px] text-muted-foreground">
                            Sans image
                          </div>
                        )}
                        <span className="font-medium">{post.title}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{newsCategory(post.category).label}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {formatNewsDate(post.published_at)}
                    </TableCell>
                    <TableCell>{status(post)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={post.pinned ? "Retirer de la une" : "Mettre à la une"}
                        onClick={() => toggle(post, "pinned")}
                      >
                        <Star className={`h-4 w-4 ${post.pinned ? "fill-gold text-gold" : "text-muted-foreground"}`} />
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={post.published}
                        onCheckedChange={() => toggle(post, "published")}
                        aria-label="Publié"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" aria-label="Modifier" onClick={() => openDialog(post)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" aria-label="Supprimer" onClick={() => deletePost(post)}>
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
            <DialogTitle>{editing ? "Modifier l'article" : "Nouvel article"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={savePost} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="news-title">Titre</Label>
              <Input
                id="news-title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                maxLength={160}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="news-slug">Adresse de la page</Label>
              <div className="flex items-center gap-1 text-sm">
                <span className="text-muted-foreground">/actualites/</span>
                <Input
                  id="news-slug"
                  placeholder={slugify(form.title) || "titre-de-l-article"}
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                />
              </div>
              <p className="text-xs text-muted-foreground">Laissez vide pour la créer à partir du titre.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Catégorie</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as NewsCategory })}>
                  <SelectTrigger aria-label="Catégorie">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NEWS_CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="news-date">Date de publication</Label>
                <Input
                  id="news-date"
                  type="datetime-local"
                  value={form.published_at}
                  onChange={(e) => setForm({ ...form, published_at: e.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground">Une date future programme la publication.</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="news-excerpt">Chapô (carte et début d'article)</Label>
              <Textarea
                id="news-excerpt"
                rows={2}
                maxLength={400}
                value={form.excerpt}
                onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">{form.excerpt.length}/400</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="news-content">Article</Label>
              <Textarea
                id="news-content"
                rows={12}
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Séparez les paragraphes par une ligne vide. « ## Titre » crée un intertitre, « - » une liste.
              </p>
            </div>

            <div className="space-y-3 rounded-md border p-3">
              <p className="text-sm font-medium">Image de couverture</p>
              <ImageUpload
                label="Envoyer une image"
                folder="news"
                value={form.cover_image_url}
                onChange={(cover_image_url) => setForm({ ...form, cover_image_url })}
              />
              <div className="space-y-1">
                <Label htmlFor="news-caption" className="text-xs">
                  Légende / crédit
                </Label>
                <Input
                  id="news-caption"
                  value={form.cover_caption}
                  onChange={(e) => setForm({ ...form, cover_caption: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-md border p-3">
              <p className="sm:col-span-2 text-sm font-medium">Bouton d'action (optionnel)</p>
              <div className="space-y-1">
                <Label htmlFor="news-cta-label" className="text-xs">
                  Texte
                </Label>
                <Input
                  id="news-cta-label"
                  placeholder="Ex. : Réserver maintenant"
                  maxLength={60}
                  value={form.cta_label}
                  onChange={(e) => setForm({ ...form, cta_label: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="news-cta-url" className="text-xs">
                  Lien
                </Label>
                <Input
                  id="news-cta-url"
                  placeholder="/hotels-partenaires ou https://..."
                  value={form.cta_url}
                  onChange={(e) => setForm({ ...form, cta_url: e.target.value })}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={form.pinned} onCheckedChange={(c) => setForm({ ...form, pinned: c })} />À la une
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={form.published} onCheckedChange={(c) => setForm({ ...form, published: c })} />
                Publié
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={saving}>
                Enregistrer
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
