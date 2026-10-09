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
import { LazyImage } from "@/components/ui/lazy-image";
import bannerBusiness from "@/assets/banner-business.jpg";
import { useTranslation } from "react-i18next";

const benefits = [
  {
    icon: CreditCard,
    title: "ux.companiesData.b1",
    description: "ux.companiesData.b1Desc",
  },
  {
    icon: FileText,
    title: "ux.companiesData.b2",
    description: "ux.companiesData.b2Desc",
  },
  {
    icon: Users,
    title: "ux.companiesData.b3",
    description: "ux.companiesData.b3Desc",
  },
];

const Companies = () => {
  const { t } = useTranslation();
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
      toast.error(t("ux.companies.signInToCreate"));
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
      toast.error(error.message || t("ux.companies.createError"));
      return;
    }

    toast.success(t("ux.companies.created"));
    refetch();
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error(t("ux.companies.signInToJoin"));
      navigate("/auth");
      return;
    }

    setJoining(true);
    const { data, error } = await supabase.rpc("join_company", { p_invite_code: inviteCode });
    setJoining(false);

    if (error || !data?.[0]) {
      toast.error(error?.message || t("ux.companies.invalidCode"));
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

      <div className="relative py-16 md:py-24 overflow-hidden bg-brand">
        <LazyImage
          src={bannerBusiness}
          alt={t("ux.companies.bannerAlt")}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-brand/75 via-brand/60 to-brand/80" />
        <div className="relative z-10 container mx-auto px-4 text-center">
          <Building2 className="w-12 h-12 text-white mx-auto mb-4" />
          <h1 className="text-4xl md:text-6xl font-bold mb-4 text-white drop-shadow-lg">
            {t("ux.companies.title")}
          </h1>
          <p className="text-lg md:text-xl text-white/95 max-w-2xl mx-auto">
            {t("ux.companies.subtitle")}
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
                  <h3 className="font-bold mb-1">{t(b.title)}</h3>
                  <p className="text-sm text-muted-foreground">{t(b.description)}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>{t("ux.companies.createTitle")}</CardTitle>
              <CardDescription>{t("ux.companies.createDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label>{t("ux.companies.companyName")}</Label>
                  <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={companyDescription} onChange={(e) => setCompanyDescription(e.target.value)} rows={2} />
                </div>
                <div className="space-y-2">
                  <Label>{t("ux.companies.billingEmail")}</Label>
                  <Input type="email" value={billingEmail} onChange={(e) => setBillingEmail(e.target.value)} placeholder="comptabilite@entreprise.com" />
                </div>
                <div className="space-y-2">
                  <Label>{t("ux.companies.billingPhone")}</Label>
                  <Input value={billingPhone} onChange={(e) => setBillingPhone(e.target.value)} />
                </div>
                <Button type="submit" className="w-full" disabled={creating || !isAuthenticated}>
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : t("ux.companies.create")}
                </Button>
                {!isAuthenticated && (
                  <p className="text-xs text-muted-foreground text-center">{t("ux.companies.signInFirstCreate")}</p>
                )}
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("ux.companies.joinTitle")}</CardTitle>
              <CardDescription>{t("ux.companies.joinDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleJoin} className="space-y-4">
                <div className="space-y-2">
                  <Label>{t("ux.companies.code")}</Label>
                  <Input
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    placeholder="Ex: A1B2C3D4"
                    className="uppercase tracking-widest"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" variant="outline" disabled={joining || !isAuthenticated}>
                  {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : t("ux.companies.join")}
                </Button>
                {!isAuthenticated && (
                  <p className="text-xs text-muted-foreground text-center">{t("ux.companies.signInFirstJoin")}</p>
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
