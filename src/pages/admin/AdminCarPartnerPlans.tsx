import { useState, useEffect } from "react";
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
import { Plus, Edit, Loader2, RefreshCw, Car, Users } from "lucide-react";

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
  const { toast } = useToast();
  const [plans, setPlans] = useState<CarPartnerPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<CarPartnerPlan | null>(null);
  const [formData, setFormData] = useState(emptyPlan);
  const [featuresText, setFeaturesText] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const fetchPlans = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("car_partner_plans")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      setPlans((data as CarPartnerPlan[]) || []);
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

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
      toast({ title: "Erreur", description: "L'identifiant et le nom sont obligatoires", variant: "destructive" });
      return;
    }
    if (formData.commission_rate < 0 || formData.commission_rate > 100) {
      toast({ title: "Erreur", description: "La commission doit être comprise entre 0 et 100%", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      const dataToSave = {
        ...formData,
        features: featuresText.split("\n").filter((f) => f.trim()),
      };

      if (editingPlan) {
        const { error } = await supabase
          .from("car_partner_plans")
          .update(dataToSave)
          .eq("id", editingPlan.id);
        if (error) throw error;
        toast({ title: "Succès", description: "Forfait mis à jour" });
      } else {
        const { error } = await supabase.from("car_partner_plans").insert(dataToSave);
        if (error) throw error;
        toast({ title: "Succès", description: "Forfait créé" });
      }

      setIsDialogOpen(false);
      fetchPlans();
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const [applyingRateFor, setApplyingRateFor] = useState<string | null>(null);

  // agencies.commission_rate is the rate actually charged (used by
  // postPaymentSuccess.ts) - it's copied from the plan's rate only at the
  // moment an admin assigns that plan to an agency (see AdminAgencies.tsx),
  // so editing a plan's rate above never retroactively changes what's
  // already been assigned. This is the explicit "apply it anyway" action
  // for when the old rate genuinely no longer applies to agencies already
  // on this plan, not just new ones.
  const applyRateToExistingAgencies = async (plan: CarPartnerPlan) => {
    if (!confirm(`Appliquer ${plan.commission_rate}% à TOUTES les agences actuellement sur le forfait "${plan.name}" ?`)) return;

    setApplyingRateFor(plan.id);
    try {
      const { data, error } = await supabase
        .from("agencies")
        .update({ commission_rate: plan.commission_rate })
        .eq("car_plan_id", plan.plan_id)
        .select("id");
      if (error) throw error;
      toast({
        title: "Succès",
        description: `Taux appliqué à ${data?.length ?? 0} agence(s) sur le forfait ${plan.name}`,
      });
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setApplyingRateFor(null);
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
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Forfaits partenaires voiture</h1>
            <p className="text-muted-foreground">
              Ajustez les taux de commission et tarifs des forfaits Découverte / Pro / Flotte
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchPlans} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualiser
            </Button>
            <Button onClick={handleCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Nouveau forfait
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
              <p className="text-center py-12 text-muted-foreground">Aucun forfait trouvé</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Forfait</TableHead>
                    <TableHead>Tarif mensuel</TableHead>
                    <TableHead>Commission</TableHead>
                    <TableHead>Véhicules max</TableHead>
                    <TableHead>Actif</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
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
                        {plan.monthly_price === 0 ? "Gratuit" : `${plan.monthly_price.toLocaleString()} ${plan.currency}`}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">{plan.commission_rate}%</Badge>
                      </TableCell>
                      <TableCell>{plan.max_vehicles ?? "Illimité"}</TableCell>
                      <TableCell>
                        <Switch checked={plan.is_active} onCheckedChange={() => toggleActive(plan)} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Appliquer ce taux aux agences déjà sur ce forfait"
                          onClick={() => applyRateToExistingAgencies(plan)}
                          disabled={applyingRateFor === plan.id}
                        >
                          {applyingRateFor === plan.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Users className="w-4 h-4" />
                          )}
                        </Button>
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
              <DialogTitle>{editingPlan ? "Modifier le forfait" : "Créer un forfait"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Identifiant *</Label>
                  <Input
                    value={formData.plan_id}
                    onChange={(e) => setFormData({ ...formData, plan_id: e.target.value })}
                    placeholder="decouverte, pro, flotte..."
                    disabled={!!editingPlan}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nom *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Pro"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Accroche</Label>
                <Input
                  value={formData.tagline || ""}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  placeholder="Pour une flotte active en croissance"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Prix mensuel (XOF)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.monthly_price}
                    onChange={(e) => setFormData({ ...formData, monthly_price: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Prix annuel (XOF)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.yearly_price}
                    onChange={(e) => setFormData({ ...formData, yearly_price: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Commission (%) *</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.commission_rate}
                    onChange={(e) => setFormData({ ...formData, commission_rate: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Véhicules max (vide = illimité)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.max_vehicles ?? ""}
                    onChange={(e) => setFormData({ ...formData, max_vehicles: e.target.value ? parseInt(e.target.value) : null })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mises en avant / mois</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.featured_slots}
                    onChange={(e) => setFormData({ ...formData, featured_slots: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Avantages (un par ligne)</Label>
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
                <Label>Actif (visible sur /partenaires/voitures)</Label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editingPlan ? "Mettre à jour" : "Créer"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
