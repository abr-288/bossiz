import { useState, useEffect } from "react";
import { AgencyLayout } from "@/components/agency/AgencyLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Building2, Save } from "lucide-react";

interface AgencyData {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  is_visible: boolean;
}

export default function AgencySettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [agency, setAgency] = useState<AgencyData | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    logo_url: "",
    contact_email: "",
    contact_phone: "",
    is_visible: false,
  });

  useEffect(() => {
    fetchAgency();
  }, []);

  const fetchAgency = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("agencies")
      .select("*")
      .eq("owner_id", user.id)
      .single();

    if (error) {
      console.error("Error fetching agency:", error);
    } else if (data) {
      setAgency(data);
      setFormData({
        name: data.name,
        description: data.description || "",
        logo_url: data.logo_url || "",
        contact_email: data.contact_email || "",
        contact_phone: data.contact_phone || "",
        is_visible: data.is_visible,
      });
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agency) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("agencies")
        .update({
          name: formData.name,
          description: formData.description || null,
          logo_url: formData.logo_url || null,
          contact_email: formData.contact_email || null,
          contact_phone: formData.contact_phone || null,
          is_visible: formData.is_visible,
        })
        .eq("id", agency.id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Paramètres mis à jour",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AgencyLayout>
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </AgencyLayout>
    );
  }

  return (
    <AgencyLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold">Paramètres de l'agence</h1>
          <p className="text-muted-foreground">
            Gérez les informations de votre agence
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Informations générales
              </CardTitle>
              <CardDescription>
                Ces informations peuvent être affichées aux clients si la visibilité est activée
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom de l'agence</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="Décrivez votre agence..."
                />
              </div>

              <ImageUpload
                label="Logo de l'agence"
                folder="agency-logos"
                value={formData.logo_url}
                onChange={(logo_url) => setFormData({ ...formData, logo_url })}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>

              <div className="flex items-center gap-3 pt-4 border-t">
                <Switch
                  id="is_visible"
                  checked={formData.is_visible}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_visible: checked })}
                />
                <div>
                  <Label htmlFor="is_visible">Branding visible aux clients</Label>
                  <p className="text-sm text-muted-foreground">
                    Si activé, votre nom et logo seront affichés sur vos offres
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </AgencyLayout>
  );
}
