import {
  LayoutDashboard,
  Package,
  Activity,
  Home,
  Calendar,
  Users,
  Crown,
  Mail,
  Cog,
  Percent,
  Tags,
  Building2,
  DollarSign,
  Megaphone,
  CreditCard,
  Star,
  MapPin,
  Newspaper,
  Globe,
  KeyRound,
  FileText,
  Car,
  Languages,
  Smile,
  Landmark,
  Receipt,
  Ticket,
  LayoutList,
} from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import {
  SidebarBrandHeader,
  sidebarIconClass,
  sidebarLinkClass,
  sidebarWidthClass,
} from "@/components/dashboard/SidebarShell";
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
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import i18n from "@/i18n/config";
import { supabase } from "@/integrations/supabase/client";

const menuItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  {
    get title() {
      return i18n.t("ux.bo.bookings");
    },
    url: "/admin/bookings",
    icon: Calendar,
  },
  { title: "Services", url: "/admin/services", icon: Package },
  {
    get title() {
      return i18n.t("ux.bo.activities");
    },
    url: "/admin/activities",
    icon: Activity,
  },
  {
    get title() {
      return i18n.t("ux.bo.stays");
    },
    url: "/admin/stays",
    icon: Home,
  },
  {
    get title() {
      return i18n.t("ux.bo.subAgencies");
    },
    url: "/admin/agencies",
    icon: Building2,
  },
  {
    get title() {
      return i18n.t("ux.bo.partnerApplications");
    },
    url: "/admin/partner-applications",
    icon: FileText,
  },
  {
    get title() {
      return i18n.t("ux.partner.admin.menu");
    },
    url: "/admin/partner-categories",
    icon: LayoutList,
  },
  { title: "Commissions", url: "/admin/commissions", icon: DollarSign },
  { title: "Commissions hôtels sur place", url: "/admin/hotel-commissions", icon: Receipt },
  {
    get title() {
      return i18n.t("ux.bo.carPlans");
    },
    url: "/admin/car-partner-plans",
    icon: Car,
  },
  {
    get title() {
      return i18n.t("ux.bo.subscriptionRequests");
    },
    url: "/admin/subscriptions",
    icon: Crown,
  },
  {
    get title() {
      return i18n.t("ux.bo.subscriptionPlans");
    },
    url: "/admin/subscription-plans",
    icon: Tags,
  },
  {
    get title() {
      return i18n.t("ux.smilesAdmin.menu");
    },
    url: "/admin/smiles",
    icon: Smile,
  },
  { title: "Promotions", url: "/admin/promotions", icon: Percent },
  {
    get title() {
      return i18n.t("ux.bo.advertisements");
    },
    url: "/admin/advertisements",
    icon: Megaphone,
  },
  {
    get title() {
      return i18n.t("ux.bo.payments");
    },
    url: "/admin/payments",
    icon: CreditCard,
  },
  {
    get title() {
      return i18n.t("ux.bo.customerReviews");
    },
    url: "/admin/reviews",
    icon: Star,
  },
  { title: "Newsletter", url: "/admin/newsletter", icon: Newspaper },
  { title: "Destinations", url: "/admin/destinations", icon: MapPin },
  { title: "Culture", url: "/admin/culture", icon: Landmark },
  { title: "Actualités", url: "/admin/actualites", icon: Newspaper },
  { title: "Événements", url: "/admin/events", icon: Ticket },
  {
    get title() {
      return i18n.t("ux.bo.bossizContent");
    },
    url: "/admin/bossiz-microsites",
    icon: Globe,
  },
  {
    get title() {
      return i18n.t("ux.bo.integrationsEmailSmsPayment");
    },
    url: "/admin/integrations",
    icon: KeyRound,
  },
  {
    get title() {
      return i18n.t("ux.bo.users");
    },
    url: "/admin/users",
    icon: Users,
  },
  {
    get title() {
      return i18n.t("ux.bo.emailTemplates");
    },
    url: "/admin/email-templates",
    icon: Mail,
  },
  {
    get title() {
      return i18n.t("ux.translations.menu");
    },
    url: "/admin/translations",
    icon: Languages,
  },
  { title: "Configuration", url: "/admin/configuration", icon: Cog },
];

export function AdminSidebar() {
  const { t } = useTranslation();
  const { state, setOpenMobile } = useSidebar();
  const location = useLocation();
  const collapsed = state === "collapsed";
  // Avis en attente de modération : ils ne sont visibles qu'une fois validés.
  const { data: pendingReviews = 0 } = useQuery({
    queryKey: ["admin-pending-reviews"],
    queryFn: async () => {
      const { count } = await supabase
        .from("reviews")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending");
      return count ?? 0;
    },
    refetchInterval: 5 * 60_000,
  });
  const badges: Record<string, number> = { "/admin/reviews": pendingReviews };

  const isActive = (path: string) => {
    if (path === "/admin") {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <Sidebar className={sidebarWidthClass(collapsed)} collapsible="icon">
      <SidebarContent className="flex flex-col h-full">
        <SidebarBrandHeader title="BossizHQ" shortTitle="HQ" collapsed={collapsed} />

        <SidebarGroup className="flex-1 overflow-y-auto">
          <SidebarGroupLabel className="text-xs px-3">{t("ux.bo.mainMenu")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link
                      to={item.url}
                      aria-label={item.title}
                      onClick={() => setOpenMobile(false)}
                      className={sidebarLinkClass(isActive(item.url))}
                    >
                      <item.icon className={sidebarIconClass} />
                      {!collapsed && <span className="truncate">{item.title}</span>}
                      {!collapsed && (badges[item.url] ?? 0) > 0 && (
                        <span
                          className="ml-auto rounded-full bg-destructive px-2 text-xs font-semibold text-destructive-foreground"
                          aria-label={t("ux.reviews.pendingBadge", { count: badges[item.url] })}
                        >
                          {badges[item.url]}
                        </span>
                      )}
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
