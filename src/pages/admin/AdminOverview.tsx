import { AdminLayout } from "@/components/admin/AdminLayout";
import { DashboardCustomizer } from "@/components/admin/DashboardCustomizer";
import { CustomizableDashboard } from "@/components/admin/CustomizableDashboard";
import { useAdminStats } from "@/hooks/useAdminStats";
import { useDashboardPreferences } from "@/hooks/useDashboardPreferences";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, Layers } from "lucide-react";
import { useTranslation } from "react-i18next";

const AdminOverview = () => {
  const { t } = useTranslation();
  const { stats, loading, refetch } = useAdminStats();
  const { activeLayout, loading: layoutLoading } = useDashboardPreferences();

  if (loading || layoutLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              {activeLayout?.layoutName === "default" 
                ? t("ux.bo.overviewPlatformRealTime") 
                : `Vue: ${activeLayout?.layoutName} - Temps réel`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="gap-2">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
              {t("ux.bo.realTime")}
            </Badge>
            <DashboardCustomizer />
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => refetch()}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {t("ux.bo.refresh")}
            </Button>
          </div>
        </div>

        <CustomizableDashboard 
          widgetsConfig={activeLayout?.widgetsConfig || []} 
          stats={stats}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminOverview;
