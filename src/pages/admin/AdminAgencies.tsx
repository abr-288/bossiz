import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
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
import { PhoneNumberInput } from "@/components/PhoneNumberInput";
import { supabase } from "@/integrations/supabase/client";
import type { JekoPayoutMethod } from "@/constants/jekoPayoutMethods";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Building2, Search, Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Agency {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  owner_id: string;
  is_visible: boolean;
  is_active: boolean;
  commission_rate: number | null;
  car_plan_id: string | null;
  enabled_features: Record<string, boolean> | null;
  created_at: string;
  owner_name?: string;
}

interface CarPartnerPlan {
  plan_id: string;
  name: string;
  max_vehicles: number | null;
  commission_rate: number;
}

const NO_CAR_PLAN = "none";
const AGENCY_FEATURES = [
  { key: "services", label: "Services et circuits" },
  { key: "activities", label: "Activités" },
  { key: "stays", label: "Séjours" },
  { key: "restaurants", label: "Restaurants et réservations" },
  { key: "artisans", label: "Artisans, produits et commandes" },
  { key: "wellness", label: "Bien-être et rendez-vous" },
  { key: "promotions", label: "Promotions" },
] as const;
const DEFAULT_AGENCY_FEATURES = Object.fromEntries(AGENCY_FEATURES.map(({ key }) => [key, true]));

interface UserOption {
  id: string;
  email: string;
  full_name: string | null;
}

export default function AdminAgencies() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const location = useLocation();
  const prefillApplication = location.state?.prefillApplication as
    | { id: string; name: string; description: string | null; contact_email: string | null; contact_phone: string | null; logo_url: string | null; requested_car_plan_id?: string | null; preferred_payout_method?: JekoPayoutMethod | null }
    | undefined;
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [carPlans, setCarPlans] = useState<CarPartnerPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAgency, setEditingAgency] = useState<Agency | null>(null);
  const [ownerMatchStatus, setOwnerMatchStatus] = useState<"idle" | "found" | "not-found">("idle");
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    logo_url: "",
    contact_email: "",
    contact_phone: "",
    owner_id: "",
    is_visible: false,
    is_active: true,
    commission_rate: 10,
    car_plan_id: NO_CAR_PLAN,
    enabled_features: { ...DEFAULT_AGENCY_FEATURES } as Record<string, boolean>,
  });

  useEffect(() => {
    fetchAgencies();
    fetchUsers();
    fetchCarPlans();
  }, []);

  useEffect(() => {
    if (prefillApplication) {
      setFormData((prev) => ({
        ...prev,
        name: prefillApplication.name || "",
        description: prefillApplication.description || "",
        contact_email: prefillApplication.contact_email || "",
        contact_phone: prefillApplication.contact_phone || "",
        logo_url: prefillApplication.logo_url || "",
        car_plan_id: prefillApplication.requested_car_plan_id || NO_CAR_PLAN,
      }));
      setIsDialogOpen(true);
    }
  }, [prefillApplication]);

  // Auto-link the owner: the candidate must already have a Bossiz+
  // account (created via /auth) using the same email as their
  // application, since agencies.owner_id always points at an existing
  // profiles row - there's no flow that creates the auth account here.
  useEffect(() => {
    if (!prefillApplication?.contact_email || users.length === 0) {
      setOwnerMatchStatus("idle");
      return;
    }
    const email = prefillApplication.contact_email.toLowerCase();
    const match = users.find((u) => u.email?.toLowerCase() === email);
    if (match) {
      setFormData((prev) => (prev.owner_id ? prev : { ...prev, owner_id: match.id }));
      setOwnerMatchStatus("found");
    } else {
      setOwnerMatchStatus("not-found");
    }
  }, [prefillApplication, users]);

  const fetchCarPlans = async () => {
    const { data, error } = await supabase
      .from("car_partner_plans")
      .select("plan_id, name, max_vehicles, commission_rate")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (!error && data) setCarPlans(data as CarPartnerPlan[]);
  };

  const fetchAgencies = async () => {
    try {
      const { data, error } = await supabase
        .from("agencies")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch owner info for each agency
      const agenciesWithOwners = await Promise.all(
        (data || []).map(async (agency) => {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", agency.owner_id)
            .single();

          return {
            ...agency,
            owner_name: profileData?.full_name || "N/A",
          };
        })
      );

      setAgencies(agenciesWithOwners);
    } catch (error) {
      console.error("Error fetching agencies:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les agences",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("admin-list-users");
      if (error) throw error;
      setUsers((data?.users || []) as UserOption[]);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  // Crée le compte du candidat côté serveur (admin-create-partner-account) et
  // lui envoie un lien pour choisir son mot de passe, puis le sélectionne
  // comme propriétaire.
  const handleCreateAccount = async () => {
    if (!prefillApplication?.contact_email) return;
    setCreatingAccount(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-create-partner-account", {
        body: { email: prefillApplication.contact_email, fullName: prefillApplication.name },
      });
      if (error || !data?.userId) throw error || new Error(data?.error || "Réponse invalide");

      await fetchUsers();
      setFormData((prev) => ({ ...prev, owner_id: data.userId }));
      setOwnerMatchStatus("found");

      if (data.created && !data.emailSent) {
        toast({
          title: "Compte créé, email non envoyé",
          description: data.setupLink
            ? `Transmettez-lui ce lien pour choisir son mot de passe : ${data.setupLink}`
            : "Il peut utiliser « Mot de passe oublié » sur /auth pour définir son mot de passe.",
        });
      } else {
        toast({
          title: data.created ? "Compte créé" : "Compte déjà existant",
          description: data.created
            ? `Un email d'invitation a été envoyé à ${prefillApplication.contact_email}.`
            : "Le compte existant a été sélectionné.",
        });
      }
    } catch (error) {
      console.error("Error creating partner account:", error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le compte. Réessayez ou sélectionnez un utilisateur existant.",
        variant: "destructive",
      });
    } finally {
      setCreatingAccount(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const carPlanId = formData.car_plan_id === NO_CAR_PLAN ? null : formData.car_plan_id;
      const carPlanChanged = editingAgency ? editingAgency.car_plan_id !== carPlanId : Boolean(carPlanId);

      if (editingAgency) {
        const { error } = await supabase
          .from("agencies")
          .update({
            name: formData.name,
            description: formData.description || null,
            logo_url: formData.logo_url || null,
            contact_email: formData.contact_email || null,
            contact_phone: formData.contact_phone
              ? formData.contact_phone.startsWith("+")
                ? formData.contact_phone
                : `+225 ${formData.contact_phone}`
              : null,
            is_visible: formData.is_visible,
            is_active: formData.is_active,
            commission_rate: formData.commission_rate,
            car_plan_id: carPlanId,
            enabled_features: formData.enabled_features,
            ...(carPlanChanged ? { car_plan_started_at: carPlanId ? new Date().toISOString() : null } : {}),
          })
          .eq("id", editingAgency.id);

        if (error) throw error;

        const { error: roleError } = await supabase
          .from("user_roles")
          .upsert(
            {
              user_id: editingAgency.owner_id,
              role: "sub_agency",
            },
            { onConflict: "user_id,role", ignoreDuplicates: true },
          );

        if (roleError) throw roleError;

        toast({
          title: "Succès",
          description: "Agence mise à jour avec succès",
        });
      } else {
        // Create agency
        const { data: newAgency, error: agencyError } = await supabase
          .from("agencies")
          .insert({
            name: formData.name,
            description: formData.description || null,
            logo_url: formData.logo_url || null,
            contact_email: formData.contact_email || null,
            contact_phone: formData.contact_phone
              ? formData.contact_phone.startsWith("+")
                ? formData.contact_phone
                : `+225 ${formData.contact_phone}`
              : null,
            owner_id: formData.owner_id,
            is_visible: formData.is_visible,
            is_active: formData.is_active,
            commission_rate: formData.commission_rate,
            car_plan_id: carPlanId,
            enabled_features: formData.enabled_features,
            car_plan_started_at: carPlanId ? new Date().toISOString() : null,
          })
          .select()
          .single();

        if (agencyError) throw agencyError;

        if (prefillApplication?.preferred_payout_method) {
          const { error: payoutDetailsError } = await supabase
            .from("agency_payout_details")
            .upsert({
              agency_id: newAgency.id,
              payment_method: prefillApplication.preferred_payout_method,
              beneficiary_name: formData.name,
            });
          if (payoutDetailsError) {
            console.error("Could not save the partner's preferred payout method:", payoutDetailsError);
            toast({
              title: "Agence créée, reversement à configurer",
              description: "Le moyen choisi n'a pas pu être enregistré. Le partenaire devra le sélectionner dans ses paramètres.",
              variant: "destructive",
            });
          }
        }

        // Add sub_agency role to user
        const { error: roleError } = await supabase
          .from("user_roles")
          .upsert(
            {
              user_id: formData.owner_id,
              role: "sub_agency",
            },
            { onConflict: "user_id,role", ignoreDuplicates: true },
          );

        if (roleError) throw roleError;

        if (prefillApplication?.id) {
          await supabase
            .from("partner_applications")
            .update({ status: "approved" })
            .eq("id", prefillApplication.id);
        }

        supabase.functions
          .invoke("send-partner-approved", { body: { agencyId: newAgency.id } })
          .then(({ error: emailError }) => {
            if (emailError) console.error("Partner approval email error:", emailError);
          });

        toast({
          title: "Succès",
          description: "Agence créée avec succès",
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchAgencies();
    } catch (error: any) {
      console.error("Error saving agency:", error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de l'enregistrement",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (agency: Agency) => {
    setEditingAgency(agency);
    setFormData({
      name: agency.name,
      description: agency.description || "",
      logo_url: agency.logo_url || "",
      contact_email: agency.contact_email || "",
      contact_phone: agency.contact_phone || "",
      owner_id: agency.owner_id,
      is_visible: agency.is_visible,
      is_active: agency.is_active,
      commission_rate: agency.commission_rate ?? 10,
      car_plan_id: agency.car_plan_id || NO_CAR_PLAN,
      enabled_features: { ...DEFAULT_AGENCY_FEATURES, ...(agency.enabled_features || {}) },
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string, ownerId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette agence ?")) return;

    try {
      // Remove sub_agency role from user
      await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", ownerId)
        .eq("role", "sub_agency" as any);

      const { error } = await supabase.from("agencies").delete().eq("id", id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Agence supprimée avec succès",
      });
      fetchAgencies();
    } catch (error: any) {
      console.error("Error deleting agency:", error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la suppression",
        variant: "destructive",
      });
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("agencies")
        .update({ is_active: !isActive })
        .eq("id", id);

      if (error) throw error;
      fetchAgencies();

      supabase.functions
        .invoke("send-partner-status-change", { body: { agencyId: id } })
        .then(({ error: emailError }) => {
          if (emailError) console.error("Partner status change email error:", emailError);
        });
    } catch (error) {
      console.error("Error toggling agency status:", error);
    }
  };

  const resetForm = () => {
    setEditingAgency(null);
    setFormData({
      name: "",
      description: "",
      logo_url: "",
      contact_email: "",
      contact_phone: "",
      owner_id: "",
      is_visible: false,
      is_active: true,
      commission_rate: 10,
      car_plan_id: NO_CAR_PLAN,
      enabled_features: { ...DEFAULT_AGENCY_FEATURES },
    });
  };

  const filteredAgencies = agencies.filter(
    (agency) =>
      agency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agency.contact_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Gestion des Sous-Agences</h1>
            <p className="text-muted-foreground">
              Gérez les sous-agences partenaires et leurs accès
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle Agence
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingAgency ? "Modifier l'agence" : "Créer une nouvelle agence"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom de l'agence *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  {!editingAgency && (
                    <div className="space-y-2">
                      <Label htmlFor="owner">Propriétaire *</Label>
                      {prefillApplication && ownerMatchStatus === "found" && (
                        <p className="text-xs text-green-600 font-medium">
                          Compte trouvé automatiquement pour {prefillApplication.contact_email}
                        </p>
                      )}
                      {prefillApplication && ownerMatchStatus === "not-found" && (
                        <div className="space-y-2 rounded-md border border-destructive/30 bg-destructive/5 p-3">
                          <p className="text-xs text-destructive font-medium">
                            Aucun compte Bossiz+ trouvé pour {prefillApplication.contact_email}.
                            Vous pouvez lui en créer un : il recevra un email pour choisir son mot
                            de passe. Sinon, sélectionnez un autre utilisateur ci-dessous.
                          </p>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={creatingAccount}
                            onClick={handleCreateAccount}
                          >
                            {creatingAccount ? "Création..." : "Créer le compte et envoyer l'invitation"}
                          </Button>
                        </div>
                      )}
                      <Select
                        value={formData.owner_id}
                        onValueChange={(value) => setFormData({ ...formData, owner_id: value })}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un utilisateur" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.full_name || "Sans nom"} — {user.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="contact_email">Email de contact</Label>
                    <Input
                      id="contact_email"
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact_phone">Téléphone</Label>
                    <PhoneNumberInput
                      id="contact_phone"
                      value={formData.contact_phone}
                      onValueChange={(contact_phone) => setFormData({ ...formData, contact_phone })}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <ImageUpload
                      label="Logo du partenaire"
                      folder="agency-logos"
                      value={formData.logo_url}
                      onChange={(logo_url) => setFormData({ ...formData, logo_url })}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                    />
                  <div className="space-y-2">
                    <Label>Partage des ventes en ligne</Label>
                    <p className="text-sm text-muted-foreground">10% pour Bossiz, 90% pour l'agence. Le taux n'est pas modifiable.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="car_plan_id">Forfait voiture</Label>
                    <Select
                      value={formData.car_plan_id}
                      onValueChange={(value) => {
                        const plan = carPlans.find((p) => p.plan_id === value);
                        setFormData({
                          ...formData,
                          car_plan_id: value,
                          commission_rate: plan ? plan.commission_rate : formData.commission_rate,
                        });
                      }}
                    >
                      <SelectTrigger id="car_plan_id">
                        <SelectValue placeholder="Aucun (illimité)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NO_CAR_PLAN}>Aucun (illimité)</SelectItem>
                        {carPlans.map((plan) => (
                          <SelectItem key={plan.plan_id} value={plan.plan_id}>
                            {plan.name} {plan.max_vehicles ? `(${plan.max_vehicles} véh.)` : "(illimité)"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  </div>
                </div>
                  <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="is_visible"
                      checked={formData.is_visible}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_visible: checked })}
                      disabled={!formData.is_visible}
                    />
                    <div>
                      <Label htmlFor="is_visible">Branding visible aux clients — 2 500 F/mois</Label>
                      {!formData.is_visible && (
                        <p className="text-xs text-muted-foreground">Le partenaire doit payer l’abonnement depuis ses paramètres pour activer le branding.</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label htmlFor="is_active">Agence active</Label>
                  </div>
                </div>
                <div className="space-y-3 rounded-lg border p-4">
                  <div>
                    <h3 className="font-semibold">Accès du partenaire</h3>
                    <p className="text-sm text-muted-foreground">Les rubriques désactivées restent visibles en gris, mais leurs formulaires et actions sont bloqués. La base refuse aussi les modifications directes.</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {AGENCY_FEATURES.map(({ key, label }) => (
                      <div key={key} className="flex items-center justify-between gap-3 rounded-md bg-muted/40 px-3 py-2">
                        <Label htmlFor={`agency-feature-${key}`}>{label}</Label>
                        <Switch
                          id={`agency-feature-${key}`}
                          checked={formData.enabled_features[key] !== false}
                          onCheckedChange={(checked) => setFormData({
                            ...formData,
                            enabled_features: { ...formData.enabled_features, [key]: checked },
                          })}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit">
                    {editingAgency ? "Mettre à jour" : "Créer l'agence"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une agence..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agence</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Propriétaire</TableHead>
                <TableHead>Part agence</TableHead>
                <TableHead>Forfait voiture</TableHead>
                <TableHead>Visibilité</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Créée le</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : filteredAgencies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    <Building2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    Aucune agence trouvée
                  </TableCell>
                </TableRow>
              ) : (
                filteredAgencies.map((agency) => (
                  <TableRow key={agency.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {agency.logo_url ? (
                          <img
                            src={agency.logo_url}
                            alt={agency.name}
                            className="h-10 w-10 rounded-lg object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-primary" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{agency.name}</p>
                          {agency.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {agency.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {agency.contact_email && <p>{agency.contact_email}</p>}
                        {agency.contact_phone && (
                          <p className="text-muted-foreground">{agency.contact_phone}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{agency.owner_name}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        90%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {agency.car_plan_id ? (
                        <Badge variant="secondary">
                          {carPlans.find((p) => p.plan_id === agency.car_plan_id)?.name || agency.car_plan_id}
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">Aucun</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {agency.is_visible ? (
                        <Badge variant="secondary" className="gap-1">
                          <Eye className="h-3 w-3" /> Visible
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1">
                          <EyeOff className="h-3 w-3" /> Masquée
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={agency.is_active ? "default" : "secondary"}
                        className="cursor-pointer"
                        onClick={() => toggleActive(agency.id, agency.is_active)}
                      >
                        {agency.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(agency.created_at), "dd MMM yyyy", { locale: fr })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(agency)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(agency.id, agency.owner_id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
}
