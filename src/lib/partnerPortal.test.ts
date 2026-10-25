import { describe, expect, it } from "vitest";
import {
  allowedServiceTypes,
  buildPartnerMenu,
  isMenuLinkActive,
  moduleForLocation,
  parsePortalContext,
  type PortalModule,
} from "./partnerPortal";
import { buildStatementHtml } from "./partnerStatement";
import { monthPeriod, parseFinanceSummary } from "@/hooks/usePartnerData";

const core: PortalModule[] = [
  { key: "dashboard", label: "Tableau de bord", group: "dashboard", enabled: true },
  { key: "orders", label: "Demandes", group: "orders", enabled: true },
  { key: "finances", label: "Finances", group: "finances", enabled: true },
  { key: "reviews", label: "Avis", group: "clients", enabled: true },
  { key: "customers", label: "Clients", group: "clients", enabled: true },
  { key: "settings", label: "Profil", group: "profile", enabled: true },
  { key: "support", label: "Assistance", group: "support", enabled: true },
];

// Ce que renvoie agency_portal_context() pour la catégorie « cars » du seed.
const garage: PortalModule[] = [
  core[0],
  { key: "catalog_cars", label: "Véhicules", group: "services", enabled: true },
  { key: "promotions", label: "Promotions", group: "services", enabled: true },
  ...core.slice(1),
];

describe("buildPartnerMenu", () => {
  it("ne montre à un garage aucun module hôtel, circuit ou restaurant", () => {
    const links = buildPartnerMenu(garage).flatMap((s) => s.links);
    const targets = links.map((l) => l.to);
    expect(targets).toContain("/agency/services?type=car");
    expect(targets.some((to) => /type=hotel|type=tour|restaurants|hotel-bookings|\/rates/.test(to))).toBe(false);
  });

  it("suit l'ordre de la structure cible et détaille finances et demandes", () => {
    const sections = buildPartnerMenu(garage);
    expect(sections.map((s) => s.group)).toEqual([
      "dashboard",
      "services",
      "orders",
      "finances",
      "clients",
      "profile",
      "support",
    ]);
    expect(sections.find((s) => s.group === "finances")!.links.map((l) => l.to)).toEqual([
      "/agency/finances?tab=revenue",
      "/agency/finances?tab=commissions",
      "/agency/finances?tab=payouts",
      "/agency/finances?tab=statements",
    ]);
    expect(sections.find((s) => s.group === "orders")!.links).toHaveLength(3);
  });

  it("ignore un module configuré en base sans page dans le site", () => {
    const sections = buildPartnerMenu([...core, { key: "boats", label: "Bateaux", group: "services", enabled: true }]);
    expect(sections.flatMap((s) => s.links).some((l) => l.module === "boats")).toBe(false);
  });

  it("garde visible, mais désactivée, une rubrique coupée par un admin", () => {
    const sections = buildPartnerMenu([
      { key: "catalog_restaurants", label: "Restaurants", group: "services", enabled: false },
    ]);
    expect(sections[0].links[0]).toMatchObject({ to: "/agency/restaurants", disabled: true });
  });
});

describe("moduleForLocation", () => {
  it("associe chaque URL à son module, y compris le type de service", () => {
    expect(moduleForLocation("/agency")).toBe("dashboard");
    expect(moduleForLocation("/agency/")).toBe("dashboard");
    expect(moduleForLocation("/agency/services", "?type=hotel")).toBe("catalog_hotels");
    expect(moduleForLocation("/agency/services", "?type=car")).toBe("catalog_cars");
    expect(moduleForLocation("/agency/restaurants")).toBe("catalog_restaurants");
    expect(moduleForLocation("/agency/finances", "?tab=payouts")).toBe("finances");
    expect(moduleForLocation("/agency/hotel-bookings")).toBe("hotel_bookings");
  });

  it("ne devine pas de module pour /agency/services sans type ni pour une URL inconnue", () => {
    expect(moduleForLocation("/agency/services")).toBeNull();
    expect(moduleForLocation("/agency/services", "?type=flight")).toBeNull();
    expect(moduleForLocation("/agency/inconnu")).toBeNull();
  });
});

describe("allowedServiceTypes", () => {
  it("limite les types de services à ceux de la catégorie", () => {
    expect(allowedServiceTypes({ modules: garage })).toEqual(["car"]);
    expect(allowedServiceTypes({ modules: core })).toEqual([]);
  });
});

describe("isMenuLinkActive", () => {
  it("tient compte de l'onglet, avec le premier onglet par défaut", () => {
    const revenue = { to: "/agency/finances?tab=revenue" };
    const payouts = { to: "/agency/finances?tab=payouts" };
    expect(isMenuLinkActive(revenue, "/agency/finances", "")).toBe(true);
    expect(isMenuLinkActive(payouts, "/agency/finances", "")).toBe(false);
    expect(isMenuLinkActive(payouts, "/agency/finances", "?tab=payouts")).toBe(true);
    expect(isMenuLinkActive({ to: "/agency" }, "/agency/finances", "")).toBe(false);
  });
});

describe("parsePortalContext", () => {
  it("rejette une réponse inattendue et normalise les modules", () => {
    expect(parsePortalContext(null)).toBeNull();
    expect(parsePortalContext({ modules: [] })).toBeNull();
    const ctx = parsePortalContext({
      agency_id: "a1",
      name: "BOT MOTOR",
      category: "cars",
      category_label: "Garage / mobilité",
      modules: [{ key: "catalog_cars", group: "services" }, { nope: true }],
    });
    expect(ctx?.modules).toEqual([{ key: "catalog_cars", label: "catalog_cars", group: "services", enabled: true }]);
  });
});

describe("finances", () => {
  it("lit les totaux renvoyés par agency_finance_summary", () => {
    expect(parseFinanceSummary({ gross: "50000", commission: 5000, net: 45000 })).toMatchObject({
      gross: 50000,
      commission: 5000,
      net: 45000,
      paid_out: 0,
    });
  });

  it("calcule les bornes d'un mois", () => {
    expect(monthPeriod(0, new Date(2026, 1, 14))).toEqual({ from: "2026-02-01", to: "2026-02-28" });
    expect(monthPeriod(-1, new Date(2026, 0, 5))).toEqual({ from: "2025-12-01", to: "2025-12-31" });
  });

  it("échappe le contenu du relevé", () => {
    const html = buildStatementHtml({
      partnerName: "<script>alert(1)</script>",
      periodLabel: "octobre 2026",
      summary: parseFinanceSummary({}),
      transactions: [],
    });
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
  });
});
