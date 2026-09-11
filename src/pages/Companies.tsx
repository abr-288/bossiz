import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Building2, CreditCard, FileText, Users, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/hooks/useCompany";
import { toast } from "sonner";

const benefits = [
  {
    icon: CreditCard,
    title: "Paiement centralisé",
    description: "Un seul responsable paie tous les voyages de l'équipe avec une carte, plus besoin que chaque employé avance ses frais.",
  },
  {
    icon: FileText,
    title: "Fini les justificatifs papier",
    description: "Toutes les réservations de l'entreprise sont regroupées au même endroit, avec leur statut de paiement.",
  },
  {
    icon: Users,
    title: "Équipe illimitée",
    description: "Ajoutez vos employés en un instant avec un simple code d'invitation, sans validation manuelle.",
  },
];

const Companies = () => {
  const navigate = useNavigate();
  const { company, loading: companyLoading, refetch } = useCompany();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");
  const [billingEmail, setBillingEmail] = useState("");
  const [billingPhone, setBillingPhone] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setIsAuthenticated(!!user));
  }, []);

  useEffect(() => {
    if (company) navigate("/company/dashboard");
  }, [company, navigate]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Connectez-vous pour créer un compte entreprise");
      navigate("/auth");
      return;
    }

    setCreating(true);
    const { error } = await supabase.rpc("create_company", {
      p_name: companyName,
      p_description: companyDescription || null,
      p_billing_email: billingEmail || user.email,
      p_billing_phone: billingPhone || null,
    });
    setCreating(false);

    if (error) {
      toast.error(error.message || "Impossible de créer le compte entreprise");
      return;
    }

    toast.success("Compte entreprise créé !");
    refetch();
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Connectez-vous pour rejoindre une entreprise");
      navigate("/auth");
      return;
    }

    setJoining(true);
    const { data, error } = await supabase.rpc("join_company", { p_invite_code: inviteCode });
    setJoining(false);

    if (error || !data?.[0]) {
      toast.error(error?.message || "Code d'invitation invalide");
      return;
    }

    toast.success(`Vous avez rejoint ${data[0].company_name} !`);
    refetch();
  };

  if (companyLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col pt-16">
      <Navbar />

      <div className="relative py-16 md:py-24 overflow-hidden bg-gradient-to-br from-primary via-primary to-secondary">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        <div className="relative z-10 container mx-auto px-4 text-center">
          <Building2 className="w-12 h-12 text-white mx-auto mb-4" />
          <h1 className="text-4xl md:text-6xl font-bold mb-4 text-white drop-shadow-lg">
            Espace Entreprises
          </h1>
          <p className="text-lg md:text-xl text-white/95 max-w-2xl mx-auto">
            Simplifiez les voyages d'affaires de votre équipe, du réservation au paiement
          </p>
        </div>
      </div>

      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {benefits.map((b) => (
            <Card key={b.title}>
              <CardContent className="p-6 flex gap-4">
                <div className="w-12 h-12 flex-shrink-0 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <b.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold mb-1">{b.title}</h3>
                  <p className="text-sm text-muted-foreground">{b.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Créer le compte de mon entreprise</CardTitle>
              <CardDescription>Vous deviendrez l'administrateur de facturation</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nom de l'entreprise *</Label>
                  <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={companyDescription} onChange={(e) => setCompanyDescription(e.target.value)} rows={2} />
                </div>
                <div className="space-y-2">
                  <Label>Email de facturation</Label>
                  <Input type="email" value={billingEmail} onChange={(e) => setBillingEmail(e.target.value)} placeholder="comptabilite@entreprise.com" />
                </div>
                <div className="space-y-2">
                  <Label>Téléphone de facturation</Label>
                  <Input value={billingPhone} onChange={(e) => setBillingPhone(e.target.value)} />
                </div>
                <Button type="submit" className="w-full" disabled={creating || !isAuthenticated}>
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Créer le compte entreprise"}
                </Button>
                {!isAuthenticated && (
                  <p className="text-xs text-muted-foreground text-center">Connectez-vous d'abord pour créer un compte entreprise.</p>
                )}
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rejoindre mon entreprise</CardTitle>
              <CardDescription>Votre administrateur vous a donné un code d'invitation</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleJoin} className="space-y-4">
                <div className="space-y-2">
                  <Label>Code d'invitation *</Label>
                  <Input
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    placeholder="Ex: A1B2C3D4"
                    className="uppercase tracking-widest"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" variant="outline" disabled={joining || !isAuthenticated}>
                  {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : "Rejoindre l'entreprise"}
                </Button>
                {!isAuthenticated && (
                  <p className="text-xs text-muted-foreground text-center">Connectez-vous d'abord pour rejoindre une entreprise.</p>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Companies;
