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
import { LocationPicker, type PartnerLocation } from "@/components/agency/LocationPicker";
import { Plus, Pencil, Trash2, UtensilsCrossed, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n/config";

interface Restaurant {
  id: string;
  name: string;
  description: string | null;
  cuisine_type: string | null;
  location: string;
  latitude: number | null;
  longitude: number | null;
  maps_url: string | null;
  address: string | null;
  price_range: string;
  image_url: string | null;
  phone: string | null;
  opening_hours: Record<string, { open: string; close: string; closed?: boolean }>;
  slot_interval_minutes: number;
  max_covers_per_slot: number;
  average_ticket_price: number | null;
  is_active: boolean;
  created_at: string;
}

const DAYS: { key: string; label: string }[] = [
  { key: "mon", get label() { return i18n.t("ux.bo.monday"); } },
  { key: "tue", get label() { return i18n.t("ux.bo.tuesday"); } },
  { key: "wed", get label() { return i18n.t("ux.bo.wednesday"); } },
  { key: "thu", get label() { return i18n.t("ux.bo.thursday"); } },
  { key: "fri", get label() { return i18n.t("ux.bo.friday"); } },
  { key: "sat", get label() { return i18n.t("ux.bo.saturday"); } },
  { key: "sun", get label() { return i18n.t("ux.bo.sunday"); } },
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
  latitude: null as number | null,
  longitude: null as number | null,
  maps_url: "",
  address: "",
  price_range: "€€",
  phone: "",
  image_url: "",
  slot_interval_minutes: "30",
  max_covers_per_slot: "20",
  average_ticket_price: "",
  available: true,
  openingHours: emptyOpeningHours(),
};

export default function AgencyRestaurants() {
  const { t } = useTranslation();
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
        latitude: formData.latitude,
        longitude: formData.longitude,
        maps_url: formData.maps_url || null,
        address: formData.address || null,
        price_range: formData.price_range,
        phone: formData.phone || null,
        image_url: formData.image_url || null,
        slot_interval_minutes: parseInt(formData.slot_interval_minutes) || 30,
        max_covers_per_slot: parseInt(formData.max_covers_per_slot) || 20,
        average_ticket_price: formData.average_ticket_price ? parseFloat(formData.average_ticket_price) : null,
        is_active: formData.available,
        opening_hours: formData.openingHours,
      };

      if (editing) {
        const { error } = await supabase.from("restaurants").update(restaurantData).eq("id", editing.id);
        if (error) throw error;
        toast({ title: t("ux.bo.success"), description: t("ux.bo.restaurantUpdated") });
      } else {
        const { error } = await supabase.from("restaurants").insert(restaurantData);
        if (error) throw error;
        toast({ title: t("ux.bo.success"), description: t("ux.bo.restaurantCreated") });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchAgencyAndRestaurants();
    } catch (error: any) {
      toast({ title: t("ux.bo.error"), description: error.message, variant: "destructive" });
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
      latitude: restaurant.latitude,
      longitude: restaurant.longitude,
      maps_url: restaurant.maps_url || "",
      address: restaurant.address || "",
      price_range: restaurant.price_range,
      phone: restaurant.phone || "",
      image_url: restaurant.image_url || "",
      slot_interval_minutes: restaurant.slot_interval_minutes.toString(),
      max_covers_per_slot: restaurant.max_covers_per_slot.toString(),
      average_ticket_price: restaurant.average_ticket_price?.toString() || "",
      available: restaurant.is_active,
      openingHours: DAYS.reduce((acc, d) => {
        acc[d.key] = hours[d.key] || { open: "11:00", close: "22:00", closed: true };
        return acc;
      }, {} as typeof emptyForm.openingHours),
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("ux.bo.deleteRestaurantRelatedBookingsWill"))) return;
    const { error } = await supabase.from("restaurants").delete().eq("id", id);
    if (error) {
      toast({ title: t("ux.bo.error"), description: error.message, variant: "destructive" });
    } else {
      toast({ title: t("ux.bo.success"), description: t("ux.bo.restaurantDeleted") });
      fetchAgencyAndRestaurants();
    }
  };

  const filtered = restaurants.filter((r) => r.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <AgencyLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">{t("ux.bo.myRestaurants")}</h1>
            <p className="text-muted-foreground">{t("ux.bo.manageRestaurantsTheirBookingSlots")}</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />{t("ux.bo.newRestaurant")}</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editing ? t("ux.bo.editRestaurant") : t("ux.bo.newRestaurant2")}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("ux.bo.name2")}</Label>
                    <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("ux.bo.cuisine")}</Label>
                    <Input
                      placeholder={t("ux.bo.eGIvorianItalian")}
                      value={formData.cuisine_type}
                      onChange={(e) => setFormData({ ...formData, cuisine_type: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("ux.bo.cityDistrict")}</Label>
                    <Input value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("ux.bo.address")}</Label>
                    <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
                  </div>
                </div>
                <LocationPicker value={{ location: formData.location, maps_url: formData.maps_url, latitude: formData.latitude, longitude: formData.longitude }} onChange={(location: PartnerLocation) => setFormData({ ...formData, ...location })} required showLocation={false} />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("ux.bo.priceRange")}</Label>
                    <Select value={formData.price_range} onValueChange={(v) => setFormData({ ...formData, price_range: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="€">€ - Abordable</SelectItem>
                        <SelectItem value="€€">{t("ux.bo.moderate")}</SelectItem>
                        <SelectItem value="€€€">{t("ux.bo.high")}</SelectItem>
                        <SelectItem value="€€€€">€€€€ - Luxe</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("ux.bo.phone")}</Label>
                    <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t("ux.bo.description")}</Label>
                  <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("ux.bo.maxCoversPerSlot")}</Label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.max_covers_per_slot}
                      onChange={(e) => setFormData({ ...formData, max_covers_per_slot: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("ux.bo.intervalBetweenSlotsMin")}</Label>
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

                <div className="space-y-2">
                  <Label>{t("ux.bo.averagePricePerPersonXof")}</Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder={t("ux.bo.eG8000")}
                    value={formData.average_ticket_price}
                    onChange={(e) => setFormData({ ...formData, average_ticket_price: e.target.value })}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("ux.bo.usedCalculateCommissionOwedEach")}
                  </p>
                </div>

                <div className="space-y-3 border-t pt-4">
                  <p className="text-sm font-medium">{t("ux.bo.openingHours")}</p>
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
                        {hours.closed && <span className="text-sm text-muted-foreground">{t("ux.bo.closed")}</span>}
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-2">
                  <Label>{t("ux.bo.photo")}</Label>
                  <ImageUpload
                    label={t("ux.bo.restaurantPhoto")}
                    folder="agency-restaurants"
                    value={formData.image_url}
                    onChange={(url) => setFormData({ ...formData, image_url: url })}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Switch checked={formData.available} onCheckedChange={(c) => setFormData({ ...formData, available: c })} />
                  <Label>{t("ux.bo.visibleSite")}</Label>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>{t("ux.bo.cancel")}</Button>
                  <Button type="submit">{editing ? t("ux.bo.update") : "Créer"}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={t("ux.bo.search")} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("ux.bo.restaurant")}</TableHead>
                <TableHead>{t("ux.bo.cuisine")}</TableHead>
                <TableHead>{t("ux.bo.location")}</TableHead>
                <TableHead>{t("ux.bo.range")}</TableHead>
                <TableHead>{t("ux.bo.status")}</TableHead>
                <TableHead className="text-right">{t("ux.bo.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8">{t("ux.bo.loading")}</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    <UtensilsCrossed className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    {t("ux.bo.noRestaurant")}
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
                      <Button aria-label={t("ux.bo.edit")} variant="ghost" size="icon" onClick={() => handleEdit(r)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button aria-label={t("ux.bo.delete")} variant="ghost" size="icon" onClick={() => handleDelete(r.id)}>
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
