import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { 
  Globe, 
  Settings,
  Eye,
  EyeOff,
  Save,
  Plus,
  X,
  MoveUp,
  MoveDown,
  Shield,
  Award,
  Headphones,
  Star,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { useHomepageConfigContext } from "@/contexts/HomepageConfigContext";
import { useToast } from "@/hooks/use-toast";

const AdminHomepageConfig = () => {
  const { toast } = useToast();
  const { config, loading, updateFeature, updateSection, refetch } = useHomepageConfigContext();
  const [activeTab, setActiveTab] = useState("sections");
  const [editingFeature, setEditingFeature] = useState<string | null>(null);

  const handleFeatureUpdate = async (featureId: string, field: string, value: any) => {
    await updateFeature(featureId, { [field]: value });
  };

  const handleSectionUpdate = async (sectionId: string, field: string, value: any) => {
    await updateSection(sectionId, { [field]: value });
  };

  const moveFeature = async (featureId: string, direction: 'up' | 'down') => {
    const currentIndex = config.features.findIndex(f => f.id === featureId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= config.features.length) return;

    const newFeatures = [...config.features];
    const [movedFeature] = newFeatures.splice(currentIndex, 1);
    newFeatures.splice(newIndex, 0, movedFeature);

    // Mettre à jour toutes les features avec leurs nouveaux ordres
    for (let i = 0; i < newFeatures.length; i++) {
      await updateFeature(newFeatures[i].id, { order_num: i });
    }
  };

  const moveSection = async (sectionId: string, direction: 'up' | 'down') => {
    const sections = Object.entries(config.sections)
      .map(([key, section]) => ({ id: key, ...section }))
      .sort((a, b) => a.order - b.order);

    const currentIndex = sections.findIndex(s => s.id === sectionId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= sections.length) return;

    const newSections = [...sections];
    const [movedSection] = newSections.splice(currentIndex, 1);
    newSections.splice(newIndex, 0, movedSection);

    // Mettre à jour toutes les sections avec leurs nouveaux ordres
    for (let i = 0; i < newSections.length; i++) {
      await updateSection(newSections[i].id, { order_num: i });
    }
  };

  const addNewFeature = async () => {
    const newFeature = {
      title: 'Nouvelle Fonctionnalité',
      description: 'Description de la nouvelle fonctionnalité',
      icon: 'Star',
      color: 'from-blue-500 to-blue-600'
    };
    
    // Ajouter via l'API (simulation)
    toast({
      title: "Fonctionnalité ajoutée",
      description: "Nouvelle fonctionnalité créée avec succès",
    });
  };

  const deleteFeature = async (featureId: string) => {
    // Supprimer via l'API (simulation)
    toast({
      title: "Fonctionnalité supprimée",
      description: "La fonctionnalité a été supprimée avec succès",
    });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Configuration Page d'Accueil</h1>
            <p className="text-muted-foreground">
              Gérez le contenu et l'apparence de la page d'accueil
            </p>
          </div>
          <Button onClick={refetch} className="gap-2">
            <Settings className="w-4 h-4" />
            Recharger
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sections" className="gap-2">
              <Settings className="w-4 h-4" />
              Sections
            </TabsTrigger>
            <TabsTrigger value="features" className="gap-2">
              <Star className="w-4 h-4" />
              Fonctionnalités
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sections" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Gestion des Sections
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(config.sections)
                    .sort(([,a], [,b]) => a.order - b.order)
                    .map(([sectionId, section]) => (
                      <Card key={sectionId} className="border">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <Label className="font-medium">{section.title}</Label>
                              <Badge variant={section.visible ? "default" : "secondary"}>
                                {section.visible ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
                                {section.visible ? 'Visible' : 'Masquée'}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => moveSection(sectionId, 'up')}
                                disabled={section.order === 1}
                              >
                                <ArrowUp className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => moveSection(sectionId, 'down')}
                                disabled={section.order === Object.keys(config.sections).length}
                              >
                                <ArrowDown className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <div>
                              <Label htmlFor={`title-${sectionId}`}>Titre</Label>
                              <Input
                                id={`title-${sectionId}`}
                                value={section.title}
                                onChange={(e) => handleSectionUpdate(sectionId, 'title', e.target.value)}
                                className="mt-1"
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor={`subtitle-${sectionId}`}>Sous-titre</Label>
                              <Input
                                id={`subtitle-${sectionId}`}
                                value={section.subtitle}
                                onChange={(e) => handleSectionUpdate(sectionId, 'subtitle', e.target.value)}
                                className="mt-1"
                              />
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Switch
                                id={`visible-${sectionId}`}
                                checked={section.visible}
                                onCheckedChange={(checked) => handleSectionUpdate(sectionId, 'visible', checked)}
                              />
                              <Label htmlFor={`visible-${sectionId}`}>Visible sur la page</Label>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="features" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5" />
                    Fonctionnalités Principales
                  </div>
                  <Button onClick={addNewFeature} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Ajouter
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {config.features.map((feature, index) => (
                    <Card key={feature.id} className="border">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center text-white`}>
                              {feature.icon === 'Shield' && <Shield className="w-5 h-5" />}
                              {feature.icon === 'Award' && <Award className="w-5 h-5" />}
                              {feature.icon === 'Headphones' && <Headphones className="w-5 h-5" />}
                              {feature.icon === 'Star' && <Star className="w-5 h-5" />}
                            </div>
                            <span className="font-medium">{feature.title}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => moveFeature(feature.id, 'up')}
                              disabled={index === 0}
                            >
                              <ArrowUp className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => moveFeature(feature.id, 'down')}
                              disabled={index === config.features.length - 1}
                            >
                              <ArrowDown className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteFeature(feature.id)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <Label htmlFor={`feature-title-${feature.id}`}>Titre</Label>
                            <Input
                              id={`feature-title-${feature.id}`}
                              value={feature.title}
                              onChange={(e) => handleFeatureUpdate(feature.id, 'title', e.target.value)}
                              className="mt-1"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor={`feature-description-${feature.id}`}>Description</Label>
                            <Textarea
                              id={`feature-description-${feature.id}`}
                              value={feature.description}
                              onChange={(e) => handleFeatureUpdate(feature.id, 'description', e.target.value)}
                              className="mt-1"
                              rows={3}
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor={`feature-color-${feature.id}`}>Couleur</Label>
                            <Input
                              id={`feature-color-${feature.id}`}
                              value={feature.color}
                              onChange={(e) => handleFeatureUpdate(feature.id, 'color', e.target.value)}
                              className="mt-1"
                              placeholder="from-blue-500 to-blue-600"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminHomepageConfig;
