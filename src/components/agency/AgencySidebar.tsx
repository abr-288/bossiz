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
import { SidebarBrandHeader, sidebarIconClass, sidebarLinkClass, sidebarWidthClass } from "@/components/dashboard/SidebarShell";
import i18n from "@/i18n/config";

const menuItems = [
  { get title() { return i18n.t("ux.bo.dashboard"); }, url: "/agency", icon: LayoutDashboard },
  { get title() { return i18n.t("ux.bo.myServices"); }, url: "/agency/services", icon: Package },
  { get title() { return i18n.t("ux.bo.myTours"); }, url: "/agency/services?type=tour", icon: Map },
  { get title() { return i18n.t("ux.bo.myRestaurants"); }, url: "/agency/restaurants", icon: UtensilsCrossed },
  { get title() { return i18n.t("ux.bo.myArtisans"); }, url: "/agency/artisans", icon: Hammer },
  { get title() { return i18n.t("ux.bo.wellnessBeauty"); }, url: "/agency/wellness", icon: Sparkles },
  { get title() { return i18n.t("ux.bo.myActivities"); }, url: "/agency/activities", icon: Activity },
  { get title() { return i18n.t("ux.bo.myStays"); }, url: "/agency/stays", icon: Home },
  { get title() { return i18n.t("ux.bo.myPromotions"); }, url: "/agency/promotions", icon: Percent },
  { get title() { return i18n.t("ux.bo.settings"); }, url: "/agency/settings", icon: Settings },
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
      get title() { return i18n.t("ux.bo.loggedOut"); },
      get description() { return i18n.t("ux.bo.seeYouSoon"); },
    });
    navigate("/");
  };

  return (
    <Sidebar className={sidebarWidthClass(collapsed)} collapsible="icon">
      <SidebarContent className="flex flex-col h-full">
        <SidebarBrandHeader title="BizBossiz" shortTitle="BB" collapsed={collapsed}>
            <Link to="/account" className="mt-3 flex items-center gap-2 rounded-lg bg-white/10 p-2 text-white hover:bg-white/20">
              <Avatar className="h-9 w-9 border border-white/40">
                <AvatarImage src={profilePhoto} />
                <AvatarFallback className="bg-white/20 text-white text-xs">
                  {profileName.trim().slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="truncate text-sm">{profileName}</span>
            </Link>
        </SidebarBrandHeader>

        <SidebarGroup className="flex-1 overflow-y-auto">
          <SidebarGroupLabel className="text-xs px-3">{i18n.t("ux.bo.mainMenu")}</SidebarGroupLabel>
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
                      title={disabled ? i18n.t("ux.bo.disabledAdministrator") : undefined}
                      onClick={(event) => { if (disabled) event.preventDefault(); }}
                      className={sidebarLinkClass(isActive(item.url), disabled)}
                    >
                      <item.icon className={sidebarIconClass} />
                      {!collapsed && <span className="truncate">{item.title}</span>}
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
            aria-label={i18n.t("ux.bo.logOut")}
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            {!collapsed && <span className="truncate">{i18n.t("ux.bo.logOut")}</span>}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
