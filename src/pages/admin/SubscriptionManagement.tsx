import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  RefreshCw, 
  Crown, 
  Shield, 
  Lock, 
  Star,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  Settings,
  Eye,
  Copy,
  CheckCircle2,
  XCircle
} from 'lucide-react';

interface SubscriptionPlan {
  id?: string;
  plan_id: string;
  name: string;
  description?: string;
  subtitle?: string;
  price: number;
  currency: string;
  billing_cycle: 'monthly' | 'yearly';
  trial_days: number;
  features: string[];
  icon_name: string;
  color_scheme: string;
  is_popular: boolean;
  is_active: boolean;
  sort_order: number;
  metadata?: Record<string, any>;
}

interface SubscriptionFeature {
  id?: string;
  plan_id?: string;
  feature_name: string;
  feature_description?: string;
  icon_name?: string;
  is_included: boolean;
  sort_order: number;
}

interface SubscriptionTestimonial {
  id?: string;
  plan_id?: string;
  customer_name: string;
  customer_title?: string;
  customer_avatar?: string;
  rating: number;
  testimonial_text: string;
  is_verified: boolean;
  is_active: boolean;
  sort_order: number;
}

interface SubscriptionFAQ {
  id?: string;
  plan_id?: string;
  question: string;
  answer: string;
  category?: string;
  sort_order: number;
  is_active: boolean;
}

export default function SubscriptionManagement() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'plans' | 'features' | 'testimonials' | 'faqs'>('plans');
  const [features, setFeatures] = useState<SubscriptionFeature[]>([]);
  const [testimonials, setTestimonials] = useState<SubscriptionTestimonial[]>([]);
  const [faqs, setFaqs] = useState<SubscriptionFAQ[]>([]);

  const [formData, setFormData] = useState<SubscriptionPlan>({
    plan_id: '',
    name: '',
    description: '',
    subtitle: '',
    price: 0,
    currency: 'XOF',
    billing_cycle: 'monthly',
    trial_days: 0,
    features: [],
    icon_name: 'Crown',
    color_scheme: 'from-yellow-400 to-yellow-600',
    is_popular: false,
    is_active: true,
    sort_order: 0
  });

  const iconOptions = [
    { value: 'Crown', label: 'Couronne', icon: <Crown className="w-4 h-4" /> },
    { value: 'Shield', label: 'Bouclier', icon: <Shield className="w-4 h-4" /> },
    { value: 'Lock', label: 'Cadenas', icon: <Lock className="w-4 h-4" /> },
    { value: 'Star', label: 'Étoile', icon: <Star className="w-4 h-4" /> },
    { value: 'TrendingUp', label: 'Tendance', icon: <TrendingUp className="w-4 h-4" /> },
    { value: 'Users', label: 'Utilisateurs', icon: <Users className="w-4 h-4" /> },
    { value: 'DollarSign', label: 'Dollar', icon: <DollarSign className="w-4 h-4" /> },
    { value: 'Calendar', label: 'Calendrier', icon: <Calendar className="w-4 h-4" /> },
    { value: 'Settings', label: 'Paramètres', icon: <Settings className="w-4 h-4" /> }
  ];

  const colorOptions = [
    { value: 'from-yellow-400 to-yellow-600', label: 'Jaune', preview: 'bg-gradient-to-r from-yellow-400 to-yellow-600' },
    { value: 'from-purple-400 to-purple-600', label: 'Violet', preview: 'bg-gradient-to-r from-purple-400 to-purple-600' },
    { value: 'from-gray-800 to-black', label: 'Noir', preview: 'bg-gradient-to-r from-gray-800 to-black' },
    { value: 'from-blue-400 to-blue-600', label: 'Bleu', preview: 'bg-gradient-to-r from-blue-400 to-blue-600' },
    { value: 'from-green-400 to-green-600', label: 'Vert', preview: 'bg-gradient-to-r from-green-400 to-green-600' },
    { value: 'from-red-400 to-red-600', label: 'Rouge', preview: 'bg-gradient-to-r from-red-400 to-red-600' }
  ];

  useEffect(() => {
    fetchSubscriptionPlans();
    if (selectedPlan) {
      fetchPlanFeatures();
      fetchPlanTestimonials();
      fetchPlanFAQs();
    }
  }, [selectedPlan]);

  const fetchSubscriptionPlans = async () => {
    try {
      const response = await fetch('/api/admin/subscription-plans');
      if (!response.ok) throw new Error('Failed to fetch subscription plans');
      const data = await response.json();
      setPlans(data);
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les plans d\'abonnement',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPlanFeatures = async () => {
    if (!selectedPlan) return;
    try {
      const response = await fetch(`/api/admin/subscription-plans/${selectedPlan.id}/features`);
      if (!response.ok) throw new Error('Failed to fetch features');
      const data = await response.json();
      setFeatures(data);
    } catch (error) {
      console.error('Error fetching features:', error);
    }
  };

  const fetchPlanTestimonials = async () => {
    if (!selectedPlan) return;
    try {
      const response = await fetch(`/api/admin/subscription-plans/${selectedPlan.id}/testimonials`);
      if (!response.ok) throw new Error('Failed to fetch testimonials');
      const data = await response.json();
      setTestimonials(data);
    } catch (error) {
      console.error('Error fetching testimonials:', error);
    }
  };

  const fetchPlanFAQs = async () => {
    if (!selectedPlan) return;
    try {
      const response = await fetch(`/api/admin/subscription-plans/${selectedPlan.id}/faqs`);
      if (!response.ok) throw new Error('Failed to fetch FAQs');
      const data = await response.json();
      setFaqs(data);
    } catch (error) {
      console.error('Error fetching FAQs:', error);
    }
  };

  const saveSubscriptionPlan = async () => {
    setSaving(true);
    try {
      const url = selectedPlan?.id 
        ? `/api/admin/subscription-plans/${selectedPlan.id}`
        : '/api/admin/subscription-plans';
      
      const method = selectedPlan?.id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) throw new Error('Failed to save subscription plan');
      
      toast({
        title: 'Succès',
        description: selectedPlan?.id ? 'Plan mis à jour' : 'Plan créé',
      });
      
      setIsEditDialogOpen(false);
      setSelectedPlan(null);
      fetchSubscriptionPlans();
      resetFormData();
    } catch (error) {
      console.error('Error saving subscription plan:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder le plan d\'abonnement',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteSubscriptionPlan = async (planId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce plan d\'abonnement ?')) return;
    
    try {
      const response = await fetch(`/api/admin/subscription-plans/${planId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete subscription plan');
      
      toast({
        title: 'Succès',
        description: 'Plan d\'abonnement supprimé',
      });
      
      fetchSubscriptionPlans();
      if (selectedPlan?.id === planId) {
        setSelectedPlan(null);
      }
    } catch (error) {
      console.error('Error deleting subscription plan:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le plan d\'abonnement',
        variant: 'destructive'
      });
    }
  };

  const resetFormData = () => {
    setFormData({
      plan_id: '',
      name: '',
      description: '',
      subtitle: '',
      price: 0,
      currency: 'XOF',
      billing_cycle: 'monthly',
      trial_days: 0,
      features: [],
      icon_name: 'Crown',
      color_scheme: 'from-yellow-400 to-yellow-600',
      is_popular: false,
      is_active: true,
      sort_order: 0
    });
  };

  const openEditDialog = (plan?: SubscriptionPlan) => {
    if (plan) {
      setFormData(plan);
      setSelectedPlan(plan);
    } else {
      resetFormData();
      setSelectedPlan(null);
    }
    setIsEditDialogOpen(true);
  };

  const handleFeatureToggle = (feature: string) => {
    const currentFeatures = formData.features || [];
    if (currentFeatures.includes(feature)) {
      setFormData(prev => ({
        ...prev,
        features: currentFeatures.filter(f => f !== feature)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        features: [...currentFeatures, feature]
      }));
    }
  };

  const addFeature = () => {
    const featureName = prompt('Nom de la fonctionnalité:');
    if (featureName) {
      handleFeatureToggle(featureName);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Abonnements</h1>
          <p className="text-muted-foreground">
            Gérez tous les aspects de vos plans d'abonnement
          </p>
        </div>
        <Button onClick={() => openEditDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Nouveau Plan
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Liste des Plans */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Plans d'Abonnement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedPlan?.id === plan.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedPlan(plan)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${plan.color_scheme} flex items-center justify-center`}>
                        {iconOptions.find(opt => opt.value === plan.icon_name)?.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">{plan.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {plan.price.toLocaleString()} {plan.currency}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      {plan.is_popular && <Badge variant="default" className="text-xs">Populaire</Badge>}
                      <div className={`w-2 h-2 rounded-full ${plan.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Détails du Plan */}
        <div className="lg:col-span-3">
          {selectedPlan ? (
            <div className="space-y-6">
              {/* En-tête du Plan */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${selectedPlan.color_scheme} flex items-center justify-center`}>
                        {iconOptions.find(opt => opt.value === selectedPlan.icon_name)?.icon}
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">{selectedPlan.name}</h2>
                        <p className="text-muted-foreground">{selectedPlan.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(selectedPlan)}>
                        <Edit className="w-4 h-4 mr-1" />
                        Modifier
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => deleteSubscriptionPlan(selectedPlan.id!)}>
                        <Trash2 className="w-4 h-4 mr-1" />
                        Supprimer
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label>Prix</Label>
                      <p className="text-2xl font-bold">
                        {selectedPlan.price.toLocaleString()} {selectedPlan.currency}
                      </p>
                    </div>
                    <div>
                      <Label>Cycle de facturation</Label>
                      <p className="text-lg">{selectedPlan.billing_cycle === 'monthly' ? 'Mensuel' : 'Annuel'}</p>
                    </div>
                    <div>
                      <Label>Jours d'essai</Label>
                      <p className="text-lg">{selectedPlan.trial_days} jours</p>
                    </div>
                    <div>
                      <Label>Statut</Label>
                      <div className="flex items-center space-x-2">
                        <Badge variant={selectedPlan.is_active ? 'default' : 'secondary'}>
                          {selectedPlan.is_active ? 'Actif' : 'Inactif'}
                        </Badge>
                        {selectedPlan.is_popular && <Badge variant="outline">Populaire</Badge>}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Onglets */}
              <div className="flex space-x-1 bg-muted p-1 rounded-lg">
                {[
                  { key: 'plans', label: 'Plan', icon: <Settings className="w-4 h-4" /> },
                  { key: 'features', label: 'Fonctionnalités', icon: <CheckCircle2 className="w-4 h-4" /> },
                  { key: 'testimonials', label: 'Témoignages', icon: <Users className="w-4 h-4" /> },
                  { key: 'faqs', label: 'FAQ', icon: <Eye className="w-4 h-4" /> }
                ].map((tab) => (
                  <Button
                    key={tab.key}
                    variant={activeTab === tab.key ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTab(tab.key as any)}
                    className="flex items-center space-x-2"
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </Button>
                ))}
              </div>

              {/* Contenu des Onglets */}
              {activeTab === 'features' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Fonctionnalités du Plan</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {features.map((feature, index) => (
                        <div key={feature.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <h4 className="font-semibold">{feature.feature_name}</h4>
                            <p className="text-sm text-muted-foreground">{feature.feature_description}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={feature.is_included ? 'default' : 'secondary'}>
                              {feature.is_included ? 'Inclus' : 'Non inclus'}
                            </Badge>
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      <Button onClick={addFeature} className="w-full">
                        <Plus className="w-4 h-4 mr-2" />
                        Ajouter une fonctionnalité
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeTab === 'testimonials' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Témoignages</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {testimonials.map((testimonial, index) => (
                        <div key={testimonial.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <h4 className="font-semibold">{testimonial.customer_name}</h4>
                            <p className="text-sm text-muted-foreground">{testimonial.customer_title}</p>
                            <div className="flex items-center space-x-1 mt-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < testimonial.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={testimonial.is_verified ? 'default' : 'secondary'}>
                              {testimonial.is_verified ? 'Vérifié' : 'Non vérifié'}
                            </Badge>
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      <Button className="w-full">
                        <Plus className="w-4 h-4 mr-2" />
                        Ajouter un témoignage
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeTab === 'faqs' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Questions Fréquentes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {faqs.map((faq, index) => (
                        <div key={faq.id} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold">{faq.question}</h4>
                            <div className="flex items-center space-x-2">
                              <Badge variant={faq.is_active ? 'default' : 'secondary'}>
                                {faq.is_active ? 'Actif' : 'Inactif'}
                              </Badge>
                              <Button variant="outline" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">{faq.answer}</p>
                        </div>
                      ))}
                      <Button className="w-full">
                        <Plus className="w-4 h-4 mr-2" />
                        Ajouter une FAQ
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Settings className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Sélectionnez un plan</h3>
                  <p className="text-muted-foreground">
                    Choisissez un plan d'abonnement pour voir et modifier ses détails
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Dialogue d'Édition */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedPlan?.id ? 'Modifier le Plan' : 'Nouveau Plan d\'Abonnement'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Informations de base */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="plan_id">ID du Plan</Label>
                <Input
                  id="plan_id"
                  value={formData.plan_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, plan_id: e.target.value }))}
                  placeholder="majestic_access"
                />
              </div>
              <div>
                <Label htmlFor="name">Nom du Plan</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Majestic Access"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="subtitle">Sous-titre</Label>
              <Input
                id="subtitle"
                value={formData.subtitle}
                onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                placeholder="Accès Premium aux services exclusifs"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Description détaillée du plan..."
                rows={3}
              />
            </div>

            {/* Prix et Facturation */}
            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label htmlFor="price">Prix</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  placeholder="327323"
                />
              </div>
              <div>
                <Label htmlFor="currency">Devise</Label>
                <Select value={formData.currency} onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}>
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
              <div>
                <Label htmlFor="billing_cycle">Cycle</Label>
                <Select value={formData.billing_cycle} onValueChange={(value: any) => setFormData(prev => ({ ...prev, billing_cycle: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Mensuel</SelectItem>
                    <SelectItem value="yearly">Annuel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="trial_days">Jours d'essai</Label>
                <Input
                  id="trial_days"
                  type="number"
                  value={formData.trial_days}
                  onChange={(e) => setFormData(prev => ({ ...prev, trial_days: parseInt(e.target.value) || 0 }))}
                  placeholder="7"
                />
              </div>
            </div>

            {/* Apparence */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Icône</Label>
                <Select value={formData.icon_name} onValueChange={(value) => setFormData(prev => ({ ...prev, icon_name: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {iconOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center space-x-2">
                          {option.icon}
                          <span>{option.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Schéma de couleurs</Label>
                <Select value={formData.color_scheme} onValueChange={(value) => setFormData(prev => ({ ...prev, color_scheme: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {colorOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center space-x-2">
                          <div className={`w-4 h-4 rounded ${option.preview}`} />
                          <span>{option.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Options */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_popular"
                  checked={formData.is_popular}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_popular: checked }))}
                />
                <Label htmlFor="is_popular">Plan populaire</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="is_active">Plan actif</Label>
              </div>
            </div>

            {/* Fonctionnalités */}
            <div>
              <Label>Fonctionnalités</Label>
              <div className="space-y-2 mt-2">
                {formData.features.map((feature, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <span>{feature}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFeatureToggle(feature)}
                    >
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button onClick={addFeature} variant="outline" className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter une fonctionnalité
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={saveSubscriptionPlan} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Sauvegarde...' : 'Sauvegarder'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
