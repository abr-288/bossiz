import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface MajesticSubscription {
  id: string;
  user_id: string;
  plan: 'access' | 'access_prive' | 'access_black';
  status: 'active' | 'inactive' | 'cancelled' | 'expired';
  start_date: string;
  end_date?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export const useMajesticSubscription = () => {
  const [subscription, setSubscription] = useState<MajesticSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const checkSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('majestic_subscriptions' as any)
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        // Check if subscription is still valid
        const now = new Date();
        const endDate = data.end_date ? new Date(data.end_date) : null;
        
        if (endDate && endDate < now) {
          // Subscription expired
          await supabase
            .from('majestic_subscriptions')
            .update({ status: 'expired' })
            .eq('id', data.id);
          
          setSubscription(null);
          setHasAccess(false);
        } else {
          setSubscription(data);
          setHasAccess(true);
        }
      } else {
        setSubscription(null);
        setHasAccess(false);
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      setHasAccess(false);
      toast({
        title: 'Erreur',
        description: 'Impossible de vérifier votre abonnement',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const requireAccess = () => {
    if (!hasAccess && !loading) {
      navigate('/majestic-access');
      return false;
    }
    return true;
  };

  const getAccessLevel = () => {
    if (!subscription) return null;
    return subscription.plan;
  };

  const hasFeatureAccess = (feature: 'concierge' | 'properties' | 'chat' | 'black') => {
    if (!hasAccess) return false;
    
    switch (feature) {
      case 'concierge':
        return ['access', 'access_prive', 'access_black'].includes(subscription?.plan || '');
      case 'properties':
        return ['access_prive', 'access_black'].includes(subscription?.plan || '');
      case 'chat':
        return ['access', 'access_prive', 'access_black'].includes(subscription?.plan || '');
      case 'black':
        return subscription?.plan === 'access_black';
      default:
        return false;
    }
  };

  useEffect(() => {
    checkSubscription();

    // Listen for auth changes
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      () => {
        checkSubscription();
      }
    );

    return () => {
      authSubscription.unsubscribe();
    };
  }, []);

  return {
    subscription,
    loading,
    hasAccess,
    requireAccess,
    getAccessLevel,
    hasFeatureAccess,
    refreshSubscription: checkSubscription
  };
};
