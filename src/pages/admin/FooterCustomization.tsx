import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { 
  Palette, 
  Eye, 
  Save, 
  RefreshCw, 
  Upload,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Mail,
  Phone,
  MapPin,
  Globe
} from 'lucide-react';

interface FooterSettings {
  id?: string;
  background_color: string;
  text_color: string;
  link_color: string;
  link_hover_color: string;
  border_color: string;
  logo_url?: string;
  company_name: string;
  description?: string;
  social_links: Record<string, string>;
  contact_info: Record<string, string>;
  quick_links: Record<string, string>;
  legal_links: Record<string, string>;
  newsletter_text?: string;
  copyright_text: string;
  is_active: boolean;
}

export default function FooterCustomization() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [settings, setSettings] = useState<FooterSettings>({
    background_color: '#1f2937',
    text_color: '#ffffff',
    link_color: '#60a5fa',
    link_hover_color: '#3b82f6',
    border_color: '#374151',
    company_name: 'Bossiz Conciergerie',
    description: 'Votre partenaire de confiance pour des services de conciergerie premium et exclusifs',
    social_links: {
      facebook: 'https://facebook.com/bossiz',
      twitter: 'https://twitter.com/bossiz',
      instagram: 'https://instagram.com/bossiz',
      linkedin: 'https://linkedin.com/company/bossiz'
    },
    contact_info: {
      phone: '+225 07 00 00 00 00',
      email: 'contact@bossiz.com',
      address: 'Abidjan, Côte d\'Ivoire'
    },
    quick_links: {
      services: 'Services',
      about: 'À propos',
      blog: 'Blog',
      careers: 'Carrières'
    },
    legal_links: {
      privacy: 'Politique de confidentialité',
      terms: 'Conditions d\'utilisation',
      cookies: 'Politique de cookies'
    },
    newsletter_text: 'Abonnez-vous à notre newsletter pour recevoir les dernières actualités',
    copyright_text: '© 2024 Bossiz Conciergerie. Tous droits réservés.',
    is_active: true
  });

  useEffect(() => {
    fetchFooterSettings();
  }, []);

  const fetchFooterSettings = async () => {
    try {
      const response = await fetch('/api/admin/footer-settings');
      if (!response.ok) throw new Error('Failed to fetch footer settings');
      const data = await response.json();
      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching footer settings:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les paramètres du footer',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const saveFooterSettings = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/footer-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });
      
      if (!response.ok) throw new Error('Failed to save footer settings');
      
      toast({
        title: 'Succès',
        description: 'Les paramètres du footer ont été sauvegardés',
      });
    } catch (error) {
      console.error('Error saving footer settings:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder les paramètres du footer',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleColorChange = (field: keyof FooterSettings, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSocialLinkChange = (platform: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      social_links: { ...prev.social_links, [platform]: value }
    }));
  };

  const handleContactInfoChange = (field: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      contact_info: { ...prev.contact_info, [field]: value }
    }));
  };

  const handleQuickLinkChange = (key: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      quick_links: { ...prev.quick_links, [key]: value }
    }));
  };

  const handleLegalLinkChange = (key: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      legal_links: { ...prev.legal_links, [key]: value }
    }));
  };

  const resetToDefaults = () => {
    setSettings({
      background_color: '#1f2937',
      text_color: '#ffffff',
      link_color: '#60a5fa',
      link_hover_color: '#3b82f6',
      border_color: '#374151',
      company_name: 'Bossiz Conciergerie',
      description: 'Votre partenaire de confiance pour des services de conciergerie premium et exclusifs',
      social_links: {
        facebook: 'https://facebook.com/bossiz',
        twitter: 'https://twitter.com/bossiz',
        instagram: 'https://instagram.com/bossiz',
        linkedin: 'https://linkedin.com/company/bossiz'
      },
      contact_info: {
        phone: '+225 07 00 00 00 00',
        email: 'contact@bossiz.com',
        address: 'Abidjan, Côte d\'Ivoire'
      },
      quick_links: {
        services: 'Services',
        about: 'À propos',
        blog: 'Blog',
        careers: 'Carrières'
      },
      legal_links: {
        privacy: 'Politique de confidentialité',
        terms: 'Conditions d\'utilisation',
        cookies: 'Politique de cookies'
      },
      newsletter_text: 'Abonnez-vous à notre newsletter pour recevoir les dernières actualités',
      copyright_text: '© 2024 Bossiz Conciergerie. Tous droits réservés.',
      is_active: true
    });
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
          <h1 className="text-3xl font-bold">Personnalisation du Footer</h1>
          <p className="text-muted-foreground">
            Personnalisez l'apparence et le contenu du footer de manière indépendante
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setPreviewMode(!previewMode)}
            className="flex items-center space-x-2"
          >
            <Eye className="w-4 h-4" />
            <span>{previewMode ? 'Mode Édition' : 'Aperçu'}</span>
          </Button>
          <Button
            variant="outline"
            onClick={resetToDefaults}
            className="flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Réinitialiser</span>
          </Button>
          <Button
            onClick={saveFooterSettings}
            disabled={saving}
            className="flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Sauvegarde...' : 'Sauvegarder'}</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Paramètres de Couleurs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Palette className="w-5 h-5" />
              <span>Couleurs du Footer</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="background_color">Couleur de fond</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="background_color"
                    type="color"
                    value={settings.background_color}
                    onChange={(e) => handleColorChange('background_color', e.target.value)}
                    className="w-12 h-12 p-1"
                  />
                  <Input
                    value={settings.background_color}
                    onChange={(e) => handleColorChange('background_color', e.target.value)}
                    placeholder="#1f2937"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="text_color">Couleur du texte</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="text_color"
                    type="color"
                    value={settings.text_color}
                    onChange={(e) => handleColorChange('text_color', e.target.value)}
                    className="w-12 h-12 p-1"
                  />
                  <Input
                    value={settings.text_color}
                    onChange={(e) => handleColorChange('text_color', e.target.value)}
                    placeholder="#ffffff"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="link_color">Couleur des liens</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="link_color"
                    type="color"
                    value={settings.link_color}
                    onChange={(e) => handleColorChange('link_color', e.target.value)}
                    className="w-12 h-12 p-1"
                  />
                  <Input
                    value={settings.link_color}
                    onChange={(e) => handleColorChange('link_color', e.target.value)}
                    placeholder="#60a5fa"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="link_hover_color">Couleur au survol</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="link_hover_color"
                    type="color"
                    value={settings.link_hover_color}
                    onChange={(e) => handleColorChange('link_hover_color', e.target.value)}
                    className="w-12 h-12 p-1"
                  />
                  <Input
                    value={settings.link_hover_color}
                    onChange={(e) => handleColorChange('link_hover_color', e.target.value)}
                    placeholder="#3b82f6"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="border_color">Couleur des bordures</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="border_color"
                    type="color"
                    value={settings.border_color}
                    onChange={(e) => handleColorChange('border_color', e.target.value)}
                    className="w-12 h-12 p-1"
                  />
                  <Input
                    value={settings.border_color}
                    onChange={(e) => handleColorChange('border_color', e.target.value)}
                    placeholder="#374151"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informations de l'Entreprise */}
        <Card>
          <CardHeader>
            <CardTitle>Informations de l'Entreprise</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="company_name">Nom de l'entreprise</Label>
              <Input
                id="company_name"
                value={settings.company_name}
                onChange={(e) => handleColorChange('company_name', e.target.value)}
                placeholder="Bossiz Conciergerie"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={settings.description}
                onChange={(e) => handleColorChange('description', e.target.value)}
                placeholder="Votre partenaire de confiance pour des services de conciergerie premium et exclusifs"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="copyright_text">Texte de copyright</Label>
              <Input
                id="copyright_text"
                value={settings.copyright_text}
                onChange={(e) => handleColorChange('copyright_text', e.target.value)}
                placeholder="© 2024 Bossiz Conciergerie. Tous droits réservés."
              />
            </div>
            <div>
              <Label htmlFor="newsletter_text">Texte newsletter</Label>
              <Textarea
                id="newsletter_text"
                value={settings.newsletter_text}
                onChange={(e) => handleColorChange('newsletter_text', e.target.value)}
                placeholder="Abonnez-vous à notre newsletter pour recevoir les dernières actualités"
                rows={2}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={settings.is_active}
                onCheckedChange={(checked) => handleColorChange('is_active', checked)}
              />
              <Label htmlFor="is_active">Footer actif</Label>
            </div>
          </CardContent>
        </Card>

        {/* Réseaux Sociaux */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Globe className="w-5 h-5" />
              <span>Réseaux Sociaux</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center space-x-2">
                <Facebook className="w-4 h-4" />
                <Label>Facebook</Label>
                <Input
                  value={settings.social_links.facebook}
                  onChange={(e) => handleSocialLinkChange('facebook', e.target.value)}
                  placeholder="https://facebook.com/bossiz"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Twitter className="w-4 h-4" />
                <Label>Twitter</Label>
                <Input
                  value={settings.social_links.twitter}
                  onChange={(e) => handleSocialLinkChange('twitter', e.target.value)}
                  placeholder="https://twitter.com/bossiz"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Instagram className="w-4 h-4" />
                <Label>Instagram</Label>
                <Input
                  value={settings.social_links.instagram}
                  onChange={(e) => handleSocialLinkChange('instagram', e.target.value)}
                  placeholder="https://instagram.com/bossiz"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Linkedin className="w-4 h-4" />
                <Label>LinkedIn</Label>
                <Input
                  value={settings.social_links.linkedin}
                  onChange={(e) => handleSocialLinkChange('linkedin', e.target.value)}
                  placeholder="https://linkedin.com/company/bossiz"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informations de Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Phone className="w-5 h-5" />
              <span>Informations de Contact</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Phone className="w-4 h-4" />
              <Label>Téléphone</Label>
              <Input
                value={settings.contact_info.phone}
                onChange={(e) => handleContactInfoChange('phone', e.target.value)}
                placeholder="+225 07 00 00 00 00"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Mail className="w-4 h-4" />
              <Label>Email</Label>
              <Input
                value={settings.contact_info.email}
                onChange={(e) => handleContactInfoChange('email', e.target.value)}
                placeholder="contact@bossiz.com"
              />
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4" />
              <Label>Adresse</Label>
              <Input
                value={settings.contact_info.address}
                onChange={(e) => handleContactInfoChange('address', e.target.value)}
                placeholder="Abidjan, Côte d'Ivoire"
              />
            </div>
          </CardContent>
        </Card>

        {/* Liens Rapides */}
        <Card>
          <CardHeader>
            <CardTitle>Liens Rapides</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Services</Label>
                <Input
                  value={settings.quick_links.services}
                  onChange={(e) => handleQuickLinkChange('services', e.target.value)}
                  placeholder="Services"
                />
              </div>
              <div>
                <Label>À propos</Label>
                <Input
                  value={settings.quick_links.about}
                  onChange={(e) => handleQuickLinkChange('about', e.target.value)}
                  placeholder="À propos"
                />
              </div>
              <div>
                <Label>Blog</Label>
                <Input
                  value={settings.quick_links.blog}
                  onChange={(e) => handleQuickLinkChange('blog', e.target.value)}
                  placeholder="Blog"
                />
              </div>
              <div>
                <Label>Carrières</Label>
                <Input
                  value={settings.quick_links.careers}
                  onChange={(e) => handleQuickLinkChange('careers', e.target.value)}
                  placeholder="Carrières"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Liens Légaux */}
        <Card>
          <CardHeader>
            <CardTitle>Liens Légaux</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label>Politique de confidentialité</Label>
                <Input
                  value={settings.legal_links.privacy}
                  onChange={(e) => handleLegalLinkChange('privacy', e.target.value)}
                  placeholder="Politique de confidentialité"
                />
              </div>
              <div>
                <Label>Conditions d'utilisation</Label>
                <Input
                  value={settings.legal_links.terms}
                  onChange={(e) => handleLegalLinkChange('terms', e.target.value)}
                  placeholder="Conditions d'utilisation"
                />
              </div>
              <div>
                <Label>Politique de cookies</Label>
                <Input
                  value={settings.legal_links.cookies}
                  onChange={(e) => handleLegalLinkChange('cookies', e.target.value)}
                  placeholder="Politique de cookies"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Aperçu du Footer */}
      {previewMode && (
        <Card>
          <CardHeader>
            <CardTitle>Aperçu du Footer</CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              className="p-8 rounded-lg"
              style={{
                backgroundColor: settings.background_color,
                color: settings.text_color,
                borderColor: settings.border_color,
                borderWidth: '1px',
                borderStyle: 'solid'
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div>
                  <h3 className="text-lg font-semibold mb-4">{settings.company_name}</h3>
                  <p className="text-sm mb-4">{settings.description}</p>
                  <div className="flex space-x-2">
                    {Object.entries(settings.social_links).map(([platform, url]) => (
                      <a
                        key={platform}
                        href={url}
                        className="p-2 rounded hover:bg-white/10 transition-colors"
                        style={{ color: settings.link_color }}
                      >
                        {platform === 'facebook' && <Facebook className="w-4 h-4" />}
                        {platform === 'twitter' && <Twitter className="w-4 h-4" />}
                        {platform === 'instagram' && <Instagram className="w-4 h-4" />}
                        {platform === 'linkedin' && <Linkedin className="w-4 h-4" />}
                      </a>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-4">Contact</h4>
                  <div className="space-y-2 text-sm">
                    <p>{settings.contact_info.phone}</p>
                    <p>{settings.contact_info.email}</p>
                    <p>{settings.contact_info.address}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-4">Liens Rapides</h4>
                  <ul className="space-y-2 text-sm">
                    {Object.entries(settings.quick_links).map(([key, label]) => (
                      <li key={key}>
                        <a href="#" style={{ color: settings.link_color }}>{label}</a>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-4">Légal</h4>
                  <ul className="space-y-2 text-sm">
                    {Object.entries(settings.legal_links).map(([key, label]) => (
                      <li key={key}>
                        <a href="#" style={{ color: settings.link_color }}>{label}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="mt-8 pt-8 border-t" style={{ borderColor: settings.border_color }}>
                <p className="text-center text-sm">{settings.copyright_text}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
