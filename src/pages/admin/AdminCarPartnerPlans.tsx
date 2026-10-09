import { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Loader2, RefreshCw, Car } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { useTranslation } from "react-i18next";

interface CarPartnerPlan {
  id: string;
  plan_id: string;
  name: string;
  tagline: string | null;
  monthly_price: number;
  yearly_price: number;
  currency: string;
  commission_rate: number;
  max_vehicles: number | null;
  featured_slots: number;
  support_level: string;
  features: string[];
  is_active: boolean;
  sort_order: number;
}

const emptyPlan: Omit<CarPartnerPlan, "id"> = {
  plan_id: "",
  name: "",
  tagline: "",
  monthly_price: 0,
  yearly_price: 0,
  currency: "XOF",
  commission_rate: 10,
  max_vehicles: null,
  featured_slots: 0,
  support_level: "email",
  features: [],
  is_active: true,
  sort_order: 0,
};

export default function AdminCarPartnerPlans() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [plans, setPlans] = useState<CarPartnerPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<CarPartnerPlan | null>(null);
  const [formData, setFormData] = useState(emptyPlan);
  const [featuresText, setFeaturesText] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const fetchPlans = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("car_partner_plans")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      setPlans((data as CarPartnerPlan[]) || []);
    } catch (error: unknown) {
      toast({ title: t("ux.bo.error"), description: error instanceof Error ? error.message : t("ux.bo.unableLoadPlans"), variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleEdit = (plan: CarPartnerPlan) => {
    setEditingPlan(plan);
    setFormData(plan);
    setFeaturesText(plan.features.join("\n"));
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingPlan(null);
    setFormData({ ...emptyPlan, sort_order: plans.length + 1 });
    setFeaturesText("");
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.plan_id || !formData.name) {
      toast({ title: t("ux.bo.error"), description: t("ux.bo.identifierNameRequired"), variant: "destructive" });
      return;
    }
    if (Number(formData.monthly_price) <= 0 || Number(formData.yearly_price) <= 0) {
      toast({
        title: t("ux.bo.invalidPrice"),
        description: t("ux.bo.bothPlanPricesMustStrictly"),
        variant: "destructive",
      });
      return;
    }
    setIsSaving(true);
    try {
      const dataToSave = {
        ...formData,
        commission_rate: 10,
        features: featuresText.split("\n").filter((f) => f.trim()),
      };

      if (editingPlan) {
        const { error } = await supabase
          .from("car_partner_plans")
          .update(dataToSave)
          .eq("id", editingPlan.id);
        if (error) throw error;
        toast({ title: t("ux.bo.success"), description: t("ux.bo.planUpdated") });
      } else {
        const { error } = await supabase.from("car_partner_plans").insert(dataToSave);
        if (error) throw error;
        toast({ title: t("ux.bo.success"), description: t("ux.bo.planCreated") });
      }

      setIsDialogOpen(false);
      fetchPlans();
    } catch (error: unknown) {
      toast({ title: t("ux.bo.error"), description: error instanceof Error ? error.message : t("ux.bo.unableSavePlan"), variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleActive = async (plan: CarPartnerPlan) => {
    try {
      const { error } = await supabase
        .from("car_partner_plans")
        .update({ is_active: !plan.is_active })
        .eq("id", plan.id);
      if (error) throw error;
      fetchPlans();
    } catch (error: unknown) {
      toast({ title: t("ux.bo.error"), description: error instanceof Error ? error.message : t("ux.bo.unableEditPlan"), variant: "destructive" });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{t("ux.bo.carPartnerPlans")}</h1>
            <p className="text-muted-foreground">
              {t("ux.bo.adjustPlanPricesFeaturesSales")}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchPlans} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              {t("ux.bo.refresh")}
            </Button>
            <Button onClick={handleCreate}>
              <Plus className="w-4 h-4 mr-2" />
              {t("ux.bo.newPlan")}
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Forfaits ({plans.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : plans.length === 0 ? (
              <EmptyState icon={Car} title={t("ux.bo.noPartnerPlans")} description={t("ux.bo.createFirstPlanCarRental")} />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("ux.bo.plan")}</TableHead>
                    <TableHead>{t("ux.bo.monthlyPrice")}</TableHead>
                    <TableHead>{t("ux.bo.payoutShare")}</TableHead>
                    <TableHead>{t("ux.bo.maxVehicles")}</TableHead>
                    <TableHead>{t("ux.bo.active2")}</TableHead>
                    <TableHead className="text-right">{t("ux.bo.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Car className="w-4 h-4 text-primary" />
                          <div>
                            <p className="font-medium">{plan.name}</p>
                            <p className="text-xs text-muted-foreground">{plan.tagline}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {plan.monthly_price.toLocaleString()} {plan.currency}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">90%</Badge>
                      </TableCell>
                      <TableCell>{plan.max_vehicles ?? "Illimité"}</TableCell>
                      <TableCell>
                        <Switch checked={plan.is_active} onCheckedChange={() => toggleActive(plan)} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(plan)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPlan ? t("ux.bo.editPlan") : t("ux.bo.createPlan")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("ux.bo.identifier")}</Label>
                  <Input
                    value={formData.plan_id}
                    onChange={(e) => setFormData({ ...formData, plan_id: e.target.value })}
                    placeholder="decouverte, pro, flotte..."
                    disabled={!!editingPlan}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("ux.bo.name2")}</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={t("ux.bo.pro")}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t("ux.bo.tagline2")}</Label>
                <Input
                  value={formData.tagline || ""}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  placeholder={t("ux.bo.growingActiveFleet")}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>{t("ux.bo.monthlyPriceXof")}</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.monthly_price}
                    onChange={(e) => setFormData({ ...formData, monthly_price: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("ux.bo.annualPriceXof")}</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.yearly_price}
                    onChange={(e) => setFormData({ ...formData, yearly_price: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("ux.bo.maxVehiclesEmptyUnlimited")}</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.max_vehicles ?? ""}
                    onChange={(e) => setFormData({ ...formData, max_vehicles: e.target.value ? parseInt(e.target.value) : null })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("ux.bo.highlightsMonth")}</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.featured_slots}
                    onChange={(e) => setFormData({ ...formData, featured_slots: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t("ux.bo.benefitsOnePerLine")}</Label>
                <Textarea
                  value={featuresText}
                  onChange={(e) => setFeaturesText(e.target.value)}
                  placeholder="Jusqu'à 15 véhicules en ligne&#10;Support prioritaire"
                  rows={5}
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
                />
                <Label>{t("ux.bo.activeVisiblePartenairesVoitures")}</Label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>{t("ux.bo.cancel")}</Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editingPlan ? t("ux.bo.update") : "Créer"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
