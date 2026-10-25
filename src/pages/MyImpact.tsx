import { Link } from "react-router-dom";
import { HeartHandshake, Loader2, Smile } from "lucide-react";
import { UserDashboardLayout } from "@/components/dashboard/UserDashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  BENEFIT_STATE,
  CONTRIBUTION_STATUS,
  IMPACT_DEFAULT_SLUG,
  describeBenefit,
  formatImpactDate,
  formatXof,
  useMyImpact,
} from "@/lib/impact";

// Espace du Membre Impact : contributions et statut de paiement (suivi en
// direct tant qu'un paiement attend sa confirmation), avantages Bossiz
// Smiles et leurs conditions. Données filtrées côté serveur.
export default function MyImpact() {
  const { data, isLoading, isError } = useMyImpact();
  const waiting = data?.contributions.some((c) => c.status === "pending" || c.status === "processing");

  return (
    <UserDashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Mon espace Impact</h1>
            <p className="text-muted-foreground">Vos contributions à Bossiz Impact et vos avantages Bossiz Smiles.</p>
          </div>
          <Button asChild variant="outline">
            <Link to={`/bossiz-impact/${IMPACT_DEFAULT_SLUG}`}>Voir la campagne</Link>
          </Button>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">Chargement…</p>
        ) : isError || !data ? (
          <p className="text-muted-foreground">Impossible de charger votre espace pour le moment. Réessayez.</p>
        ) : data.contributions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <HeartHandshake className="h-10 w-10 text-primary" />
              <p className="text-muted-foreground">Vous n'avez pas encore contribué à Bossiz Impact.</p>
              <Button asChild>
                <Link to={`/bossiz-impact/${IMPACT_DEFAULT_SLUG}`}>Découvrir la campagne</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Référence de membre</p>
                  <p className="mt-1 text-2xl font-bold">{data.member_reference ?? "—"}</p>
                  {!data.member_reference && (
                    <p className="text-xs text-muted-foreground">Attribuée à la confirmation du premier paiement.</p>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Contributions confirmées</p>
                  <p className="mt-1 text-2xl font-bold">{formatXof(data.total_paid_xof)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Membre depuis</p>
                  <p className="mt-1 text-2xl font-bold">{formatImpactDate(data.member_since)}</p>
                </CardContent>
              </Card>
            </div>

            {waiting && (
              <div
                className="flex items-center gap-2 rounded-lg border bg-muted/40 p-3 text-sm"
                role="status"
                aria-live="polite"
              >
                <Loader2 className="h-4 w-4 animate-spin" />
                Un paiement attend la confirmation de notre prestataire. Cette page se met à jour automatiquement.
              </div>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Mes contributions</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Référence</TableHead>
                      <TableHead>Formule</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.contributions.map((c) => {
                      const status = CONTRIBUTION_STATUS[c.status] ?? { label: c.status, tone: "outline" as const };
                      return (
                        <TableRow key={c.id}>
                          <TableCell className="font-mono text-xs">{c.reference}</TableCell>
                          <TableCell>{c.offer_name ?? "Contribution libre"}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            {formatImpactDate(c.paid_at ?? c.created_at)}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-right">{formatXof(c.amount_xof)}</TableCell>
                          <TableCell>
                            <Badge variant={status.tone}>{status.label}</Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Mes avantages</CardTitle>
                <CardDescription>
                  Présentez votre référence de membre lors de votre commande : l'équipe Bossiz vérifie et applique
                  l'avantage.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {data.benefits.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucun avantage pour le moment.</p>
                ) : (
                  <ul className="divide-y">
                    {data.benefits.map((b) => {
                      const state = BENEFIT_STATE[b.state] ?? { label: b.state, tone: "outline" as const };
                      return (
                        <li key={b.id} className="space-y-1 py-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="font-medium">{b.title}</p>
                            <Badge variant={state.tone}>{state.label}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{describeBenefit(b.details)}</p>
                          {b.details.conditions && (
                            <p className="text-sm text-muted-foreground">{b.details.conditions}</p>
                          )}
                          {b.details.exclusions && (
                            <p className="text-sm text-muted-foreground">Exclusions : {b.details.exclusions}</p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Utilisé {b.uses}/{b.uses_allowed} · valable du {formatImpactDate(b.valid_from)} au{" "}
                            {formatImpactDate(b.expires_at)}
                          </p>
                          {b.history.length > 0 && (
                            <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                              {b.history.map((h, i) => (
                                <li key={i} className={h.cancelled ? "line-through" : undefined}>
                                  {formatImpactDate(h.used_at)} · commande {h.order_reference}
                                  {h.discount_xof > 0 ? ` · ${formatXof(h.discount_xof)}` : ""}
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Smile className="h-4 w-4 text-primary" />
                  Mes Smiles Impact
                </CardTitle>
                <CardDescription>
                  Points de fidélité Bossiz Smiles : ni argent ni solde retirable, utilisables selon les conditions du
                  programme.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.smiles.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucun Smile attribué par Bossiz Impact.</p>
                ) : (
                  <ul className="divide-y text-sm">
                    {data.smiles.map((s, i) => (
                      <li key={i} className="flex justify-between gap-3 py-2">
                        <span>
                          {s.description}
                          <span className="block text-xs text-muted-foreground">
                            {formatImpactDate(s.created_at)}
                            {s.expires_at ? ` · expire le ${formatImpactDate(s.expires_at)}` : ""}
                          </span>
                        </span>
                        <span className={s.points < 0 ? "text-destructive" : "font-semibold"}>
                          {s.points > 0 ? "+" : ""}
                          {s.points.toLocaleString("fr-FR")}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                <Button asChild variant="outline" size="sm">
                  <Link to="/smiles">Mon solde Bossiz Smiles</Link>
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </UserDashboardLayout>
  );
}
