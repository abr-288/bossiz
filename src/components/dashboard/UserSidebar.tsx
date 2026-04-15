import { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  Calendar, 
  CreditCard, 
  User, 
  Bell, 
  Settings, 
  MapPin,
  Plane,
  HelpCircle,
  LogOut,
  Building2,
  Crown
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
      title: 'Majestic Club', 
      url: "/majestic-club", 
      icon: Crown,
      premium: true
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
      url: "/flights", 
      icon: Plane 
    },
    { 
      title: t('nav.destinations', 'Destinations'), 
      url: "/destinations", 
      icon: MapPin 
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
    title: "Espace Agence", 
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
      className={collapsed ? "w-16" : "w-64"} 
      collapsible="icon"
    >
      <SidebarHeader className="border-b p-4">
        <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
          <Avatar className="h-10 w-10 border-2 border-primary/20">
            <AvatarImage src={userProfile?.avatar_url} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {userProfile?.full_name ? getInitials(userProfile.full_name) : "U"}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="font-semibold text-sm truncate">
                {userProfile?.full_name || t('dashboardPage.welcome')}
              </span>
              <span className="text-xs text-muted-foreground truncate">
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
                      className={`flex items-center gap-3 ${
                        isActive(item.url) 
                          ? (item.url === "/majestic-club" ? "bg-[#D4AF37]/20 text-[#D4AF37] font-bold" : "bg-primary/10 text-primary font-medium")
                          : (item.url === "/majestic-club" ? "text-[#D4AF37] hover:bg-[#D4AF37]/10" : "hover:bg-muted")
                      }`}
                    >
                      <item.icon className={`h-5 w-5 shrink-0 ${item.url === "/majestic-club" ? "text-[#D4AF37]" : ""}`} />
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
                      className={`flex items-center gap-3 ${
                        isActive(agencyItem.url) 
                          ? "bg-primary/10 text-primary font-medium" 
                          : "hover:bg-muted"
                      }`}
                    >
                      <agencyItem.icon className="h-5 w-5 shrink-0" />
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
                    <Link 
                      to={item.url}
                      className={`flex items-center gap-3 ${
                        isActive(item.url) 
                          ? "bg-primary/10 text-primary font-medium" 
                          : "hover:bg-muted"
                      }`}
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </Link>
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
                      className={`flex items-center gap-3 hover:bg-muted`}
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
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
