import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, Eye, EyeOff, MoveUp, MoveDown } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ImageUpload } from "@/components/admin/ImageUpload";

interface Advertisement {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  link_url: string | null;
  link_text: string | null;
  background_color: string | null;
  text_color: string | null;
  is_active: boolean;
  position: string;
  sort_order: number;
  starts_at: string | null;
  expires_at: string | null;
  created_at: string;
}

const defaultAd = {
  title: "",
  description: "",
  image_url: "",
  link_url: "",
  link_text: "En savoir plus",
  background_color: "#1e3a5f",
  text_color: "#ffffff",
  is_active: true,
  position: "homepage_before_subscriptions",
  sort_order: 0,
  starts_at: null as string | null,
  expires_at: null as string | null,
};

export default function AdminAdvertisements() {
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<Partial<Advertisement> | null>(null);
  const [formData, setFormData] = useState(defaultAd);

  const fetchAds = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("advertisements")
      .select("*")
      .order("sort_order", { ascending: true });

    if (!error && data) {
      setAds(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAds();
  }, []);

  const handleOpenDialog = (ad?: Advertisement) => {
    if (ad) {
      setEditingAd(ad);
      setFormData({
        title: ad.title,
        description: ad.description || "",
        image_url: ad.image_url || "",
        link_url: ad.link_url || "",
        link_text: ad.link_text || "En savoir plus",
        background_color: ad.background_color || "#1e3a5f",
        text_color: ad.text_color || "#ffffff",
        is_active: ad.is_active,
        position: ad.position,
        sort_order: ad.sort_order,
        starts_at: ad.starts_at,
        expires_at: ad.expires_at,
      });
    } else {
      setEditingAd(null);
      setFormData({ ...defaultAd, sort_order: ads.length });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title) {
      toast.error("Le titre est requis");
      return;
    }

    if (editingAd?.id) {
      const { error } = await supabase
        .from("advertisements")
        .update(formData)
        .eq("id", editingAd.id);

      if (error) {
        toast.error("Erreur lors de la mise à jour");
      } else {
        toast.success("Publicité mise à jour");
        setDialogOpen(false);
        fetchAds();
      }
    } else {
      const { error } = await supabase
        .from("advertisements")
        .insert([formData]);

      if (error) {
        toast.error("Erreur lors de la création");
      } else {
        toast.success("Publicité créée");
        setDialogOpen(false);
        fetchAds();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette publicité ?")) return;

    const { error } = await supabase
      .from("advertisements")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Erreur lors de la suppression");
    } else {
      toast.success("Publicité supprimée");
      fetchAds();
    }
  };

  const handleToggleActive = async (ad: Advertisement) => {
    const { error } = await supabase
      .from("advertisements")
      .update({ is_active: !ad.is_active })
      .eq("id", ad.id);

    if (!error) {
      fetchAds();
      toast.success(ad.is_active ? "Publicité désactivée" : "Publicité activée");
    }
  };

  const handleMoveOrder = async (ad: Advertisement, direction: "up" | "down") => {
    const currentIndex = ads.findIndex((a) => a.id === ad.id);
    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    
    if (newIndex < 0 || newIndex >= ads.length) return;

    const otherAd = ads[newIndex];
    
    await Promise.all([
      supabase.from("advertisements").update({ sort_order: newIndex }).eq("id", ad.id),
      supabase.from("advertisements").update({ sort_order: currentIndex }).eq("id", otherAd.id),
    ]);

    fetchAds();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestion des Publicités</h1>
            <p className="text-muted-foreground">
              Gérez les bannières publicitaires affichées sur le site
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle publicité
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingAd ? "Modifier la publicité" : "Nouvelle publicité"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Titre *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Titre de la publicité"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Description courte"
                  />
                </div>
                <ImageUpload
                  value={formData.image_url}
                  onChange={(url) => setFormData({ ...formData, image_url: url })}
                  folder="advertisements"
                  label="Image de la publicité"
                />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Lien (URL)</Label>
                    <Input
                      value={formData.link_url}
                      onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                      placeholder="/flights ou https://..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Texte du bouton</Label>
                    <Input
                      value={formData.link_text}
                      onChange={(e) => setFormData({ ...formData, link_text: e.target.value })}
                      placeholder="En savoir plus"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Couleur de fond</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={formData.background_color}
                        onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                        className="w-16 h-10 p-1"
                      />
                      <Input
                        value={formData.background_color}
                        onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                        placeholder="#1e3a5f"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Couleur du texte</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={formData.text_color}
                        onChange={(e) => setFormData({ ...formData, text_color: e.target.value })}
                        className="w-16 h-10 p-1"
                      />
                      <Input
                        value={formData.text_color}
                        onChange={(e) => setFormData({ ...formData, text_color: e.target.value })}
                        placeholder="#ffffff"
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date de début</Label>
                    <Input
                      type="datetime-local"
                      value={formData.starts_at ? formData.starts_at.slice(0, 16) : ""}
                      onChange={(e) => setFormData({ ...formData, starts_at: e.target.value ? new Date(e.target.value).toISOString() : null })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Date d'expiration</Label>
                    <Input
                      type="datetime-local"
                      value={formData.expires_at ? formData.expires_at.slice(0, 16) : ""}
                      onChange={(e) => setFormData({ ...formData, expires_at: e.target.value ? new Date(e.target.value).toISOString() : null })}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label>Publicité active</Label>
                </div>

                {/* Preview */}
                {formData.title && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Aperçu</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div 
                        className="rounded-lg overflow-hidden"
                        style={{ backgroundColor: formData.background_color }}
                      >
                        <div className="flex flex-col sm:flex-row items-center">
                          {formData.image_url && (
                            <div className="w-full sm:w-1/3 h-32 overflow-hidden">
                              <img
                                src={formData.image_url}
                                alt="Preview"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1 p-4" style={{ color: formData.text_color }}>
                            <h4 className="font-bold">{formData.title}</h4>
                            <p className="text-sm opacity-90">{formData.description}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleSave}>
                    {editingAd ? "Mettre à jour" : "Créer"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Ordre</TableHead>
                  <TableHead>Titre</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Période</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      Chargement...
                    </TableCell>
                  </TableRow>
                ) : ads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Aucune publicité. Créez-en une !
                    </TableCell>
                  </TableRow>
                ) : (
                  ads.map((ad, index) => (
                    <TableRow key={ad.id}>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleMoveOrder(ad, "up")}
                            disabled={index === 0}
                          >
                            <MoveUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleMoveOrder(ad, "down")}
                            disabled={index === ads.length - 1}
                          >
                            <MoveDown className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {ad.image_url && (
                            <img
                              src={ad.image_url}
                              alt={ad.title}
                              className="w-16 h-10 object-cover rounded"
                              loading="lazy"
                            />
                          )}
                          <div>
                            <p className="font-medium">{ad.title}</p>
                            <p className="text-sm text-muted-foreground truncate max-w-xs">
                              {ad.description}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant={ad.is_active ? "default" : "secondary"}
                          size="sm"
                          onClick={() => handleToggleActive(ad)}
                        >
                          {ad.is_active ? (
                            <>
                              <Eye className="h-3 w-3 mr-1" /> Active
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-3 w-3 mr-1" /> Inactive
                            </>
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {ad.starts_at && (
                            <p>Début: {format(new Date(ad.starts_at), "dd/MM/yyyy")}</p>
                          )}
                          {ad.expires_at && (
                            <p>Fin: {format(new Date(ad.expires_at), "dd/MM/yyyy")}</p>
                          )}
                          {!ad.starts_at && !ad.expires_at && (
                            <span className="text-muted-foreground">Permanente</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(ad)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => handleDelete(ad.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
