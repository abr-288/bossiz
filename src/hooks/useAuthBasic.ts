import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/integrations/supabase/client';

export function useAuth() {
  const [user, setUser] = useState<any>(null);
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
        return;
      }
      
      setUser(user);
      
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
      const { data, error } = await supabase
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
    return user?.user_metadata?.role === 'admin';
  };

  const refreshAuth = () => {
    return checkAuth();
  };

  return {
    user,
    loading,
    error,
    isAuthenticated,
    hasPaymentMethod,
    isAdmin,
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
  const [paymentChecked, setPaymentChecked] = useState(false);
  
  useEffect(() => {
    const checkPayment = async () => {
      if (!authData.loading) {
        if (!authData.isAuthenticated) {
          router.push('/login?redirectTo=' + encodeURIComponent(window.location.pathname));
        } else {
          const hasPayment = await authData.hasPaymentMethod();
          if (!hasPayment) {
            router.push('/payment-setup?redirectTo=' + encodeURIComponent(window.location.pathname));
          }
          setPaymentChecked(true);
        }
      }
    };

    checkPayment();
  }, [authData.isAuthenticated, authData.loading, router]);

  return { ...authData, paymentChecked };
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
