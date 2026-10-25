import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { formatXof, impactMethodLabel } from "@/lib/impact";

interface Overview {
  goal_xof: number;
  confirmed_xof: number;
  pending_xof: number;
  refunded_xof: number;
  members: number;
  paid_count: number;
  failed_count: number;
  pending_count: number;
  refunded_count: number;
  by_offer: { offer: string; count: number; amount_xof: number }[];
  by_method: { method: string; count: number; amount_xof: number }[];
  by_day: { day: string; amount_xof: number }[];
  obligations: {
    open_benefits: number;
    max_discount_open_xof: number;
    uncapped_open_benefits: number;
    impact_smiles_awarded: number;
    smile_value_xof: number | null;
  };
}

export function ImpactOverview({ campaignId }: { campaignId: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["impact-admin-overview", campaignId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("impact_admin_overview", { p_campaign_id: campaignId });
      if (error) throw error;
      return data as unknown as Overview;
    },
  });

  if (isLoading) return <p className="text-muted-foreground">Chargement…</p>;
  if (isError || !data) return <p className="text-muted-foreground">Tableau de bord indisponible.</p>;

  const percent = Math.min(100, (Number(data.confirmed_xof) * 100) / Number(data.goal_xof || 1));
  const maxDay = Math.max(1, ...data.by_day.map((d) => Number(d.amount_xof)));
  const tiles = [
    { label: "Objectif", value: formatXof(data.goal_xof) },
    { label: "Confirmé (net des remboursements)", value: formatXof(data.confirmed_xof) },
    { label: "En attente de paiement", value: formatXof(data.pending_xof) },
    { label: "Remboursé", value: formatXof(data.refunded_xof) },
    { label: "Membres Impact", value: String(data.members) },
    {
      label: "Transactions",
      value: `${data.paid_count} réussies · ${data.failed_count} échouées/expirées · ${data.refunded_count} remboursées`,
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-2 p-5">
          <div className="flex justify-between text-sm">
            <span>Avancement</span>
            <span className="font-semibold">{percent.toFixed(1)} %</span>
          </div>
          <Progress value={percent} aria-label="Avancement de la collecte" />
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((t) => (
          <Card key={t.label}>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{t.label}</p>
              <p className="mt-1 text-xl font-bold">{t.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        « Confirmé » : paiements confirmés par le prestataire et non remboursés. Les contributions en attente, échouées
        ou expirées ne sont jamais comptées. Définition à faire valider par le comptable avant tout usage officiel.
      </p>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Par formule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {data.by_offer.length === 0 && <p className="text-muted-foreground">Aucune contribution confirmée.</p>}
            {data.by_offer.map((o) => (
              <div key={o.offer} className="flex justify-between gap-3">
                <span>
                  {o.offer} <span className="text-muted-foreground">({o.count})</span>
                </span>
                <span className="font-medium">{formatXof(o.amount_xof)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Par moyen de paiement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {data.by_method.length === 0 && <p className="text-muted-foreground">Aucune contribution confirmée.</p>}
            {data.by_method.map((m) => (
              <div key={m.method} className="flex justify-between gap-3">
                <span>
                  {impactMethodLabel(m.method)} <span className="text-muted-foreground">({m.count})</span>
                </span>
                <span className="font-medium">{formatXof(m.amount_xof)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Évolution de la collecte</CardTitle>
        </CardHeader>
        <CardContent>
          {data.by_day.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune contribution confirmée.</p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {data.by_day.map((d) => (
                <li key={d.day} className="grid grid-cols-[6rem_1fr_7rem] items-center gap-3">
                  <span className="text-muted-foreground">
                    {new Date(`${d.day}T00:00:00`).toLocaleDateString("fr-FR")}
                  </span>
                  <span
                    className="h-2 rounded bg-primary"
                    style={{ width: `${(Number(d.amount_xof) * 100) / maxDay}%` }}
                  />
                  <span className="text-right">{formatXof(d.amount_xof)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Engagements envers les membres</CardTitle>
          <CardDescription>
            Avantages encore utilisables et Smiles attribués : prestations promises à prévoir avant de dépenser la
            totalité des fonds.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <p>
            Avantages ouverts : <strong>{data.obligations.open_benefits}</strong>
          </p>
          <p>
            Réductions maximales restantes (avantages plafonnés) :{" "}
            <strong>{formatXof(data.obligations.max_discount_open_xof)}</strong>
          </p>
          <p>
            Avantages sans plafond : <strong>{data.obligations.uncapped_open_benefits}</strong>
          </p>
          <p>
            Smiles Impact attribués :{" "}
            <strong>{Number(data.obligations.impact_smiles_awarded).toLocaleString("fr-FR")}</strong>
            {data.obligations.smile_value_xof != null && (
              <span className="text-muted-foreground">
                {" "}
                (valeur d'utilisation réglée : {data.obligations.smile_value_xof} FCFA / Smile)
              </span>
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
