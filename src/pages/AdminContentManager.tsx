import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useContentManagement, PageSection, CustomizablePlan, Testimonial, ValueProposition } from '@/hooks/useContentManagement';
import { 
  Settings, 
  Type, 
  Palette, 
  Layout, 
  MessageSquare, 
  Star, 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  X,
  MoveUp,
  MoveDown
} from 'lucide-react';

const AdminContentManager = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    loading,
    error,
    pageSections,
    customizablePlans,
    testimonials,
    valuePropositions,
    globalSettings,
    updatePageSection,
    updateCustomizablePlan,
    updateTestimonial,
    updateValueProposition,
    updateGlobalSetting,
    getGlobalSetting
  } = useContentManagement();

  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editingPlan, setEditingPlan] = useState<string | null>(null);
  const [editingTestimonial, setEditingTestimonial] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string | null>(null);

  // Form states
  const [sectionForm, setSectionForm] = useState<Partial<PageSection>>({});
  const [planForm, setPlanForm] = useState<Partial<CustomizablePlan>>({});
  const [testimonialForm, setTestimonialForm] = useState<Partial<Testimonial>>({});
  const [valueForm, setValueForm] = useState<Partial<ValueProposition>>({});

  const colorOptions = [
    { value: 'black', label: 'Noir', class: 'bg-black' },
    { value: 'primary', label: 'Primaire', class: 'bg-primary' },
    { value: 'secondary', label: 'Secondaire', class: 'bg-secondary' },
    { value: 'white', label: 'Blanc', class: 'bg-white border' },
    { value: 'gray', label: 'Gris', class: 'bg-gray-500' },
  ];

  const iconOptions = [
    'Crown', 'Zap', 'Shield', 'Star', 'Heart', 'MessageCircle', 'Phone', 'Mail', 'Calendar', 'CreditCard'
  ];

  const handleSectionUpdate = async (id: string) => {
    try {
      await updatePageSection(id, sectionForm);
      setEditingSection(null);
      setSectionForm({});
      toast({
        title: 'Section mise à jour',
        description: 'Les modifications ont été enregistrées avec succès.',
      });
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handlePlanUpdate = async (id: string) => {
    try {
      await updateCustomizablePlan(id, planForm);
      setEditingPlan(null);
      setPlanForm({});
      toast({
        title: 'Plan mis à jour',
        description: 'Les modifications ont été enregistrées avec succès.',
      });
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleTestimonialUpdate = async (id: string) => {
    try {
      await updateTestimonial(id, testimonialForm);
      setEditingTestimonial(null);
      setTestimonialForm({});
      toast({
        title: 'Témoignage mis à jour',
        description: 'Les modifications ont été enregistrées avec succès.',
      });
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleValueUpdate = async (id: string) => {
    try {
      await updateValueProposition(id, valueForm);
      setEditingValue(null);
      setValueForm({});
      toast({
        title: 'Valeur mise à jour',
        description: 'Les modifications ont été enregistrées avec succès.',
      });
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleGlobalSettingUpdate = async (key: string, value: string) => {
    try {
      await updateGlobalSetting(key, value);
      toast({
        title: 'Paramètre mis à jour',
        description: 'Le paramètre a été enregistré avec succès.',
      });
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-black mb-2">Gestion du Contenu</h1>
            <p className="text-gray-700">Modifiez le contenu, les couleurs et les textes de votre site</p>
          </div>
          <Button 
            onClick={() => navigate('/admin')}
            className="bg-black hover:bg-gray-800 text-white"
          >
            Retour Admin
          </Button>
        </div>

        <Tabs defaultValue="sections" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="sections">Sections</TabsTrigger>
            <TabsTrigger value="plans">Plans d'Abonnement</TabsTrigger>
            <TabsTrigger value="testimonials">Témoignages</TabsTrigger>
            <TabsTrigger value="values">Valeurs</TabsTrigger>
            <TabsTrigger value="settings">Paramètres Globaux</TabsTrigger>
          </TabsList>

          {/* Page Sections */}
          <TabsContent value="sections">
            <div className="space-y-4">
              {pageSections.map((section) => (
                <Card key={section.id} className="border-2 border-gray-300">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-bold text-black">
                        {section.page_key} - {section.section_key}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={section.is_visible}
                          onCheckedChange={(checked) => 
                            handleSectionUpdate(section.id, { is_visible: checked })
                          }
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingSection(editingSection === section.id ? null : section.id)}
                        >
                          {editingSection === section.id ? <X className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  {editingSection === section.id && (
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`title-${section.id}`}>Titre</Label>
                          <Input
                            id={`title-${section.id}`}
                            value={sectionForm.title ?? section.title ?? ''}
                            onChange={(e) => setSectionForm({ ...sectionForm, title: e.target.value })}
                            placeholder="Titre de la section"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`subtitle-${section.id}`}>Sous-titre</Label>
                          <Input
                            id={`subtitle-${section.id}`}
                            value={sectionForm.subtitle ?? section.subtitle ?? ''}
                            onChange={(e) => setSectionForm({ ...sectionForm, subtitle: e.target.value })}
                            placeholder="Sous-titre de la section"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`button-text-${section.id}`}>Texte du bouton</Label>
                          <Input
                            id={`button-text-${section.id}`}
                            value={sectionForm.button_text ?? section.button_text ?? ''}
                            onChange={(e) => setSectionForm({ ...sectionForm, button_text: e.target.value })}
                            placeholder="Texte du bouton"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`text-color-${section.id}`}>Couleur du texte</Label>
                          <Select
                            value={sectionForm.text_color ?? section.text_color}
                            onValueChange={(value) => setSectionForm({ ...sectionForm, text_color: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {colorOptions.map((color) => (
                                <SelectItem key={color.value} value={color.value}>
                                  <div className="flex items-center gap-2">
                                    <div className={`w-4 h-4 rounded ${color.class}`}></div>
                                    {color.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor={`description-${section.id}`}>Description</Label>
                        <Textarea
                          id={`description-${section.id}`}
                          value={sectionForm.description ?? section.description ?? ''}
                          onChange={(e) => setSectionForm({ ...sectionForm, description: e.target.value })}
                          placeholder="Description de la section"
                          rows={3}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => handleSectionUpdate(section.id)}>
                          <Save className="w-4 h-4 mr-2" />
                          Sauvegarder
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setEditingSection(null);
                            setSectionForm({});
                          }}
                        >
                          Annuler
                        </Button>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Customizable Plans */}
          <TabsContent value="plans">
            <div className="space-y-4">
              {customizablePlans.map((plan) => (
                <Card key={plan.id} className="border-2 border-gray-300">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-bold text-black">
                        {plan.name}
                        {plan.is_popular && <Badge className="ml-2 bg-black text-white">Populaire</Badge>}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={plan.is_visible}
                          onCheckedChange={(checked) => 
                            handlePlanUpdate(plan.id, { is_visible: checked })
                          }
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingPlan(editingPlan === plan.id ? null : plan.id)}
                        >
                          {editingPlan === plan.id ? <X className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  {editingPlan === plan.id && (
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`plan-name-${plan.id}`}>Nom du plan</Label>
                          <Input
                            id={`plan-name-${plan.id}`}
                            value={planForm.name ?? plan.name}
                            onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`plan-price-${plan.id}`}>Prix</Label>
                          <Input
                            id={`plan-price-${plan.id}`}
                            value={planForm.price ?? plan.price}
                            onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`plan-color-${plan.id}`}>Couleur du thème</Label>
                          <Select
                            value={planForm.color_scheme ?? plan.color_scheme}
                            onValueChange={(value) => setPlanForm({ ...planForm, color_scheme: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {colorOptions.map((color) => (
                                <SelectItem key={color.value} value={color.value}>
                                  <div className="flex items-center gap-2">
                                    <div className={`w-4 h-4 rounded ${color.class}`}></div>
                                    {color.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={planForm.is_popular ?? plan.is_popular}
                            onCheckedChange={(checked) => setPlanForm({ ...planForm, is_popular: checked })}
                          />
                          <Label>Plan populaire</Label>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor={`plan-description-${plan.id}`}>Description</Label>
                        <Textarea
                          id={`plan-description-${plan.id}`}
                          value={planForm.description ?? plan.description ?? ''}
                          onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                          rows={2}
                        />
                      </div>
                      <div>
                        <Label>Caractéristiques (une par ligne)</Label>
                        <Textarea
                          value={planForm.features?.join('\n') ?? plan.features.join('\n')}
                          onChange={(e) => setPlanForm({ 
                            ...planForm, 
                            features: e.target.value.split('\n').filter(f => f.trim()) 
                          })}
                          rows={4}
                          placeholder="Caractéristique 1&#10;Caractéristique 2&#10;Caractéristique 3"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => handlePlanUpdate(plan.id)}>
                          <Save className="w-4 h-4 mr-2" />
                          Sauvegarder
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setEditingPlan(null);
                            setPlanForm({});
                          }}
                        >
                          Annuler
                        </Button>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Testimonials */}
          <TabsContent value="testimonials">
            <div className="space-y-4">
              {testimonials.map((testimonial) => (
                <Card key={testimonial.id} className="border-2 border-gray-300">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-bold text-black">
                        {testimonial.name} - {testimonial.role}
                        <div className="flex ml-2">
                          {[...Array(testimonial.rating)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 text-black fill-current" />
                          ))}
                        </div>
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={testimonial.is_visible}
                          onCheckedChange={(checked) => 
                            handleTestimonialUpdate(testimonial.id, { is_visible: checked })
                          }
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingTestimonial(editingTestimonial === testimonial.id ? null : testimonial.id)}
                        >
                          {editingTestimonial === testimonial.id ? <X className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  {editingTestimonial === testimonial.id && (
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`testimonial-name-${testimonial.id}`}>Nom</Label>
                          <Input
                            id={`testimonial-name-${testimonial.id}`}
                            value={testimonialForm.name ?? testimonial.name}
                            onChange={(e) => setTestimonialForm({ ...testimonialForm, name: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`testimonial-role-${testimonial.id}`}>Rôle</Label>
                          <Input
                            id={`testimonial-role-${testimonial.id}`}
                            value={testimonialForm.role ?? testimonial.role ?? ''}
                            onChange={(e) => setTestimonialForm({ ...testimonialForm, role: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`testimonial-rating-${testimonial.id}`}>Note</Label>
                          <Select
                            value={String(testimonialForm.rating ?? testimonial.rating)}
                            onValueChange={(value) => setTestimonialForm({ ...testimonialForm, rating: parseInt(value) })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {[1, 2, 3, 4, 5].map((rating) => (
                                <SelectItem key={rating} value={String(rating)}>
                                  <div className="flex items-center gap-2">
                                    {[...Array(rating)].map((_, i) => (
                                      <Star key={i} className="w-4 h-4 text-black fill-current" />
                                    ))}
                                    {rating}/5
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor={`testimonial-content-${testimonial.id}`}>Témoignage</Label>
                        <Textarea
                          id={`testimonial-content-${testimonial.id}`}
                          value={testimonialForm.content ?? testimonial.content}
                          onChange={(e) => setTestimonialForm({ ...testimonialForm, content: e.target.value })}
                          rows={3}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => handleTestimonialUpdate(testimonial.id)}>
                          <Save className="w-4 h-4 mr-2" />
                          Sauvegarder
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setEditingTestimonial(null);
                            setTestimonialForm({});
                          }}
                        >
                          Annuler
                        </Button>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Value Propositions */}
          <TabsContent value="values">
            <div className="space-y-4">
              {valuePropositions.map((value) => (
                <Card key={value.id} className="border-2 border-gray-300">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-bold text-black">
                        {value.title}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={value.is_visible}
                          onCheckedChange={(checked) => 
                            handleValueUpdate(value.id, { is_visible: checked })
                          }
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingValue(editingValue === value.id ? null : value.id)}
                        >
                          {editingValue === value.id ? <X className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  {editingValue === value.id && (
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`value-icon-${value.id}`}>Icône</Label>
                          <Select
                            value={valueForm.icon_name ?? value.icon_name}
                            onValueChange={(value) => setValueForm({ ...valueForm, icon_name: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {iconOptions.map((icon) => (
                                <SelectItem key={icon} value={icon}>
                                  {icon}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor={`value-color-${value.id}`}>Couleur</Label>
                          <Select
                            value={valueForm.color_scheme ?? value.color_scheme}
                            onValueChange={(value) => setValueForm({ ...valueForm, color_scheme: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {colorOptions.map((color) => (
                                <SelectItem key={color.value} value={color.value}>
                                  <div className="flex items-center gap-2">
                                    <div className={`w-4 h-4 rounded ${color.class}`}></div>
                                    {color.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor={`value-title-${value.id}`}>Titre</Label>
                        <Input
                          id={`value-title-${value.id}`}
                          value={valueForm.title ?? value.title}
                          onChange={(e) => setValueForm({ ...valueForm, title: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`value-description-${value.id}`}>Description</Label>
                        <Textarea
                          id={`value-description-${value.id}`}
                          value={valueForm.description ?? value.description}
                          onChange={(e) => setValueForm({ ...valueForm, description: e.target.value })}
                          rows={2}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => handleValueUpdate(value.id)}>
                          <Save className="w-4 h-4 mr-2" />
                          Sauvegarder
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setEditingValue(null);
                            setValueForm({});
                          }}
                        >
                          Annuler
                        </Button>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Global Settings */}
          <TabsContent value="settings">
            <div className="space-y-4">
              {globalSettings.map((setting) => (
                <Card key={setting.id} className="border-2 border-gray-300">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold text-black">
                      {setting.setting_key}
                    </CardTitle>
                    {setting.description && (
                      <p className="text-sm text-gray-600">{setting.description}</p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      {setting.setting_type === 'boolean' ? (
                        <Switch
                          checked={setting.setting_value === 'true'}
                          onCheckedChange={(checked) => 
                            handleGlobalSettingUpdate(setting.setting_key, String(checked))
                          }
                        />
                      ) : setting.setting_type === 'color' ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="color"
                            value={setting.setting_value}
                            onChange={(e) => 
                              handleGlobalSettingUpdate(setting.setting_key, e.target.value)
                            }
                            className="w-20 h-10"
                          />
                          <Input
                            value={setting.setting_value}
                            onChange={(e) => 
                              handleGlobalSettingUpdate(setting.setting_key, e.target.value)
                            }
                            placeholder="#000000"
                          />
                        </div>
                      ) : (
                        <Input
                          value={setting.setting_value}
                          onChange={(e) => 
                            handleGlobalSettingUpdate(setting.setting_key, e.target.value)
                          }
                          placeholder={setting.description}
                        />
                      )}
                      <Badge variant="outline">{setting.setting_type}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminContentManager;
