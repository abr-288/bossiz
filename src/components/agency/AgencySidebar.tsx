import { LayoutDashboard, Package, Activity, Home, Percent, Settings, LogOut } from "lucide-react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const menuItems = [
  { title: "Tableau de bord", url: "/agency", icon: LayoutDashboard },
  { title: "Mes Services", url: "/agency/services", icon: Package },
  { title: "Mes Activités", url: "/agency/activities", icon: Activity },
  { title: "Mes Séjours", url: "/agency/stays", icon: Home },
  { title: "Mes Promotions", url: "/agency/promotions", icon: Percent },
  { title: "Paramètres", url: "/agency/settings", icon: Settings },
];

export function AgencySidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const collapsed = state === "collapsed";

  const isActive = (path: string) => {
    if (path === "/agency") {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Déconnexion réussie",
      description: "À bientôt !",
    });
    navigate("/");
  };

  return (
    <Sidebar className={collapsed ? "w-14" : "w-60 md:w-64"} collapsible="icon">
      <SidebarContent className="flex flex-col h-full">
        <div className="p-3 md:p-4 border-b flex-shrink-0">
          <h2 className={`font-bold text-lg md:text-xl ${collapsed ? "text-center" : ""}`}>
            {collapsed ? "AG" : "Espace Agence"}
          </h2>
        </div>

        <SidebarGroup className="flex-1 overflow-y-auto">
          <SidebarGroupLabel className="text-xs px-3">Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link
                      to={item.url}
                      aria-label={item.title}
                      className={`flex items-center gap-2 md:gap-3 py-2 md:py-2.5 ${
                        isActive(item.url) ? "bg-accent text-accent-foreground font-medium" : ""
                      }`}
                    >
                      <item.icon className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
                      {!collapsed && <span className="text-sm md:text-base truncate">{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto p-3 md:p-4 border-t flex-shrink-0">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-sm"
            onClick={handleLogout}
            aria-label="Déconnexion"
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            {!collapsed && <span className="truncate">Déconnexion</span>}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}