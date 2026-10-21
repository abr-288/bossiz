import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/lib/errorMessage";

export type WidgetConfig = {
  id: string;
  type: string;
  visible: boolean;
  order: number;
};

export interface DashboardLayout {
  id?: string;
  layoutName: string;
  widgetsConfig: WidgetConfig[];
  isActive: boolean;
}

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: "stats-cards", type: "stats", visible: true, order: 0 },
  { id: "conversion-metrics", type: "conversion", visible: true, order: 1 },
  { id: "revenue-chart", type: "revenue", visible: true, order: 2 },
  { id: "service-chart", type: "service", visible: true, order: 3 },
  { id: "geographic-chart", type: "geographic", visible: true, order: 4 },
  { id: "status-pie", type: "status", visible: true, order: 5 },
  { id: "recent-bookings", type: "recent", visible: true, order: 6 },
];

export const useDashboardPreferences = () => {
  const [layouts, setLayouts] = useState<DashboardLayout[]>([]);
  const [activeLayout, setActiveLayout] = useState<DashboardLayout | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchLayouts();
  }, []);

  const fetchLayouts = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from("dashboard_preferences")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedLayouts =
        data?.map((pref) => ({
          id: pref.id,
          layoutName: pref.layout_name,
          widgetsConfig: (pref.widgets_config as unknown as WidgetConfig[]) || [],
          isActive: pref.is_active ?? false,
        })) || [];

      setLayouts(formattedLayouts);

      // Find active layout or use default
      const active = formattedLayouts.find((l) => l.isActive);
      if (active) {
        setActiveLayout(active);
      } else {
        // Create default layout
        setActiveLayout({
          layoutName: "default",
          widgetsConfig: DEFAULT_WIDGETS,
          isActive: true,
        });
      }
    } catch (error) {
      console.error("Error fetching dashboard layouts:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les préférences",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveLayout = async (layout: DashboardLayout) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const layoutData = {
        user_id: user.id,
        layout_name: layout.layoutName,
        widgets_config: layout.widgetsConfig,
        is_active: layout.isActive,
      };

      if (layout.id) {
        // Update existing layout
        const { error } = await supabase.from("dashboard_preferences").update(layoutData).eq("id", layout.id);

        if (error) throw error;
      } else {
        // Insert new layout
        const { data, error } = await supabase.from("dashboard_preferences").insert([layoutData]).select().single();

        if (error) throw error;
        layout.id = data.id;
      }

      toast({
        title: "Succès",
        description: "Préférences sauvegardées",
      });

      await fetchLayouts();
    } catch (error) {
      console.error("Error saving layout:", error);
      toast({
        title: "Erreur",
        description: getErrorMessage(error) || "Impossible de sauvegarder",
        variant: "destructive",
      });
    }
  };

  const setActive = async (layoutId: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Deactivate all layouts
      await supabase.from("dashboard_preferences").update({ is_active: false }).eq("user_id", user.id);

      // Activate selected layout
      const { error } = await supabase.from("dashboard_preferences").update({ is_active: true }).eq("id", layoutId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Vue activée",
      });

      await fetchLayouts();
    } catch (error) {
      console.error("Error setting active layout:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'activer la vue",
        variant: "destructive",
      });
    }
  };

  const deleteLayout = async (layoutId: string) => {
    try {
      const { error } = await supabase.from("dashboard_preferences").delete().eq("id", layoutId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Vue supprimée",
      });

      await fetchLayouts();
    } catch (error) {
      console.error("Error deleting layout:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la vue",
        variant: "destructive",
      });
    }
  };

  return {
    layouts,
    activeLayout,
    loading,
    saveLayout,
    setActive,
    deleteLayout,
    refetch: fetchLayouts,
  };
};
