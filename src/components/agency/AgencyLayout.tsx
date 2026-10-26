import { ReactNode, useEffect, useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AgencySidebar } from "./AgencySidebar";
import { PartnerNotificationsBell } from "./PartnerNotificationsBell";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Home, ShieldX } from "lucide-react";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { getProfilePhotoUrl, getUserPhotoFromMetadata } from "@/lib/profilePhoto";
import { useTranslation } from "react-i18next";
import { useBackgroundTranslation } from "@/lib/translatableContent";
import { portalDenial, usePartnerModuleAccess, usePartnerPortal } from "@/hooks/usePartnerPortal";
import { allowedServiceTypes, buildPartnerMenu } from "@/lib/partnerPortal";

interface AgencyLayoutProps {
  children: ReactNode;
}

function FullScreenLoader({ label }: { label: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function ModuleForbidden() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center" role="alert">
      <ShieldX className="h-12 w-12 text-destructive" />
      <div>
        <p className="text-sm font-semibold text-destructive">403</p>
        <h1 className="text-xl font-bold">{t("ux.partner.forbidden.title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("ux.partner.forbidden.body")}</p>
      </div>
      <Button asChild>
        <Link to="/agency">{t("ux.partner.forbidden.back")}</Link>
      </Button>
    </div>
  );
}

export function AgencyLayout({ children }: AgencyLayoutProps) {
  const { t } = useTranslation();
  const [signedIn, setSignedIn] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | undefined>();
  const [profileName, setProfileName] = useState("");
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/auth");
        return;
      }
      setSignedIn(true);

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      setProfileName(profile?.full_name || user.email || "Partenaire");
      setProfilePhoto(getProfilePhotoUrl(profile?.avatar_url) || getUserPhotoFromMetadata(user));
    };

    loadUser();
  }, [navigate]);

  // Rôle, agence active, catégorie et modules : vérifiés côté serveur par
  // agency_portal_context(), la rubrique ouverte comprise (403 sinon).
  const portal = usePartnerPortal({ enabled: signedIn });
  const access = usePartnerModuleAccess({ enabled: signedIn });
  // Compte non partenaire ou agence inactive : renvoi vers l'accueil. Une
  // autre erreur (réseau…) laisse le partenaire réessayer sur place.
  const spaceDenial =
    access.denial === "not_partner" || access.denial === "inactive" ? access.denial : portalDenial(portal.error, null);

  useEffect(() => {
    if (!spaceDenial) return;
    toast({
      title: t("ux.bo.accessDenied"),
      description: spaceDenial === "inactive" ? t("ux.bo.agencyNotActive") : t("ux.bo.youNotLinkedAgency"),
      variant: "destructive",
    });
    navigate("/");
  }, [spaceDenial, navigate, t, toast]);
  const spaceDenied = !!spaceDenial;

  const sections = useMemo(() => buildPartnerMenu(portal.data?.modules ?? []), [portal.data]);

  // Traduction automatique des contenus enregistrés pendant la session
  useBackgroundTranslation(!!portal.data);

  if (!portal.data) {
    if (portal.isError && !spaceDenied) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background p-4 text-center">
          <p className="text-muted-foreground">{t("ux.partner.loadError")}</p>
          <Button onClick={() => portal.refetch()}>{t("ux.partner.retry")}</Button>
        </div>
      );
    }
    return <FullScreenLoader label={t("ux.bo.checkingAccess")} />;
  }

  // /agency/services sans type (anciens liens) : premier type de service de
  // la catégorie, ou 403 si la catégorie n'en gère aucun.
  const serviceTypes = allowedServiceTypes(portal.data);
  const bareServicesPage = pathname.replace(/\/+$/, "") === "/agency/services" && !access.module;
  if (bareServicesPage && serviceTypes.length > 0) {
    const params = new URLSearchParams(search);
    params.set("type", serviceTypes[0]);
    return <Navigate replace to={`/agency/services?${params.toString()}`} />;
  }

  const forbidden = access.denial === "module" || (bareServicesPage && serviceTypes.length === 0);
  const currentModule = portal.data.modules.find((m) => m.key === access.module);
  const featureDisabled = currentModule?.enabled === false;

  let content: ReactNode;
  if (forbidden) {
    content = <ModuleForbidden />;
  } else if (access.isPending || spaceDenied) {
    content = (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-label={t("ux.bo.checkingAccess")} />
      </div>
    );
  } else if (access.isError) {
    content = <p className="py-16 text-center text-muted-foreground">{t("ux.partner.loadError")}</p>;
  } else {
    content = (
      <>
        {featureDisabled && (
          <div
            className="mb-4 rounded-lg border border-warning-foreground/20 bg-warning p-3 text-sm text-warning-foreground"
            role="status"
          >
            {t("ux.bo.sectionDisabledAdministratorItemsRemain")}
          </div>
        )}
        <fieldset disabled={featureDisabled} className="m-0 min-w-0 border-0 p-0 disabled:opacity-100">
          {children}
        </fieldset>
      </>
    );
  }

  return (
    <SidebarProvider>
      {/* Hauteur d'écran fixe : seul le contenu défile, dans son panneau, et
          ne dépasse jamais la barre latérale. */}
      <div className="flex h-screen w-full overflow-hidden bg-background supports-[height:100svh]:h-svh">
        <div className="fixed top-0 left-0 right-0 h-1 z-banner bg-brand" />
        <AgencySidebar sections={sections} profileName={profileName} profilePhoto={profilePhoto} />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <header className="h-14 md:h-16 shrink-0 border-b flex items-center justify-between px-3 md:px-4 bg-background z-50">
            <div className="flex items-center gap-2 md:gap-4 min-w-0">
              <SidebarTrigger className="touch-target flex-shrink-0" />
              <Link to="/">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 flex-shrink-0"
                  aria-label={t("ux.bo.backHome")}
                  title={t("ux.bo.backHome")}
                >
                  <Home className="h-4 w-4" />
                </Button>
              </Link>
              <span className="font-medium text-sm md:text-lg truncate">{portal.data.name}</span>
              {portal.data.category_label ? (
                <Badge variant="secondary" className="hidden sm:inline-flex">
                  {portal.data.category_label}
                </Badge>
              ) : (
                <Badge variant="outline" className="hidden sm:inline-flex">
                  {t("ux.partner.noCategory")}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              <PartnerNotificationsBell />
              <DarkModeToggle />
            </div>
          </header>
          <main className="min-h-0 min-w-0 flex-1 overflow-auto p-3 md:p-6">{content}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
