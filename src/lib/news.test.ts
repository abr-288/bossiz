import { describe, expect, it } from "vitest";
import { isNewsPostLive, isSafeNewsLink } from "./news";

describe("isSafeNewsLink", () => {
  it("accepte une page du site ou une adresse https", () => {
    expect(isSafeNewsLink("/hotels-partenaires")).toBe(true);
    expect(isSafeNewsLink("https://bossiz.com")).toBe(true);
  });

  it("refuse les autres liens", () => {
    expect(isSafeNewsLink("javascript:alert(1)")).toBe(false);
    expect(isSafeNewsLink("//evil.example")).toBe(false);
    expect(isSafeNewsLink("http://bossiz.com")).toBe(false);
  });
});

describe("isNewsPostLive", () => {
  const now = new Date("2026-10-25T12:00:00Z");
  it("publié et daté : visible", () => {
    expect(isNewsPostLive({ published: true, published_at: "2026-10-24T08:00:00Z" }, now)).toBe(true);
  });
  it("brouillon ou programmé : masqué", () => {
    expect(isNewsPostLive({ published: false, published_at: "2026-10-24T08:00:00Z" }, now)).toBe(false);
    expect(isNewsPostLive({ published: true, published_at: "2026-10-26T08:00:00Z" }, now)).toBe(false);
  });
});
