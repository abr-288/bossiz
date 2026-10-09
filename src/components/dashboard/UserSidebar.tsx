import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Calendar,
  User,
  Bell,
  Settings,
  MapPin,
  Map,
  Plane,
  HelpCircle,
  LogOut,
  Building2
} from "lucide-react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getProfilePhotoUrl } from "@/lib/profilePhoto";
import { sidebarIconClass, sidebarLinkClass, sidebarWidthClass } from "@/components/dashboard/SidebarShell";

interface UserSidebarProps {
  userProfile?: {
    full_name: string;
    email: string;
    avatar_url?: string;
  } | null;
}

export function UserSidebar({ userProfile }: UserSidebarProps) {
  const { t } = useTranslation();
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const collapsed = state === "collapsed";
  const [isSubAgency, setIsSubAgency] = useState(false);

  useEffect(() => {
    const checkSubAgencyRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "sub_agency")
          .maybeSingle();
        
        setIsSubAgency(!!roles);
      }
    };
    checkSubAgencyRole();
  }, []);

  const menuItems = [
    { 
      title: t('dashboardPage.sidebar.overview', 'Vue d\'ensemble'), 
      url: "/dashboard", 
      icon: LayoutDashboard 
    },
    {
      title: t('dashboardPage.sidebar.bookings', 'Mes réservations'),
      url: "/booking-history", 
      icon: Calendar 
    },
    { 
      title: t('dashboardPage.sidebar.priceAlerts', 'Alertes prix'), 
      url: "/price-alerts", 
      icon: Bell 
    },
    { 
      title: t('dashboardPage.sidebar.account', 'Mon compte'), 
      url: "/account", 
      icon: User 
    },
  ];

  const exploreItems = [
    {
      title: t('nav.flights', 'Vols'),
      url: "https://vols.bossiz.com/",
      icon: Plane
    },
    { 
      title: t('nav.destinations', 'Destinations'), 
      url: "/destinations", 
      icon: MapPin 
    },
    {
      title: t('nav.tours', 'Circuits'),
      url: "/tours",
      icon: Map,
    },
  ];

  const supportItems = [
    { 
      title: t('nav.help', 'Aide'), 
      url: "/help", 
      icon: HelpCircle 
    },
    { 
      title: t('nav.support', 'Support'), 
      url: "/support", 
      icon: Settings 
    },
  ];

  const agencyItem = { 
    title: "BizBossiz",
    url: "/agency", 
    icon: Building2 
  };

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Sidebar
      className={sidebarWidthClass(collapsed)}
      collapsible="icon"
    >
      <SidebarHeader className="bg-brand p-4 text-brand-foreground">
        <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
          <Avatar className="h-10 w-10 border border-white/40">
            <AvatarImage src={getProfilePhotoUrl(userProfile?.avatar_url)} />
            <AvatarFallback className="bg-white/20 text-white font-semibold">
              {userProfile?.full_name ? getInitials(userProfile.full_name) : "U"}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="font-semibold text-sm truncate">
                {userProfile?.full_name || t('dashboardPage.welcome')}
              </span>
              <span className="text-xs text-white/75 truncate">
                {userProfile?.email}
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            {!collapsed && t('dashboardPage.sidebar.main', 'Principal')}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link
                      to={item.url}
                      aria-label={item.title}
                      className={sidebarLinkClass(isActive(item.url))}
                    >
                      <item.icon className={sidebarIconClass} />
                      {!collapsed && <span>{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isSubAgency && (
          <SidebarGroup>
            <SidebarGroupLabel>
              {!collapsed && "Mon Agence"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link
                      to={agencyItem.url}
                      aria-label={agencyItem.title}
                      className={sidebarLinkClass(isActive(agencyItem.url))}
                    >
                      <agencyItem.icon className={sidebarIconClass} />
                      {!collapsed && <span>{agencyItem.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarGroupLabel>
            {!collapsed && t('dashboardPage.sidebar.explore', 'Explorer')}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {exploreItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    {item.url.startsWith("http") ? (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={item.title}
                        className={sidebarLinkClass(false)}
                      >
                        <item.icon className={sidebarIconClass} />
                        {!collapsed && <span>{item.title}</span>}
                      </a>
                    ) : (
                      <Link
                        to={item.url}
                        aria-label={item.title}
                        className={sidebarLinkClass(isActive(item.url))}
                      >
                        <item.icon className={sidebarIconClass} />
                        {!collapsed && <span>{item.title}</span>}
                      </Link>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>
            {!collapsed && t('dashboardPage.sidebar.support', 'Assistance')}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {supportItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link
                      to={item.url}
                      aria-label={item.title}
                      className={sidebarLinkClass(false)}
                    >
                      <item.icon className={sidebarIconClass} />
                      {!collapsed && <span>{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-2">
        <Button
          variant="ghost"
          onClick={handleLogout}
          aria-label={t('auth.logout', 'Déconnexion')}
          className={`w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10 ${
            collapsed ? "justify-center px-2" : ""
          }`}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>{t('auth.logout', 'Déconnexion')}</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
