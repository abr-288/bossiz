import { AdminLayout } from "@/components/admin/AdminLayout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, MessageSquare, TrendingUp, Clock, Check, X } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type ReviewStatus = "pending" | "approved" | "rejected";

const statusBadge = (status: ReviewStatus) => {
  switch (status) {
    case "approved":
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Approuvé</Badge>;
    case "rejected":
      return <Badge variant="destructive">Rejeté</Badge>;
    default:
      return <Badge variant="secondary">En attente</Badge>;
  }
};

const AdminReviews = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchReviews = async () => {
    const { data, error } = await supabase
      .from("reviews")
      .select(`*, services:service_id (name, type)`)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erreur lors du chargement des avis");
    } else {
      setReviews(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const updateStatus = async (id: string, status: ReviewStatus) => {
    setUpdatingId(id);
    const { error } = await supabase.from("reviews").update({ status }).eq("id", id);
    if (error) {
      toast.error("Impossible de mettre à jour l'avis");
    } else {
      setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
      toast.success(status === "approved" ? "Avis approuvé et publié sur le site" : "Avis rejeté");
    }
    setUpdatingId(null);
  };

  const approvedReviews = reviews.filter((r) => r.status === "approved");
  const pendingReviews = reviews.filter((r) => r.status === "pending");
  const avgRating = approvedReviews.length > 0
    ? (approvedReviews.reduce((s, r) => s + r.rating, 0) / approvedReviews.length).toFixed(1)
    : "0";

  const renderStars = (rating: number) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`h-4 w-4 ${i <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
      ))}
    </div>
  );

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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Avis Clients</h1>
          <p className="text-muted-foreground">Modérez les avis avant qu'ils n'apparaissent sur le site</p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Avis</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reviews.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">En attente</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingReviews.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Note Moyenne (publiée)</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgRating}/5</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">5 étoiles</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {approvedReviews.filter(r => r.rating === 5).length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Liste des avis</CardTitle>
            <CardDescription>{reviews.length} avis au total, {pendingReviews.length} en attente de modération</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead>Commentaire</TableHead>
                  <TableHead>Origine</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      Aucun avis pour le moment
                    </TableCell>
                  </TableRow>
                ) : (
                  reviews.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{(r.services as any)?.name || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{(r.services as any)?.type || "—"}</Badge>
                      </TableCell>
                      <TableCell>{renderStars(r.rating)}</TableCell>
                      <TableCell className="max-w-xs truncate">{r.comment || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{r.source === "imported" ? "Importé" : "Site"}</Badge>
                      </TableCell>
                      <TableCell>{statusBadge(r.status as ReviewStatus)}</TableCell>
                      <TableCell>{format(new Date(r.created_at), "dd MMM yyyy", { locale: fr })}</TableCell>
                      <TableCell className="text-right">
                        {r.status !== "approved" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="mr-2"
                            disabled={updatingId === r.id}
                            onClick={() => updateStatus(r.id, "approved")}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Approuver
                          </Button>
                        )}
                        {r.status !== "rejected" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            disabled={updatingId === r.id}
                            onClick={() => updateStatus(r.id, "rejected")}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Rejeter
                          </Button>
                        )}
                      </TableCell>
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

export default AdminReviews;
