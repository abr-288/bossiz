import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Bossiz Impact (collecte) et ses avantages Bossiz Smiles (fidélité).
// Toutes les règles (montants, statuts, droits) sont appliquées côté
// serveur : voir supabase/migrations/20261029000000_bossiz_impact.sql.

export const IMPACT_DEFAULT_SLUG = "ensemble-pour-la-croissance-de-bossiz";

export const IMPACT_PAYMENT_METHODS: { value: string; label: string }[] = [
  { value: "wave", label: "Wave" },
  { value: "orange_money", label: "Orange Money" },
  { value: "mtn", label: "MTN MoMo" },
  { value: "moov", label: "Moov Money" },
  { value: "djamo", label: "Djamo" },
];

export const impactMethodLabel = (value: string | null | undefined) =>
  IMPACT_PAYMENT_METHODS.find((m) => m.value === value)?.label ?? value ?? "—";

export const CONTRIBUTION_STATUS: Record<
  string,
  { label: string; tone: "default" | "secondary" | "outline" | "destructive" }
> = {
  pending: { label: "En attente de paiement", tone: "outline" },
  processing: { label: "Paiement en cours de confirmation", tone: "outline" },
  paid: { label: "Confirmée", tone: "default" },
  failed: { label: "Échouée", tone: "destructive" },
  expired: { label: "Expirée (non payée)", tone: "secondary" },
  cancelled: { label: "Annulée", tone: "secondary" },
  refunded: { label: "Remboursée", tone: "secondary" },
};

export const BENEFIT_STATE: Record<
  string,
  { label: string; tone: "default" | "secondary" | "outline" | "destructive" }
> = {
  available: { label: "Disponible", tone: "default" },
  upcoming: { label: "Bientôt disponible", tone: "outline" },
  used: { label: "Utilisé", tone: "secondary" },
  expired: { label: "Expiré", tone: "secondary" },
  revoked: { label: "Retiré", tone: "destructive" },
};

export const BENEFIT_TYPES: { value: string; label: string }[] = [
  { value: "percent_discount", label: "Réduction en %" },
  { value: "fixed_discount", label: "Réduction en FCFA" },
  { value: "service", label: "Prestation offerte" },
  { value: "priority", label: "Accès prioritaire" },
  { value: "other", label: "Autre avantage" },
];

export const formatXof = (amount: number | string | null | undefined) =>
  `${Math.round(Number(amount ?? 0)).toLocaleString("fr-FR")} FCFA`;

export const formatImpactDate = (iso: string | null | undefined, withTime = false) =>
  iso
    ? new Date(iso).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
        ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
      })
    : "—";

export interface ImpactBenefitSummary {
  title: string;
  description?: string | null;
  benefit_type: string;
  value?: number | null;
  max_discount_xof?: number | null;
  uses_per_member?: number | null;
  cumulable?: boolean;
  exclusions?: string | null;
  conditions?: string | null;
  services?: string[];
  eligible_services?: string[];
}

// Texte court d'un avantage (« 10 % de réduction, plafonné à 5 000 FCFA »).
export function describeBenefit(b: ImpactBenefitSummary): string {
  const value = b.value != null ? Number(b.value) : null;
  const parts: string[] = [];
  if (b.benefit_type === "percent_discount" && value != null) parts.push(`${value} % de réduction`);
  else if (b.benefit_type === "fixed_discount" && value != null) parts.push(`${formatXof(value)} de réduction`);
  if (b.max_discount_xof != null) parts.push(`plafonné à ${formatXof(b.max_discount_xof)}`);
  const uses = Number(b.uses_per_member ?? 1);
  parts.push(uses > 1 ? `${uses} utilisations` : "1 utilisation");
  if (b.cumulable === false) parts.push("non cumulable avec d'autres promotions");
  return parts.join(", ");
}

export interface ImpactOffer {
  id: string;
  name: string;
  description: string | null;
  min_amount_xof: number;
  max_amount_xof: number | null;
  smiles_awarded: number;
  // Part du montant versé convertie en Smiles (1 Smile par FCFA).
  smiles_percent: number | null;
  validity_months: number;
  terms: string | null;
  available: boolean;
  benefits: ImpactBenefitSummary[];
}

export interface ImpactListItem {
  title: string;
  description?: string;
  amount_xof?: number | null;
  target_xof?: number | null;
  done?: boolean;
}

export interface ImpactCampaign {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  secondary_tagline: string | null;
  summary: string | null;
  description: string | null;
  goal_xof: number;
  target_members: number | null;
  min_contribution_xof: number;
  max_contribution_xof: number | null;
  allow_free_amount: boolean;
  starts_at: string | null;
  ends_at: string | null;
  status: string;
  benefits_validity_months: number;
  benefits_valid_from: string | null;
  funding_uses: ImpactListItem[];
  milestones: ImpactListItem[];
  faq: { question: string; answer: string }[];
  terms: string | null;
  terms_version: string;
  legal_entity: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  accepted_methods: string[];
  // Contribution minimale pour utiliser ses Smiles sur les billets d'avion.
  smiles_flights_min_xof: number | null;
}

export interface ImpactPublicData {
  campaign: ImpactCampaign;
  collected_xof: number;
  members: number;
  percent: number;
  is_open: boolean;
  offers: ImpactOffer[];
}

const asArray = <T>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

export function parseImpactPublic(value: unknown): ImpactPublicData | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  const c = v.campaign as ImpactCampaign | undefined;
  if (!c?.id) return null;
  return {
    campaign: {
      ...c,
      funding_uses: asArray(c.funding_uses),
      milestones: asArray(c.milestones),
      faq: asArray(c.faq),
      accepted_methods: asArray(c.accepted_methods),
    },
    collected_xof: Number(v.collected_xof ?? 0),
    members: Number(v.members ?? 0),
    percent: Number(v.percent ?? 0),
    is_open: v.is_open === true,
    offers: asArray<ImpactOffer>(v.offers).map((o) => ({
      ...o,
      smiles_awarded: Number(o.smiles_awarded ?? 0),
      smiles_percent: o.smiles_percent == null ? null : Number(o.smiles_percent),
      benefits: asArray(o.benefits),
    })),
  };
}

// Smiles reçus pour un montant donné : même calcul que
// impact_start_contribution (montant fixe + pourcentage, arrondi inférieur).
export function offerSmiles(offer: Pick<ImpactOffer, "smiles_awarded" | "smiles_percent">, amountXof: number) {
  const amount = Number.isFinite(amountXof) && amountXof > 0 ? amountXof : 0;
  return Number(offer.smiles_awarded ?? 0) + Math.floor((amount * Number(offer.smiles_percent ?? 0)) / 100);
}

export function useImpactCampaign(slug: string) {
  return useQuery({
    queryKey: ["impact-campaign", slug],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("impact_public_campaign", { p_slug: slug });
      if (error) throw error;
      return parseImpactPublic(data);
    },
    staleTime: 60_000,
  });
}

export interface MyImpactContribution {
  id: string;
  reference: string;
  amount_xof: number;
  status: string;
  offer_name: string | null;
  campaign: string;
  created_at: string;
  paid_at: string | null;
  refunded_at: string | null;
}

export interface MyImpactBenefit {
  id: string;
  title: string;
  details: ImpactBenefitSummary;
  uses_allowed: number;
  uses: number;
  valid_from: string;
  expires_at: string;
  state: string;
  history: { used_at: string; order_reference: string; discount_xof: number; cancelled: boolean }[];
}

export interface MyImpactOverview {
  member_reference: string | null;
  member_since: string | null;
  total_paid_xof: number;
  contributions: MyImpactContribution[];
  benefits: MyImpactBenefit[];
  smiles: { kind: string; points: number; description: string | null; created_at: string; expires_at: string | null }[];
}

export function useMyImpact() {
  return useQuery({
    queryKey: ["my-impact"],
    queryFn: async (): Promise<MyImpactOverview> => {
      const { data, error } = await supabase.rpc("impact_my_overview");
      if (error) throw error;
      const v = (data ?? {}) as Record<string, unknown>;
      return {
        member_reference: (v.member_reference as string | null) ?? null,
        member_since: (v.member_since as string | null) ?? null,
        total_paid_xof: Number(v.total_paid_xof ?? 0),
        contributions: asArray(v.contributions),
        benefits: asArray(v.benefits),
        smiles: asArray(v.smiles),
      };
    },
    // Suivi d'un paiement en cours : actualisé toutes les 5 s tant qu'une
    // contribution attend la confirmation du prestataire.
    refetchInterval: (query) =>
      query.state.data?.contributions.some((c) => c.status === "pending" || c.status === "processing") ? 5000 : false,
  });
}

// Export CSV des rapports admin.
export { downloadCsv, toCsv } from "./csv";
