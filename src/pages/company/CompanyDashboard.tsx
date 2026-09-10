import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Loader2, Copy, Users, Building2, Trash2 } from "lucide-react";
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

const CompanyDashboard = () => {
  const navigate = useNavigate();
  const { company, role, loading: companyLoading } = useCompany();
  const [bookings, setBookings] = useState<CompanyBooking[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingData, setLoadingData] = useState(true);

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
      .select("id, user_id, status, payment_status, total_price, currency, start_date, customer_name, created_at, services(name, type)")
      .eq("company_id", company.id)
      .order("created_at", { ascending: false });

    const membersQuery = role === "admin"
      ? supabase.from("company_members").select("id, user_id, role, profiles(full_name)").eq("company_id", company.id)
      : Promise.resolve({ data: [] as any[] });

    const [{ data: bookingsData }, membersRes] = await Promise.all([bookingsQuery, membersQuery]);
    setBookings((bookingsData || []) as any);
    setMembers(((membersRes as any).data || []) as any);
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

  if (companyLoading || !company) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const pendingCount = bookings.filter((b) => b.payment_status !== "paid").length;
  const totalPending = bookings
    .filter((b) => b.payment_status !== "paid")
    .reduce((sum, b) => sum + Number(b.total_price), 0);

  return (
    <div className="min-h-screen bg-background flex flex-col pt-16">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center gap-3">
          <Building2 className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">{company.name}</h1>
            <p className="text-muted-foreground text-sm">
              {role === "admin" ? "Administrateur de facturation" : "Membre de l'équipe"}
            </p>
          </div>
        </div>

        {role === "admin" && (
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Réservations à payer</CardTitle>
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{pendingCount}</div></CardContent>
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

        {role === "admin" && (
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
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>{m.profiles?.full_name || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={m.role === "admin" ? "default" : "secondary"}>
                          {m.role === "admin" ? "Administrateur" : "Employé"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {m.role !== "admin" && (
                          <Button variant="ghost" size="icon" onClick={() => removeMember(m.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>{role === "admin" ? "Toutes les réservations de l'entreprise" : "Mes réservations facturées à l'entreprise"}</CardTitle>
            <CardDescription>
              {role === "admin"
                ? "Payez directement les réservations en attente de vos employés"
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
                    <TableHead>Statut</TableHead>
                    {role === "admin" && <TableHead className="text-right">Action</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">{b.services?.name || "—"}</TableCell>
                      <TableCell>{b.customer_name}</TableCell>
                      <TableCell>{format(new Date(b.start_date), "dd MMM yyyy", { locale: fr })}</TableCell>
                      <TableCell><Price amount={b.total_price} fromCurrency={b.currency} /></TableCell>
                      <TableCell>
                        <div className="flex gap-1.5">
                          <BookingStatusBadge status={b.status} />
                          <PaymentStatusBadge status={b.payment_status} />
                        </div>
                      </TableCell>
                      {role === "admin" && (
                        <TableCell className="text-right">
                          {b.payment_status !== "paid" && (
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
