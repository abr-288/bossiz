import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Company {
  id: string;
  name: string;
  description: string | null;
  billing_email: string | null;
  billing_phone: string | null;
  invite_code: string;
  is_active: boolean;
}

export type CompanyRole = "admin" | "approver" | "employee";

export const useCompany = () => {
  const [company, setCompany] = useState<Company | null>(null);
  const [role, setRole] = useState<CompanyRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCompany = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setCompany(null);
      setRole(null);
      setLoading(false);
      return;
    }

    // A user could in principle join more than one company (no constraint
    // prevents it); for this first version we only surface the first one.
    const { data: memberships } = await supabase
      .from("company_members")
      .select("role, companies(*)")
      .eq("user_id", user.id)
      .limit(1);

    const membership = memberships?.[0];
    if (membership?.companies) {
      setCompany(membership.companies as any);
      setRole(membership.role as CompanyRole);
    } else {
      setCompany(null);
      setRole(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCompany();
  }, [fetchCompany]);

  return { company, role, loading, refetch: fetchCompany };
};
