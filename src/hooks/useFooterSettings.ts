import { useState, useEffect } from 'react';

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

export function useFooterSettings() {
  const [settings, setSettings] = useState<FooterSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFooterSettings();
  }, []);

  const fetchFooterSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/footer-settings');
      
      if (!response.ok) {
        throw new Error('Failed to fetch footer settings');
      }
      
      const data = await response.json();
      
      if (data) {
        setSettings(data);
      }
    } catch (err) {
      console.error('Error fetching footer settings:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      // Keep default settings on error
    } finally {
      setLoading(false);
    }
  };

  const updateFooterSettings = async (newSettings: Partial<FooterSettings>) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/footer-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...settings, ...newSettings }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update footer settings');
      }
      
      const data = await response.json();
      
      if (data) {
        setSettings(data);
      }
      
      return data;
    } catch (err) {
      console.error('Error updating footer settings:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const resetToDefaults = () => {
    setSettings(defaultSettings);
    setError(null);
  };

  return {
    settings,
    loading,
    error,
    refetch: fetchFooterSettings,
    update: updateFooterSettings,
    resetToDefaults
  };
}
