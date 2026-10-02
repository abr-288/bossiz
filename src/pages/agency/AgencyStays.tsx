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
import { ImageUpload } from "@/components/admin/ImageUpload";
import { LocationPicker, type PartnerLocation } from "@/components/agency/LocationPicker";
import { AvailableDatesInput } from "@/components/agency/AvailableDatesInput";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Home, Search } from "lucide-react";

interface Stay {
  id: string;
  name: string;
  type: string;
  description: string | null;
  location: string;
  maps_url: string | null;
  latitude: number | null;
  longitude: number | null;
  available_dates: string[];
  duration: string;
  price_per_unit: number;
  currency: string;
  available: boolean;
  image_url: string | null;
  created_at: string;
}

const stayTypes = [
  { value: "apartment", label: "Appartement" },
  { value: "villa", label: "Villa" },
  { value: "house", label: "Maison" },
  { value: "bungalow", label: "Bungalow" },
  { value: "chalet", label: "Chalet" },
  { value: "studio", label: "Studio" },
];

export default function AgencyStays() {
  const { toast } = useToast();
  const [stays, setStays] = useState<Stay[]>([]);
  const [agencyId, setAgencyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStay, setEditingStay] = useState<Stay | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "apartment",
    description: "",
    location: "",
    maps_url: "",
    latitude: null as number | null,
    longitude: null as number | null,
    available_dates: [] as string[],
    duration: "",
    price_per_unit: "",
    currency: "XOF",
    available: true,
    image_url: "",
  });

  useEffect(() => {
    fetchAgencyAndStays();
  }, []);

  const fetchAgencyAndStays = async () => {
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
      .from("stays")
      .select("*")
      .eq("agency_id", agency.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching stays:", error);
    } else {
      setStays(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agencyId) return;

    try {
      const stayData = {
        name: formData.name,
        type: formData.type,
        description: formData.description || null,
        location: formData.location,
        maps_url: formData.maps_url || null,
        latitude: formData.latitude,
        longitude: formData.longitude,
        available_dates: formData.available_dates,
        duration: formData.duration,
        price_per_unit: parseFloat(formData.price_per_unit),
        currency: "XOF",
        available: formData.available,
        image_url: formData.image_url || null,
        agency_id: agencyId,
      };

      if (editingStay) {
        const { error } = await supabase
          .from("stays")
          .update(stayData)
          .eq("id", editingStay.id);

        if (error) throw error;
        toast({ title: "Succès", description: "Séjour mis à jour" });
      } else {
        const { error } = await supabase
          .from("stays")
          .insert(stayData);

        if (error) throw error;
        toast({ title: "Succès", description: "Séjour créé" });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchAgencyAndStays();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (stay: Stay) => {
    setEditingStay(stay);
    setFormData({
      name: stay.name,
      type: stay.type,
      description: stay.description || "",
      location: stay.location,
      maps_url: stay.maps_url || "",
      latitude: stay.latitude,
      longitude: stay.longitude,
      available_dates: stay.available_dates || [],
      duration: stay.duration,
      price_per_unit: stay.price_per_unit.toString(),
      currency: stay.currency,
      available: stay.available,
      image_url: stay.image_url || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce séjour ?")) return;

    const { error } = await supabase.from("stays").delete().eq("id", id);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Succès", description: "Séjour supprimé" });
      fetchAgencyAndStays();
    }
  };

  const resetForm = () => {
    setEditingStay(null);
    setFormData({
      name: "",
      type: "apartment",
      description: "",
      location: "",
      maps_url: "",
      latitude: null,
      longitude: null,
      available_dates: [],
      duration: "",
      price_per_unit: "",
      currency: "XOF",
      available: true,
      image_url: "",
    });
  };

  const filteredStays = stays.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AgencyLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Mes Séjours</h1>
            <p className="text-muted-foreground">Gérez vos hébergements de séjour</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Nouveau Séjour</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingStay ? "Modifier le séjour" : "Nouveau séjour"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nom *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Type *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(v) => setFormData({ ...formData, type: v })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {stayTypes.map((t) => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <LocationPicker
                  value={{ location: formData.location, maps_url: formData.maps_url, latitude: formData.latitude, longitude: formData.longitude }}
                  onChange={(location: PartnerLocation) => setFormData({ ...formData, ...location })}
                  required
                />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Durée min *</Label>
                    <Input
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      placeholder="Ex: 1 nuit"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Prix / nuit *</Label>
                    <Input
                      type="number"
                      value={formData.price_per_unit}
                      onChange={(e) => setFormData({ ...formData, price_per_unit: e.target.value })}
                      required
                    />
                  </div>
                  <div className="flex items-end pb-2 text-sm text-muted-foreground">Prix affiché et facturé en XOF (FCFA)</div>
                </div>
                <AvailableDatesInput dates={formData.available_dates} onChange={(available_dates) => setFormData({ ...formData, available_dates })} label="Dates spéciales de disponibilité" />
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                  />
                </div>
                <ImageUpload
                  label="Photo du séjour"
                  folder="agency-stays"
                  value={formData.image_url}
                  onChange={(image_url) => setFormData({ ...formData, image_url })}
                />
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.available}
                    onCheckedChange={(c) => setFormData({ ...formData, available: c })}
                  />
                  <Label>Disponible</Label>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit">{editingStay ? "Mettre à jour" : "Créer"}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Séjour</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Localisation</TableHead>
                <TableHead>Durée min</TableHead>
                <TableHead>Prix/nuit</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">Chargement...</TableCell>
                </TableRow>
              ) : filteredStays.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    <Home className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    Aucun séjour
                  </TableCell>
                </TableRow>
              ) : (
                filteredStays.map((stay) => (
                  <TableRow key={stay.id}>
                    <TableCell className="font-medium">{stay.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {stayTypes.find((t) => t.value === stay.type)?.label || stay.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{stay.location}</TableCell>
                    <TableCell>{stay.duration}</TableCell>
                    <TableCell>{stay.price_per_unit} {stay.currency}</TableCell>
                    <TableCell>
                      <Badge variant={stay.available ? "default" : "secondary"}>
                        {stay.available ? "Disponible" : "Indisponible"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(stay)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(stay.id)}>
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
