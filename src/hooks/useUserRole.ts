import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useUserRole() {
  const [role, setRole] = useState<'admin' | 'user' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setRole(null);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        if (error) throw error;

        // A user can end up with more than one role row (e.g. the default
        // 'user' role assigned on signup, plus 'admin' granted later) — pick
        // the highest-privilege one rather than assuming a single row.
        const roles = (data ?? []).map((r) => r.role);
        if (roles.includes('admin')) {
          setRole('admin');
        } else if (roles.length > 0) {
          setRole('user');
        } else {
          setRole('user'); // Default to user if no role exists
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
        setRole('user'); // Default to user
      } finally {
        setLoading(false);
      }
    };

    fetchRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchRole();
    });

    return () => subscription.unsubscribe();
  }, []);

  return { role, loading, isAdmin: role === 'admin' };
}
