import { LayoutDashboard, Package, Activity, Home, Percent, Settings, LogOut, UtensilsCrossed, Hammer, Sparkles, Map } from "lucide-react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const menuItems = [
  { title: "Tableau de bord", url: "/agency", icon: LayoutDashboard },
  { title: "Mes Services", url: "/agency/services", icon: Package },
  { title: "Mes Circuits", url: "/agency/services?type=tour", icon: Map },
  { title: "Mes Restaurants", url: "/agency/restaurants", icon: UtensilsCrossed },
  { title: "Mes Artisans", url: "/agency/artisans", icon: Hammer },
  { title: "Bien-être & Beauté", url: "/agency/wellness", icon: Sparkles },
  { title: "Mes Activités", url: "/agency/activities", icon: Activity },
  { title: "Mes Séjours", url: "/agency/stays", icon: Home },
  { title: "Mes Promotions", url: "/agency/promotions", icon: Percent },
  { title: "Paramètres", url: "/agency/settings", icon: Settings },
];

export function AgencySidebar({
  enabledFeatures = {},
  profileName = "Partenaire",
  profilePhoto,
}: {
  enabledFeatures?: Record<string, boolean>;
  profileName?: string;
  profilePhoto?: string;
}) {
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
        <div className="p-3 md:p-4 flex-shrink-0" style={{ backgroundColor: "#0f766e" }}>
          <h2 className={`font-bold text-lg md:text-xl text-white ${collapsed ? "text-center" : ""}`}>
            {collapsed ? "BB" : "BizBossiz"}
          </h2>
          {!collapsed && (
            <Link to="/account" className="mt-3 flex items-center gap-2 rounded-md bg-white/10 p-2 text-white hover:bg-white/20">
              <Avatar className="h-9 w-9 border border-white/40">
                <AvatarImage src={profilePhoto} />
                <AvatarFallback className="bg-white/20 text-white text-xs">
                  {profileName.trim().slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="truncate text-sm">{profileName}</span>
            </Link>
          )}
        </div>

        <SidebarGroup className="flex-1 overflow-y-auto">
          <SidebarGroupLabel className="text-xs px-3">Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const feature = item.url.startsWith("/agency/services") ? "services"
                  : item.url.startsWith("/agency/activities") ? "activities"
                  : item.url.startsWith("/agency/stays") ? "stays"
                  : item.url.startsWith("/agency/restaurants") ? "restaurants"
                  : item.url.startsWith("/agency/artisans") ? "artisans"
                  : item.url.startsWith("/agency/wellness") ? "wellness"
                  : item.url.startsWith("/agency/promotions") ? "promotions"
                  : null;
                const disabled = !!feature && enabledFeatures[feature] === false;
                return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link
                      to={item.url}
                      aria-label={item.title}
                      aria-disabled={disabled}
                      tabIndex={disabled ? -1 : undefined}
                      title={disabled ? "Désactivé par l’administrateur" : undefined}
                      onClick={(event) => { if (disabled) event.preventDefault(); }}
                      className={`flex items-center gap-2 md:gap-3 py-2 md:py-2.5 ${
                        disabled ? "text-muted-foreground cursor-not-allowed" : isActive(item.url) ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold" : ""
                      }`}
                    >
                      <item.icon className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
                      {!collapsed && <span className="text-sm md:text-base truncate">{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                );
              })}
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
