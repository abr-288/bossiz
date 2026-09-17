import { useState, useEffect } from "react";
import { AgencyLayout } from "@/components/agency/AgencyLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { Plus, Pencil, Trash2, Sparkles, Search, X } from "lucide-react";

interface Treatment {
  name: string;
  description?: string;
  price?: number;
  currency?: string;
  duration_minutes?: number;
}

interface WellnessService {
  id: string;
  name: string;
  category: string;
  description: string | null;
  location: string;
  address: string | null;
  phone: string | null;
  image_url: string | null;
  treatments: Treatment[];
  opening_hours: Record<string, { open: string; close: string; closed?: boolean }>;
  slot_interval_minutes: number;
  max_capacity_per_slot: number;
  is_active: boolean;
  created_at: string;
}

const CATEGORIES: { key: string; label: string }[] = [
  { key: "spa", label: "Spa" },
  { key: "nail_salon", label: "Manucure & Pédicure" },
  { key: "barbershop", label: "Barbershop" },
  { key: "beauty_institute", label: "Institut de beauté" },
  { key: "yoga", label: "Yoga" },
];

const DAYS: { key: string; label: string }[] = [
  { key: "mon", label: "Lundi" },
  { key: "tue", label: "Mardi" },
  { key: "wed", label: "Mercredi" },
  { key: "thu", label: "Jeudi" },
  { key: "fri", label: "Vendredi" },
  { key: "sat", label: "Samedi" },
  { key: "sun", label: "Dimanche" },
];

const emptyOpeningHours = () =>
  DAYS.reduce((acc, d) => {
    acc[d.key] = { open: "09:00", close: "19:00", closed: d.key === "sun" };
    return acc;
  }, {} as Record<string, { open: string; close: string; closed?: boolean }>);

const emptyTreatment = (): Treatment => ({ name: "", description: "", price: undefined, currency: "XOF", duration_minutes: undefined });

const emptyForm = {
  name: "",
  category: "spa",
  description: "",
  location: "",
  address: "",
  phone: "",
  image_url: "",
  slot_interval_minutes: "30",
  max_capacity_per_slot: "1",
  available: true,
  openingHours: emptyOpeningHours(),
  treatments: [emptyTreatment()] as Treatment[],
};

export default function AgencyWellness() {
  const { toast } = useToast();
  const [items, setItems] = useState<WellnessService[]>([]);
  const [agencyId, setAgencyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<WellnessService | null>(null);
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    fetchAgencyAndItems();
  }, []);

  const fetchAgencyAndItems = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: agency } = await supabase
      .from("agencies")
      .select("id")
      .eq("owner_id", user.id)
      .single();

    if (!agency) return;
    setAgencyId(agency.id);

    const { data, error } = await supabase
      .from("wellness_services")
      .select("*")
      .eq("agency_id", agency.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching wellness services:", error);
    } else {
      setItems((data || []) as any);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setEditing(null);
    setFormData(emptyForm);
  };

  const cleanTreatments = (treatments: Treatment[]) =>
    treatments
      .filter((t) => t.name.trim())
      .map((t) => ({
        name: t.name.trim(),
        description: t.description?.trim() || undefined,
        price: t.price !== undefined && !Number.isNaN(t.price) ? t.price : undefined,
        currency: t.currency || "XOF",
        duration_minutes: t.duration_minutes !== undefined && !Number.isNaN(t.duration_minutes) ? t.duration_minutes : undefined,
      }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agencyId) return;

    try {
      const serviceData = {
        agency_id: agencyId,
        name: formData.name,
        category: formData.category,
        description: formData.description || null,
        location: formData.location,
        address: formData.address || null,
        phone: formData.phone || null,
        image_url: formData.image_url || null,
        slot_interval_minutes: parseInt(formData.slot_interval_minutes) || 30,
        max_capacity_per_slot: parseInt(formData.max_capacity_per_slot) || 1,
        is_active: formData.available,
        opening_hours: formData.openingHours,
        treatments: cleanTreatments(formData.treatments),
      };

      if (editing) {
        const { error } = await supabase.from("wellness_services").update(serviceData).eq("id", editing.id);
        if (error) throw error;
        toast({ title: "Succès", description: "Établissement mis à jour" });
      } else {
        const { error } = await supabase.from("wellness_services").insert(serviceData);
        if (error) throw error;
        toast({ title: "Succès", description: "Établissement créé" });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchAgencyAndItems();
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  };

  const handleEdit = (service: WellnessService) => {
    setEditing(service);
    const hours = service.opening_hours || {};
    setFormData({
      name: service.name,
      category: service.category,
      description: service.description || "",
      location: service.location,
      address: service.address || "",
      phone: service.phone || "",
      image_url: service.image_url || "",
      slot_interval_minutes: service.slot_interval_minutes.toString(),
      max_capacity_per_slot: service.max_capacity_per_slot.toString(),
      available: service.is_active,
      openingHours: DAYS.reduce((acc, d) => {
        acc[d.key] = hours[d.key] || { open: "09:00", close: "19:00", closed: true };
        return acc;
      }, {} as typeof emptyForm.openingHours),
      treatments: service.treatments && service.treatments.length > 0 ? service.treatments : [emptyTreatment()],
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cet établissement ? Les rendez-vous liés seront aussi supprimés.")) return;
    const { error } = await supabase.from("wellness_services").delete().eq("id", id);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Succès", description: "Établissement supprimé" });
      fetchAgencyAndItems();
    }
  };

  const updateTreatment = (index: number, patch: Partial<Treatment>) => {
    setFormData({
      ...formData,
      treatments: formData.treatments.map((t, i) => (i === index ? { ...t, ...patch } : t)),
    });
  };

  const addTreatment = () => {
    setFormData({ ...formData, treatments: [...formData.treatments, emptyTreatment()] });
  };

  const removeTreatment = (index: number) => {
    setFormData({ ...formData, treatments: formData.treatments.filter((_, i) => i !== index) });
  };

  const filtered = items.filter((i) => i.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <AgencyLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Bien-être & Beauté</h1>
            <p className="text-muted-foreground">Gérez vos établissements et leurs créneaux de rendez-vous</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Nouvel établissement</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editing ? "Modifier l'établissement" : "Nouvel établissement"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nom *</Label>
                    <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Catégorie *</Label>
                    <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>
                        ))}
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
                    <Label>Capacité max par créneau *</Label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.max_capacity_per_slot}
                      onChange={(e) => setFormData({ ...formData, max_capacity_per_slot: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} />
                </div>

                <div className="space-y-3 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Prestations proposées</p>
                    <Button type="button" variant="outline" size="sm" onClick={addTreatment}>
                      <Plus className="h-3.5 w-3.5 mr-1" />Ajouter
                    </Button>
                  </div>
                  {formData.treatments.map((treatment, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-start">
                      <Input
                        className="col-span-4"
                        placeholder="Nom (ex: Manucure)"
                        value={treatment.name}
                        onChange={(e) => updateTreatment(index, { name: e.target.value })}
                      />
                      <Input
                        className="col-span-3"
                        type="number"
                        min="0"
                        placeholder="Prix XOF"
                        value={treatment.price ?? ""}
                        onChange={(e) => updateTreatment(index, { price: e.target.value ? parseFloat(e.target.value) : undefined })}
                      />
                      <Input
                        className="col-span-3"
                        type="number"
                        min="0"
                        placeholder="Durée (min)"
                        value={treatment.duration_minutes ?? ""}
                        onChange={(e) => updateTreatment(index, { duration_minutes: e.target.value ? parseInt(e.target.value) : undefined })}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="col-span-2"
                        onClick={() => removeTreatment(index)}
                        disabled={formData.treatments.length === 1}
                      >
                        <X className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 border-t pt-4">
                  <p className="text-sm font-medium">Horaires d'ouverture</p>
                  {DAYS.map((day) => {
                    const hours = formData.openingHours[day.key];
                    return (
                      <div key={day.key} className="flex items-center gap-3">
                        <div className="w-24 flex items-center gap-2">
                          <Switch
                            checked={!hours.closed}
                            onCheckedChange={(c) =>
                              setFormData({
                                ...formData,
                                openingHours: { ...formData.openingHours, [day.key]: { ...hours, closed: !c } },
                              })
                            }
                          />
                          <span className="text-sm">{day.label}</span>
                        </div>
                        {!hours.closed && (
                          <>
                            <Input
                              type="time"
                              className="w-32"
                              value={hours.open}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  openingHours: { ...formData.openingHours, [day.key]: { ...hours, open: e.target.value } },
                                })
                              }
                            />
                            <span className="text-sm text-muted-foreground">à</span>
                            <Input
                              type="time"
                              className="w-32"
                              value={hours.close}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  openingHours: { ...formData.openingHours, [day.key]: { ...hours, close: e.target.value } },
                                })
                              }
                            />
                          </>
                        )}
                        {hours.closed && <span className="text-sm text-muted-foreground">Fermé</span>}
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-2">
                  <Label>Photo</Label>
                  <ImageUpload
                    label="Photo de l'établissement"
                    folder="agency-wellness"
                    value={formData.image_url}
                    onChange={(url) => setFormData({ ...formData, image_url: url })}
                  />
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
                <TableHead>Établissement</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Localisation</TableHead>
                <TableHead>Prestations</TableHead>
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
                    <Sparkles className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    Aucun établissement
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{CATEGORIES.find((c) => c.key === s.category)?.label || s.category}</TableCell>
                    <TableCell>{s.location}</TableCell>
                    <TableCell>{s.treatments?.length || 0}</TableCell>
                    <TableCell>
                      <Badge variant={s.is_active ? "default" : "secondary"}>
                        {s.is_active ? "Visible" : "Masqué"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(s)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)}>
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
