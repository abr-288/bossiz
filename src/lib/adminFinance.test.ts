import { describe, expect, it } from "vitest";
import { canMarkPaid, change, parseDashboard, payoutState, periodFromPreset } from "./adminFinance";

describe("periodFromPreset", () => {
  const now = new Date(2026, 9, 25, 15, 30);

  it("compte aujourd'hui dans les 7 derniers jours", () => {
    expect(periodFromPreset("7d", now)).toEqual({ preset: "7d", from: "2026-10-19", to: "2026-10-25" });
  });

  it("couvre tout le mois dernier", () => {
    expect(periodFromPreset("last_month", now)).toMatchObject({ from: "2026-09-01", to: "2026-09-30" });
  });

  it("laisse les dates vides depuis le début", () => {
    expect(periodFromPreset("all", now)).toMatchObject({ from: "", to: "" });
  });
});

describe("payoutState", () => {
  const base = { status: "pending", payout_status: "not_scheduled", payout_due_at: null, payout_error: null };

  it("regroupe les blocages en un seul statut, avec le motif", () => {
    expect(payoutState({ ...base, payout_status: "awaiting_details" })).toMatchObject({ key: "blocked" });
    expect(payoutState({ ...base, payout_status: "failed", payout_error: "Numéro invalide" })).toMatchObject({
      key: "blocked",
      hint: "Numéro invalide",
    });
  });

  it("une commande annulée reste annulée quel que soit le versement", () => {
    expect(payoutState({ ...base, status: "cancelled", payout_status: "ready" }).key).toBe("cancelled");
  });

  it("versé l'emporte", () => {
    expect(payoutState({ ...base, status: "paid", payout_status: "paid" }).key).toBe("paid");
  });

  it("pas de saisie manuelle quand Jèko gère le versement", () => {
    expect(canMarkPaid({ status: "pending", payout_status: "ready", collection: "online" })).toBe(false);
    expect(canMarkPaid({ status: "pending", payout_status: "awaiting_details", collection: "online" })).toBe(true);
    expect(canMarkPaid({ status: "to_invoice", payout_status: null, collection: "on_site" })).toBe(false);
  });
});

describe("change", () => {
  it("renvoie null sans période précédente", () => {
    expect(change(5000, 0)).toBeNull();
  });

  it("calcule la variation en %", () => {
    expect(change(15000, 10000)).toBe(50);
    expect(change(5000, 10000)).toBe(-50);
  });
});

describe("parseDashboard", () => {
  it("convertit les montants et tolère les champs manquants", () => {
    const d = parseDashboard({
      granularity: "month",
      totals: { volume: "210000", gain: 52000 },
      activities: [{ activity: "hotel", orders: 2, volume: "130000" }],
      tasks: [{ key: "reviews", count: 1 }],
    });
    expect(d.granularity).toBe("month");
    expect(d.totals.volume).toBe(210000);
    expect(d.totals.prev_volume).toBe(0);
    expect(d.activities[0]).toMatchObject({ activity: "hotel", orders: 2, volume: 130000, gain: 0 });
    expect(d.series).toEqual([]);
    expect(d.balances.due_to_partners).toBe(0);
  });
});
