import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { CONTRIBUTION_STATUS, downloadCsv, impactMethodLabel, toCsv } from "@/lib/impact";

const stamp = () => new Date().toISOString().slice(0, 10);

// Exports CSV (séparateur « ; », lisibles dans Excel). Données servies par
// des fonctions réservées aux admins ; les téléphones ne sont pas exportés.
export function ImpactReportsPanel({ campaignId }: { campaignId: string }) {
  const [busy, setBusy] = useState<string | null>(null);

  const run = async (key: string, task: () => Promise<void>) => {
    setBusy(key);
    try {
      await task();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export impossible");
    } finally {
      setBusy(null);
    }
  };

  const transactions = async (onlyRefunds: boolean) => {
    const { data, error } = await supabase.rpc("impact_admin_transactions", {
      p_campaign_id: campaignId,
      p_status: onlyRefunds ? "refunded" : null,
    });
    if (error) throw error;
    const rows = (data ?? []).map((t) => ({
      ...t,
      status: CONTRIBUTION_STATUS[t.status]?.label ?? t.status,
      payment_method: impactMethodLabel(t.payment_method),
    }));
    downloadCsv(
      `bossiz-impact-${onlyRefunds ? "remboursements" : "transactions"}-${stamp()}.csv`,
      toCsv(rows, [
        { key: "reference", label: "Référence" },
        { key: "created_at", label: "Créée le" },
        { key: "paid_at", label: "Payée le" },
        { key: "status", label: "Statut" },
        { key: "amount_xof", label: "Montant (FCFA)" },
        { key: "offer_name", label: "Formule" },
        { key: "member_reference", label: "Membre" },
        { key: "contributor_name", label: "Nom" },
        { key: "contributor_email", label: "E-mail" },
        { key: "payment_method", label: "Moyen" },
        { key: "provider_transaction_id", label: "Transaction prestataire" },
        { key: "provider_status", label: "Statut prestataire" },
        { key: "refunded_at", label: "Remboursée le" },
        { key: "refund_reference", label: "Réf. remboursement" },
        { key: "refund_reason", label: "Motif" },
      ]),
    );
  };

  const members = async () => {
    const { data, error } = await supabase.rpc("impact_admin_members", { p_campaign_id: campaignId });
    if (error) throw error;
    downloadCsv(
      `bossiz-impact-membres-${stamp()}.csv`,
      toCsv(data ?? [], [
        { key: "member_reference", label: "Référence" },
        { key: "display_name", label: "Nom" },
        { key: "email", label: "E-mail" },
        { key: "paid_xof", label: "Contributions confirmées (FCFA)" },
        { key: "contributions", label: "Nombre" },
        { key: "open_benefits", label: "Avantages disponibles" },
        { key: "smiles_balance", label: "Solde Smiles" },
        { key: "first_contribution_at", label: "Membre depuis" },
      ]),
    );
  };

  const benefits = async () => {
    const [benefitsRes, membersRes, usesRes] = await Promise.all([
      supabase
        .from("impact_member_benefits")
        .select("id, member_id, title, uses_allowed, valid_from, expires_at, revoked_at, revoked_reason")
        .order("created_at"),
      supabase.from("impact_members").select("id, member_reference"),
      supabase.from("impact_benefit_uses").select("member_benefit_id, cancelled_at"),
    ]);
    const error = benefitsRes.error || membersRes.error || usesRes.error;
    if (error) throw error;
    const refById = new Map((membersRes.data ?? []).map((m) => [m.id, m.member_reference]));
    const rows = (benefitsRes.data ?? []).map((b) => ({
      member: refById.get(b.member_id) ?? "",
      title: b.title,
      uses: (usesRes.data ?? []).filter((u) => u.member_benefit_id === b.id && !u.cancelled_at).length,
      uses_allowed: b.uses_allowed,
      valid_from: b.valid_from,
      expires_at: b.expires_at,
      revoked: b.revoked_at ? `oui (${b.revoked_reason ?? ""})` : "",
    }));
    downloadCsv(
      `bossiz-impact-avantages-${stamp()}.csv`,
      toCsv(rows, [
        { key: "member", label: "Membre" },
        { key: "title", label: "Avantage" },
        { key: "uses", label: "Utilisations" },
        { key: "uses_allowed", label: "Autorisées" },
        { key: "valid_from", label: "Valable du" },
        { key: "expires_at", label: "Expire le" },
        { key: "revoked", label: "Retiré" },
      ]),
    );
  };

  const smiles = async () => {
    const { data, error } = await supabase
      .from("loyalty_transactions")
      .select("user_id, kind, points, description, reference_id, created_at, expires_at")
      .in("kind", ["impact", "impact_reversal"])
      .order("created_at");
    if (error) throw error;
    downloadCsv(
      `bossiz-impact-smiles-${stamp()}.csv`,
      toCsv(data ?? [], [
        { key: "created_at", label: "Date" },
        { key: "kind", label: "Mouvement" },
        { key: "points", label: "Smiles" },
        { key: "description", label: "Libellé" },
        { key: "reference_id", label: "Référence" },
        { key: "expires_at", label: "Expire le" },
        { key: "user_id", label: "Compte" },
      ]),
    );
  };

  const exportsList = [
    { key: "transactions", label: "Contributions et transactions", task: () => transactions(false) },
    { key: "refunds", label: "Remboursements", task: () => transactions(true) },
    { key: "members", label: "Membres", task: members },
    { key: "benefits", label: "Avantages attribués", task: benefits },
    { key: "smiles", label: "Mouvements de Smiles Impact", task: smiles },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Exports</CardTitle>
          <CardDescription>
            Fichiers CSV contenant des données personnelles : à conserver de façon sécurisée et à ne partager qu'avec
            les personnes habilitées.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          {exportsList.map((x) => (
            <Button key={x.key} variant="outline" disabled={busy !== null} onClick={() => run(x.key, x.task)}>
              <Download className="mr-2 h-4 w-4" />
              {x.label}
            </Button>
          ))}
        </CardContent>
      </Card>
      <ImpactAuditLog />
    </div>
  );
}

function ImpactAuditLog() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["impact-admin-audit"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("impact_audit_log")
        .select("id, actor, action, entity, entity_id, details, created_at")
        .order("id", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Journal des opérations</CardTitle>
        <CardDescription>
          Modifications de configuration, paiements, utilisations et remboursements (200 dernières).
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : (
          <ul className="divide-y text-sm">
            {data.map((log) => (
              <li key={log.id} className="py-2">
                <details>
                  <summary className="cursor-pointer">
                    {new Date(log.created_at).toLocaleString("fr-FR")} · {log.action} · {log.entity}
                    {log.actor ? "" : " · système"}
                  </summary>
                  <pre className="mt-2 max-h-60 overflow-auto rounded bg-muted p-2 text-xs">
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                </details>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
