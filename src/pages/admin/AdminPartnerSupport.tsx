import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { LifeBuoy, Mail } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDay } from "@/lib/adminFinance";

const STATUSES = ["open", "in_progress", "resolved", "closed"] as const;

// Tickets ouverts par les partenaires depuis leur rubrique Assistance. Le
// partenaire voit le statut changer dans son espace ; la réponse se fait par
// e-mail.
export default function AdminPartnerSupport() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"active" | "all">("active");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-partner-tickets"],
    queryFn: async () => {
      const { data: tickets, error } = await supabase
        .from("partner_support_tickets")
        .select("id, agency_id, topic, subject, message, status, created_at, updated_at")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      const ids = [...new Set((tickets ?? []).map((x) => x.agency_id))];
      const { data: agencies } = ids.length
        ? await supabase.from("agencies").select("id, name, contact_email").in("id", ids)
        : { data: [] };
      const byId = new Map((agencies ?? []).map((a) => [a.id, a]));
      return (tickets ?? []).map((x) => ({ ...x, agency: byId.get(x.agency_id) ?? null }));
    },
  });

  const tickets = useMemo(
    () => (data ?? []).filter((x) => filter === "all" || x.status === "open" || x.status === "in_progress"),
    [data, filter],
  );

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("partner_support_tickets")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      toast({ title: "Erreur", description: "Impossible de changer le statut.", variant: "destructive" });
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["admin-partner-tickets"] });
    queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Support partenaires</h1>
            <p className="text-muted-foreground">
              Demandes envoyées par les partenaires depuis leur espace. Une copie arrive aussi par e-mail au support.
            </p>
          </div>
          <Select value={filter} onValueChange={(v) => setFilter(v as "active" | "all")}>
            <SelectTrigger className="w-[200px]" aria-label="Afficher">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Ouverts et en cours</SelectItem>
              <SelectItem value="all">Tous les tickets</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">Chargement…</p>
        ) : isError ? (
          <p className="text-muted-foreground">Impossible de charger les tickets.</p>
        ) : tickets.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
              <LifeBuoy className="h-8 w-8" />
              Aucun ticket {filter === "active" ? "en attente" : ""}.
            </CardContent>
          </Card>
        ) : (
          <ul className="space-y-3">
            {tickets.map((x) => (
              <li key={x.id}>
                <Card>
                  <CardContent className="space-y-3 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-medium">{x.subject}</p>
                        <p className="text-sm text-muted-foreground">
                          {x.agency?.name ?? "Partenaire supprimé"} · {formatDay(x.created_at)} · réf.{" "}
                          {x.id.slice(0, 8).toUpperCase()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{t(`ux.partner.support.topics.${x.topic}`)}</Badge>
                        <Select value={x.status} onValueChange={(v) => setStatus(x.id, v)}>
                          <SelectTrigger className="h-8 w-[130px]" aria-label="Statut">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUSES.map((s) => (
                              <SelectItem key={s} value={s}>
                                {t(`ux.partner.support.status.${s}`)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <p className="whitespace-pre-wrap text-sm">{x.message}</p>
                    {x.agency?.contact_email && (
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={`mailto:${x.agency.contact_email}?subject=${encodeURIComponent(
                            `Re: ${x.subject} (ticket ${x.id.slice(0, 8).toUpperCase()})`,
                          )}`}
                        >
                          <Mail className="mr-2 h-4 w-4" />
                          Répondre par e-mail
                        </a>
                      </Button>
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
