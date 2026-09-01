import { LayoutDashboard, Package, Activity, Home, Calendar, Users, Crown, Mail, Cog, Percent, Tags, Building2, DollarSign, Megaphone, CreditCard, Star, MapPin, Newspaper, Globe, KeyRound, FileText } from "lucide-react";
import { useLocation, Link } from "react-router-dom";
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

const menuItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Réservations", url: "/admin/bookings", icon: Calendar },
  { title: "Services", url: "/admin/services", icon: Package },
  { title: "Activités", url: "/admin/activities", icon: Activity },
  { title: "Séjours", url: "/admin/stays", icon: Home },
  { title: "Sous-Agences", url: "/admin/agencies", icon: Building2 },
  { title: "Candidatures Partenaires", url: "/admin/partner-applications", icon: FileText },
  { title: "Commissions", url: "/admin/commissions", icon: DollarSign },
  { title: "Demandes Abonnements", url: "/admin/subscriptions", icon: Crown },
  { title: "Plans d'abonnement", url: "/admin/subscription-plans", icon: Tags },
  { title: "Promotions", url: "/admin/promotions", icon: Percent },
  { title: "Publicités", url: "/admin/advertisements", icon: Megaphone },
  { title: "Paiements", url: "/admin/payments", icon: CreditCard },
  { title: "Avis Clients", url: "/admin/reviews", icon: Star },
  { title: "Newsletter", url: "/admin/newsletter", icon: Newspaper },
  { title: "Destinations", url: "/admin/destinations", icon: MapPin },
  { title: "Contenu Bossiz", url: "/admin/bossiz-microsites", icon: Globe },
  { title: "Intégrations (Email/SMS/Paiement)", url: "/admin/integrations", icon: KeyRound },
  { title: "Utilisateurs", url: "/admin/users", icon: Users },
  { title: "Templates Email", url: "/admin/email-templates", icon: Mail },
  { title: "Configuration", url: "/admin/configuration", icon: Cog },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const collapsed = state === "collapsed";

  const isActive = (path: string) => {
    if (path === "/admin") {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <Sidebar className={collapsed ? "w-14" : "w-56 md:w-64"} collapsible="icon">
      <SidebarContent className="flex flex-col h-full">
        <div className="p-3 md:p-4 border-b flex-shrink-0">
          <h2 className={`font-bold text-base md:text-xl ${collapsed ? "text-center" : ""}`}>
            {collapsed ? "BR" : "B-Reserve Admin"}
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
                      {!collapsed && <span className="text-xs md:text-sm truncate">{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
