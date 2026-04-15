import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
      
      // Charger le profil utilisateur
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (profileError) {
          console.error('Error loading profile:', profileError);
        } else {
          setProfile(profileData);
        }
      } catch (profileErr) {
        console.error('Profile fetch error:', profileErr);
      }
      
      // Charger les méthodes de paiement
      try {
        const { data: paymentData, error: paymentError } = await supabase
          .from('user_payment_methods')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('is_default', { ascending: false });
        
        if (paymentError) {
          console.error('Error loading payment methods:', paymentError);
        } else {
          setPaymentMethods(paymentData || []);
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

  const hasPaymentMethod = () => {
    return paymentMethods.length > 0;
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
  const router = useRouter();
  
  useEffect(() => {
    if (!authData.loading && !authData.isAuthenticated) {
      router.push('/login');
    }
  }, [authData.isAuthenticated, authData.loading, router]);
  
  return authData;
}

export function useRequirePayment() {
  const authData = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!authData.loading) {
      if (!authData.isAuthenticated) {
        router.push('/login?redirectTo=' + encodeURIComponent(window.location.pathname));
      } else if (!authData.hasPaymentMethod()) {
        router.push('/payment-setup?redirectTo=' + encodeURIComponent(window.location.pathname));
      }
    }
  }, [authData.isAuthenticated, authData.hasPaymentMethod, authData.loading, router]);
  
  return authData;
}

export function useRequireAdmin() {
  const authData = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!authData.loading) {
      if (!authData.isAuthenticated) {
        router.push('/login');
      } else if (!authData.isAdmin()) {
        router.push('/dashboard');
      }
    }
  }, [authData.isAuthenticated, authData.isAdmin, authData.loading, router]);
  
  return authData;
}
