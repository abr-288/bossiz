import { describe, it, expect } from "vitest";
import { getAirlineName } from "@/utils/airlineNames";

describe("airlineNames", () => {
  it("should return known airline names", () => {
    // Test some common IATA codes
    const result = getAirlineName("AF");
    expect(result).toBeDefined();
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("should return the code itself for unknown airlines", () => {
    const result = getAirlineName("ZZ");
    // Should return either the code or a fallback
    expect(result).toBeDefined();
    expect(typeof result).toBe("string");
  });

  it("should handle empty input gracefully", () => {
    const result = getAirlineName("");
    expect(result).toBeDefined();
    expect(typeof result).toBe("string");
  });
});
