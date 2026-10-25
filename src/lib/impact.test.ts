import { describe, expect, it } from "vitest";
import { describeBenefit, parseImpactPublic, toCsv } from "./impact";

describe("toCsv", () => {
  it("neutralise les formules et échappe les séparateurs", () => {
    const csv = toCsv(
      [{ a: '=HYPERLINK("x")', b: "Awa; Konan" }],
      [
        { key: "a", label: "A" },
        { key: "b", label: "B" },
      ],
    );
    const line = csv.split("\r\n")[1];
    expect(line.startsWith("\"'=HYPERLINK")).toBe(true);
    expect(line.endsWith('"Awa; Konan"')).toBe(true);
  });
});

describe("describeBenefit", () => {
  it("décrit une réduction plafonnée", () => {
    expect(
      describeBenefit({
        title: "x",
        benefit_type: "percent_discount",
        value: 10,
        max_discount_xof: 5000,
        uses_per_member: 2,
        cumulable: false,
      }),
    ).toContain("10 % de réduction");
  });
});

describe("parseImpactPublic", () => {
  it("refuse une réponse vide (campagne en brouillon)", () => {
    expect(parseImpactPublic(null)).toBeNull();
  });

  it("normalise les listes de la campagne", () => {
    const data = parseImpactPublic({
      campaign: { id: "c1", name: "Ensemble pour la croissance de Bossiz", funding_uses: null, faq: "x" },
      collected_xof: "5000",
      members: 1,
      percent: 0.1,
      is_open: true,
      offers: [{ id: "o1", benefits: null }],
    });
    expect(data?.campaign.funding_uses).toEqual([]);
    expect(data?.campaign.faq).toEqual([]);
    expect(data?.collected_xof).toBe(5000);
    expect(data?.offers[0].benefits).toEqual([]);
  });
});
