import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ExportButtons } from "@/components/admin/ExportButtons";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function AdminStays() {
  const { t } = useTranslation();
  const [stays, setStays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStay, setEditingStay] = useState<any>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    type: "",
    location: "",
    description: "",
    duration: "",
    price_per_unit: 0,
    currency: "EUR",
    available: true,
    featured: false,
  });

  useEffect(() => {
    fetchStays();
  }, []);

  const fetchStays = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("stays")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setStays(data || []);
    } catch (error) {
      console.error("Error fetching stays:", error);
      toast({
        title: t("ux.bo.error"),
        description: t("ux.bo.unableLoadStays"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingStay) {
        const { error } = await supabase
          .from("stays")
          .update(formData)
          .eq("id", editingStay.id);

        if (error) throw error;
        toast({ title: t("ux.bo.stayUpdatedSuccessfully") });
      } else {
        const { error } = await supabase.from("stays").insert([formData]);
        if (error) throw error;
        toast({ title: t("ux.bo.stayCreatedSuccessfully") });
      }

      setDialogOpen(false);
      resetForm();
      fetchStays();
    } catch (error) {
      console.error("Error saving stay:", error);
      toast({
        title: t("ux.bo.error"),
        description: t("ux.bo.unableSaveStay"),
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("ux.bo.youSureYouWantDelete5"))) return;

    try {
      const { error } = await supabase.from("stays").delete().eq("id", id);
      if (error) throw error;
      toast({ title: t("ux.bo.stayDeletedSuccessfully") });
      fetchStays();
    } catch (error) {
      console.error("Error deleting stay:", error);
      toast({
        title: t("ux.bo.error"),
        description: t("ux.bo.unableDeleteStay"),
        variant: "destructive",
      });
    }
  };

  const handleEdit = (stay: any) => {
    setEditingStay(stay);
    setFormData({
      name: stay.name,
      type: stay.type,
      location: stay.location,
      description: stay.description || "",
      duration: stay.duration,
      price_per_unit: stay.price_per_unit,
      currency: stay.currency,
      available: stay.available,
      featured: stay.featured,
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingStay(null);
    setFormData({
      name: "",
      type: "",
      location: "",
      description: "",
      duration: "",
      price_per_unit: 0,
      currency: "EUR",
      available: true,
      featured: false,
    });
  };

  const filteredStays = stays.filter((stay) =>
    stay.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    stay.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    stay.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">{t("ux.bo.stayManagement")}</h1>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                {t("ux.bo.newStay")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingStay ? t("ux.bo.editStay") : t("ux.bo.createStay")}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("ux.bo.name")}</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("ux.bo.type")}</Label>
                    <Input
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      placeholder={t("ux.bo.eGVillaResort")}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("ux.bo.location")}</Label>
                    <Input
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("ux.bo.duration")}</Label>
                    <Input
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      placeholder={t("ux.bo.eG5Days4")}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("ux.bo.pricePerNight")}</Label>
                    <Input
                      type="number"
                      value={formData.price_per_unit}
                      onChange={(e) => setFormData({ ...formData, price_per_unit: Number(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("ux.bo.currency")}</Label>
                    <Input
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t("ux.bo.description")}</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.available}
                      onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                    />
                    {t("ux.bo.available")}
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.featured}
                      onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    />
                    {t("ux.bo.featured")}
                  </label>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    {t("ux.bo.cancel")}
                  </Button>
                  <Button type="submit">
                    {editingStay ? t("ux.bo.update") : "Créer"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("ux.bo.searchStay")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <ExportButtons data={filteredStays} filename="stays" />
        </div>

        {loading ? (
          <div className="text-center py-12">{t("ux.bo.loading")}</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("ux.bo.name")}</TableHead>
                <TableHead>{t("ux.bo.type")}</TableHead>
                <TableHead>{t("ux.bo.location")}</TableHead>
                <TableHead>{t("ux.bo.duration")}</TableHead>
                <TableHead>{t("ux.bo.price")}</TableHead>
                <TableHead>{t("ux.bo.status")}</TableHead>
                <TableHead>{t("ux.bo.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStays.map((stay) => (
                <TableRow key={stay.id}>
                  <TableCell className="font-medium">{stay.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{stay.type}</Badge>
                  </TableCell>
                  <TableCell>{stay.location}</TableCell>
                  <TableCell>{stay.duration}</TableCell>
                  <TableCell>
                    {stay.price_per_unit} {stay.currency}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {stay.available && <Badge variant="secondary">{t("ux.bo.available")}</Badge>}
                      {stay.featured && <Badge>{t("ux.bo.featured2")}</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(stay)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(stay.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </AdminLayout>
  );
}
