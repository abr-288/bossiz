import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { JEKO_PAYOUT_METHOD_LABELS, type JekoPayoutMethod } from "@/constants/jekoPayoutMethods";
import { useToast } from "@/hooks/use-toast";
import { FileText, Search, Check, X } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n/config";

interface PartnerApplication {
  id: string;
  name: string;
  description: string | null;
  contact_email: string;
  contact_phone: string | null;
  logo_url: string | null;
  status: string;
  created_at: string;
  requested_car_plan_id: string | null;
  preferred_payout_method: JekoPayoutMethod | null;
}

const carPlanLabels: Record<string, string> = {
  get decouverte() { return i18n.t("ux.bo.discovery"); },
  get pro() { return i18n.t("ux.bo.pro"); },
  flotte: "Flotte",
};

export default function AdminPartnerApplications() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<PartnerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from("partner_applications")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error("Error fetching partner applications:", error);
      toast({
        title: t("ux.bo.error"),
        description: t("ux.bo.unableLoadApplications"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm("Rejeter cette candidature ?")) return;

    try {
      const { error } = await supabase
        .from("partner_applications")
        .update({ status: "rejected" })
        .eq("id", id);

      if (error) throw error;

      toast({ title: t("ux.bo.success"), description: t("ux.bo.applicationRejected") });
      fetchApplications();

      supabase.functions
        .invoke("send-partner-application-rejection", { body: { applicationId: id } })
        .then(({ error: emailError }) => {
          if (emailError) console.error("Partner rejection email error:", emailError);
        });
    } catch (error: any) {
      console.error("Error rejecting application:", error);
      toast({
        title: t("ux.bo.error"),
        description: error.message || t("ux.bo.errorWhileRejecting"),
        variant: "destructive",
      });
    }
  };

  const handleCreateAgency = (application: PartnerApplication) => {
    navigate("/admin/agencies", {
      state: {
        prefillApplication: {
          id: application.id,
          name: application.name,
          description: application.description,
          contact_email: application.contact_email,
          contact_phone: application.contact_phone,
          logo_url: application.logo_url,
          requested_car_plan_id: application.requested_car_plan_id,
          preferred_payout_method: application.preferred_payout_method,
        },
      },
    });
  };

  const statusBadge = (status: string) => {
    if (status === "approved") return <Badge>{t("ux.bo.approved")}</Badge>;
    if (status === "rejected") return <Badge variant="destructive">{t("ux.bo.rejected")}</Badge>;
    return <Badge variant="secondary">{t("ux.bo.pending2")}</Badge>;
  };

  const filteredApplications = applications.filter(
    (app) =>
      app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.contact_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{t("ux.bo.partnerApplications")}</h1>
          <p className="text-muted-foreground">
            {t("ux.bo.applicationsReceivedThroughPublicBecome")}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("ux.bo.searchApplication")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("ux.bo.agency")}</TableHead>
                <TableHead>{t("ux.bo.contact")}</TableHead>
                <TableHead>{t("ux.bo.description")}</TableHead>
                <TableHead>{t("ux.bo.requestedPlan")}</TableHead>
                <TableHead>{t("ux.bo.preferredPayout")}</TableHead>
                <TableHead>{t("ux.bo.status")}</TableHead>
                <TableHead>{t("ux.bo.received")}</TableHead>
                <TableHead className="text-right">{t("ux.bo.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    {t("ux.bo.loading")}
                  </TableCell>
                </TableRow>
              ) : filteredApplications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    {t("ux.bo.noApplicationFound")}
                  </TableCell>
                </TableRow>
              ) : (
                filteredApplications.map((application) => (
                  <TableRow key={application.id}>
                    <TableCell className="font-medium">{application.name}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{application.contact_email}</p>
                        {application.contact_phone && (
                          <p className="text-muted-foreground">{application.contact_phone}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-muted-foreground line-clamp-2 max-w-xs">
                        {application.description || "—"}
                      </p>
                    </TableCell>
                    <TableCell>
                      {application.requested_car_plan_id ? (
                        <Badge variant="outline">
                          {carPlanLabels[application.requested_car_plan_id] || application.requested_car_plan_id}
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {application.preferred_payout_method
                        ? JEKO_PAYOUT_METHOD_LABELS[application.preferred_payout_method]
                        : "—"}
                    </TableCell>
                    <TableCell>{statusBadge(application.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(application.created_at), "dd MMM yyyy", { locale: fr })}
                    </TableCell>
                    <TableCell className="text-right">
                      {application.status === "pending" && (
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCreateAgency(application)}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            {t("ux.bo.createAgency")}
                          </Button>
                          <Button
                            aria-label={t("ux.bo.rejectApplication")}
                            variant="ghost"
                            size="icon"
                            onClick={() => handleReject(application.id)}
                          >
                            <X className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
}
