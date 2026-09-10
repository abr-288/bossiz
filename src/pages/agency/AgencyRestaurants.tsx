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
import { Plus, Pencil, Trash2, UtensilsCrossed, Search } from "lucide-react";

interface Restaurant {
  id: string;
  name: string;
  description: string | null;
  cuisine_type: string | null;
  location: string;
  address: string | null;
  price_range: string;
  image_url: string | null;
  phone: string | null;
  opening_hours: Record<string, { open: string; close: string; closed?: boolean }>;
  slot_interval_minutes: number;
  max_covers_per_slot: number;
  is_active: boolean;
  created_at: string;
}

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
    acc[d.key] = { open: "11:00", close: "22:00", closed: d.key === "sun" };
    return acc;
  }, {} as Record<string, { open: string; close: string; closed?: boolean }>);

const emptyForm = {
  name: "",
  description: "",
  cuisine_type: "",
  location: "",
  address: "",
  price_range: "€€",
  phone: "",
  image_url: "",
  slot_interval_minutes: "30",
  max_covers_per_slot: "20",
  available: true,
  openingHours: emptyOpeningHours(),
};

export default function AgencyRestaurants() {
  const { toast } = useToast();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [agencyId, setAgencyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Restaurant | null>(null);
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    fetchAgencyAndRestaurants();
  }, []);

  const fetchAgencyAndRestaurants = async () => {
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
      .from("restaurants")
      .select("*")
      .eq("agency_id", agency.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching restaurants:", error);
    } else {
      setRestaurants((data || []) as any);
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
      const restaurantData = {
        agency_id: agencyId,
        name: formData.name,
        description: formData.description || null,
        cuisine_type: formData.cuisine_type || null,
        location: formData.location,
        address: formData.address || null,
        price_range: formData.price_range,
        phone: formData.phone || null,
        image_url: formData.image_url || null,
        slot_interval_minutes: parseInt(formData.slot_interval_minutes) || 30,
        max_covers_per_slot: parseInt(formData.max_covers_per_slot) || 20,
        is_active: formData.available,
        opening_hours: formData.openingHours,
      };

      if (editing) {
        const { error } = await supabase.from("restaurants").update(restaurantData).eq("id", editing.id);
        if (error) throw error;
        toast({ title: "Succès", description: "Restaurant mis à jour" });
      } else {
        const { error } = await supabase.from("restaurants").insert(restaurantData);
        if (error) throw error;
        toast({ title: "Succès", description: "Restaurant créé" });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchAgencyAndRestaurants();
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  };

  const handleEdit = (restaurant: Restaurant) => {
    setEditing(restaurant);
    const hours = restaurant.opening_hours || {};
    setFormData({
      name: restaurant.name,
      description: restaurant.description || "",
      cuisine_type: restaurant.cuisine_type || "",
      location: restaurant.location,
      address: restaurant.address || "",
      price_range: restaurant.price_range,
      phone: restaurant.phone || "",
      image_url: restaurant.image_url || "",
      slot_interval_minutes: restaurant.slot_interval_minutes.toString(),
      max_covers_per_slot: restaurant.max_covers_per_slot.toString(),
      available: restaurant.is_active,
      openingHours: DAYS.reduce((acc, d) => {
        acc[d.key] = hours[d.key] || { open: "11:00", close: "22:00", closed: true };
        return acc;
      }, {} as typeof emptyForm.openingHours),
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce restaurant ? Les réservations liées seront aussi supprimées.")) return;
    const { error } = await supabase.from("restaurants").delete().eq("id", id);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Succès", description: "Restaurant supprimé" });
      fetchAgencyAndRestaurants();
    }
  };

  const filtered = restaurants.filter((r) => r.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <AgencyLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Mes Restaurants</h1>
            <p className="text-muted-foreground">Gérez vos restaurants et leurs créneaux de réservation</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Nouveau Restaurant</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editing ? "Modifier le restaurant" : "Nouveau restaurant"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nom *</Label>
                    <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Cuisine</Label>
                    <Input
                      placeholder="Ex: Ivoirienne, Italienne..."
                      value={formData.cuisine_type}
                      onChange={(e) => setFormData({ ...formData, cuisine_type: e.target.value })}
                    />
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
                    <Label>Gamme de prix</Label>
                    <Select value={formData.price_range} onValueChange={(v) => setFormData({ ...formData, price_range: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="€">€ - Abordable</SelectItem>
                        <SelectItem value="€€">€€ - Modéré</SelectItem>
                        <SelectItem value="€€€">€€€ - Élevé</SelectItem>
                        <SelectItem value="€€€€">€€€€ - Luxe</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Téléphone</Label>
                    <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Couverts max par créneau *</Label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.max_covers_per_slot}
                      onChange={(e) => setFormData({ ...formData, max_covers_per_slot: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Intervalle entre créneaux (min)</Label>
                    <Select value={formData.slot_interval_minutes} onValueChange={(v) => setFormData({ ...formData, slot_interval_minutes: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 min</SelectItem>
                        <SelectItem value="30">30 min</SelectItem>
                        <SelectItem value="60">60 min</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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
                    label="Photo du restaurant"
                    folder="agency-restaurants"
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
                <TableHead>Restaurant</TableHead>
                <TableHead>Cuisine</TableHead>
                <TableHead>Localisation</TableHead>
                <TableHead>Gamme</TableHead>
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
                    <UtensilsCrossed className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    Aucun restaurant
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell>{r.cuisine_type || "—"}</TableCell>
                    <TableCell>{r.location}</TableCell>
                    <TableCell>{r.price_range}</TableCell>
                    <TableCell>
                      <Badge variant={r.is_active ? "default" : "secondary"}>
                        {r.is_active ? "Visible" : "Masqué"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(r)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(r.id)}>
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
