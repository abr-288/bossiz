import {
  LayoutDashboard,
  Package,
  Activity,
  Home,
  Percent,
  Settings,
  LogOut,
  UtensilsCrossed,
  Hammer,
  Sparkles,
  Map,
  CalendarCheck,
  Hotel,
  Car,
  Tags,
  Inbox,
  Clock,
  History,
  Wallet,
  Receipt,
  Banknote,
  FileText,
  Star,
  Users,
  LifeBuoy,
  type LucideIcon,
} from "lucide-react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
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
import {
  SidebarBrandHeader,
  sidebarIconClass,
  sidebarLinkClass,
  sidebarWidthClass,
} from "@/components/dashboard/SidebarShell";
import i18n from "@/i18n/config";
import { isMenuLinkActive, type PartnerMenuSection } from "@/lib/partnerPortal";

const LINK_ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  catalog_hotels: Hotel,
  catalog_cars: Car,
  catalog_tours: Map,
  catalog_activities: Activity,
  catalog_stays: Home,
  catalog_restaurants: UtensilsCrossed,
  catalog_artisans: Hammer,
  catalog_wellness: Sparkles,
  hotel_rates: Tags,
  promotions: Percent,
  "orders.new": Inbox,
  "orders.in_progress": Clock,
  "orders.history": History,
  hotel_bookings: CalendarCheck,
  "finances.revenue": Wallet,
  "finances.commissions": Receipt,
  "finances.payouts": Banknote,
  "finances.statements": FileText,
  reviews: Star,
  customers: Users,
  settings: Settings,
  support: LifeBuoy,
};

// Libellé traduit si la clé existe, sinon celui de partner_modules.
const linkLabel = (labelKey: string | undefined, fallback: string) =>
  labelKey && i18n.exists(labelKey) ? i18n.t(labelKey) : fallback;

export function AgencySidebar({
  sections,
  profileName = "Partenaire",
  profilePhoto,
}: {
  sections: PartnerMenuSection[];
  profileName?: string;
  profilePhoto?: string;
}) {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const collapsed = state === "collapsed";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    queryClient.removeQueries({ queryKey: ["partner-portal"] });
    toast({
      get title() {
        return i18n.t("ux.bo.loggedOut");
      },
      get description() {
        return i18n.t("ux.bo.seeYouSoon");
      },
    });
    navigate("/");
  };

  return (
    <Sidebar className={sidebarWidthClass(collapsed)} collapsible="icon">
      <SidebarContent className="flex flex-col h-full">
        <SidebarBrandHeader title="BizBossiz" shortTitle="BB" collapsed={collapsed}>
          <Link
            to="/account"
            className="mt-3 flex items-center gap-2 rounded-lg bg-white/10 p-2 text-white hover:bg-white/20"
          >
            <Avatar className="h-9 w-9 border border-white/40">
              <AvatarImage src={profilePhoto} />
              <AvatarFallback className="bg-white/20 text-white text-xs">
                {profileName.trim().slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="truncate text-sm">{profileName}</span>
          </Link>
        </SidebarBrandHeader>

        <nav className="flex-1 overflow-y-auto" aria-label={i18n.t("ux.bo.mainMenu")}>
          {sections.map((section) => (
            <SidebarGroup key={section.group} className="py-1">
              {section.group !== "dashboard" && (
                <SidebarGroupLabel className="text-xs px-3">
                  {i18n.t(`ux.partner.groups.${section.group}`)}
                </SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu>
                  {section.links.map((link) => {
                    const Icon = LINK_ICONS[link.id] ?? LINK_ICONS[link.module] ?? Package;
                    const label = linkLabel(link.labelKey, link.label);
                    return (
                      <SidebarMenuItem key={link.id}>
                        <SidebarMenuButton asChild>
                          <Link
                            to={link.to}
                            aria-label={label}
                            aria-disabled={link.disabled}
                            tabIndex={link.disabled ? -1 : undefined}
                            title={link.disabled ? i18n.t("ux.bo.disabledAdministrator") : undefined}
                            onClick={(event) => {
                              if (link.disabled) event.preventDefault();
                            }}
                            className={sidebarLinkClass(
                              isMenuLinkActive(link, location.pathname, location.search),
                              link.disabled,
                            )}
                          >
                            <Icon className={sidebarIconClass} />
                            {!collapsed && <span className="truncate">{label}</span>}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </nav>

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
