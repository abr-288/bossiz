import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getErrorMessage } from '@/lib/errorMessage';

export interface PriceAlert {
  id: string;
  service_type: 'flight' | 'hotel' | 'car';
  origin?: string;
  destination: string;
  departure_date?: string;
  return_date?: string;
  passengers?: number;
  rooms?: number;
  target_price?: number;
  current_price?: number;
  currency: string;
  alert_threshold: number;
  is_active: boolean;
  last_checked_at?: string;
  created_at: string;
}

export const usePriceAlerts = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const createAlert = async (alert: Omit<PriceAlert, 'id' | 'created_at' | 'last_checked_at'>) => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Vous devez être connecté');

      const { data, error } = await supabase
        .from('price_alerts')
        .insert([{ ...alert, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Alerte créée",
        description: "Vous serez notifié quand le prix baisse",
      });

      return data;
    } catch (error) {
      toast({
        title: "Erreur",
        description: getErrorMessage(error),
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getAlerts = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Vous devez être connecté');

      const { data, error } = await supabase
        .from('price_alerts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PriceAlert[];
    } catch (error) {
      toast({
        title: "Erreur",
        description: getErrorMessage(error),
        variant: "destructive",
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const updateAlert = async (id: string, updates: Partial<PriceAlert>) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('price_alerts')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Alerte mise à jour",
        description: "L'alerte a été modifiée avec succès",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: getErrorMessage(error),
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAlert = async (id: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('price_alerts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Alerte supprimée",
        description: "L'alerte de prix a été supprimée",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: getErrorMessage(error),
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createAlert,
    getAlerts,
    updateAlert,
    deleteAlert,
    isLoading,
  };
};
