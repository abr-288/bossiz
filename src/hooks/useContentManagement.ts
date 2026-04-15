import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PageSection {
  id: string;
  page_key: string;
  section_key: string;
  title?: string;
  subtitle?: string;
  description?: string;
  background_color: string;
  text_color: string;
  button_text?: string;
  button_color: string;
  button_hover_color: string;
  is_visible: boolean;
  sort_order: number;
}

export interface CustomizablePlan {
  id: string;
  plan_id: string;
  name: string;
  description?: string;
  price: string;
  price_note?: string;
  features: string[];
  color_scheme: string;
  is_popular: boolean;
  is_visible: boolean;
  sort_order: number;
}

export interface Testimonial {
  id: string;
  name: string;
  role?: string;
  content: string;
  rating: number;
  is_visible: boolean;
  sort_order: number;
}

export interface ValueProposition {
  id: string;
  icon_name: string;
  title: string;
  description: string;
  color_scheme: string;
  is_visible: boolean;
  sort_order: number;
}

export interface GlobalSetting {
  id: string;
  setting_key: string;
  setting_value: string;
  setting_type: 'text' | 'color' | 'boolean' | 'number';
  description?: string;
}

export const useContentManagement = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Page Sections
  const [pageSections, setPageSections] = useState<PageSection[]>([]);
  
  const fetchPageSections = async (pageKey?: string) => {
    try {
      setLoading(true);
      let query = supabase.from('page_sections').select('*').order('sort_order');
      
      if (pageKey) {
        query = query.eq('page_key', pageKey);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      setPageSections(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updatePageSection = async (id: string, updates: Partial<PageSection>) => {
    try {
      const { error } = await supabase
        .from('page_sections')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
      
      setPageSections(prev => 
        prev.map(section => 
          section.id === id ? { ...section, ...updates } : section
        )
      );
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const createPageSection = async (section: Omit<PageSection, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('page_sections')
        .insert(section)
        .select()
        .single();
      
      if (error) throw error;
      
      setPageSections(prev => [...prev, data]);
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const deletePageSection = async (id: string) => {
    try {
      const { error } = await supabase
        .from('page_sections')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setPageSections(prev => prev.filter(section => section.id !== id));
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Customizable Plans
  const [customizablePlans, setCustomizablePlans] = useState<CustomizablePlan[]>([]);
  
  const fetchCustomizablePlans = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('customizable_plans')
        .select('*')
        .order('sort_order');
      
      if (error) throw error;
      setCustomizablePlans(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateCustomizablePlan = async (id: string, updates: Partial<CustomizablePlan>) => {
    try {
      const { error } = await supabase
        .from('customizable_plans')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
      
      setCustomizablePlans(prev => 
        prev.map(plan => 
          plan.id === id ? { ...plan, ...updates } : plan
        )
      );
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const createCustomizablePlan = async (plan: Omit<CustomizablePlan, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('customizable_plans')
        .insert(plan)
        .select()
        .single();
      
      if (error) throw error;
      
      setCustomizablePlans(prev => [...prev, data]);
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const deleteCustomizablePlan = async (id: string) => {
    try {
      const { error } = await supabase
        .from('customizable_plans')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setCustomizablePlans(prev => prev.filter(plan => plan.id !== id));
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Testimonials
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  
  const fetchTestimonials = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .order('sort_order');
      
      if (error) throw error;
      setTestimonials(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateTestimonial = async (id: string, updates: Partial<Testimonial>) => {
    try {
      const { error } = await supabase
        .from('testimonials')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
      
      setTestimonials(prev => 
        prev.map(testimonial => 
          testimonial.id === id ? { ...testimonial, ...updates } : testimonial
        )
      );
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const createTestimonial = async (testimonial: Omit<Testimonial, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('testimonials')
        .insert(testimonial)
        .select()
        .single();
      
      if (error) throw error;
      
      setTestimonials(prev => [...prev, data]);
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const deleteTestimonial = async (id: string) => {
    try {
      const { error } = await supabase
        .from('testimonials')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setTestimonials(prev => prev.filter(testimonial => testimonial.id !== id));
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Value Propositions
  const [valuePropositions, setValuePropositions] = useState<ValueProposition[]>([]);
  
  const fetchValuePropositions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('value_propositions')
        .select('*')
        .order('sort_order');
      
      if (error) throw error;
      setValuePropositions(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateValueProposition = async (id: string, updates: Partial<ValueProposition>) => {
    try {
      const { error } = await supabase
        .from('value_propositions')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
      
      setValuePropositions(prev => 
        prev.map(proposition => 
          proposition.id === id ? { ...proposition, ...updates } : proposition
        )
      );
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const createValueProposition = async (proposition: Omit<ValueProposition, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('value_propositions')
        .insert(proposition)
        .select()
        .single();
      
      if (error) throw error;
      
      setValuePropositions(prev => [...prev, data]);
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const deleteValueProposition = async (id: string) => {
    try {
      const { error } = await supabase
        .from('value_propositions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setValuePropositions(prev => prev.filter(proposition => proposition.id !== id));
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Global Settings
  const [globalSettings, setGlobalSettings] = useState<GlobalSetting[]>([]);
  
  const fetchGlobalSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('global_settings')
        .select('*');
      
      if (error) throw error;
      setGlobalSettings(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateGlobalSetting = async (key: string, value: string) => {
    try {
      const { error } = await supabase
        .from('global_settings')
        .update({ setting_value: value })
        .eq('setting_key', key);
      
      if (error) throw error;
      
      setGlobalSettings(prev => 
        prev.map(setting => 
          setting.setting_key === key ? { ...setting, setting_value: value } : setting
        )
      );
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const getGlobalSetting = (key: string): string => {
    const setting = globalSettings.find(s => s.setting_key === key);
    return setting?.setting_value || '';
  };

  // Initialize all data
  useEffect(() => {
    fetchPageSections();
    fetchCustomizablePlans();
    fetchTestimonials();
    fetchValuePropositions();
    fetchGlobalSettings();
  }, []);

  return {
    loading,
    error,
    pageSections,
    customizablePlans,
    testimonials,
    valuePropositions,
    globalSettings,
    
    // Page Sections
    fetchPageSections,
    updatePageSection,
    createPageSection,
    deletePageSection,
    
    // Customizable Plans
    fetchCustomizablePlans,
    updateCustomizablePlan,
    createCustomizablePlan,
    deleteCustomizablePlan,
    
    // Testimonials
    fetchTestimonials,
    updateTestimonial,
    createTestimonial,
    deleteTestimonial,
    
    // Value Propositions
    fetchValuePropositions,
    updateValueProposition,
    createValueProposition,
    deleteValueProposition,
    
    // Global Settings
    fetchGlobalSettings,
    updateGlobalSetting,
    getGlobalSetting,
  };
};
