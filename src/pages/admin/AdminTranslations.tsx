import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/ui/empty-state";
import { Languages } from "lucide-react";
import {
  TRANSLATABLE_FIELDS,
  requestContentTranslation,
  type ContentTranslations,
  type TranslatedValue,
} from "@/lib/translatableContent";

type Lang = "en" | "zh";
type Row = Record<string, unknown> & { id: string; translations?: ContentTranslations };

const TABLE_LABEL_KEYS: Record<string, string> = {
  advertisements: "ux.translations.table_advertisements",
  promotions: "ux.translations.table_promotions",
  subscription_plans: "ux.translations.table_subscriptionPlans",
  car_partner_plans: "ux.translations.table_carPlans",
  homepage_features: "ux.translations.table_reassurance",
  services: "ux.translations.table_services",
  activities: "ux.translations.table_activities",
  stays: "ux.translations.table_stays",
  restaurants: "ux.translations.table_restaurants",
  artisans: "ux.translations.table_artisans",
  wellness_services: "ux.translations.table_wellness",
};

const asText = (v: unknown) => (Array.isArray(v) ? v.join("\n") : typeof v === "string" ? v : "");
const rowTitle = (row: Row) => asText(row.name ?? row.title ?? row.bio ?? row.description).slice(0, 80) || row.id;

/**
 * Relecture des traductions automatiques. Une valeur modifiée ici est marquée
 * « corrigée à la main » et n'est plus remplacée tant que le texte français
 * du champ ne change pas.
 */
const AdminTranslations = () => {
  const { t } = useTranslation();
  const [table, setTable] = useState("advertisements");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [missingColumn, setMissingColumn] = useState(false);
  const [running, setRunning] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const fields = TRANSLATABLE_FIELDS[table];

  const load = useCallback(async () => {
    setLoading(true);
    setDrafts({});
    const { data, error } = await supabase
      .from(table as "advertisements")
      .select(["id", "translations", ...fields].join(","));
    setMissingColumn(Boolean(error && /translations/i.test(error.message)));
    setRows(error ? [] : ((data ?? []) as unknown as Row[]));
    setLoading(false);
  }, [table, fields]);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const filled = rows.filter((r) => fields.some((f) => asText(r[f])));
    const done = filled.filter((r) => r.translations?.en && r.translations?.zh);
    return { total: filled.length, done: done.length };
  }, [rows, fields]);

  const runNow = async () => {
    setRunning(true);
    const result = await requestContentTranslation(table);
    setRunning(false);
    if (result?.errors?.length && !result.translated) {
      // Message exact (ex. « Claude 401 : invalid x-api-key ») pour savoir quoi corriger
      toast.error(t("ux.translations.runError"), { description: String(result.errors[0]).slice(0, 200), duration: 15000 });
    } else {
      toast.success(t("ux.translations.runDone", { count: result?.translated ?? 0 }));
      if (result?.pending) toast.info(t("ux.translations.runPending", { count: result.pending }));
    }
    load();
  };

  const draftKey = (rowId: string, lang: Lang, field: string) => `${rowId}|${lang}|${field}`;

  const save = async (row: Row) => {
    const current = row.translations ?? {};
    const next: ContentTranslations = { ...current, manual: { en: [...(current.manual?.en ?? [])], zh: [...(current.manual?.zh ?? [])] } };
    let changed = false;
    for (const lang of ["en", "zh"] as Lang[]) {
      const values = { ...(current[lang] ?? {}) };
      for (const field of fields) {
        const key = draftKey(row.id, lang, field);
        if (!(key in drafts)) continue;
        const text = drafts[key];
        const value: TranslatedValue = Array.isArray(row[field]) ? text.split("\n").filter((l) => l.trim()) : text;
        values[field] = value;
        if (!next.manual![lang]!.includes(field)) next.manual![lang]!.push(field);
        changed = true;
      }
      next[lang] = values;
    }
    if (!changed) return;
    setSaving(row.id);
    const { error } = await supabase
      .from(table as "advertisements")
      .update({ translations: next } as never)
      .eq("id", row.id);
    setSaving(null);
    if (error) {
      toast.error(t("ux.translations.saveError"));
      return;
    }
    toast.success(t("ux.translations.saved"));
    load();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t("ux.translations.title")}</h1>
            <p className="mt-1 text-muted-foreground">{t("ux.translations.subtitle")}</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Select value={table} onValueChange={setTable}>
              <SelectTrigger className="sm:w-64" aria-label={t("ux.translations.contentType")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(TRANSLATABLE_FIELDS).map((key) => (
                  <SelectItem key={key} value={key}>
                    {t(TABLE_LABEL_KEYS[key])}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={runNow} disabled={running || missingColumn}>
              {running ? t("ux.translations.running") : t("ux.translations.runNow")}
            </Button>
          </div>
        </div>

        {missingColumn && (
          <Card className="border-warning-foreground/30 bg-warning">
            <CardContent className="p-4 text-sm text-warning-foreground">{t("ux.translations.missingColumn")}</CardContent>
          </Card>
        )}

        {!missingColumn && !loading && (
          <p className="text-sm text-muted-foreground">
            {t("ux.translations.progress", { done: stats.done, total: stats.total })}
          </p>
        )}

        {loading ? (
          <Skeleton className="h-64" />
        ) : rows.length === 0 ? (
          <Card>
            <EmptyState icon={Languages} title={t("ux.translations.empty")} />
          </Card>
        ) : (
          <div className="space-y-4">
            {rows.map((row) => {
              const manual = row.translations?.manual ?? {};
              const hasDraft = Object.keys(drafts).some((k) => k.startsWith(`${row.id}|`));
              return (
                <Card key={row.id}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{rowTitle(row)}</CardTitle>
                    {!row.translations?.en && <CardDescription>{t("ux.translations.notYet")}</CardDescription>}
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {fields
                      .filter((field) => asText(row[field]))
                      .map((field) => (
                        <div key={field} className="grid gap-3 lg:grid-cols-3">
                          <div>
                            <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">FR · {field}</p>
                            <p className="whitespace-pre-line text-sm">{asText(row[field])}</p>
                          </div>
                          {(["en", "zh"] as Lang[]).map((lang) => {
                            const key = draftKey(row.id, lang, field);
                            const value = key in drafts ? drafts[key] : asText(row.translations?.[lang]?.[field]);
                            const multiline = Array.isArray(row[field]) || asText(row[field]).length > 60;
                            const Field = multiline ? Textarea : Input;
                            return (
                              <div key={lang}>
                                <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
                                  {lang.toUpperCase()}
                                  {manual[lang]?.includes(field) && (
                                    <Badge variant="secondary">{t("ux.translations.manual")}</Badge>
                                  )}
                                </p>
                                <Field
                                  aria-label={`${field} ${lang}`}
                                  value={value}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                                    setDrafts((d) => ({ ...d, [key]: e.target.value }))
                                  }
                                />
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    <div className="flex justify-end">
                      <Button variant="secondary" onClick={() => save(row)} disabled={!hasDraft || saving === row.id}>
                        {t("ux.translations.save")}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminTranslations;
