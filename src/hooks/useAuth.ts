import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface User {
  id: string;
  email?: string;
  user_metadata?: Record<string, any>;
}

interface UserProfile {
  id: string;
  user_id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  role?: string;
  created_at: string;
  updated_at: string;
}

interface PaymentMethod {
  id: string;
  user_id: string;
  type: 'card' | 'mobile_money' | 'bank_transfer';
  card_number?: string;
  card_expiry?: string;
  card_holder_name?: string;
  mobile_operator?: string;
  mobile_number?: string;
  bank_name?: string;
  bank_account_number?: string;
  bank_account_name?: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Vérifier l'authentification
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        setUser(null);
        setProfile(null);
        setPaymentMethods([]);
        return;
      }
      
      setUser(user);
      
      // Charger le profil utilisateur (approche simplifiée)
      try {
        const { data: profileData, error: profileError } = await (supabase as any)
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (profileError) {
          console.error('Error loading profile:', profileError);
        } else if (profileData) {
          setProfile(profileData);
        }
      } catch (profileErr) {
        console.error('Profile fetch error:', profileErr);
      }
      
      // Charger les méthodes de paiement (approche simplifiée)
      try {
        const { data: paymentData, error: paymentError } = await (supabase as any)
          .from('user_payment_methods')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('is_default', { ascending: false });
        
        if (paymentError) {
          console.error('Error loading payment methods:', paymentError);
        } else if (paymentData) {
          setPaymentMethods(paymentData);
        }
      } catch (paymentErr) {
        console.error('Payment methods fetch error:', paymentErr);
      }
      
    } catch (err) {
      console.error('Auth check error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const isAuthenticated = () => {
    return !!user;
  };

  const hasPaymentMethod = async () => {
    if (!user) return false;
    
    try {
      const { data, error } = await (supabase as any)
        .from('user_payment_methods')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .limit(1);
      
      if (error) {
        console.error('Error checking payment methods:', error);
        return false;
      }
      
      return data && data.length > 0;
    } catch (err) {
      console.error('Payment method check error:', err);
      return false;
    }
  };

  const isAdmin = () => {
    return profile?.role === 'admin';
  };

  const hasCompletedProfile = () => {
    return !!(profile?.first_name && profile?.last_name && profile?.email && profile?.phone);
  };

  const refreshAuth = () => {
    return checkAuth();
  };

  return {
    user,
    profile,
    paymentMethods,
    loading,
    error,
    isAuthenticated,
    hasPaymentMethod,
    isAdmin,
    hasCompletedProfile,
    refreshAuth
  };
}

export function useRequireAuth() {
  const authData = useAuth();
  
  useEffect(() => {
    if (!authData.loading && !authData.isAuthenticated) {
      window.location.href = '/login';
    }
  }, [authData.isAuthenticated, authData.loading]);
  
  return authData;
}

export function useRequirePayment() {
  const authData = useAuth();
  const [paymentChecked, setPaymentChecked] = useState(false);
  
  useEffect(() => {
    const checkPayment = async () => {
      if (!authData.loading) {
        if (!authData.isAuthenticated) {
          window.location.href = '/login?redirectTo=' + encodeURIComponent(window.location.pathname);
        } else {
          const hasPayment = await authData.hasPaymentMethod();
          if (!hasPayment) {
            window.location.href = '/payment-setup?redirectTo=' + encodeURIComponent(window.location.pathname);
          }
          setPaymentChecked(true);
        }
      }
    };

    checkPayment();
  }, [authData.isAuthenticated, authData.loading]);

  return { ...authData, paymentChecked };
}

export function useRequireAdmin() {
  const authData = useAuth();
  
  useEffect(() => {
    if (!authData.loading) {
      if (!authData.isAuthenticated) {
        window.location.href = '/login';
      } else if (!authData.isAdmin()) {
        window.location.href = '/dashboard';
      }
    }
  }, [authData.isAuthenticated, authData.isAdmin, authData.loading]);
  
  return authData;
}
