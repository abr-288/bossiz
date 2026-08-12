import { useState, useEffect } from "react";
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
import { supabase } from "@/integrations/supabase/client";
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
  created_at: string;
  owner_email?: string;
  owner_name?: string;
}

interface UserOption {
  id: string;
  email: string;
  full_name: string | null;
}

export default function AdminAgencies() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAgency, setEditingAgency] = useState<Agency | null>(null);
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
  });

  useEffect(() => {
    fetchAgencies();
    fetchUsers();
  }, []);

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

          const { data: userData } = await supabase.auth.admin.getUserById(agency.owner_id).catch(() => ({ data: null }));

          return {
            ...agency,
            owner_name: profileData?.full_name || "N/A",
            owner_email: userData?.user?.email || "N/A",
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
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, full_name");

      if (error) throw error;
      
      setUsers(
        (profiles || []).map((p) => ({
          id: p.id,
          email: "",
          full_name: p.full_name,
        }))
      );
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingAgency) {
        const { error } = await supabase
          .from("agencies")
          .update({
            name: formData.name,
            description: formData.description || null,
            logo_url: formData.logo_url || null,
            contact_email: formData.contact_email || null,
            contact_phone: formData.contact_phone || null,
            is_visible: formData.is_visible,
            is_active: formData.is_active,
            commission_rate: formData.commission_rate,
          })
          .eq("id", editingAgency.id);

        if (error) throw error;

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
            contact_phone: formData.contact_phone || null,
            owner_id: formData.owner_id,
            is_visible: formData.is_visible,
            is_active: formData.is_active,
            commission_rate: formData.commission_rate,
          })
          .select()
          .single();

        if (agencyError) throw agencyError;

        // Add sub_agency role to user
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({
            user_id: formData.owner_id,
            role: "sub_agency" as any,
          });

        if (roleError && !roleError.message.includes("duplicate")) {
          console.error("Error adding role:", roleError);
        }

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
                              {user.full_name || user.id.slice(0, 8)}
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
                    <Input
                      id="contact_phone"
                      value={formData.contact_phone}
                      onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="logo_url">URL du logo</Label>
                    <Input
                      id="logo_url"
                      value={formData.logo_url}
                      onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                      placeholder="https://..."
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
                    <Label htmlFor="commission_rate">Taux de commission (%)</Label>
                    <Input
                      id="commission_rate"
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={formData.commission_rate}
                      onChange={(e) => setFormData({ ...formData, commission_rate: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="is_visible"
                      checked={formData.is_visible}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_visible: checked })}
                    />
                    <Label htmlFor="is_visible">Branding visible aux clients</Label>
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
                <TableHead>Commission</TableHead>
                <TableHead>Visibilité</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Créée le</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : filteredAgencies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
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
                        {agency.commission_rate ?? 10}%
                      </Badge>
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