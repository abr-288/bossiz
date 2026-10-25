import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";

// Services Bossiz acceptant les avantages Impact : aucun n'est actif par
// défaut, chacun doit être activé explicitement.
export function ImpactServicesManager() {
  const queryClient = useQueryClient();
  const { data: services = [], isLoading } = useQuery({
    queryKey: ["impact-admin-services"],
    queryFn: async () => {
      const { data, error } = await supabase.from("impact_eligible_services").select("*").order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });

  const toggle = async (key: string, enabled: boolean) => {
    const { error } = await supabase.from("impact_eligible_services").update({ is_enabled: enabled }).eq("key", key);
    if (error) return toast.error(error.message);
    queryClient.invalidateQueries({ queryKey: ["impact-admin-services"] });
    queryClient.invalidateQueries({ queryKey: ["impact-admin-offers"] });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Services éligibles</CardTitle>
        <CardDescription>
          Un avantage ne peut être appliqué que sur un service activé ici et coché dans l'avantage.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : (
          <ul className="divide-y">
            {services.map((s) => (
              <li key={s.key} className="flex items-center justify-between gap-4 py-3">
                <div>
                  <p className="font-medium">{s.label}</p>
                  {s.description && <p className="text-sm text-muted-foreground">{s.description}</p>}
                </div>
                <Switch
                  checked={s.is_enabled}
                  onCheckedChange={(c) => toggle(s.key, c)}
                  aria-label={`Activer ${s.label}`}
                />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
