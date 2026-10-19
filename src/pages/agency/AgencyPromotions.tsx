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
import { Badge } from "@/components/ui/badge";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Percent, Search } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useTranslation } from "react-i18next";

interface Promotion {
  id: string;
  name: string;
  description: string | null;
  location: string;
  original_price: number;
  discount: number;
  currency: string;
  is_active: boolean;
  expires_at: string | null;
  image_url: string | null;
  created_at: string;
}

export default function AgencyPromotions() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [agencyId, setAgencyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    location: "",
    original_price: "",
    discount: "",
    currency: "XOF",
    is_active: true,
    expires_at: "",
    image_url: "",
  });

  useEffect(() => {
    fetchAgencyAndPromotions();
  }, []);

  const fetchAgencyAndPromotions = async () => {
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
      .from("promotions")
      .select("*")
      .eq("agency_id", agency.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching promotions:", error);
    } else {
      setPromotions(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agencyId) return;

    try {
      const promotionData = {
        name: formData.name,
        description: formData.description || null,
        location: formData.location,
        original_price: parseFloat(formData.original_price),
        discount: parseInt(formData.discount),
        currency: "XOF",
        is_active: formData.is_active,
        expires_at: formData.expires_at || null,
        image_url: formData.image_url || null,
        agency_id: agencyId,
      };

      if (editingPromotion) {
        const { error } = await supabase
          .from("promotions")
          .update(promotionData)
          .eq("id", editingPromotion.id);

        if (error) throw error;
        toast({ title: t("ux.bo.success"), description: t("ux.bo.promotionUpdated") });
      } else {
        const { error } = await supabase
          .from("promotions")
          .insert(promotionData);

        if (error) throw error;
        toast({ title: t("ux.bo.success"), description: t("ux.bo.promotionCreated") });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchAgencyAndPromotions();
    } catch (error: any) {
      toast({
        title: t("ux.bo.error"),
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (promotion: Promotion) => {
    setEditingPromotion(promotion);
    setFormData({
      name: promotion.name,
      description: promotion.description || "",
      location: promotion.location,
      original_price: promotion.original_price.toString(),
      discount: promotion.discount.toString(),
      currency: promotion.currency || "XOF",
      is_active: promotion.is_active,
      expires_at: promotion.expires_at ? promotion.expires_at.split("T")[0] : "",
      image_url: promotion.image_url || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("ux.bo.deletePromotion"))) return;

    const { error } = await supabase.from("promotions").delete().eq("id", id);
    if (error) {
      toast({ title: t("ux.bo.error"), description: error.message, variant: "destructive" });
    } else {
      toast({ title: t("ux.bo.success"), description: t("ux.bo.promotionDeleted") });
      fetchAgencyAndPromotions();
    }
  };

  const resetForm = () => {
    setEditingPromotion(null);
    setFormData({
      name: "",
      description: "",
      location: "",
      original_price: "",
      discount: "",
      currency: "XOF",
      is_active: true,
      expires_at: "",
      image_url: "",
    });
  };

  const filteredPromotions = promotions.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateDiscountedPrice = (original: number, discount: number) => {
    return original - (original * discount / 100);
  };

  return (
    <AgencyLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">{t("ux.bo.myPromotions")}</h1>
            <p className="text-muted-foreground">{t("ux.bo.managePromotionalOffers")}</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />{t("ux.bo.newPromotion2")}</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingPromotion ? t("ux.bo.editPromotion") : t("ux.bo.newPromotion")}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>{t("ux.bo.offerName")}</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("ux.bo.location4")}</Label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>{t("ux.bo.originalPrice")}</Label>
                    <Input
                      type="number"
                      value={formData.original_price}
                      onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("ux.bo.discount")}</Label>
                    <Input
                      type="number"
                      min="1"
                      max="99"
                      value={formData.discount}
                      onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                      required
                    />
                  </div>
                  <div className="flex items-end pb-2 text-sm text-muted-foreground">{t("ux.bo.priceShownChargedXofFcfa")}</div>
                </div>
                <div className="space-y-2">
                  <Label>{t("ux.bo.expiryDate")}</Label>
                  <Input
                    type="date"
                    value={formData.expires_at}
                    onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("ux.bo.description")}</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                  />
                </div>
                <ImageUpload label={t("ux.bo.promotionVisual")} folder="agency-promotions" value={formData.image_url} onChange={(image_url) => setFormData({ ...formData, image_url })} />
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(c) => setFormData({ ...formData, is_active: c })}
                  />
                  <Label>{t("ux.bo.active")}</Label>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    {t("ux.bo.cancel")}
                  </Button>
                  <Button type="submit">{editingPromotion ? t("ux.bo.update") : "Créer"}</Button>
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
                <TableHead>{t("ux.bo.promotion")}</TableHead>
                <TableHead>{t("ux.bo.location")}</TableHead>
                <TableHead>{t("ux.bo.originalPrice2")}</TableHead>
                <TableHead>{t("ux.bo.discount2")}</TableHead>
                <TableHead>{t("ux.bo.finalPrice")}</TableHead>
                <TableHead>{t("ux.bo.expires")}</TableHead>
                <TableHead>{t("ux.bo.status")}</TableHead>
                <TableHead className="text-right">{t("ux.bo.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">{t("ux.bo.loading")}</TableCell>
                </TableRow>
              ) : filteredPromotions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    <Percent className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    {t("ux.bo.noPromotion")}
                  </TableCell>
                </TableRow>
              ) : (
                filteredPromotions.map((promotion) => (
                  <TableRow key={promotion.id}>
                    <TableCell className="font-medium">{promotion.name}</TableCell>
                    <TableCell>{promotion.location}</TableCell>
                    <TableCell className="line-through text-muted-foreground">
                      {promotion.original_price} {promotion.currency}
                    </TableCell>
                    <TableCell>
                      <Badge variant="destructive">-{promotion.discount}%</Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-success">
                      {calculateDiscountedPrice(promotion.original_price, promotion.discount).toFixed(0)} {promotion.currency}
                    </TableCell>
                    <TableCell>
                      {promotion.expires_at 
                        ? format(new Date(promotion.expires_at), "dd MMM yyyy", { locale: fr })
                        : "-"
                      }
                    </TableCell>
                    <TableCell>
                      <Badge variant={promotion.is_active ? "default" : "secondary"}>
                        {promotion.is_active ? t("ux.bo.active") : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button aria-label={t("ux.bo.edit")} variant="ghost" size="icon" onClick={() => handleEdit(promotion)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button aria-label={t("ux.bo.delete")} variant="ghost" size="icon" onClick={() => handleDelete(promotion.id)}>
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
