import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Globe, 
  MapPin, 
  Phone, 
  Mail, 
  Users,
  Star,
  ArrowRight,
  Shield,
  Crown,
  Plane,
  Building,
  Car,
  Calendar,
  Hotel,
  Anchor,
  Sparkles,
  TrendingUp,
  Award,
  Headphones,
  CheckCircle,
  Save,
  Edit,
  Plus,
  X,
  Upload,
  Image as ImageIcon
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BossizSite {
  id: string;
  title: string;
  subtitle: string;
  tagline: string;
  description: string;
  location: string;
  image: string;
  features: string[];
  color: string;
  bgColor: string;
  borderColor: string;
  stats: Array<{
    value: string;
    label: string;
    icon: React.ReactNode;
  }>;
  contact: {
    phone: string;
    email: string;
    address: string;
  };
  highlights: string[];
  route: string;
}

const AdminBossizSites = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("cote-divoire");
  const [editingField, setEditingField] = useState<string | null>(null);
  const [bossizSites, setBossizSites] = useState<BossizSite[]>([
    {
      id: 'cote-d-ivoire',
      title: 'Bossiz Côte d\'Ivoire',
      subtitle: 'Excellence en Conciergerie',
      tagline: 'L\'élégance ivoirienne au service de l\'excellence',
      description: 'Découvrez une expérience de conciergerie unique en Côte d\'Ivoire, où tradition et modernité se rencontrent pour offrir des services d\'exception.',
      location: 'Abidjan, Yamoussoukro, San Pedro',
      image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      features: [
        'Voyages & Tourisme Premium',
        'Immobilier de Luxe',
        'Transport VIP & Jets Privés',
        'Événements Corporatifs',
        'Services Personnalisés',
        'Assistance 24/7',
        'Gastronomie & Bien-être',
        'Shopping Privé'
      ],
      color: 'from-orange-600 to-red-600',
      bgColor: 'from-orange-50 via-white to-red-50',
      borderColor: 'border-orange-200',
      stats: [
        { value: '15+', label: 'Années d\'Excellence', icon: <Award className="w-5 h-5" /> },
        { value: '5000+', label: 'Clients Satisfaits', icon: <Users className="w-5 h-5" /> },
        { value: '1000+', label: 'Partenaires Premium', icon: <Globe className="w-5 h-5" /> },
        { value: '98%', label: 'Satisfaction', icon: <Star className="w-5 h-5" /> }
      ],
      contact: {
        phone: '+225 XX XX XX XX',
        email: 'ci@bossiz.com',
        address: 'Abidjan, Plateau - Tour BOSSIZ'
      },
      highlights: [
        'Expertise locale approfondie',
        'Réseau exclusif de partenaires',
        'Services sur-mesure',
        'Discrétion absolue'
      ],
      route: '/bossiz-conciergerie-ci'
    },
    {
      id: 'senegal',
      title: 'Bossiz Sénégal',
      subtitle: 'Conciergerie d\'Exception',
      tagline: 'La tradition sénégalaise au service du luxe',
      description: 'Vivez une expérience de conciergerie d\'exception au Sénégal, alliant savoir-faire local et standards internationaux pour des services inégalés.',
      location: 'Dakar, Thiès, Saint-Louis',
      image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      features: [
        'Voyages d\'Affaires',
        'Gestion Immobilière',
        'Transport Premium',
        'Organisation d\'Événements',
        'Services aux Entreprises',
        'Conciergerie Digitale',
        'Bien-être & Loisirs',
        'Shopping Premium'
      ],
      color: 'from-green-600 to-blue-600',
      bgColor: 'from-green-50 via-white to-blue-50',
      borderColor: 'border-green-200',
      stats: [
        { value: '10+', label: 'Années d\'Expertise', icon: <Award className="w-5 h-5" /> },
        { value: '3000+', label: 'Clients Satisfaits', icon: <Users className="w-5 h-5" /> },
        { value: '800+', label: 'Partenaires Premium', icon: <Globe className="w-5 h-5" /> },
        { value: '97%', label: 'Satisfaction', icon: <Star className="w-5 h-5" /> }
      ],
      contact: {
        phone: '+221 XX XX XX XX',
        email: 'sn@bossiz.com',
        address: 'Dakar, Plateau - Centre BOSSIZ'
      },
      highlights: [
        'Innovation technologique',
        'Approche client personnalisée',
        'Services intégrés',
        'Excellence opérationnelle'
      ],
      route: '/bossiz-conciergerie-sn'
    }
  ]);

  useEffect(() => {
    // Simuler le chargement des données
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  const handleFieldEdit = (siteId: string, field: string, value: any) => {
    setBossizSites(prev => prev.map(site => 
      site.id === siteId ? { ...site, [field]: value } : site
    ));
  };

  const handleNestedFieldEdit = (siteId: string, parentField: string, childField: string, value: any) => {
    setBossizSites(prev => prev.map(site => 
      site.id === siteId 
        ? { ...site, [parentField]: { ...site[parentField as keyof BossizSite], [childField]: value } }
        : site
    ));
  };

  const handleArrayFieldEdit = (siteId: string, field: string, index: number, value: string) => {
    setBossizSites(prev => prev.map(site => 
      site.id === siteId 
        ? { ...site, [field]: site[field as keyof BossizSite].map((item: string, i: number) => i === index ? value : item) }
        : site
    ));
  };

  const addArrayItem = (siteId: string, field: string, newItem: string) => {
    setBossizSites(prev => prev.map(site => 
      site.id === siteId 
        ? { ...site, [field]: [...(site[field as keyof BossizSite] as string[]), newItem] }
        : site
    ));
  };

  const removeArrayItem = (siteId: string, field: string, index: number) => {
    setBossizSites(prev => prev.map(site => 
      site.id === siteId 
        ? { ...site, [field]: (site[field as keyof BossizSite] as string[]).filter((_, i) => i !== index) }
        : site
    ));
  };

  const handleSave = () => {
    // Simuler la sauvegarde
    toast({
      title: "Modifications enregistrées",
      description: "Les informations des sites Bossiz ont été mises à jour avec succès.",
    });
  };

  const currentSite = bossizSites.find(site => site.id === activeTab);

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
            <h1 className="text-3xl font-bold tracking-tight">Gestion des Sites Bossiz</h1>
            <p className="text-muted-foreground">
              Modifiez les informations des sites Bossiz Côte d'Ivoire et Sénégal
            </p>
          </div>
          <Button onClick={handleSave} className="gap-2">
            <Save className="w-4 h-4" />
            Enregistrer les modifications
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="cote-divoire" className="gap-2">
              <MapPin className="w-4 h-4" />
              Bossiz Côte d'Ivoire
            </TabsTrigger>
            <TabsTrigger value="senegal" className="gap-2">
              <Anchor className="w-4 h-4" />
              Bossiz Sénégal
            </TabsTrigger>
          </TabsList>

          {bossizSites.map((site) => (
            <TabsContent key={site.id} value={site.id} className="space-y-6">
              {/* Informations principales */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    Informations principales
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`title-${site.id}`}>Titre</Label>
                      <Input
                        id={`title-${site.id}`}
                        value={site.title}
                        onChange={(e) => handleFieldEdit(site.id, 'title', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`subtitle-${site.id}`}>Sous-titre</Label>
                      <Input
                        id={`subtitle-${site.id}`}
                        value={site.subtitle}
                        onChange={(e) => handleFieldEdit(site.id, 'subtitle', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor={`tagline-${site.id}`}>Tagline</Label>
                    <Input
                      id={`tagline-${site.id}`}
                      value={site.tagline}
                      onChange={(e) => handleFieldEdit(site.id, 'tagline', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`description-${site.id}`}>Description</Label>
                    <Textarea
                      id={`description-${site.id}`}
                      value={site.description}
                      onChange={(e) => handleFieldEdit(site.id, 'description', e.target.value)}
                      className="mt-1"
                      rows={4}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`location-${site.id}`}>Localisation</Label>
                    <Input
                      id={`location-${site.id}`}
                      value={site.location}
                      onChange={(e) => handleFieldEdit(site.id, 'location', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`image-${site.id}`}>URL de l'image</Label>
                    <Input
                      id={`image-${site.id}`}
                      value={site.image}
                      onChange={(e) => handleFieldEdit(site.id, 'image', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Contact */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="w-5 h-5" />
                    Informations de contact
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`phone-${site.id}`}>Téléphone</Label>
                      <Input
                        id={`phone-${site.id}`}
                        value={site.contact.phone}
                        onChange={(e) => handleNestedFieldEdit(site.id, 'contact', 'phone', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`email-${site.id}`}>Email</Label>
                      <Input
                        id={`email-${site.id}`}
                        value={site.contact.email}
                        onChange={(e) => handleNestedFieldEdit(site.id, 'contact', 'email', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor={`address-${site.id}`}>Adresse</Label>
                    <Input
                      id={`address-${site.id}`}
                      value={site.contact.address}
                      onChange={(e) => handleNestedFieldEdit(site.id, 'contact', 'address', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Services */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="w-5 h-5" />
                    Services
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {site.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          value={feature}
                          onChange={(e) => handleArrayFieldEdit(site.id, 'features', index, e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => removeArrayItem(site.id, 'features', index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      onClick={() => addArrayItem(site.id, 'features', 'Nouveau service')}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Ajouter un service
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Points forts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5" />
                    Points forts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {site.highlights.map((highlight, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          value={highlight}
                          onChange={(e) => handleArrayFieldEdit(site.id, 'highlights', index, e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => removeArrayItem(site.id, 'highlights', index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      onClick={() => addArrayItem(site.id, 'highlights', 'Nouveau point fort')}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Ajouter un point fort
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Statistiques */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Statistiques
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {site.stats.map((stat, index) => (
                      <div key={index} className="space-y-2">
                        <Label>Statistique {index + 1}</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            placeholder="Valeur"
                            value={stat.value}
                            onChange={(e) => {
                              const newStats = [...site.stats];
                              newStats[index] = { ...newStats[index], value: e.target.value };
                              handleFieldEdit(site.id, 'stats', newStats);
                            }}
                          />
                          <Input
                            placeholder="Label"
                            value={stat.label}
                            onChange={(e) => {
                              const newStats = [...site.stats];
                              newStats[index] = { ...newStats[index], label: e.target.value };
                              handleFieldEdit(site.id, 'stats', newStats);
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Apparence */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Apparence
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`color-${site.id}`}>Couleur principale</Label>
                      <Input
                        id={`color-${site.id}`}
                        value={site.color}
                        onChange={(e) => handleFieldEdit(site.id, 'color', e.target.value)}
                        className="mt-1"
                        placeholder="from-orange-600 to-red-600"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`bgColor-${site.id}`}>Couleur de fond</Label>
                      <Input
                        id={`bgColor-${site.id}`}
                        value={site.bgColor}
                        onChange={(e) => handleFieldEdit(site.id, 'bgColor', e.target.value)}
                        className="mt-1"
                        placeholder="from-orange-50 via-white to-red-50"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Aperçu */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="w-5 h-5" />
                    Aperçu du site
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`w-12 h-12 bg-gradient-to-br ${site.color} rounded-xl flex items-center justify-center text-white`}>
                        <Globe className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">{site.title}</h3>
                        <p className="text-gray-600">{site.subtitle}</p>
                      </div>
                    </div>
                    <p className="text-gray-700 mb-4">{site.description}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{site.location}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminBossizSites;
