import { AdminLayout } from "@/components/admin/AdminLayout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { MapPin, RefreshCw, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useTranslation } from "react-i18next";

const AdminDestinations = () => {
  const { t } = useTranslation();
  const [cache, setCache] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCache = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("destinations_cache")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error(t("ux.bo.errorWhileLoading"));
    } else {
      setCache(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCache();
  }, []);

  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date();

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
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
            <h1 className="text-3xl font-bold tracking-tight">Destinations</h1>
            <p className="text-muted-foreground">{t("ux.bo.destinationCacheManagement")}</p>
          </div>
          <Button onClick={fetchCache} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            {t("ux.bo.refresh")}
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t("ux.bo.cachedEntries")}</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{cache.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t("ux.bo.expired")}</CardTitle>
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {cache.filter(c => isExpired(c.expires_at)).length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("ux.bo.destinationCache")}</CardTitle>
            <CardDescription>{t("ux.bo.entriesCurrentlyCached")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("ux.bo.key")}</TableHead>
                  <TableHead>{t("ux.bo.source")}</TableHead>
                  <TableHead>{t("ux.bo.status")}</TableHead>
                  <TableHead>{t("ux.bo.created2")}</TableHead>
                  <TableHead>{t("ux.bo.expires")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cache.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      {t("ux.bo.noCachedEntries")}
                    </TableCell>
                  </TableRow>
                ) : (
                  cache.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-xs">{c.cache_key}</TableCell>
                      <TableCell><Badge variant="outline">{c.source}</Badge></TableCell>
                      <TableCell>
                        <Badge variant={isExpired(c.expires_at) ? "destructive" : "default"}>
                          {isExpired(c.expires_at) ? "Expiré" : "Actif"}
                        </Badge>
                      </TableCell>
                      <TableCell>{format(new Date(c.created_at), "dd MMM yyyy", { locale: fr })}</TableCell>
                      <TableCell>{format(new Date(c.expires_at), "dd MMM yyyy", { locale: fr })}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDestinations;
