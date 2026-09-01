import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Plus, Trash2, Globe, Mail, Palette, Settings, FileText, CreditCard, Paintbrush } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeConfig } from "@/components/admin/ThemeConfig";
import { ImageUpload } from "@/components/admin/ImageUpload";

interface ConfigItem {
  id: string;
  config_key: string;
  config_value: any;
  category: string;
  description: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export default function AdminConfiguration() {
  const [configs, setConfigs] = useState<ConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const { data, error } = await supabase
        .from("site_config")
        .select("*")
        .order("category");

      if (error) throw error;
      setConfigs(data || []);
    } catch (error) {
      console.error("Error fetching configs:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger la configuration",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = async (id: string, configKey: string, value: any) => {
    setSaving(id);
    try {
      const { error } = await supabase
        .from("site_config")
        .update({ config_value: value })
        .eq("id", id);

      if (error) throw error;

      setConfigs((prev) =>
        prev.map((c) => (c.id === id ? { ...c, config_value: value } : c))
      );

      toast({
        title: "Succès",
        description: `${configKey} mis à jour`,
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(null);
    }
  };

  const getConfigByKey = (key: string) => configs.find((c) => c.config_key === key);

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Configuration du site</h1>
          <p className="text-muted-foreground">
            Gérez tous les paramètres du site depuis cette interface
          </p>
        </div>

        <Tabs defaultValue="theme" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
            <TabsTrigger value="theme" className="flex items-center gap-2">
              <Paintbrush className="h-4 w-4" />
              <span className="hidden sm:inline">Thème</span>
            </TabsTrigger>
            <TabsTrigger value="branding" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Marque</span>
            </TabsTrigger>
            <TabsTrigger value="contact" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">Contact</span>
            </TabsTrigger>
            <TabsTrigger value="homepage" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">Accueil</span>
            </TabsTrigger>
            <TabsTrigger value="seo" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">SEO</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Paramètres</span>
            </TabsTrigger>
            <TabsTrigger value="footer" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Footer</span>
            </TabsTrigger>
          </TabsList>

          {/* Theme Tab */}
          <TabsContent value="theme" className="space-y-4">
            <ThemeConfig />
          </TabsContent>

          {/* Branding Tab */}
          <TabsContent value="branding" className="space-y-4">
            <BrandingConfig
              config={getConfigByKey("branding")}
              onSave={(value) => {
                const config = getConfigByKey("branding");
                if (config) updateConfig(config.id, "branding", value);
              }}
              saving={saving === getConfigByKey("branding")?.id}
            />
            <SocialConfig
              config={getConfigByKey("social")}
              onSave={(value) => {
                const config = getConfigByKey("social");
                if (config) updateConfig(config.id, "social", value);
              }}
              saving={saving === getConfigByKey("social")?.id}
            />
          </TabsContent>

          {/* Contact Tab */}
          <TabsContent value="contact" className="space-y-4">
            <ContactConfig
              config={getConfigByKey("contact")}
              onSave={(value) => {
                const config = getConfigByKey("contact");
                if (config) updateConfig(config.id, "contact", value);
              }}
              saving={saving === getConfigByKey("contact")?.id}
            />
          </TabsContent>

          {/* Homepage Tab */}
          <TabsContent value="homepage" className="space-y-4">
            <HeroConfig
              config={getConfigByKey("hero")}
              onSave={(value) => {
                const config = getConfigByKey("hero");
                if (config) updateConfig(config.id, "hero", value);
              }}
              saving={saving === getConfigByKey("hero")?.id}
            />
            <FeaturesConfig
              config={getConfigByKey("features")}
              onSave={(value) => {
                const config = getConfigByKey("features");
                if (config) updateConfig(config.id, "features", value);
              }}
              saving={saving === getConfigByKey("features")?.id}
            />
          </TabsContent>

          {/* SEO Tab */}
          <TabsContent value="seo" className="space-y-4">
            <SEOConfig
              config={getConfigByKey("seo")}
              onSave={(value) => {
                const config = getConfigByKey("seo");
                if (config) updateConfig(config.id, "seo", value);
              }}
              saving={saving === getConfigByKey("seo")?.id}
            />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <LocaleConfig
              config={getConfigByKey("locale")}
              onSave={(value) => {
                const config = getConfigByKey("locale");
                if (config) updateConfig(config.id, "locale", value);
              }}
              saving={saving === getConfigByKey("locale")?.id}
            />
            <BookingConfig
              config={getConfigByKey("booking")}
              onSave={(value) => {
                const config = getConfigByKey("booking");
                if (config) updateConfig(config.id, "booking", value);
              }}
              saving={saving === getConfigByKey("booking")?.id}
            />
            <PricingConfig
              config={getConfigByKey("pricing")}
              onSave={(value) => {
                const config = getConfigByKey("pricing");
                if (config) updateConfig(config.id, "pricing", value);
              }}
              saving={saving === getConfigByKey("pricing")?.id}
            />
          </TabsContent>

          {/* Footer Tab */}
          <TabsContent value="footer" className="space-y-4">
            <FooterConfig
              config={getConfigByKey("footer")}
              onSave={(value) => {
                const config = getConfigByKey("footer");
                if (config) updateConfig(config.id, "footer", value);
              }}
              saving={saving === getConfigByKey("footer")?.id}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

// Sub-components for each config section
function BrandingConfig({ config, onSave, saving }: { config?: ConfigItem; onSave: (value: any) => void; saving: boolean }) {
  const [value, setValue] = useState(config?.config_value || {});

  useEffect(() => {
    if (config) setValue(config.config_value);
  }, [config]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Identité de marque</CardTitle>
        <CardDescription>Nom du site, logos et slogan</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Nom du site</Label>
            <Input
              value={value.siteName || ""}
              onChange={(e) => setValue({ ...value, siteName: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Slogan</Label>
            <Input
              value={value.tagline || ""}
              onChange={(e) => setValue({ ...value, tagline: e.target.value })}
            />
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2">
          <ImageUpload
            value={value.logoLight || ""}
            onChange={(url) => setValue({ ...value, logoLight: url })}
            folder="logos"
            label="Logo clair (thème sombre)"
          />
          <ImageUpload
            value={value.logoDark || ""}
            onChange={(url) => setValue({ ...value, logoDark: url })}
            folder="logos"
            label="Logo sombre (thème clair)"
          />
        </div>
        
        <ImageUpload
          value={value.favicon || ""}
          onChange={(url) => setValue({ ...value, favicon: url })}
          folder="logos"
          label="Favicon"
        />
        
        <Button onClick={() => onSave(value)} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Sauvegarder
        </Button>
      </CardContent>
    </Card>
  );
}

function ContactConfig({ config, onSave, saving }: { config?: ConfigItem; onSave: (value: any) => void; saving: boolean }) {
  const [value, setValue] = useState(config?.config_value || {});

  useEffect(() => {
    if (config) setValue(config.config_value);
  }, [config]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informations de contact</CardTitle>
        <CardDescription>Email, téléphone et adresse</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              value={value.email || ""}
              onChange={(e) => setValue({ ...value, email: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Téléphone</Label>
            <Input
              value={value.phone || ""}
              onChange={(e) => setValue({ ...value, phone: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>WhatsApp</Label>
            <Input
              value={value.whatsapp || ""}
              onChange={(e) => setValue({ ...value, whatsapp: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Adresse</Label>
            <Input
              value={value.address || ""}
              onChange={(e) => setValue({ ...value, address: e.target.value })}
            />
          </div>
        </div>
        <Button onClick={() => onSave(value)} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Sauvegarder
        </Button>
      </CardContent>
    </Card>
  );
}

function SocialConfig({ config, onSave, saving }: { config?: ConfigItem; onSave: (value: any) => void; saving: boolean }) {
  const [value, setValue] = useState(config?.config_value || {});

  useEffect(() => {
    if (config) setValue(config.config_value);
  }, [config]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Réseaux sociaux</CardTitle>
        <CardDescription>Liens vers vos réseaux sociaux</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          {["facebook", "instagram", "twitter", "linkedin", "youtube"].map((social) => (
            <div key={social} className="space-y-2">
              <Label className="capitalize">{social}</Label>
              <Input
                value={value[social] || ""}
                onChange={(e) => setValue({ ...value, [social]: e.target.value })}
                placeholder={`https://${social}.com/...`}
              />
            </div>
          ))}
        </div>
        <Button onClick={() => onSave(value)} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Sauvegarder
        </Button>
      </CardContent>
    </Card>
  );
}

function HeroConfig({ config, onSave, saving }: { config?: ConfigItem; onSave: (value: any) => void; saving: boolean }) {
  const [value, setValue] = useState(config?.config_value || { slides: [] });

  useEffect(() => {
    if (config) setValue(config.config_value);
  }, [config]);

  const addSlide = () => {
    setValue({
      ...value,
      slides: [...(value.slides || []), { image: "", title: "" }],
    });
  };

  const removeSlide = (index: number) => {
    setValue({
      ...value,
      slides: value.slides.filter((_: any, i: number) => i !== index),
    });
  };

  const updateSlide = (index: number, field: string, val: string) => {
    const newSlides = [...value.slides];
    newSlides[index] = { ...newSlides[index], [field]: val };
    setValue({ ...value, slides: newSlides });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Section Hero</CardTitle>
        <CardDescription>Bannière principale de la page d'accueil</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Titre principal</Label>
            <Input
              value={value.title || ""}
              onChange={(e) => setValue({ ...value, title: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Sous-titre</Label>
            <Input
              value={value.subtitle || ""}
              onChange={(e) => setValue({ ...value, subtitle: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Texte du bouton CTA</Label>
            <Input
              value={value.ctaText || ""}
              onChange={(e) => setValue({ ...value, ctaText: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">Slides du carousel</Label>
            <Button type="button" variant="outline" size="sm" onClick={addSlide}>
              <Plus className="mr-2 h-4 w-4" /> Ajouter un slide
            </Button>
          </div>
          
          <div className="space-y-4">
            {value.slides?.map((slide: any, index: number) => (
              <div key={index} className="p-4 border rounded-lg space-y-3 bg-muted/30">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Slide {index + 1}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSlide(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Supprimer
                  </Button>
                </div>
                
                <ImageUpload
                  value={slide.image || ""}
                  onChange={(url) => updateSlide(index, "image", url)}
                  folder="hero"
                  label="Image du slide"
                />
                
                <div className="space-y-2">
                  <Label>Titre du slide (optionnel)</Label>
                  <Input
                    placeholder="Ex: Découvrez Paris"
                    value={slide.title || ""}
                    onChange={(e) => updateSlide(index, "title", e.target.value)}
                  />
                </div>
              </div>
            ))}
            
            {(!value.slides || value.slides.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucun slide configuré. Les images par défaut seront utilisées.
              </p>
            )}
          </div>
        </div>

        <Button onClick={() => onSave(value)} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Sauvegarder
        </Button>
      </CardContent>
    </Card>
  );
}

function FeaturesConfig({ config, onSave, saving }: { config?: ConfigItem; onSave: (value: any) => void; saving: boolean }) {
  const [value, setValue] = useState(config?.config_value || { items: [] });

  useEffect(() => {
    if (config) setValue(config.config_value);
  }, [config]);

  const addItem = () => {
    setValue({
      ...value,
      items: [...(value.items || []), { icon: "Star", title: "", description: "" }],
    });
  };

  const removeItem = (index: number) => {
    setValue({
      ...value,
      items: value.items.filter((_: any, i: number) => i !== index),
    });
  };

  const updateItem = (index: number, field: string, val: string) => {
    const newItems = [...value.items];
    newItems[index] = { ...newItems[index], [field]: val };
    setValue({ ...value, items: newItems });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Section Caractéristiques</CardTitle>
        <CardDescription>Points forts affichés sur la page d'accueil</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Titre de la section</Label>
          <Input
            value={value.title || ""}
            onChange={(e) => setValue({ ...value, title: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Caractéristiques</Label>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="mr-2 h-4 w-4" /> Ajouter
            </Button>
          </div>
          <div className="space-y-2">
            {value.items?.map((item: any, index: number) => (
              <div key={index} className="flex gap-2 items-center">
                <Input
                  placeholder="Icône (Shield, Clock, Star...)"
                  value={item.icon || ""}
                  onChange={(e) => updateItem(index, "icon", e.target.value)}
                  className="w-32"
                />
                <Input
                  placeholder="Titre"
                  value={item.title || ""}
                  onChange={(e) => updateItem(index, "title", e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="Description"
                  value={item.description || ""}
                  onChange={(e) => updateItem(index, "description", e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(index)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <Button onClick={() => onSave(value)} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Sauvegarder
        </Button>
      </CardContent>
    </Card>
  );
}

function SEOConfig({ config, onSave, saving }: { config?: ConfigItem; onSave: (value: any) => void; saving: boolean }) {
  const [value, setValue] = useState(config?.config_value || {});

  useEffect(() => {
    if (config) setValue(config.config_value);
  }, [config]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Paramètres SEO</CardTitle>
        <CardDescription>Métadonnées pour les moteurs de recherche</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Titre par défaut</Label>
          <Input
            value={value.defaultTitle || ""}
            onChange={(e) => setValue({ ...value, defaultTitle: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Description par défaut</Label>
          <Textarea
            value={value.defaultDescription || ""}
            onChange={(e) => setValue({ ...value, defaultDescription: e.target.value })}
            rows={3}
          />
        </div>
        <div className="space-y-2">
          <Label>Mots-clés (séparés par des virgules)</Label>
          <Input
            value={value.keywords || ""}
            onChange={(e) => setValue({ ...value, keywords: e.target.value })}
          />
        </div>
        <Button onClick={() => onSave(value)} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Sauvegarder
        </Button>
      </CardContent>
    </Card>
  );
}

function LocaleConfig({ config, onSave, saving }: { config?: ConfigItem; onSave: (value: any) => void; saving: boolean }) {
  const [value, setValue] = useState(config?.config_value || {});

  useEffect(() => {
    if (config) setValue(config.config_value);
  }, [config]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Langue et devise</CardTitle>
        <CardDescription>Paramètres régionaux par défaut</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <strong>Devise :</strong> le site facture uniquement en XOF (Franc CFA)
          via CinetPay — ces champs sont indicatifs et n'affectent pas le
          site. Passer à un vrai multi-devises (affichage et paiement)
          demanderait un développement dédié.
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Devise par défaut (indicatif, non appliqué)</Label>
            <Input
              value={value.defaultCurrency || ""}
              onChange={(e) => setValue({ ...value, defaultCurrency: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Devises disponibles (indicatif, non appliqué)</Label>
            <Input
              value={value.availableCurrencies?.join(", ") || ""}
              onChange={(e) =>
                setValue({
                  ...value,
                  availableCurrencies: e.target.value.split(",").map((s: string) => s.trim()),
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Langue par défaut (appliquée aux nouveaux visiteurs)</Label>
            <Input
              value={value.defaultLanguage || ""}
              onChange={(e) => setValue({ ...value, defaultLanguage: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Langues disponibles (codes fr/en/zh, séparées par des virgules)</Label>
            <Input
              value={value.availableLanguages?.join(", ") || ""}
              onChange={(e) =>
                setValue({
                  ...value,
                  availableLanguages: e.target.value.split(",").map((s: string) => s.trim()),
                })
              }
            />
            <p className="text-xs text-muted-foreground">
              Contrôle les langues proposées dans le sélecteur de langue du site.
            </p>
          </div>
        </div>
        <Button onClick={() => onSave(value)} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Sauvegarder
        </Button>
      </CardContent>
    </Card>
  );
}

function BookingConfig({ config, onSave, saving }: { config?: ConfigItem; onSave: (value: any) => void; saving: boolean }) {
  const [value, setValue] = useState(config?.config_value || {});

  useEffect(() => {
    if (config) setValue(config.config_value);
  }, [config]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Paramètres de réservation</CardTitle>
        <CardDescription>Configuration des réservations</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Délai minimum (heures)</Label>
            <Input
              type="number"
              value={value.minAdvanceHours || 24}
              onChange={(e) => setValue({ ...value, minAdvanceHours: parseInt(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label>Max voyageurs par réservation</Label>
            <Input
              type="number"
              value={value.maxGuestsPerBooking || 10}
              onChange={(e) => setValue({ ...value, maxGuestsPerBooking: parseInt(e.target.value) })}
            />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Vérification téléphone requise</Label>
            <p className="text-sm text-muted-foreground">Exiger la vérification du numéro</p>
          </div>
          <Switch
            checked={value.requirePhoneVerification || false}
            onCheckedChange={(checked) => setValue({ ...value, requirePhoneVerification: checked })}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Confirmation automatique</Label>
            <p className="text-sm text-muted-foreground">Confirmer automatiquement les réservations</p>
          </div>
          <Switch
            checked={value.autoConfirmBookings || false}
            onCheckedChange={(checked) => setValue({ ...value, autoConfirmBookings: checked })}
          />
        </div>
        <Button onClick={() => onSave(value)} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Sauvegarder
        </Button>
      </CardContent>
    </Card>
  );
}

function PricingConfig({ config, onSave, saving }: { config?: ConfigItem; onSave: (value: any) => void; saving: boolean }) {
  const [value, setValue] = useState(config?.config_value || {});

  useEffect(() => {
    if (config) setValue(config.config_value);
  }, [config]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Affichage des prix</CardTitle>
        <CardDescription>Configuration de l'affichage des tarifs</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Afficher le prix original</Label>
            <p className="text-sm text-muted-foreground">Montrer le prix barré en cas de réduction</p>
          </div>
          <Switch
            checked={value.showOriginalPrice !== false}
            onCheckedChange={(checked) => setValue({ ...value, showOriginalPrice: checked })}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Couleur badge promotion</Label>
            <Input
              value={value.discountBadgeColor || "red"}
              onChange={(e) => setValue({ ...value, discountBadgeColor: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Position devise (before/after)</Label>
            <Input
              value={value.currencyPosition || "after"}
              onChange={(e) => setValue({ ...value, currencyPosition: e.target.value })}
            />
          </div>
        </div>
        <Button onClick={() => onSave(value)} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Sauvegarder
        </Button>
      </CardContent>
    </Card>
  );
}

function FooterConfig({ config, onSave, saving }: { config?: ConfigItem; onSave: (value: any) => void; saving: boolean }) {
  const [value, setValue] = useState(config?.config_value || {});

  useEffect(() => {
    if (config) setValue(config.config_value);
  }, [config]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Footer</CardTitle>
        <CardDescription>Contenu du pied de page</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Copyright</Label>
          <Input
            value={value.copyright || ""}
            onChange={(e) => setValue({ ...value, copyright: e.target.value })}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Afficher newsletter</Label>
            <p className="text-sm text-muted-foreground">Afficher le formulaire d'inscription</p>
          </div>
          <Switch
            checked={value.showNewsletter !== false}
            onCheckedChange={(checked) => setValue({ ...value, showNewsletter: checked })}
          />
        </div>
        <div className="space-y-2">
          <Label>Titre newsletter</Label>
          <Input
            value={value.newsletterTitle || ""}
            onChange={(e) => setValue({ ...value, newsletterTitle: e.target.value })}
          />
        </div>
        <Button onClick={() => onSave(value)} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Sauvegarder
        </Button>
      </CardContent>
    </Card>
  );
}

// Les clés d'API tierces (Amadeus, RapidAPI, AeroDataBox, TravelAdvisor, Flight Fare Search, Kayak)
// ne sont jamais lues depuis site_config par les Edge Functions (elles utilisent Deno.env.get()
// via les secrets Supabase). Un onglet d'administration qui les stockait ici a été supprimé :
// il n'avait aucun effet fonctionnel et exposait ces secrets via la lecture publique de site_config.
