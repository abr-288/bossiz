import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { Button } from "@/components/ui/button";
import { LogOut, Home } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      // Check if user has admin role
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!roles) {
        toast({
          title: "Accès refusé",
          description: "Vous n'avez pas les permissions nécessaires",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      setLoading(false);
    };

    checkAdmin();
  }, [navigate, toast]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-muted/10">
        <div className="fixed top-0 left-0 right-0 h-1 z-[60]" style={{ backgroundColor: "#334155" }} />
        <AdminSidebar />
        
        <div className="flex-1 flex flex-col min-w-0">
          <header className="min-h-14 md:h-16 border-b bg-background flex items-center justify-between gap-2 px-3 md:px-6 sticky top-0 z-50">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="touch-target" />
              <Link to="/">
                <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Retour à l'accueil" title="Retour à l'accueil">
                  <Home className="h-4 w-4" />
                </Button>
              </Link>
              <span className="text-sm font-semibold sm:hidden">Administration</span>
            </div>
            <Button
              variant="ghost"
              onClick={handleLogout}
              aria-label="Déconnexion"
              title="Déconnexion"
              className="touch-target gap-2 text-sm md:text-base"
            >
              <LogOut className="h-4 w-4" />
              <span className="sm:hidden">Quitter</span>
              <span className="hidden sm:inline">Déconnexion</span>
            </Button>
          </header>

          <main className="min-w-0 flex-1 overflow-auto p-3 sm:p-4 md:p-6">
            <div data-admin-content className="min-w-0">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
