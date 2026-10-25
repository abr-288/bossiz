// Espace partenaire : correspondance entre les modules configurés en base
// (public.partner_modules, activés par catégorie dans
// public.partner_category_modules) et les pages du site.
//
// Le menu n'est plus écrit en dur : il est construit à partir de la liste
// des modules que renvoie agency_portal_context() pour le partenaire
// connecté. Une catégorie se configure dans /admin/partner-categories ; un
// nouveau module demande une page, donc une entrée ici et une migration.

export type PartnerMenuGroup = "dashboard" | "services" | "orders" | "finances" | "clients" | "profile" | "support";

export interface PortalModule {
  key: string;
  label: string;
  group: PartnerMenuGroup;
  // false : rubrique désactivée par un admin (visible, en lecture seule).
  enabled: boolean;
}

export interface PartnerPortalContext {
  agency_id: string;
  name: string;
  category: string | null;
  category_label: string | null;
  modules: PortalModule[];
}

export interface PartnerMenuLink {
  // Clé i18n (ux.partner.menu.*) ou libellé de la base en repli.
  id: string;
  module: string;
  to: string;
  label: string;
  labelKey?: string;
  disabled: boolean;
}

export interface PartnerMenuSection {
  group: PartnerMenuGroup;
  links: PartnerMenuLink[];
}

// Modules gérés dans public.services : la page /agency/services est filtrée
// par type, un type par module.
export const SERVICE_TYPE_MODULES = {
  hotel: "catalog_hotels",
  car: "catalog_cars",
  tour: "catalog_tours",
} as const;

export type PartnerServiceType = keyof typeof SERVICE_TYPE_MODULES;

const MODULE_PATHS: Record<string, string> = {
  dashboard: "/agency",
  catalog_hotels: "/agency/services?type=hotel",
  catalog_cars: "/agency/services?type=car",
  catalog_tours: "/agency/services?type=tour",
  catalog_activities: "/agency/activities",
  catalog_stays: "/agency/stays",
  catalog_restaurants: "/agency/restaurants",
  catalog_artisans: "/agency/artisans",
  catalog_wellness: "/agency/wellness",
  hotel_rates: "/agency/rates",
  promotions: "/agency/promotions",
  orders: "/agency/orders",
  hotel_bookings: "/agency/hotel-bookings",
  finances: "/agency/finances",
  reviews: "/agency/reviews",
  customers: "/agency/customers",
  settings: "/agency/settings",
  support: "/agency/support",
};

// Rubriques d'un module affichées comme entrées distinctes du menu
// (onglets de la page, via ?tab=).
const MODULE_TABS: Record<string, string[]> = {
  orders: ["new", "in_progress", "history"],
  finances: ["revenue", "commissions", "payouts", "statements"],
};

export const PARTNER_MENU_GROUPS: PartnerMenuGroup[] = [
  "dashboard",
  "services",
  "orders",
  "finances",
  "clients",
  "profile",
  "support",
];

export function modulePath(module: string): string | null {
  return MODULE_PATHS[module] ?? null;
}

// Module correspondant à une URL de l'espace partenaire. null : URL hors
// espace partenaire, ou /agency/services sans type (voir
// firstServiceModule).
export function moduleForLocation(pathname: string, search = ""): string | null {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path === "/agency/services") {
    const type = new URLSearchParams(search).get("type");
    return type && type in SERVICE_TYPE_MODULES ? SERVICE_TYPE_MODULES[type as PartnerServiceType] : null;
  }
  const entry = Object.entries(MODULE_PATHS).find(([, to]) => !to.includes("?") && to === path);
  return entry ? entry[0] : null;
}

export function hasModule(context: Pick<PartnerPortalContext, "modules"> | null | undefined, module: string) {
  return !!context?.modules.some((m) => m.key === module);
}

// Types de services que le partenaire peut gérer, dans l'ordre du menu.
export function allowedServiceTypes(context: Pick<PartnerPortalContext, "modules"> | null | undefined) {
  return (Object.keys(SERVICE_TYPE_MODULES) as PartnerServiceType[]).filter((type) =>
    hasModule(context, SERVICE_TYPE_MODULES[type]),
  );
}

export function buildPartnerMenu(modules: PortalModule[]): PartnerMenuSection[] {
  const sections = new Map<PartnerMenuGroup, PartnerMenuLink[]>();
  for (const m of modules) {
    const to = MODULE_PATHS[m.key];
    // Module configuré en base sans page correspondante dans cette version
    // du site : on ne l'affiche pas plutôt que de proposer un lien mort.
    if (!to) continue;
    const tabs = MODULE_TABS[m.key];
    const links: PartnerMenuLink[] = tabs
      ? tabs.map((tab) => ({
          id: `${m.key}.${tab}`,
          module: m.key,
          to: `${to}?tab=${tab}`,
          label: m.label,
          labelKey: `ux.partner.menu.${m.key}_${tab}`,
          disabled: !m.enabled,
        }))
      : [
          {
            id: m.key,
            module: m.key,
            to,
            label: m.label,
            labelKey: `ux.partner.menu.${m.key}`,
            disabled: !m.enabled,
          },
        ];
    sections.set(m.group, [...(sections.get(m.group) ?? []), ...links]);
  }
  return PARTNER_MENU_GROUPS.filter((g) => sections.has(g)).map((group) => ({
    group,
    links: sections.get(group)!,
  }));
}

// Lien actif : même chemin, et même onglet / type quand le lien en précise un.
export function isMenuLinkActive(link: Pick<PartnerMenuLink, "to">, pathname: string, search: string) {
  const [linkPath, linkQuery] = link.to.split("?");
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path !== linkPath) return false;
  if (!linkQuery) return true;
  const current = new URLSearchParams(search);
  const wanted = new URLSearchParams(linkQuery);
  for (const [key, value] of wanted) {
    const actual = current.get(key);
    // Onglet par défaut (premier onglet) quand l'URL n'en précise pas.
    if (key === "tab" && actual === null) {
      const module = moduleForLocation(path);
      if (module && MODULE_TABS[module]?.[0] === value) continue;
    }
    if (actual !== value) return false;
  }
  return true;
}

export function parsePortalContext(value: unknown): PartnerPortalContext | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const v = value as Record<string, unknown>;
  if (typeof v.agency_id !== "string" || !Array.isArray(v.modules)) return null;
  const modules = v.modules.flatMap((raw): PortalModule[] => {
    if (!raw || typeof raw !== "object") return [];
    const m = raw as Record<string, unknown>;
    if (typeof m.key !== "string" || typeof m.group !== "string") return [];
    return [
      {
        key: m.key,
        label: typeof m.label === "string" ? m.label : m.key,
        group: m.group as PartnerMenuGroup,
        enabled: m.enabled !== false,
      },
    ];
  });
  return {
    agency_id: v.agency_id,
    name: typeof v.name === "string" ? v.name : "",
    category: typeof v.category === "string" ? v.category : null,
    category_label: typeof v.category_label === "string" ? v.category_label : null,
    modules,
  };
}
