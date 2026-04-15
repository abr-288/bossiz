import React, { useState, useEffect } from 'react';
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin, 
  Mail, 
  Phone, 
  MapPin, 
  Globe,
  ChevronRight
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

const defaultSettings: FooterSettings = {
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
};

export default function CustomFooter() {
  const [settings, setSettings] = useState<FooterSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');

  useEffect(() => {
    fetchFooterSettings();
  }, []);

  const fetchFooterSettings = async () => {
    try {
      const response = await fetch('/api/admin/footer-settings');
      if (response.ok) {
        const data = await response.json();
        if (data) {
          setSettings(data);
        }
      }
    } catch (error) {
      console.error('Error fetching footer settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      // Ici vous pouvez ajouter la logique pour soumettre l'email à votre newsletter
      console.log('Newsletter subscription:', email);
      setEmail('');
      // Vous pourriez afficher un message de succès ici
    }
  };

  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case 'facebook':
        return <Facebook className="w-5 h-5" />;
      case 'twitter':
        return <Twitter className="w-5 h-5" />;
      case 'instagram':
        return <Instagram className="w-5 h-5" />;
      case 'linkedin':
        return <Linkedin className="w-5 h-5" />;
      default:
        return <Globe className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <footer style={{ backgroundColor: defaultSettings.background_color }}>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center" style={{ color: defaultSettings.text_color }}>
            Chargement...
          </div>
        </div>
      </footer>
    );
  }

  if (!settings.is_active) {
    return null;
  }

  return (
    <footer 
      style={{ 
        backgroundColor: settings.background_color,
        color: settings.text_color,
        borderTop: `1px solid ${settings.border_color}`
      }}
    >
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              {settings.logo_url ? (
                <img 
                  src={settings.logo_url} 
                  alt={settings.company_name}
                  className="h-8 w-auto"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {settings.company_name.charAt(0)}
                  </span>
                </div>
              )}
              <h3 className="text-xl font-bold">{settings.company_name}</h3>
            </div>
            {settings.description && (
              <p className="text-sm opacity-90 leading-relaxed">
                {settings.description}
              </p>
            )}
            
            {/* Social Links */}
            <div className="flex space-x-3">
              {Object.entries(settings.social_links).map(([platform, url]) => (
                url && (
                  <a
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                    style={{ color: settings.text_color }}
                  >
                    {getSocialIcon(platform)}
                  </a>
                )
              ))}
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Contact</h4>
            <div className="space-y-3">
              {settings.contact_info.phone && (
                <div className="flex items-center space-x-3">
                  <Phone className="w-4 h-4" style={{ color: settings.link_color }} />
                  <a 
                    href={`tel:${settings.contact_info.phone}`}
                    className="text-sm hover:underline"
                    style={{ color: settings.link_color }}
                  >
                    {settings.contact_info.phone}
                  </a>
                </div>
              )}
              {settings.contact_info.email && (
                <div className="flex items-center space-x-3">
                  <Mail className="w-4 h-4" style={{ color: settings.link_color }} />
                  <a 
                    href={`mailto:${settings.contact_info.email}`}
                    className="text-sm hover:underline"
                    style={{ color: settings.link_color }}
                  >
                    {settings.contact_info.email}
                  </a>
                </div>
              )}
              {settings.contact_info.address && (
                <div className="flex items-center space-x-3">
                  <MapPin className="w-4 h-4" style={{ color: settings.link_color }} />
                  <span className="text-sm">{settings.contact_info.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Liens Rapides</h4>
            <ul className="space-y-2">
              {Object.entries(settings.quick_links).map(([key, label]) => (
                <li key={key}>
                  <a 
                    href="#" 
                    className="flex items-center space-x-2 text-sm hover:underline transition-colors"
                    style={{ 
                      color: settings.link_color,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = settings.link_hover_color;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = settings.link_color;
                    }}
                  >
                    <ChevronRight className="w-3 h-3" />
                    <span>{label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Newsletter</h4>
            {settings.newsletter_text && (
              <p className="text-sm opacity-90">
                {settings.newsletter_text}
              </p>
            )}
            <form onSubmit={handleNewsletterSubmit} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Votre email"
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
                style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                  color: settings.text_color
                }}
                required
              />
              <button
                type="submit"
                className="w-full px-4 py-2 rounded-lg font-medium transition-colors"
                style={{
                  backgroundColor: settings.link_color,
                  color: settings.background_color
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = settings.link_hover_color;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = settings.link_color;
                }}
              >
                S'abonner
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Section */}
        <div 
          className="mt-12 pt-8 border-t flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0"
          style={{ borderColor: settings.border_color }}
        >
          <div className="text-sm opacity-90">
            {settings.copyright_text}
          </div>
          
          {/* Legal Links */}
          <div className="flex flex-wrap items-center space-x-6 text-sm">
            {Object.entries(settings.legal_links).map(([key, label]) => (
              <a
                key={key}
                href="#"
                className="hover:underline transition-colors"
                style={{ 
                  color: settings.link_color,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = settings.link_hover_color;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = settings.link_color;
                }}
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
