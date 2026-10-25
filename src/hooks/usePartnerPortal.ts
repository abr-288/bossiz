import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { moduleForLocation, parsePortalContext, type PartnerPortalContext } from "@/lib/partnerPortal";

interface PostgrestLikeError {
  code?: string;
  hint?: string | null;
  message?: string;
}

export type PartnerPortalDenial = "not_partner" | "inactive" | "module" | null;

const PORTAL_KEY = ["partner-portal"] as const;

// agency_portal_context() lève 42501 (HTTP 403) ; HINT = module demandé
// quand c'est la rubrique, et non l'espace entier, qui est refusée.
export function portalDenial(error: unknown, module: string | null): PartnerPortalDenial {
  const e = error as PostgrestLikeError | null;
  if (!e || e.code !== "42501") return null;
  if (module && e.hint === module) return "module";
  return e.message?.includes("inactif") ? "inactive" : "not_partner";
}

async function fetchPortalContext(module: string | null) {
  const { data, error } = await supabase.rpc("agency_portal_context", module ? { p_module: module } : {});
  if (error) throw error;
  const context = parsePortalContext(data);
  if (!context) throw new Error("Contexte partenaire invalide");
  return context;
}

// Catégorie et modules du partenaire connecté (menu, filtres des pages).
export function usePartnerPortal({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery<PartnerPortalContext>({
    queryKey: PORTAL_KEY,
    queryFn: () => fetchPortalContext(null),
    enabled,
    retry: false,
    staleTime: 60_000,
  });
}

// Vérification serveur que la rubrique de l'URL courante fait partie de
// l'activité du partenaire. Une URL saisie à la main hors catégorie est
// refusée par agency_portal_context(module) avec un 403.
export function usePartnerModuleAccess({ enabled = true }: { enabled?: boolean } = {}) {
  const { pathname, search } = useLocation();
  const queryClient = useQueryClient();
  const module = moduleForLocation(pathname, search);

  const query = useQuery({
    queryKey: [...PORTAL_KEY, "access", module],
    queryFn: async () => {
      const context = await fetchPortalContext(module);
      queryClient.setQueryData(PORTAL_KEY, context);
      return true;
    },
    enabled,
    retry: false,
    staleTime: 60_000,
  });

  return { ...query, module, denial: portalDenial(query.error, module) };
}
