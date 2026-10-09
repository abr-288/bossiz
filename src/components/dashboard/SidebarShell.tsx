import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// Éléments communs aux sidebars des trois espaces connectés (admin, agence,
// client) : même largeur, même en-tête de marque, mêmes liens. Avant, chaque
// espace avait ses propres couleurs en dur (#334155, #0f766e, primary/10).

export const sidebarWidthClass = (collapsed: boolean) => (collapsed ? "w-14" : "w-64");

export const sidebarLinkClass = (active: boolean, disabled = false) =>
  cn(
    "flex min-h-11 items-center gap-3 rounded-lg text-sm transition-colors",
    disabled
      ? "cursor-not-allowed text-muted-foreground"
      : active
        ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground"
        : "text-sidebar-foreground hover:bg-muted",
  );

export const sidebarIconClass = "h-5 w-5 shrink-0";

interface SidebarBrandHeaderProps {
  title: string;
  shortTitle: string;
  collapsed: boolean;
  children?: ReactNode;
}

export function SidebarBrandHeader({ title, shortTitle, collapsed, children }: SidebarBrandHeaderProps) {
  return (
    <div className="flex-shrink-0 bg-brand p-3 text-brand-foreground md:p-4">
      <p className={cn("font-display text-lg font-bold md:text-xl", collapsed && "text-center")}>
        {collapsed ? shortTitle : title}
      </p>
      {!collapsed && children}
    </div>
  );
}
