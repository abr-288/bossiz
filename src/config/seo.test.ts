import { describe, it, expect } from "vitest";
import { resolveSeo, SITE_URL } from "./seo";

describe("resolveSeo", () => {
  it("indexe une page publique avec sa propre canonique", () => {
    const seo = resolveSeo("/hotels");
    expect(seo.noindex).toBe(false);
    expect(seo.canonicalUrl).toBe(`${SITE_URL}/hotels`);
    expect(seo.title).toContain("Hôtels");
  });

  it("ignore le slash final", () => {
    expect(resolveSeo("/cars/").canonicalUrl).toBe(`${SITE_URL}/cars`);
  });

  it("canonicalise les alias vers l'URL principale", () => {
    expect(resolveSeo("/home").canonicalUrl).toBe(`${SITE_URL}/`);
    expect(resolveSeo("/privacy-policy").canonicalUrl).toBe(`${SITE_URL}/privacy`);
  });

  it("gère les pages à paramètre", () => {
    const seo = resolveSeo("/destinations/grand-bassam");
    expect(seo.noindex).toBe(false);
    expect(seo.canonicalUrl).toBe(`${SITE_URL}/destinations/grand-bassam`);
  });

  it.each(["/admin", "/admin/users", "/dashboard", "/payment", "/agency/services", "/auth", "/page-inexistante"])(
    "met %s en noindex",
    (path) => {
      expect(resolveSeo(path).noindex).toBe(true);
    },
  );
});
