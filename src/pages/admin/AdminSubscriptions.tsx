import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  Search, 
  Eye, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Building2, 
  Crown, 
  FileCheck, 
  Plane,
  Mail,
  Phone,
  Calendar,
  MessageSquare,
  Loader2,
  RefreshCw
} from "lucide-react";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n/config";

interface SubscriptionRequest {
  id: string;
  plan_id: string;
  plan_name: string;
  name: string;
  email: string;
  phone: string;
  company: string | null;
  message: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const planIcons: Record<string, React.ReactNode> = {
  corporate: <Building2 className="w-4 h-4" />,
  premium: <Crown className="w-4 h-4" />,
  visa: <FileCheck className="w-4 h-4" />,
  billets: <Plane className="w-4 h-4" />,
};

const statusColors: Record<string, string> = {
  pending: "bg-warning text-warning-foreground border-warning-foreground/20",
  contacted: "bg-info/10 text-info border-info/30",
  approved: "bg-success/10 text-success border-success/30",
  rejected: "bg-destructive/10 text-destructive border-destructive/30",
};

const statusLabels: Record<string, string> = {
  get pending() { return i18n.t("ux.bo.pending2"); },
  get contacted() { return i18n.t("ux.bo.contacted2"); },
  get approved() { return i18n.t("ux.bo.approved2"); },
  get rejected() { return i18n.t("ux.bo.rejected2"); },
};

export default function AdminSubscriptions() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [requests, setRequests] = useState<SubscriptionRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [selectedRequest, setSelectedRequest] = useState<SubscriptionRequest | null>(null);
  const [notes, setNotes] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("subscription_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error: any) {
      toast({
        title: t("ux.bo.error"),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("subscription_requests")
        .update({ status, notes })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: t("ux.bo.statusUpdated"),
        description: `La demande a été marquée comme "${statusLabels[status]}"`,
      });

      fetchRequests();
      setSelectedRequest(null);
    } catch (error: any) {
      toast({
        title: t("ux.bo.error"),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      request.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.phone.includes(searchTerm) ||
      (request.company?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);

    const matchesStatus = statusFilter === "all" || request.status === statusFilter;
    const matchesPlan = planFilter === "all" || request.plan_id === planFilter;

    return matchesSearch && matchesStatus && matchesPlan;
  });

  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    contacted: requests.filter((r) => r.status === "contacted").length,
    approved: requests.filter((r) => r.status === "approved").length,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t("ux.bo.subscriptionRequests2")}</h1>
            <p className="text-muted-foreground">{t("ux.bo.manageBossizConciergeSubscriptionRequests")}</p>
          </div>
          <Button onClick={fetchRequests} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            {t("ux.bo.refresh")}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t("ux.bo.total")}</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <MessageSquare className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t("ux.bo.pending2")}</p>
                  <p className="text-2xl font-bold text-warning-foreground">{stats.pending}</p>
                </div>
                <Clock className="w-8 h-8 text-gold" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t("ux.bo.contacted")}</p>
                  <p className="text-2xl font-bold text-info">{stats.contacted}</p>
                </div>
                <Phone className="w-8 h-8 text-info" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t("ux.bo.approved3")}</p>
                  <p className="text-2xl font-bold text-success">{stats.approved}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-success" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder={t("ux.bo.searchNameEmailPhone")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder={t("ux.bo.status")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("ux.bo.allStatuses")}</SelectItem>
                  <SelectItem value="pending">{t("ux.bo.pending2")}</SelectItem>
                  <SelectItem value="contacted">{t("ux.bo.contacted2")}</SelectItem>
                  <SelectItem value="approved">{t("ux.bo.approved2")}</SelectItem>
                  <SelectItem value="rejected">{t("ux.bo.rejected2")}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={planFilter} onValueChange={setPlanFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder={t("ux.bo.offer")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("ux.bo.allOffers")}</SelectItem>
                  <SelectItem value="corporate">Corporate</SelectItem>
                  <SelectItem value="premium">Premium VIP</SelectItem>
                  <SelectItem value="visa">Visa+</SelectItem>
                  <SelectItem value="billets">Billets Pro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des demandes ({filteredRequests.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {t("ux.bo.noRequestFound")}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("ux.bo.date")}</TableHead>
                      <TableHead>{t("ux.bo.offer")}</TableHead>
                      <TableHead>{t("ux.bo.name")}</TableHead>
                      <TableHead>{t("ux.bo.contact")}</TableHead>
                      <TableHead>{t("ux.bo.status")}</TableHead>
                      <TableHead className="text-right">{t("ux.bo.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(request.created_at), "dd MMM yyyy", { locale: fr })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {planIcons[request.plan_id]}
                            <span className="text-sm">{request.plan_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{request.name}</p>
                            {request.company && (
                              <p className="text-xs text-muted-foreground">{request.company}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{request.email}</p>
                            <p className="text-muted-foreground">{request.phone}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[request.status]}>
                            {statusLabels[request.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setNotes(request.notes || "");
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-lg">
                              <DialogHeader>
                                <DialogTitle>{t("ux.bo.requestDetails")}</DialogTitle>
                                <DialogDescription>
                                  Demande pour {request.plan_name}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 mt-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-muted-foreground">{t("ux.bo.name")}</Label>
                                    <p className="font-medium">{request.name}</p>
                                  </div>
                                  <div>
                                    <Label className="text-muted-foreground">{t("ux.bo.company")}</Label>
                                    <p className="font-medium">{request.company || "-"}</p>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-muted-foreground" />
                                    <a href={`mailto:${request.email}`} className="text-primary hover:underline">
                                      {request.email}
                                    </a>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-muted-foreground" />
                                    <a href={`tel:${request.phone}`} className="text-primary hover:underline">
                                      {request.phone}
                                    </a>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4 text-muted-foreground" />
                                  <span className="text-sm">
                                    {format(new Date(request.created_at), "dd MMMM yyyy 'à' HH:mm", { locale: fr })}
                                  </span>
                                </div>
                                {request.message && (
                                  <div>
                                    <Label className="text-muted-foreground">{t("ux.bo.message")}</Label>
                                    <p className="mt-1 p-3 bg-muted rounded-lg text-sm">{request.message}</p>
                                  </div>
                                )}
                                <div>
                                  <Label htmlFor="notes">{t("ux.bo.internalNotes")}</Label>
                                  <Textarea
                                    id="notes"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder={t("ux.bo.addNotes")}
                                    className="mt-1"
                                  />
                                </div>
                                <div className="flex flex-wrap gap-2 pt-4 border-t">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="gap-2"
                                    onClick={() => updateStatus(request.id, "contacted")}
                                    disabled={isUpdating}
                                  >
                                    <Phone className="w-4 h-4" />
                                    {t("ux.bo.markAsContacted")}
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="gap-2 bg-success hover:bg-success/90"
                                    onClick={() => updateStatus(request.id, "approved")}
                                    disabled={isUpdating}
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                    {t("ux.bo.approve")}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    className="gap-2"
                                    onClick={() => updateStatus(request.id, "rejected")}
                                    disabled={isUpdating}
                                  >
                                    <XCircle className="w-4 h-4" />
                                    {t("ux.bo.reject")}
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
