import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { getErrorMessage } from "@/lib/errorMessage";

const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/^(\d)/, "c_$1")
    .slice(0, 40);

// Configuration du menu de l'espace partenaire : chaque catégorie active une
// liste de modules (public.partner_category_modules). Les modules communs
// (tableau de bord, finances, avis…) sont visibles pour toutes.
export default function AdminPartnerCategories() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [newLabel, setNewLabel] = useState("");
  const [creating, setCreating] = useState(false);

  const config = useQuery({
    queryKey: ["admin-partner-categories"],
    queryFn: async () => {
      const [categories, modules, links, agencies] = await Promise.all([
        supabase.from("partner_categories").select("*").order("sort_order"),
        supabase.from("partner_modules").select("*").order("sort_order"),
        supabase.from("partner_category_modules").select("category_key, module_key"),
        supabase.from("agencies").select("category"),
      ]);
      const error = categories.error || modules.error || links.error || agencies.error;
      if (error) throw error;
      const partnersByCategory: Record<string, number> = {};
      for (const a of agencies.data ?? []) {
        if (a.category) partnersByCategory[a.category] = (partnersByCategory[a.category] ?? 0) + 1;
      }
      return {
        categories: categories.data ?? [],
        modules: modules.data ?? [],
        links: new Set((links.data ?? []).map((l) => `${l.category_key}:${l.module_key}`)),
        partnersByCategory,
      };
    },
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin-partner-categories"] });

  const toggleModule = async (category: string, module: string, checked: boolean) => {
    const { error } = checked
      ? await supabase.from("partner_category_modules").insert({ category_key: category, module_key: module })
      : await supabase.from("partner_category_modules").delete().eq("category_key", category).eq("module_key", module);
    if (error) toast.error(getErrorMessage(error));
    refresh();
  };

  const toggleActive = async (category: string, isActive: boolean) => {
    const { error } = await supabase
      .from("partner_categories")
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq("key", category);
    if (error) toast.error(getErrorMessage(error));
    refresh();
  };

  const createCategory = async (event: React.FormEvent) => {
    event.preventDefault();
    const label = newLabel.trim();
    const key = slugify(label);
    if (key.length < 2) return;
    setCreating(true);
    const maxOrder = Math.max(0, ...(config.data?.categories ?? []).map((c) => c.sort_order));
    const { error } = await supabase.from("partner_categories").insert({ key, label, sort_order: maxOrder + 10 });
    setCreating(false);
    if (error) {
      toast.error(getErrorMessage(error));
      return;
    }
    setNewLabel("");
    toast.success(t("ux.partner.admin.created"));
    refresh();
  };

  const optionalModules = (config.data?.modules ?? []).filter((m) => !m.is_core);
  const coreModules = (config.data?.modules ?? []).filter((m) => m.is_core);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{t("ux.partner.admin.title")}</h1>
          <p className="text-muted-foreground">{t("ux.partner.admin.subtitle")}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("ux.partner.admin.newCategory")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={createCategory} className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-2">
                <Label htmlFor="category-label">{t("ux.partner.admin.label")}</Label>
                <Input
                  id="category-label"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder={t("ux.partner.admin.labelPlaceholder")}
                  minLength={2}
                  maxLength={80}
                  required
                />
                {newLabel.trim() && (
                  <p className="text-xs text-muted-foreground">
                    {t("ux.partner.admin.key")} : <code>{slugify(newLabel)}</code>
                  </p>
                )}
              </div>
              <Button type="submit" disabled={creating}>
                <Plus className="mr-2 h-4 w-4" />
                {t("ux.partner.admin.create")}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("ux.partner.admin.matrix")}</CardTitle>
            <CardDescription>
              {t("ux.partner.admin.matrixHelp", { core: coreModules.map((m) => m.label).join(", ") })}
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            {config.isLoading ? (
              <p className="p-6 text-muted-foreground">{t("ux.partner.loading")}</p>
            ) : config.isError ? (
              <p className="p-6 text-muted-foreground">{t("ux.partner.loadError")}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-48">{t("ux.partner.admin.category")}</TableHead>
                    {optionalModules.map((m) => (
                      <TableHead key={m.key} className="min-w-24 text-center text-xs">
                        {m.label}
                      </TableHead>
                    ))}
                    <TableHead className="text-center">{t("ux.partner.admin.offered")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {config.data!.categories.map((c) => (
                    <TableRow key={c.key}>
                      <TableCell>
                        <p className="font-medium">{c.label}</p>
                        <p className="text-xs text-muted-foreground">
                          <code>{c.key}</code> ·{" "}
                          {t("ux.partner.admin.partners", { count: config.data!.partnersByCategory[c.key] ?? 0 })}
                        </p>
                      </TableCell>
                      {optionalModules.map((m) => {
                        const checked = config.data!.links.has(`${c.key}:${m.key}`);
                        return (
                          <TableCell key={m.key} className="text-center">
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(value) => toggleModule(c.key, m.key, value === true)}
                              aria-label={`${c.label} – ${m.label}`}
                            />
                          </TableCell>
                        );
                      })}
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Switch
                            checked={c.is_active}
                            onCheckedChange={(value) => toggleActive(c.key, value)}
                            aria-label={t("ux.partner.admin.offered")}
                          />
                          {!c.is_active && <Badge variant="outline">{t("ux.partner.admin.hidden")}</Badge>}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
