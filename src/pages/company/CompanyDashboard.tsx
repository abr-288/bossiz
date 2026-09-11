import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Loader2, Copy, Users, Building2, Trash2, Check, X, ShieldCheck, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/hooks/useCompany";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Price } from "@/components/ui/price";
import { BookingStatusBadge, PaymentStatusBadge } from "@/components/dashboard/BookingStatusBadge";

interface CompanyBooking {
  id: string;
  user_id: string;
  status: string;
  payment_status: string;
  approval_status: string | null;
  total_price: number;
  currency: string;
  start_date: string;
  customer_name: string;
  created_at: string;
  services: { name: string; type: string } | null;
}

interface Member {
  id: string;
  user_id: string;
  role: string;
  profiles: { full_name: string | null } | null;
}

interface TravelPolicy {
  id: string;
  service_type: string;
  max_amount: number;
  currency: string;
}

const SERVICE_TYPES = [
  { value: "flight", label: "Vol" },
  { value: "hotel", label: "Hôtel" },
  { value: "car", label: "Voiture" },
  { value: "tour", label: "Circuit" },
];

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrateur (DAF)",
  approver: "Approbateur",
  employee: "Collaborateur",
};

const CompanyDashboard = () => {
  const navigate = useNavigate();
  const { company, role, loading: companyLoading } = useCompany();
  const [bookings, setBookings] = useState<CompanyBooking[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [policies, setPolicies] = useState<TravelPolicy[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [newPolicyType, setNewPolicyType] = useState("flight");
  const [newPolicyAmount, setNewPolicyAmount] = useState("");

  const isApprover = role === "admin" || role === "approver";
  const isAdmin = role === "admin";

  useEffect(() => {
    if (!companyLoading && !company) {
      navigate("/entreprises");
    }
  }, [companyLoading, company, navigate]);

  useEffect(() => {
    if (!company) return;
    fetchData();
  }, [company]);

  const fetchData = async () => {
    if (!company) return;
    setLoadingData(true);

    const bookingsQuery = supabase
      .from("bookings")
      .select("id, user_id, status, payment_status, approval_status, total_price, currency, start_date, customer_name, created_at, services(name, type)")
      .eq("company_id", company.id)
      .order("created_at", { ascending: false });

    const membersQuery = isApprover
      ? supabase.from("company_members").select("id, user_id, role, profiles(full_name)").eq("company_id", company.id)
      : Promise.resolve({ data: [] as any[] });

    const policiesQuery = isAdmin
      ? supabase.from("travel_policies").select("id, service_type, max_amount, currency").eq("company_id", company.id)
      : Promise.resolve({ data: [] as any[] });

    const [{ data: bookingsData }, membersRes, policiesRes] = await Promise.all([bookingsQuery, membersQuery, policiesQuery]);
    setBookings((bookingsData || []) as any);
    setMembers(((membersRes as any).data || []) as any);
    setPolicies(((policiesRes as any).data || []) as any);
    setLoadingData(false);
  };

  const copyInviteCode = () => {
    if (!company) return;
    navigator.clipboard.writeText(company.invite_code);
    toast.success("Code d'invitation copié");
  };

  const removeMember = async (memberId: string) => {
    if (!confirm("Retirer ce membre de l'entreprise ?")) return;
    const { error } = await supabase.from("company_members").delete().eq("id", memberId);
    if (error) {
      toast.error("Impossible de retirer ce membre");
    } else {
      toast.success("Membre retiré");
      fetchData();
    }
  };

  const updateMemberRole = async (memberId: string, newRole: string) => {
    const { error } = await supabase.from("company_members").update({ role: newRole }).eq("id", memberId);
    if (error) {
      toast.error("Impossible de mettre à jour le rôle");
    } else {
      toast.success("Rôle mis à jour");
      fetchData();
    }
  };

  const reviewBooking = async (bookingId: string, decision: "approved" | "rejected") => {
    // Goes through the review-booking-approval edge function (rather than a
    // direct table update) so the traveler gets notified by SMS/WhatsApp
    // the moment their booking is reviewed.
    const { data, error } = await supabase.functions.invoke("review-booking-approval", {
      body: { bookingId, decision },
    });

    if (error || !data?.success) {
      toast.error("Impossible de traiter cette demande");
    } else {
      toast.success(decision === "approved" ? "Réservation approuvée" : "Réservation rejetée");
      fetchData();
    }
  };

  const savePolicy = async () => {
    if (!company || !newPolicyAmount) return;
    if (parseFloat(newPolicyAmount) <= 0) {
      toast.error("Le plafond doit être supérieur à 0");
      return;
    }
    const { error } = await supabase.from("travel_policies").upsert(
      { company_id: company.id, service_type: newPolicyType, max_amount: parseFloat(newPolicyAmount), currency: "XOF" },
      { onConflict: "company_id,service_type" }
    );
    if (error) {
      toast.error("Impossible d'enregistrer la politique");
    } else {
      toast.success("Politique de voyage mise à jour");
      setNewPolicyAmount("");
      fetchData();
    }
  };

  const deletePolicy = async (id: string) => {
    const { error } = await supabase.from("travel_policies").delete().eq("id", id);
    if (error) {
      toast.error("Impossible de supprimer");
    } else {
      fetchData();
    }
  };

  if (companyLoading || !company) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const pendingApproval = bookings.filter((b) => b.approval_status === "pending_approval");
  const payableCount = bookings.filter((b) => b.approval_status === "approved" && b.payment_status !== "paid").length;
  const totalPending = bookings
    .filter((b) => b.approval_status === "approved" && b.payment_status !== "paid")
    .reduce((sum, b) => sum + Number(b.total_price), 0);

  const approvalBadge = (status: string | null) => {
    if (status === "approved") return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Approuvé</Badge>;
    if (status === "rejected") return <Badge variant="destructive">Rejeté</Badge>;
    if (status === "pending_approval") return <Badge variant="secondary">En attente</Badge>;
    return null;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col pt-16">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center gap-3">
          <Building2 className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">{company.name}</h1>
            <p className="text-muted-foreground text-sm">{ROLE_LABELS[role || "employee"]}</p>
          </div>
        </div>

        {isAdmin && (
          <div className="grid md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">En attente d'approbation</CardTitle>
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{pendingApproval.length}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Réservations à payer</CardTitle>
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{payableCount}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Montant en attente</CardTitle>
              </CardHeader>
              <CardContent><div className="text-2xl font-bold"><Price amount={totalPending} fromCurrency="XOF" /></div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Membres de l'équipe</CardTitle>
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{members.length}</div></CardContent>
            </Card>
          </div>
        )}

        {isApprover && pendingApproval.length > 0 && (
          <Card className="border-amber-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-amber-600" /> Demandes en attente d'approbation</CardTitle>
              <CardDescription>Validez ou refusez les voyages soumis par l'équipe</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingApproval.map((b) => (
                <div key={b.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border">
                  <div>
                    <p className="font-medium">{b.services?.name || "—"} — {b.customer_name}</p>
                    <p className="text-sm text-muted-foreground">
                      <Price amount={b.total_price} fromCurrency={b.currency} /> · {format(new Date(b.start_date), "dd MMM yyyy", { locale: fr })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="text-destructive" onClick={() => reviewBooking(b.id, "rejected")}>
                      <X className="w-4 h-4 mr-1" /> Rejeter
                    </Button>
                    <Button size="sm" onClick={() => reviewBooking(b.id, "approved")}>
                      <Check className="w-4 h-4 mr-1" /> Approuver
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle>Politique de voyage</CardTitle>
              <CardDescription>Plafonds par type de service — affichés comme repère « conforme / hors politique » lors de la réservation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {policies.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Plafond</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {policies.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>{SERVICE_TYPES.find((s) => s.value === p.service_type)?.label || p.service_type}</TableCell>
                        <TableCell><Price amount={p.max_amount} fromCurrency={p.currency} /></TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => deletePolicy(p.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              <div className="flex gap-2 items-end">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Type de service</label>
                  <Select value={newPolicyType} onValueChange={setNewPolicyType}>
                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SERVICE_TYPES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Plafond (XOF)</label>
                  <Input type="number" min="1" value={newPolicyAmount} onChange={(e) => setNewPolicyAmount(e.target.value)} className="w-40" />
                </div>
                <Button onClick={savePolicy} disabled={!newPolicyAmount}>
                  <Plus className="w-4 h-4 mr-1" /> Enregistrer
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {isApprover && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" /> Équipe</CardTitle>
              <CardDescription>
                Partagez ce code pour que vos employés rejoignent l'entreprise :{" "}
                <button onClick={copyInviteCode} className="inline-flex items-center gap-1 font-mono font-bold text-primary hover:underline">
                  {company.invite_code} <Copy className="w-3.5 h-3.5" />
                </button>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Membre</TableHead>
                    <TableHead>Rôle</TableHead>
                    {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>{m.profiles?.full_name || "—"}</TableCell>
                      <TableCell>
                        {isAdmin && m.role !== "admin" ? (
                          <Select value={m.role} onValueChange={(v) => updateMemberRole(m.id, v)}>
                            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="employee">Collaborateur</SelectItem>
                              <SelectItem value="approver">Approbateur</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant={m.role === "admin" ? "default" : "secondary"}>{ROLE_LABELS[m.role]}</Badge>
                        )}
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="text-right">
                          {m.role !== "admin" && (
                            <Button variant="ghost" size="icon" onClick={() => removeMember(m.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>{isApprover ? "Toutes les réservations de l'entreprise" : "Mes réservations facturées à l'entreprise"}</CardTitle>
            <CardDescription>
              {isAdmin
                ? "Payez les réservations approuvées de vos employés"
                : "Choisissez « Facturer à mon entreprise » lors d'une réservation pour qu'elle apparaisse ici"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingData ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : bookings.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Aucune réservation pour le moment</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead>Voyageur</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Approbation</TableHead>
                    <TableHead>Statut</TableHead>
                    {isAdmin && <TableHead className="text-right">Action</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">{b.services?.name || "—"}</TableCell>
                      <TableCell>{b.customer_name}</TableCell>
                      <TableCell>{format(new Date(b.start_date), "dd MMM yyyy", { locale: fr })}</TableCell>
                      <TableCell><Price amount={b.total_price} fromCurrency={b.currency} /></TableCell>
                      <TableCell>{approvalBadge(b.approval_status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1.5">
                          <BookingStatusBadge status={b.status} />
                          <PaymentStatusBadge status={b.payment_status} />
                        </div>
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="text-right">
                          {b.approval_status === "approved" && b.payment_status !== "paid" && (
                            <Button size="sm" onClick={() => navigate(`/payment?bookingId=${b.id}`)}>
                              Payer
                            </Button>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default CompanyDashboard;
