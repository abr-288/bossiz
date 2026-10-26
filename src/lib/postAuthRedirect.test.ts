import { beforeEach, describe, expect, it } from "vitest";
import { rememberPostAuthRedirect, safeInternalPath, takePostAuthRedirect } from "./postAuthRedirect";

describe("postAuthRedirect", () => {
  beforeEach(() => localStorage.clear());

  it("refuse les adresses externes", () => {
    expect(safeInternalPath("https://evil.example")).toBeNull();
    expect(safeInternalPath("//evil.example")).toBeNull();
    expect(safeInternalPath("/bossiz-impact?contribuer=1")).toBe("/bossiz-impact?contribuer=1");
  });

  it("rend la page mémorisée une seule fois", () => {
    rememberPostAuthRedirect("/bossiz-impact?contribuer=1");
    expect(takePostAuthRedirect()).toBe("/bossiz-impact?contribuer=1");
    expect(takePostAuthRedirect()).toBeNull();
  });

  it("ignore l'accueil et les demandes de plus de 24 h", () => {
    rememberPostAuthRedirect("/");
    expect(takePostAuthRedirect()).toBeNull();
    rememberPostAuthRedirect("/bossiz-impact");
    expect(takePostAuthRedirect(Date.now() + 25 * 60 * 60 * 1000)).toBeNull();
  });
});
