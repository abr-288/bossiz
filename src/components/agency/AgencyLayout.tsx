import { ReactNode, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AgencySidebar } from "./AgencySidebar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Home } from "lucide-react";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { getProfilePhotoUrl, getUserPhotoFromMetadata } from "@/lib/profilePhoto";
import { useTranslation } from "react-i18next";

interface AgencyLayoutProps {
  children: ReactNode;
}

export function AgencyLayout({ children }: AgencyLayoutProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [agencyName, setAgencyName] = useState<string>("");
  const [profilePhoto, setProfilePhoto] = useState<string | undefined>();
  const [profileName, setProfileName] = useState("");
  const [enabledFeatures, setEnabledFeatures] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const checkAgencyAccess = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      setProfileName(profile?.full_name || user.email || "Partenaire");
      setProfilePhoto(getProfilePhotoUrl(profile?.avatar_url) || getUserPhotoFromMetadata(user));

      // Check if user has sub_agency role
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "sub_agency")
        .maybeSingle();

      if (!roles) {
        toast({
          title: t("ux.bo.accessDenied"),
          description: t("ux.bo.youNotLinkedAgency"),
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      // Fetch agency info
      let { data: agency, error: agencyError } = await supabase
        .from("agencies")
        .select("name, is_active, enabled_features")
        .eq("owner_id", user.id)
        .single();

      // Keep older deployments usable until the permissions migration is applied.
      if (agencyError?.message.includes("enabled_features")) {
        const legacyResult = await supabase
          .from("agencies")
          .select("name, is_active")
          .eq("owner_id", user.id)
          .single();
        agency = legacyResult.data ? { ...legacyResult.data, enabled_features: {} } : null;
        agencyError = legacyResult.error;
      }

      if (!agency || agencyError || !agency.is_active) {
        toast({
          title: t("ux.bo.accessDenied"),
          description: t("ux.bo.agencyNotActive"),
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      setAgencyName(agency.name);
      setEnabledFeatures((agency.enabled_features as Record<string, boolean> | null) || {});
      setLoading(false);
    };

    checkAgencyAccess();
  }, [navigate, pathname, toast]);

  const featureForPath = pathname.startsWith("/agency/services") ? "services"
    : pathname.startsWith("/agency/activities") ? "activities"
    : pathname.startsWith("/agency/stays") ? "stays"
    : pathname.startsWith("/agency/restaurants") ? "restaurants"
    : pathname.startsWith("/agency/artisans") ? "artisans"
    : pathname.startsWith("/agency/wellness") ? "wellness"
    : pathname.startsWith("/agency/promotions") ? "promotions"
    : null;
  const featureDisabled = !!featureForPath && enabledFeatures[featureForPath] === false;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="text-muted-foreground">{t("ux.bo.checkingAccess")}</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <div className="fixed top-0 left-0 right-0 h-1 z-banner bg-brand" />
        <AgencySidebar
          enabledFeatures={enabledFeatures}
          profileName={profileName}
          profilePhoto={profilePhoto}
        />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 md:h-16 border-b flex items-center justify-between px-3 md:px-4 bg-background sticky top-0 z-50">
            <div className="flex items-center gap-2 md:gap-4 min-w-0">
              <SidebarTrigger className="touch-target flex-shrink-0" />
              <Link to="/">
                <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" aria-label={t("ux.bo.backHome")} title={t("ux.bo.backHome")}>
                  <Home className="h-4 w-4" />
                </Button>
              </Link>
              <span className="font-medium text-sm md:text-lg truncate">{agencyName}</span>
            </div>
            <DarkModeToggle />
          </header>
          <main className="flex-1 p-3 md:p-6 overflow-auto">
            {featureDisabled && (
              <div className="mb-4 rounded-lg border border-warning-foreground/20 bg-warning p-3 text-sm text-warning-foreground" role="status">
                {t("ux.bo.sectionDisabledAdministratorItemsRemain")}
              </div>
            )}
            <fieldset disabled={featureDisabled} className="m-0 min-w-0 border-0 p-0 disabled:opacity-100">
              {children}
            </fieldset>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
