import { ReactNode, useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { isAuthRetryableFetchError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { UserSidebar } from "./UserSidebar";
import { DarkModeToggle } from "@/components/DarkModeToggle";

import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { getProfilePhotoUrl, getUserPhotoFromMetadata, PROFILE_UPDATED_EVENT } from "@/lib/profilePhoto";
import { withTimeout } from "@/lib/withTimeout";
import { LoadErrorRetry } from "@/components/LoadErrorRetry";

interface UserDashboardLayoutProps {
  children: ReactNode;
  /** Removes the default padding around `children` so dark, full-bleed
   * content can span edge-to-edge instead of floating as an inset box
   * inside the light shell's padding. */
  fullBleed?: boolean;
}

interface UserProfile {
  full_name: string;
  email: string;
  avatar_url?: string;
}

export function UserDashboardLayout({ children, fullBleed }: UserDashboardLayoutProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      setLoadFailed(false);
      try {
        const {
          data: { user },
          error,
        } = await withTimeout(supabase.auth.getUser());

        // Une coupure réseau ne veut pas dire « déconnecté » : on propose de
        // réessayer au lieu de renvoyer vers la page de connexion.
        if (error && isAuthRetryableFetchError(error)) throw error;

        if (!user) {
          navigate("/auth");
          return;
        }

        await withTimeout(refreshProfile(user.id, user.email || "", getUserPhotoFromMetadata(user)));
        setLoading(false);
      } catch {
        setLoadFailed(true);
      }
    };

    const refreshProfile = async (userId: string, email: string, metadataPhoto?: string) => {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", userId)
        .maybeSingle();

      setUserProfile({
        full_name: profileData?.full_name || "Utilisateur",
        email,
        avatar_url: getProfilePhotoUrl(profileData?.avatar_url) || metadataPhoto,
      });
    };

    checkAuth();

    const handleProfileUpdated = () => {
      void supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) void refreshProfile(user.id, user.email || "", getUserPhotoFromMetadata(user));
      });
    };
    window.addEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdated);
    return () => window.removeEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdated);
  }, [navigate, attempt]);

  if (loadFailed) {
    return (
      <div className="min-h-screen flex bg-background">
        <LoadErrorRetry onRetry={() => setAttempt((n) => n + 1)} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      {/* Hauteur d'écran fixe : seul le contenu défile, dans son panneau, et
          ne dépasse jamais la barre latérale. */}
      <div className="flex h-screen w-full overflow-hidden bg-muted/30 supports-[height:100svh]:h-svh">
        <UserSidebar userProfile={userProfile} />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <header className="h-14 shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-4 z-50">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <Link to="/">
                <Button variant="ghost" size="icon" aria-label="Accueil" className="h-8 w-8">
                  <Home className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <DarkModeToggle />
            </div>
          </header>

          <main className={cn("min-h-0 min-w-0 flex-1 overflow-auto", fullBleed ? "p-0" : "p-4 md:p-6")}>
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
