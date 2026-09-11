import { useState, useEffect } from "react";
import { AgencyLayout } from "@/components/agency/AgencyLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { Plus, Pencil, Trash2, Hammer, Search, X } from "lucide-react";

interface Product {
  name: string;
  description: string;
  price: string;
  currency: string;
  image_url: string;
}

interface Artisan {
  id: string;
  name: string;
  craft_type: string;
  bio: string | null;
  location: string;
  address: string | null;
  phone: string | null;
  whatsapp: string | null;
  image_url: string | null;
  products: Product[];
  is_active: boolean;
  created_at: string;
}

const CRAFT_TYPES = ["Sculpture sur bois", "Bijoux & Accessoires", "Textile & Tissage", "Poterie & Céramique", "Maroquinerie", "Peinture & Art", "Vannerie", "Autre"];

const emptyProduct = (): Product => ({ name: "", description: "", price: "", currency: "XOF", image_url: "" });

const emptyForm = {
  name: "",
  craft_type: CRAFT_TYPES[0],
  bio: "",
  location: "",
  address: "",
  phone: "",
  whatsapp: "",
  image_url: "",
  available: true,
  products: [] as Product[],
};

export default function AgencyArtisans() {
  const { toast } = useToast();
  const [artisans, setArtisans] = useState<Artisan[]>([]);
  const [agencyId, setAgencyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Artisan | null>(null);
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    fetchAgencyAndArtisans();
  }, []);

  const fetchAgencyAndArtisans = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: agency } = await supabase.from("agencies").select("id").eq("owner_id", user.id).single();
    if (!agency) return;
    setAgencyId(agency.id);

    const { data, error } = await supabase
      .from("artisans")
      .select("*")
      .eq("agency_id", agency.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching artisans:", error);
    } else {
      setArtisans((data || []) as any);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setEditing(null);
    setFormData(emptyForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agencyId) return;

    try {
      const artisanData = {
        agency_id: agencyId,
        name: formData.name,
        craft_type: formData.craft_type,
        bio: formData.bio || null,
        location: formData.location,
        address: formData.address || null,
        phone: formData.phone || null,
        whatsapp: formData.whatsapp || null,
        image_url: formData.image_url || null,
        is_active: formData.available,
        products: formData.products
          .filter((p) => p.name.trim())
          .map((p) => ({ ...p, price: parseFloat(p.price) || 0 })),
      };

      if (editing) {
        const { error } = await supabase.from("artisans").update(artisanData).eq("id", editing.id);
        if (error) throw error;
        toast({ title: "Succès", description: "Artisan mis à jour" });
      } else {
        const { error } = await supabase.from("artisans").insert(artisanData);
        if (error) throw error;
        toast({ title: "Succès", description: "Artisan ajouté" });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchAgencyAndArtisans();
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  };

  const handleEdit = (artisan: Artisan) => {
    setEditing(artisan);
    setFormData({
      name: artisan.name,
      craft_type: artisan.craft_type,
      bio: artisan.bio || "",
      location: artisan.location,
      address: artisan.address || "",
      phone: artisan.phone || "",
      whatsapp: artisan.whatsapp || "",
      image_url: artisan.image_url || "",
      available: artisan.is_active,
      products: (artisan.products || []).map((p) => ({ ...p, price: p.price?.toString() || "" })) as any,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cet artisan ?")) return;
    const { error } = await supabase.from("artisans").delete().eq("id", id);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Succès", description: "Artisan supprimé" });
      fetchAgencyAndArtisans();
    }
  };

  const addProduct = () => setFormData({ ...formData, products: [...formData.products, emptyProduct()] });
  const removeProduct = (index: number) =>
    setFormData({ ...formData, products: formData.products.filter((_, i) => i !== index) });
  const updateProduct = (index: number, field: keyof Product, value: string) => {
    const products = [...formData.products];
    products[index] = { ...products[index], [field]: value };
    setFormData({ ...formData, products });
  };

  const filtered = artisans.filter((a) => a.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <AgencyLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Mes Artisans</h1>
            <p className="text-muted-foreground">Mettez en valeur des artisans locaux et leurs créations</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Nouvel Artisan</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editing ? "Modifier l'artisan" : "Nouvel artisan"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nom *</Label>
                    <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Métier *</Label>
                    <Select value={formData.craft_type} onValueChange={(v) => setFormData({ ...formData, craft_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CRAFT_TYPES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Ville / Quartier *</Label>
                    <Input value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Adresse</Label>
                    <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Téléphone</Label>
                    <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>WhatsApp</Label>
                    <Input value={formData.whatsapp} onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })} placeholder="+225 XX XX XX XX XX" />
                    <p className="text-xs text-muted-foreground">Indiquez bien l'indicatif pays (+225…), sinon le bouton WhatsApp du client ne fonctionnera pas.</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Présentation</Label>
                  <Textarea
                    placeholder="Le parcours de l'artisan, son savoir-faire..."
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Photo de couverture</Label>
                  <ImageUpload
                    label="Photo de l'artisan / atelier"
                    folder="agency-artisans"
                    value={formData.image_url}
                    onChange={(url) => setFormData({ ...formData, image_url: url })}
                  />
                </div>

                <div className="space-y-3 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Créations à mettre en avant</p>
                    <Button type="button" size="sm" variant="outline" onClick={addProduct}>
                      <Plus className="h-3.5 w-3.5 mr-1" /> Ajouter
                    </Button>
                  </div>
                  {formData.products.length === 0 && (
                    <p className="text-sm text-muted-foreground">Aucune création ajoutée pour l'instant.</p>
                  )}
                  {formData.products.map((product, index) => (
                    <div key={index} className="border rounded-lg p-3 space-y-3 relative">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="absolute top-2 right-2 h-6 w-6"
                        onClick={() => removeProduct(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Nom de la création</Label>
                          <Input value={product.name} onChange={(e) => updateProduct(index, "name", e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Prix</Label>
                          <div className="flex gap-2">
                            <Input type="number" value={product.price} onChange={(e) => updateProduct(index, "price", e.target.value)} />
                            <Select value={product.currency} onValueChange={(v) => updateProduct(index, "currency", v)}>
                              <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="XOF">XOF</SelectItem>
                                <SelectItem value="EUR">EUR</SelectItem>
                                <SelectItem value="USD">USD</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Description</Label>
                        <Textarea rows={2} value={product.description} onChange={(e) => updateProduct(index, "description", e.target.value)} />
                      </div>
                      <ImageUpload
                        label="Photo de la création"
                        folder="agency-artisans"
                        value={product.image_url}
                        onChange={(url) => updateProduct(index, "image_url", url)}
                      />
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <Switch checked={formData.available} onCheckedChange={(c) => setFormData({ ...formData, available: c })} />
                  <Label>Visible sur le site</Label>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
                  <Button type="submit">{editing ? "Mettre à jour" : "Créer"}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Artisan</TableHead>
                <TableHead>Métier</TableHead>
                <TableHead>Localisation</TableHead>
                <TableHead>Créations</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8">Chargement...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    <Hammer className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    Aucun artisan
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.name}</TableCell>
                    <TableCell>{a.craft_type}</TableCell>
                    <TableCell>{a.location}</TableCell>
                    <TableCell>{a.products?.length || 0}</TableCell>
                    <TableCell>
                      <Badge variant={a.is_active ? "default" : "secondary"}>
                        {a.is_active ? "Visible" : "Masqué"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(a)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(a.id)}>
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
    </AgencyLayout>
  );
}
