import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ImpactCampaignForm } from "@/components/impact/admin/ImpactCampaignForm";
import { ImpactMembersPanel } from "@/components/impact/admin/ImpactMembersPanel";
import { ImpactOffersManager } from "@/components/impact/admin/ImpactOffersManager";
import { ImpactOverview } from "@/components/impact/admin/ImpactOverview";
import { ImpactReportsPanel } from "@/components/impact/admin/ImpactReportsPanel";
import { ImpactServicesManager } from "@/components/impact/admin/ImpactServicesManager";
import { ImpactTransactionsPanel } from "@/components/impact/admin/ImpactTransactionsPanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

const STATUS_LABEL: Record<string, string> = {
  draft: "Brouillon",
  active: "Active",
  suspended: "Suspendue",
  closed: "Terminée",
};

// Pilotage de Bossiz Impact. Les droits sont vérifiés côté serveur (RLS et
// fonctions réservées aux admins) ; cette page ne fait qu'afficher.
export default function AdminImpact() {
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const campaigns = useQuery({
    queryKey: ["impact-admin-campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase.from("impact_campaigns").select("*").order("created_at");
      if (error) throw error;
      return data ?? [];
    },
  });
  const list = campaigns.data ?? [];
  const campaign = list.find((c) => c.id === campaignId) ?? list[0];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Bossiz Impact</h1>
            <p className="text-muted-foreground">Collecte, formules, membres, avantages Bossiz Smiles et rapports.</p>
          </div>
          {campaign && (
            <div className="flex flex-wrap items-center gap-2">
              {list.length > 1 && (
                <Select value={campaign.id} onValueChange={setCampaignId}>
                  <SelectTrigger className="w-64" aria-label="Campagne">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {list.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Badge variant={campaign.status === "active" ? "default" : "outline"}>
                {STATUS_LABEL[campaign.status] ?? campaign.status}
              </Badge>
              <Button variant="outline" asChild>
                <a href={`/bossiz-impact/${campaign.slug}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  {campaign.status === "draft" ? "Aperçu" : "Voir la page"}
                </a>
              </Button>
            </div>
          )}
        </div>

        {campaigns.isLoading ? (
          <p className="text-muted-foreground">Chargement…</p>
        ) : !campaign ? (
          <p className="text-muted-foreground">
            Aucune campagne. Exécutez la migration 20261029000000_bossiz_impact.sql pour créer la campagne initiale.
          </p>
        ) : (
          <Tabs defaultValue="overview">
            <TabsList className="h-auto flex-wrap">
              <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
              <TabsTrigger value="campaign">Campagne</TabsTrigger>
              <TabsTrigger value="offers">Formules et avantages</TabsTrigger>
              <TabsTrigger value="services">Services éligibles</TabsTrigger>
              <TabsTrigger value="members">Membres</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="reports">Rapports et journal</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="mt-6">
              <ImpactOverview campaignId={campaign.id} />
            </TabsContent>
            <TabsContent value="campaign" className="mt-6">
              <ImpactCampaignForm campaign={campaign} />
            </TabsContent>
            <TabsContent value="offers" className="mt-6">
              <ImpactOffersManager campaignId={campaign.id} />
            </TabsContent>
            <TabsContent value="services" className="mt-6">
              <ImpactServicesManager />
            </TabsContent>
            <TabsContent value="members" className="mt-6">
              <ImpactMembersPanel campaignId={campaign.id} />
            </TabsContent>
            <TabsContent value="transactions" className="mt-6">
              <ImpactTransactionsPanel campaignId={campaign.id} />
            </TabsContent>
            <TabsContent value="reports" className="mt-6">
              <ImpactReportsPanel campaignId={campaign.id} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AdminLayout>
  );
}
