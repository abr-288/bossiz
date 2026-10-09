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
import { LocationPicker, type PartnerLocation } from "@/components/agency/LocationPicker";
import { AvailableDatesInput } from "@/components/agency/AvailableDatesInput";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Activity, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n/config";

interface ActivityItem {
  id: string;
  name: string;
  category: string;
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

const categories = [
  { value: "adventure", get label() { return i18n.t("ux.bo.adventure"); } },
  { value: "cultural", get label() { return i18n.t("ux.bo.cultural"); } },
  { value: "nature", get label() { return i18n.t("ux.bo.nature"); } },
  { value: "sport", get label() { return i18n.t("ux.bo.sport"); } },
  { value: "relaxation", get label() { return i18n.t("ux.bo.relaxation"); } },
  { value: "gastronomie", get label() { return i18n.t("ux.bo.foodDrink"); } },
];

export default function AgencyActivities() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [agencyId, setAgencyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ActivityItem | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "adventure",
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
    fetchAgencyAndActivities();
  }, []);

  const fetchAgencyAndActivities = async () => {
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
      .from("activities")
      .select("*")
      .eq("agency_id", agency.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching activities:", error);
    } else {
      setActivities(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agencyId) return;

    try {
      const activityData = {
        name: formData.name,
        category: formData.category,
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

      if (editingActivity) {
        const { error } = await supabase
          .from("activities")
          .update(activityData)
          .eq("id", editingActivity.id);

        if (error) throw error;
        toast({ title: t("ux.bo.success"), description: t("ux.bo.activityUpdated") });
      } else {
        const { error } = await supabase
          .from("activities")
          .insert(activityData);

        if (error) throw error;
        toast({ title: t("ux.bo.success"), description: t("ux.bo.activityCreated") });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchAgencyAndActivities();
    } catch (error: any) {
      toast({
        title: t("ux.bo.error"),
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (activity: ActivityItem) => {
    setEditingActivity(activity);
    setFormData({
      name: activity.name,
      category: activity.category,
      description: activity.description || "",
      location: activity.location,
      maps_url: activity.maps_url || "",
      latitude: activity.latitude,
      longitude: activity.longitude,
      available_dates: activity.available_dates || [],
      duration: activity.duration,
      price_per_unit: activity.price_per_unit.toString(),
      currency: activity.currency,
      available: activity.available,
      image_url: activity.image_url || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("ux.bo.deleteActivity"))) return;

    const { error } = await supabase.from("activities").delete().eq("id", id);
    if (error) {
      toast({ title: t("ux.bo.error"), description: error.message, variant: "destructive" });
    } else {
      toast({ title: t("ux.bo.success"), description: t("ux.bo.activityDeleted") });
      fetchAgencyAndActivities();
    }
  };

  const resetForm = () => {
    setEditingActivity(null);
    setFormData({
      name: "",
      category: "adventure",
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

  const filteredActivities = activities.filter((a) =>
    a.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AgencyLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">{t("ux.bo.myActivities")}</h1>
            <p className="text-muted-foreground">{t("ux.bo.manageTouristActivities")}</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />{t("ux.bo.newActivity")}</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingActivity ? t("ux.bo.editActivity") : t("ux.bo.newActivity2")}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("ux.bo.name2")}</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("ux.bo.category2")}</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(v) => setFormData({ ...formData, category: v })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
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
                    <Label>{t("ux.bo.duration2")}</Label>
                    <Input
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      placeholder={t("ux.bo.eG2Hours")}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("ux.bo.price2")}</Label>
                    <Input
                      type="number"
                      value={formData.price_per_unit}
                      onChange={(e) => setFormData({ ...formData, price_per_unit: e.target.value })}
                      required
                    />
                  </div>
                  <div className="flex items-end pb-2 text-sm text-muted-foreground">{t("ux.bo.priceShownChargedXofFcfa")}</div>
                </div>
                <AvailableDatesInput dates={formData.available_dates} onChange={(available_dates) => setFormData({ ...formData, available_dates })} />
                <div className="space-y-2">
                  <Label>{t("ux.bo.description")}</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                  />
                </div>
                <ImageUpload label={t("ux.bo.activityPhoto")} folder="agency-activities" value={formData.image_url} onChange={(image_url) => setFormData({ ...formData, image_url })} />
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.available}
                    onCheckedChange={(c) => setFormData({ ...formData, available: c })}
                  />
                  <Label>{t("ux.bo.available")}</Label>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    {t("ux.bo.cancel")}
                  </Button>
                  <Button type="submit">{editingActivity ? t("ux.bo.update") : "Créer"}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("ux.bo.search")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("ux.bo.activity")}</TableHead>
                <TableHead>{t("ux.bo.category")}</TableHead>
                <TableHead>{t("ux.bo.location")}</TableHead>
                <TableHead>{t("ux.bo.duration")}</TableHead>
                <TableHead>{t("ux.bo.price")}</TableHead>
                <TableHead>{t("ux.bo.status")}</TableHead>
                <TableHead className="text-right">{t("ux.bo.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">{t("ux.bo.loading")}</TableCell>
                </TableRow>
              ) : filteredActivities.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    {t("ux.bo.noActivity")}
                  </TableCell>
                </TableRow>
              ) : (
                filteredActivities.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell className="font-medium">{activity.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {categories.find((c) => c.value === activity.category)?.label || activity.category}
                      </Badge>
                    </TableCell>
                    <TableCell>{activity.location}</TableCell>
                    <TableCell>{activity.duration}</TableCell>
                    <TableCell>{activity.price_per_unit} {activity.currency}</TableCell>
                    <TableCell>
                      <Badge variant={activity.available ? "default" : "secondary"}>
                        {activity.available ? t("ux.bo.available") : "Indisponible"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button aria-label={t("ux.bo.edit")} variant="ghost" size="icon" onClick={() => handleEdit(activity)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button aria-label={t("ux.bo.delete")} variant="ghost" size="icon" onClick={() => handleDelete(activity.id)}>
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
