import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ExportButtons } from "@/components/admin/ExportButtons";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function AdminServices() {
  const { t } = useTranslation();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState<{
    name: string;
    type: "hotel" | "flight" | "car" | "tour" | "event" | "flight_hotel";
    location: string;
    destination: string;
    description: string;
    price_per_unit: number;
    currency: string;
    available: boolean;
    featured: boolean;
  }>({
    name: "",
    type: "hotel",
    location: "",
    destination: "",
    description: "",
    price_per_unit: 0,
    currency: "XOF",
    available: true,
    featured: false,
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error("Error fetching services:", error);
      toast({
        title: t("ux.bo.error"),
        description: t("ux.bo.unableLoadServices"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingService) {
        const { error } = await supabase
          .from("services")
          .update(formData)
          .eq("id", editingService.id);

        if (error) throw error;
        toast({ title: t("ux.bo.serviceUpdatedSuccessfully") });
      } else {
        const { error } = await supabase.from("services").insert([formData]);
        if (error) throw error;
        toast({ title: t("ux.bo.serviceCreatedSuccessfully") });
      }

      setDialogOpen(false);
      resetForm();
      fetchServices();
    } catch (error) {
      console.error("Error saving service:", error);
      toast({
        title: t("ux.bo.error"),
        description: t("ux.bo.unableSaveService"),
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("ux.bo.youSureYouWantDelete4"))) return;

    try {
      const { error } = await supabase.from("services").delete().eq("id", id);
      if (error) throw error;
      toast({ title: t("ux.bo.serviceDeletedSuccessfully") });
      fetchServices();
    } catch (error) {
      console.error("Error deleting service:", error);
      toast({
        title: t("ux.bo.error"),
        description: t("ux.bo.unableDeleteService"),
        variant: "destructive",
      });
    }
  };

  const handleEdit = (service: any) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      type: service.type,
      location: service.location,
      destination: service.destination || "",
      description: service.description || "",
      price_per_unit: service.price_per_unit,
      currency: service.currency,
      available: service.available,
      featured: service.featured,
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingService(null);
    setFormData({
      name: "",
      type: "hotel",
      location: "",
      destination: "",
      description: "",
      price_per_unit: 0,
      currency: "XOF",
      available: true,
      featured: false,
    });
  };

  const filteredServices = services.filter((service) => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || service.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">{t("ux.bo.serviceManagement")}</h1>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                {t("ux.bo.newService")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingService ? t("ux.bo.editService") : t("ux.bo.createService")}
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
                    <Select
                      value={formData.type}
                      onValueChange={(value: "hotel" | "flight" | "car" | "tour" | "event" | "flight_hotel") => 
                        setFormData({ ...formData, type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hotel">{t("ux.bo.hotel")}</SelectItem>
                        <SelectItem value="flight">{t("ux.bo.flight")}</SelectItem>
                        <SelectItem value="car">{t("ux.bo.car")}</SelectItem>
                        <SelectItem value="tour">{t("ux.bo.tour")}</SelectItem>
                        <SelectItem value="event">{t("ux.bo.event")}</SelectItem>
                        <SelectItem value="flight_hotel">{t("ux.bo.flightHotel")}</SelectItem>
                      </SelectContent>
                    </Select>
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
                    <Label>{t("ux.bo.destination")}</Label>
                    <Input
                      value={formData.destination}
                      onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("ux.bo.pricePerUnit")}</Label>
                    <Input
                      type="number"
                      value={formData.price_per_unit}
                      onChange={(e) => setFormData({ ...formData, price_per_unit: Number(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("ux.bo.currency")}</Label>
                    <Select
                      value={formData.currency}
                      onValueChange={(value) => setFormData({ ...formData, currency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="XOF">XOF (FCFA)</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                      </SelectContent>
                    </Select>
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
                    {editingService ? t("ux.bo.update") : "Créer"}
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
              placeholder={t("ux.bo.searchService")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("ux.bo.allTypes")}</SelectItem>
              <SelectItem value="hotel">{t("ux.bo.hotel")}</SelectItem>
              <SelectItem value="flight">{t("ux.bo.flight")}</SelectItem>
              <SelectItem value="car">{t("ux.bo.car")}</SelectItem>
              <SelectItem value="tour">{t("ux.bo.tour")}</SelectItem>
              <SelectItem value="event">{t("ux.bo.event")}</SelectItem>
              <SelectItem value="flight_hotel">{t("ux.bo.flightHotel")}</SelectItem>
            </SelectContent>
          </Select>
          <ExportButtons data={filteredServices} filename="services" />
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
                <TableHead>{t("ux.bo.price")}</TableHead>
                <TableHead>{t("ux.bo.status")}</TableHead>
                <TableHead>{t("ux.bo.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredServices.map((service) => (
                <TableRow key={service.id}>
                  <TableCell className="font-medium">{service.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{service.type}</Badge>
                  </TableCell>
                  <TableCell>{service.location}</TableCell>
                  <TableCell>
                    {service.price_per_unit} {service.currency}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {service.available && <Badge variant="secondary">{t("ux.bo.available")}</Badge>}
                      {service.featured && <Badge>{t("ux.bo.featured2")}</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(service)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(service.id)}
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
