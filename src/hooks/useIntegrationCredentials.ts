import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface IntegrationCredential {
  id: string;
  provider: string;
  category: "email" | "sms" | "whatsapp" | "payment" | "push" | "other";
  label: string;
  credentials: Record<string, string>;
  is_active: boolean;
  updated_at: string;
}

export const useIntegrationCredentials = () => {
  const [integrations, setIntegrations] = useState<IntegrationCredential[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableMissing, setTableMissing] = useState(false);
  const { toast } = useToast();

  const fetchIntegrations = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("integration_credentials" as any)
        .select("*")
        .order("category");

      if (error) {
        // La table n'existe pas encore tant que la migration n'a pas été
        // appliquée manuellement (voir docs/DOCUMENTATION.md).
        // - 42P01 : code Postgres natif "relation does not exist"
        // - PGRST205 : code PostgREST "table absente du schema cache"
        //   (c'est celui-ci que Supabase renvoie réellement dans ce cas)
        if (
          error.code === "42P01" ||
          error.code === "PGRST205" ||
          error.message?.includes("does not exist") ||
          error.message?.includes("schema cache")
        ) {
          setTableMissing(true);
          setIntegrations([]);
          return;
        }
        throw error;
      }
      setTableMissing(false);
      setIntegrations((data as any) || []);
    } catch (error) {
      console.error("Error fetching integration credentials:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateIntegration = useCallback(async (id: string, updates: Partial<IntegrationCredential>) => {
    try {
      const { error } = await supabase
        .from("integration_credentials" as any)
        .update(updates as any)
        .eq("id", id);

      if (error) throw error;

      setIntegrations((prev) => prev.map((i) => (i.id === id ? { ...i, ...updates } : i)));
      toast({ title: "Succès", description: "Identifiants mis à jour" });
    } catch (error: any) {
      console.error("Error updating integration credentials:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Active un prestataire et désactive tous les autres de la même catégorie
  // (ex: un seul prestataire de paiement actif à la fois). Nécessaire pour
  // que /admin/integrations reflète réellement le prestataire que les Edge
  // Functions utiliseront (getActivePaymentProvider ne regarde que le
  // premier "is_active=true" trouvé).
  const activateExclusive = useCallback(async (id: string, category: string, updates: Partial<IntegrationCredential> = {}) => {
    try {
      const siblings = integrations.filter((i) => i.category === category && i.id !== id);

      if (siblings.length > 0) {
        const { error: deactivateError } = await supabase
          .from("integration_credentials" as any)
          .update({ is_active: false } as any)
          .in("id", siblings.map((i) => i.id));
        if (deactivateError) throw deactivateError;
      }

      const { error } = await supabase
        .from("integration_credentials" as any)
        .update({ ...updates, is_active: true } as any)
        .eq("id", id);
      if (error) throw error;

      setIntegrations((prev) =>
        prev.map((i) => {
          if (i.id === id) return { ...i, ...updates, is_active: true };
          if (i.category === category) return { ...i, is_active: false };
          return i;
        })
      );
      toast({ title: "Succès", description: "Prestataire activé" });
    } catch (error: any) {
      console.error("Error activating integration exclusively:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'activer ce prestataire",
        variant: "destructive",
      });
    }
  }, [integrations, toast]);

  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  return { integrations, loading, tableMissing, updateIntegration, activateExclusive, refetch: fetchIntegrations };
};
