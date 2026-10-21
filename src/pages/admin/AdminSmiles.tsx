import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { AlertTriangle, Loader2, Minus, Plus, RefreshCw, Save, Search, Smile } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { currentLocaleTag } from "@/lib/dateLocale";

interface Stats {
  members: number;
  outstanding: number;
  earned_30d: number;
  used_30d: number;
  expired_30d: number;
  referrals: number;
}

interface Member {
  user_id: string;
  full_name: string | null;
  email: string;
  referral_code: string | null;
  balance: number;
  lifetime: number;
  last_activity: string | null;
}

interface Tier {
  code: string;
  name: string;
  min_points: number;
  multiplier: number;
}

interface MemberTransaction {
  id: string;
  kind: string;
  points: number;
  status: string;
  description: string | null;
  created_at: string;
}

type SettingsForm = Record<string, string>;

// Paramètres numériques du programme, dans l'ordre d'affichage
const SETTING_FIELDS: { key: string; percent?: boolean; step?: string }[] = [
  { key: "points_per_100_xof", step: "0.1" },
  { key: "point_value_xof", step: "0.1" },
  { key: "max_redeem_ratio", percent: true },
  { key: "min_redeem_points" },
  { key: "points_validity_months" },
  { key: "daily_checkin_points" },
  { key: "streak_days" },
  { key: "streak_bonus_points" },
  { key: "referral_referrer_points" },
  { key: "referral_referee_points" },
];

export default function AdminSmiles() {
  const { t } = useTranslation();
  const nf = new Intl.NumberFormat(currentLocaleTag());
  const fmt = (n: number) => nf.format(Math.round(n));

  const [stats, setStats] = useState<Stats | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState("");
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [settings, setSettings] = useState<SettingsForm>({});
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [savingSettings, setSavingSettings] = useState(false);

  const [selected, setSelected] = useState<Member | null>(null);
  const [history, setHistory] = useState<MemberTransaction[]>([]);
  const [mode, setMode] = useState<"add" | "remove">("add");
  const [points, setPoints] = useState("");
  const [reason, setReason] = useState("");
  const [adjusting, setAdjusting] = useState(false);

  const loadStats = useCallback(async () => {
    const { data } = await supabase.rpc("loyalty_admin_stats");
    setStats((data as unknown as Stats) ?? null);
  }, []);

  const loadMembers = useCallback(async (term: string) => {
    setLoadingMembers(true);
    const { data, error } = await supabase.rpc("loyalty_admin_members", { p_search: term, p_limit: 50 });
    if (error) toast.error(error.message);
    setMembers((data as Member[] | null) ?? []);
    setLoadingMembers(false);
  }, []);

  const loadSettings = useCallback(async () => {
    const [{ data: row }, { data: tierRows }] = await Promise.all([
      supabase.from("loyalty_settings").select("*").maybeSingle(),
      supabase.from("loyalty_tiers").select("*").order("min_points"),
    ]);
    if (row) {
      const form: SettingsForm = {};
      for (const { key, percent } of SETTING_FIELDS) {
        const value = Number((row as Record<string, unknown>)[key] ?? 0);
        form[key] = String(percent ? Math.round(value * 1000) / 10 : value);
      }
      setSettings(form);
    }
    setTiers((tierRows as Tier[] | null) ?? []);
  }, []);

  useEffect(() => {
    void loadStats();
    void loadSettings();
  }, [loadStats, loadSettings]);

  // Recherche avec un léger délai pendant la frappe
  useEffect(() => {
    const timer = setTimeout(() => void loadMembers(search), 300);
    return () => clearTimeout(timer);
  }, [search, loadMembers]);

  const openMember = async (member: Member) => {
    setSelected(member);
    setMode("add");
    setPoints("");
    setReason("");
    const { data } = await supabase
      .from("loyalty_transactions")
      .select("id, kind, points, status, description, created_at")
      .eq("user_id", member.user_id)
      .order("created_at", { ascending: false })
      .limit(30);
    setHistory((data as MemberTransaction[] | null) ?? []);
  };

  const submitAdjustment = async () => {
    if (!selected) return;
    const amount = Math.floor(Number(points));
    if (!amount || amount <= 0 || !reason.trim()) {
      toast.error(t("ux.smilesAdmin.adjustInvalid"));
      return;
    }
    setAdjusting(true);
    const { data, error } = await supabase.rpc("loyalty_admin_adjust", {
      p_user: selected.user_id,
      p_points: mode === "add" ? amount : -amount,
      p_reason: reason.trim(),
    });
    setAdjusting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    const balance = (data as { balance: number } | null)?.balance ?? selected.balance;
    toast.success(t("ux.smilesAdmin.adjustDone", { balance: fmt(balance) }));
    const updated = { ...selected, balance };
    setMembers((list) => list.map((m) => (m.user_id === updated.user_id ? updated : m)));
    void openMember(updated);
    void loadStats();
  };

  const saveSettings = async () => {
    const payload: Record<string, number> = {};
    for (const { key, percent } of SETTING_FIELDS) {
      const value = Number(settings[key]);
      if (!Number.isFinite(value) || value < 0 || (percent && value > 100)) {
        toast.error(t("ux.smilesAdmin.invalidValue", { field: t(`ux.smilesAdmin.field_${key}`) }));
        return;
      }
      payload[key] = percent ? value / 100 : value;
    }
    for (const tier of tiers) {
      if (!Number.isFinite(Number(tier.min_points)) || Number(tier.min_points) < 0 || !(Number(tier.multiplier) > 0)) {
        toast.error(t("ux.smilesAdmin.invalidTier", { tier: tier.name }));
        return;
      }
    }

    setSavingSettings(true);
    const { error } = await supabase
      .from("loyalty_settings")
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq("id", true);
    let tierError = null;
    for (const tier of tiers) {
      const { error: e } = await supabase
        .from("loyalty_tiers")
        .update({ min_points: Math.floor(Number(tier.min_points)), multiplier: Number(tier.multiplier) })
        .eq("code", tier.code);
      tierError = tierError ?? e;
    }
    setSavingSettings(false);
    if (error || tierError) {
      toast.error((error ?? tierError)!.message);
      return;
    }
    toast.success(t("ux.smilesAdmin.settingsSaved"));
    void loadSettings();
  };

  const ratio = Number(settings.max_redeem_ratio);
  const statCards = stats
    ? [
        { label: t("ux.smilesAdmin.statMembers"), value: fmt(stats.members) },
        {
          label: t("ux.smilesAdmin.statOutstanding"),
          value: fmt(stats.outstanding),
          hint: t("ux.smilesAdmin.statOutstandingHint", {
            amount: fmt(stats.outstanding * Number(settings.point_value_xof || 1)),
          }),
        },
        { label: t("ux.smilesAdmin.statEarned"), value: `+${fmt(stats.earned_30d)}` },
        { label: t("ux.smilesAdmin.statUsed"), value: `−${fmt(stats.used_30d)}` },
        { label: t("ux.smilesAdmin.statExpired"), value: `−${fmt(stats.expired_30d)}` },
        { label: t("ux.smilesAdmin.statReferrals"), value: fmt(stats.referrals) },
      ]
    : [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
              <Smile className="h-6 w-6 text-primary" />
              {t("ux.smilesAdmin.title")}
            </h1>
            <p className="text-muted-foreground">{t("ux.smilesAdmin.subtitle")}</p>
          </div>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => {
              void loadStats();
              void loadMembers(search);
              void loadSettings();
            }}
          >
            <RefreshCw className="h-4 w-4" />
            {t("ux.bo.refresh")}
          </Button>
        </div>

        <Tabs defaultValue="members" className="space-y-6">
          <TabsList>
            <TabsTrigger value="members">{t("ux.smilesAdmin.tabMembers")}</TabsTrigger>
            <TabsTrigger value="settings">{t("ux.smilesAdmin.tabSettings")}</TabsTrigger>
          </TabsList>

          {/* --------------------------- Membres --------------------------- */}
          <TabsContent value="members" className="space-y-6">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
              {statCards.map((card) => (
                <Card key={card.label}>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">{card.label}</p>
                    <p className="mt-1 text-2xl font-bold tabular-nums">{card.value}</p>
                    {card.hint && <p className="mt-1 text-xs text-muted-foreground">{card.hint}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>{t("ux.smilesAdmin.membersTitle")}</CardTitle>
                <CardDescription>{t("ux.smilesAdmin.membersDesc")}</CardDescription>
                <div className="relative pt-2">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 translate-y-[-25%] text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t("ux.smilesAdmin.searchPlaceholder")}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              <CardContent>
                {loadingMembers ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : members.length === 0 ? (
                  <p className="py-12 text-center text-muted-foreground">{t("ux.smilesAdmin.noMember")}</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("ux.smilesAdmin.colCustomer")}</TableHead>
                          <TableHead>{t("ux.smilesAdmin.colCode")}</TableHead>
                          <TableHead className="text-right">{t("ux.smilesAdmin.colBalance")}</TableHead>
                          <TableHead className="text-right">{t("ux.smilesAdmin.colLifetime")}</TableHead>
                          <TableHead>{t("ux.smilesAdmin.colLastActivity")}</TableHead>
                          <TableHead />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {members.map((member) => (
                          <TableRow key={member.user_id}>
                            <TableCell>
                              <p className="font-medium">{member.full_name || "-"}</p>
                              <p className="text-xs text-muted-foreground">{member.email}</p>
                            </TableCell>
                            <TableCell className="font-mono text-sm">{member.referral_code || "-"}</TableCell>
                            <TableCell className="text-right font-semibold tabular-nums">
                              {fmt(member.balance)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-muted-foreground">
                              {fmt(member.lifetime)}
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                              {member.last_activity
                                ? new Date(member.last_activity).toLocaleDateString(currentLocaleTag())
                                : "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button size="sm" variant="outline" onClick={() => void openMember(member)}>
                                {t("ux.smilesAdmin.manage")}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* -------------------------- Paramètres -------------------------- */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("ux.smilesAdmin.ratesTitle")}</CardTitle>
                <CardDescription>{t("ux.smilesAdmin.ratesDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-5 md:grid-cols-2">
                  {SETTING_FIELDS.map(({ key, percent, step }) => (
                    <div key={key} className="space-y-1.5">
                      <Label htmlFor={`setting-${key}`}>{t(`ux.smilesAdmin.field_${key}`)}</Label>
                      <div className="relative">
                        <Input
                          id={`setting-${key}`}
                          type="number"
                          min={0}
                          max={percent ? 100 : undefined}
                          step={step ?? "1"}
                          value={settings[key] ?? ""}
                          onChange={(e) => setSettings((form) => ({ ...form, [key]: e.target.value }))}
                          className={percent ? "pr-8" : undefined}
                        />
                        {percent && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                            %
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{t(`ux.smilesAdmin.help_${key}`)}</p>
                    </div>
                  ))}
                </div>

                {ratio > 10 && (
                  <div className="flex gap-3 rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm">
                    <AlertTriangle className="h-5 w-5 shrink-0 text-warning-foreground" />
                    <p>{t("ux.smilesAdmin.ratioWarning")}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("ux.smilesAdmin.tiersTitle")}</CardTitle>
                <CardDescription>{t("ux.smilesAdmin.tiersDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tiers.map((tier, index) => (
                    <div key={tier.code} className="grid grid-cols-[1fr_1fr_1fr] items-end gap-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">{t("ux.smilesAdmin.tierName")}</Label>
                        <p className="mt-2 font-semibold">{t(`ux.smiles.tier_${tier.code}`, tier.name)}</p>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`tier-min-${tier.code}`} className="text-xs text-muted-foreground">
                          {t("ux.smilesAdmin.tierMin")}
                        </Label>
                        <Input
                          id={`tier-min-${tier.code}`}
                          type="number"
                          min={0}
                          disabled={index === 0}
                          value={tier.min_points}
                          onChange={(e) =>
                            setTiers((list) =>
                              list.map((item) =>
                                item.code === tier.code ? { ...item, min_points: Number(e.target.value) } : item,
                              ),
                            )
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`tier-mult-${tier.code}`} className="text-xs text-muted-foreground">
                          {t("ux.smilesAdmin.tierMultiplier")}
                        </Label>
                        <Input
                          id={`tier-mult-${tier.code}`}
                          type="number"
                          min={0}
                          step="0.05"
                          value={tier.multiplier}
                          onChange={(e) =>
                            setTiers((list) =>
                              list.map((item) =>
                                item.code === tier.code ? { ...item, multiplier: Number(e.target.value) } : item,
                              ),
                            )
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={() => void saveSettings()} disabled={savingSettings} className="gap-2">
                {savingSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {t("ux.smilesAdmin.save")}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* ----------------------- Fiche d'un client ----------------------- */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.full_name || selected.email}</DialogTitle>
                <DialogDescription>
                  {selected.email}
                  {selected.referral_code && ` · ${selected.referral_code}`}
                </DialogDescription>
              </DialogHeader>

              <div className="rounded-2xl bg-primary/5 p-4 text-center">
                <p className="text-sm text-muted-foreground">{t("ux.smilesAdmin.colBalance")}</p>
                <p className="text-3xl font-extrabold tabular-nums">
                  {fmt(selected.balance)} <span className="text-base font-semibold text-muted-foreground">Smiles</span>
                </p>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={mode === "add" ? "default" : "outline"}
                    onClick={() => setMode("add")}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    {t("ux.smilesAdmin.add")}
                  </Button>
                  <Button
                    type="button"
                    variant={mode === "remove" ? "destructive" : "outline"}
                    onClick={() => setMode("remove")}
                    className="gap-2"
                  >
                    <Minus className="h-4 w-4" />
                    {t("ux.smilesAdmin.remove")}
                  </Button>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="adjust-points">{t("ux.smilesAdmin.points")}</Label>
                  <Input
                    id="adjust-points"
                    type="number"
                    min={1}
                    value={points}
                    onChange={(e) => setPoints(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="adjust-reason">{t("ux.smilesAdmin.reason")}</Label>
                  <Textarea
                    id="adjust-reason"
                    value={reason}
                    maxLength={200}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder={t("ux.smilesAdmin.reasonPlaceholder")}
                  />
                </div>
                <Button className="w-full" onClick={() => void submitAdjustment()} disabled={adjusting}>
                  {adjusting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {mode === "add" ? t("ux.smilesAdmin.confirmAdd") : t("ux.smilesAdmin.confirmRemove")}
                </Button>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold">{t("ux.smiles.historyTitle")}</p>
                {history.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">{t("ux.smilesAdmin.noHistory")}</p>
                ) : (
                  <ul className="divide-y divide-border text-sm">
                    {history.map((row) => (
                      <li key={row.id} className="flex items-center justify-between gap-3 py-2">
                        <div className="min-w-0">
                          <p className="truncate">
                            {row.kind === "adjustment" && row.description
                              ? row.description
                              : t(`ux.smiles.kind_${row.kind}`, row.description ?? row.kind)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(row.created_at).toLocaleString(currentLocaleTag())}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p
                            className={cn(
                              "font-semibold tabular-nums",
                              row.status === "cancelled"
                                ? "text-muted-foreground line-through"
                                : row.points > 0
                                  ? "text-success"
                                  : "",
                            )}
                          >
                            {row.points > 0 ? "+" : "−"}
                            {fmt(Math.abs(row.points))}
                          </p>
                          {row.status !== "posted" && (
                            <Badge variant="outline" className="text-[10px]">
                              {t(`ux.smilesAdmin.status_${row.status}`)}
                            </Badge>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
