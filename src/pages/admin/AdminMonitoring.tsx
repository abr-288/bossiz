import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Database,
  Download,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Surveillance du site : dernier contrôle automatique (toutes les 5 minutes,
// fonction health-check) et erreurs JavaScript remontées par les navigateurs
// et l'app mobile (table app_errors). Voir migration 20261103000000_monitoring.

interface CheckResult {
  key: string;
  label: string;
  ok: boolean;
  detail: string;
  ms?: number;
}

interface HealthRow {
  id: number;
  checked_at: string;
  ok: boolean;
  results: CheckResult[];
  alert_sent: string | null;
}

interface ErrorRow {
  id: number;
  source: "web" | "app" | "function";
  message: string;
  stack: string | null;
  url: string | null;
  release: string | null;
  user_agent: string | null;
  occurrences: number;
  first_seen: string;
  last_seen: string;
  resolved_at: string | null;
}

// Tables absentes des types générés : accès non typé, lignes typées ci-dessus.
type UntypedQuery = PromiseLike<{ data: unknown; error: { message: string } | null }> & {
  [method: string]: (...args: unknown[]) => UntypedQuery;
};
const table = (name: string) => (supabase as unknown as { from: (t: string) => UntypedQuery }).from(name);

const when = (iso: string) =>
  new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

const SOURCE_LABEL: Record<ErrorRow["source"], string> = { web: "Site", app: "App mobile", function: "Serveur" };

export default function AdminMonitoring() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showResolved, setShowResolved] = useState(false);
  const [open, setOpen] = useState<number | null>(null);
  const [running, setRunning] = useState(false);

  const health = useQuery({
    queryKey: ["admin-health-checks"],
    queryFn: async () => {
      const { data, error } = await table("health_checks")
        .select("id, checked_at, ok, results, alert_sent")
        .order("checked_at", { ascending: false })
        .limit(288);
      if (error) throw new Error(error.message);
      return (data ?? []) as HealthRow[];
    },
    refetchInterval: 60_000,
  });

  const errors = useQuery({
    queryKey: ["admin-app-errors", showResolved],
    queryFn: async () => {
      let q = table("app_errors")
        .select("id, source, message, stack, url, release, user_agent, occurrences, first_seen, last_seen, resolved_at")
        .order("last_seen", { ascending: false })
        .limit(200);
      if (!showResolved) q = q.is("resolved_at", null);
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      return (data ?? []) as ErrorRow[];
    },
    refetchInterval: 60_000,
  });

  const runNow = async () => {
    setRunning(true);
    const { error } = await supabase.functions.invoke("health-check", { body: {} });
    setRunning(false);
    if (error) {
      toast({ title: "Vérification impossible", description: error.message, variant: "destructive" });
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["admin-health-checks"] });
    queryClient.invalidateQueries({ queryKey: ["admin-app-errors"] });
  };

  const setResolved = async (id: number, resolved: boolean) => {
    const { error } = await table("app_errors")
      .update({ resolved_at: resolved ? new Date().toISOString() : null })
      .eq("id", id);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["admin-app-errors"] });
  };

  const latest = health.data?.[0];
  const rows = health.data ?? [];
  const uptime = rows.length ? Math.round((rows.filter((r) => r.ok).length / rows.length) * 1000) / 10 : null;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Surveillance</h1>
            <p className="text-muted-foreground">
              Contrôle automatique toutes les 5 minutes. En cas de panne ou de nouvelle erreur, un e-mail part vers
              l'adresse d'alerte.
            </p>
          </div>
          <Button onClick={runNow} disabled={running}>
            <RefreshCw className={`mr-2 h-4 w-4 ${running ? "animate-spin" : ""}`} />
            Vérifier maintenant
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex flex-wrap items-center gap-2 text-lg">
              <Activity className="h-5 w-5" />
              État actuel
              {latest && (
                <Badge variant={latest.ok ? "default" : "destructive"}>
                  {latest.ok ? "Tout fonctionne" : "Problème détecté"}
                </Badge>
              )}
              {uptime !== null && (
                <span className="text-sm font-normal text-muted-foreground">
                  · {uptime} % de contrôles réussis sur {rows.length} (24 h)
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {health.isLoading ? (
              <p className="text-muted-foreground">Chargement…</p>
            ) : health.isError ? (
              <p className="text-muted-foreground">
                Impossible de lire les contrôles. La migration de surveillance a-t-elle été appliquée ?
              </p>
            ) : !latest ? (
              <p className="text-muted-foreground">
                Aucun contrôle pour l'instant : cliquez sur « Vérifier maintenant ».
              </p>
            ) : (
              <>
                <p className="mb-3 text-sm text-muted-foreground">Dernier contrôle : {when(latest.checked_at)}</p>
                <ul className="divide-y">
                  {latest.results.map((c) => (
                    <li key={c.key} className="flex items-start gap-3 py-2">
                      {c.ok ? (
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-label="OK" />
                      ) : (
                        <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-label="En échec" />
                      )}
                      <div className="min-w-0">
                        <p className="font-medium">{c.label}</p>
                        <p className="break-words text-sm text-muted-foreground">
                          {c.detail}
                          {typeof c.ms === "number" ? ` · ${c.ms} ms` : ""}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex flex-wrap gap-1" aria-label="Historique des 24 dernières heures">
                  {[...rows].reverse().map((r) => (
                    <span
                      key={r.id}
                      title={`${when(r.checked_at)} — ${r.ok ? "OK" : "échec"}`}
                      className={`h-4 w-1.5 rounded-sm ${r.ok ? "bg-success" : "bg-destructive"}`}
                    />
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <BackupsCard />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-semibold">Erreurs remontées par les visiteurs</h2>
          <Button variant="outline" size="sm" onClick={() => setShowResolved((v) => !v)}>
            {showResolved ? "Masquer les résolues" : "Afficher aussi les résolues"}
          </Button>
        </div>

        {errors.isLoading ? (
          <p className="text-muted-foreground">Chargement…</p>
        ) : errors.isError ? (
          <p className="text-muted-foreground">Impossible de charger les erreurs.</p>
        ) : (errors.data ?? []).length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
              <CheckCircle2 className="h-8 w-8" />
              Aucune erreur en attente.
            </CardContent>
          </Card>
        ) : (
          <ul className="space-y-2">
            {(errors.data ?? []).map((e) => (
              <li key={e.id}>
                <Card className={e.resolved_at ? "opacity-60" : ""}>
                  <CardContent className="space-y-2 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <button
                        type="button"
                        className="flex min-w-0 items-start gap-2 text-left"
                        onClick={() => setOpen(open === e.id ? null : e.id)}
                        aria-expanded={open === e.id}
                      >
                        {open === e.id ? (
                          <ChevronDown className="mt-0.5 h-4 w-4 shrink-0" />
                        ) : (
                          <ChevronRight className="mt-0.5 h-4 w-4 shrink-0" />
                        )}
                        <span className="min-w-0">
                          <span className="block break-words font-medium">{e.message}</span>
                          <span className="block text-sm text-muted-foreground">
                            {SOURCE_LABEL[e.source]} · {e.url ?? "page inconnue"} · {e.occurrences} fois · dernière{" "}
                            {when(e.last_seen)}
                          </span>
                        </span>
                      </button>
                      <Button variant="outline" size="sm" onClick={() => setResolved(e.id, !e.resolved_at)}>
                        {e.resolved_at ? "Rouvrir" : "Marquer résolue"}
                      </Button>
                    </div>
                    {open === e.id && (
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <p>
                          Première fois : {when(e.first_seen)} · version : {e.release ?? "?"}
                        </p>
                        {e.user_agent && <p className="break-words">Navigateur : {e.user_agent}</p>}
                        {e.stack && (
                          <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded bg-muted p-2">
                            {e.stack}
                          </pre>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AdminLayout>
  );
}

// Sauvegardes nocturnes de la base (fonction backup-database, stockage privé
// db-backups, 14 jours). Voir docs/technique/12-sauvegardes.md.
function BackupsCard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  const backups = useQuery({
    queryKey: ["admin-db-backups"],
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from("db-backups")
        .list("", { limit: 100, sortBy: { column: "name", order: "desc" } });
      if (error) throw error;
      return (data ?? []).filter((f) => f.name.endsWith(".jsonl.gz"));
    },
  });

  const backupNow = async () => {
    setSaving(true);
    const { data, error } = await supabase.functions.invoke("backup-database", { body: {} });
    setSaving(false);
    if (error || !data?.success) {
      toast({
        title: "Sauvegarde incomplète",
        description: error?.message ?? (data?.errors ?? []).join(" ; ") ?? "Erreur inconnue",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Sauvegarde faite",
        description: `${data.rows} lignes, ${data.tables} tables, ${Math.round(data.sizeBytes / 1024)} Ko`,
      });
    }
    queryClient.invalidateQueries({ queryKey: ["admin-db-backups"] });
  };

  const download = async (name: string) => {
    const { data, error } = await supabase.storage.from("db-backups").createSignedUrl(name, 300, { download: true });
    if (error || !data?.signedUrl) {
      toast({ title: "Téléchargement impossible", description: error?.message, variant: "destructive" });
      return;
    }
    window.location.assign(data.signedUrl);
  };

  const files = backups.data ?? [];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-lg">
          <span className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Sauvegardes de la base
          </span>
          <Button variant="outline" size="sm" onClick={backupNow} disabled={saving}>
            <RefreshCw className={`mr-2 h-4 w-4 ${saving ? "animate-spin" : ""}`} />
            Sauvegarder maintenant
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Toutes les tables et les comptes, chaque nuit à 03:30 (heure d'Abidjan), gardées 14 jours. Téléchargez-en une
          de temps en temps et gardez-la hors de Supabase.
        </p>
        {backups.isLoading ? (
          <p className="text-muted-foreground">Chargement…</p>
        ) : backups.isError ? (
          <p className="text-muted-foreground">
            Impossible de lire les sauvegardes. La migration 20261104000000 a-t-elle été appliquée ?
          </p>
        ) : files.length === 0 ? (
          <p className="text-muted-foreground">Aucune sauvegarde pour l'instant.</p>
        ) : (
          <ul className="divide-y">
            {files.map((f) => {
              const size = (f.metadata as { size?: number } | null)?.size;
              return (
                <li key={f.name} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span className="min-w-0 break-words text-sm">
                    {f.name}
                    {typeof size === "number" ? ` · ${Math.round(size / 1024)} Ko` : ""}
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => download(f.name)}>
                    <Download className="mr-2 h-4 w-4" />
                    Télécharger
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
