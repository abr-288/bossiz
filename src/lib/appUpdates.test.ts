import { describe, expect, it } from "vitest";
import { isNewerVersion } from "./appUpdates";

describe("isNewerVersion", () => {
  it("compares build versions numerically", () => {
    expect(isNewerVersion("1.20261027.101500", "1.20261027.93012")).toBe(true);
    expect(isNewerVersion("1.20261028.5", "1.20261027.235959")).toBe(true);
    expect(isNewerVersion("1.20261027.93012", "1.20261027.93012")).toBe(false);
    expect(isNewerVersion("1.20261026.120000", "1.20261027.0")).toBe(false);
  });

  it("treats an unknown running version as older", () => {
    expect(isNewerVersion("1.20261027.93012", "0")).toBe(true);
  });
});
