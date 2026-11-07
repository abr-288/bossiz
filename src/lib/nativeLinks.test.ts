import { describe, expect, it } from "vitest";
import { parseDeepLink } from "./nativeLinks";

describe("parseDeepLink", () => {
  it("ignore les liens d'un autre schéma", () => {
    expect(parseDeepLink("https://app.bossiz.com/auth/callback?code=x")).toBeNull();
  });

  it("lit le code PKCE du retour Google", () => {
    expect(parseDeepLink("com.bossizplus.app://auth/callback?code=abc123")).toMatchObject({
      kind: "auth",
      code: "abc123",
    });
  });

  it("lit les jetons du flux implicite", () => {
    const link = parseDeepLink("com.bossizplus.app://auth/callback#access_token=AT&refresh_token=RT&expires_in=3600");
    expect(link).toMatchObject({ kind: "auth", accessToken: "AT", refreshToken: "RT" });
  });

  it("remonte l'erreur renvoyée par Supabase", () => {
    const link = parseDeepLink("com.bossizplus.app://auth/callback?error=access_denied&error_description=Refus%C3%A9");
    expect(link?.error).toBe("Refusé");
  });

  it("transforme un autre lien en chemin interne", () => {
    expect(parseDeepLink("com.bossizplus.app://booking-history?tab=paid")).toEqual({
      kind: "path",
      path: "/booking-history?tab=paid",
    });
  });
});
