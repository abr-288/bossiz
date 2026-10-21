import { describe, expect, it } from "vitest";
import { maskCardNumbers } from "./sensitiveText";

describe("maskCardNumbers", () => {
  it("masks card numbers written with or without separators", () => {
    expect(maskCardNumbers("ma carte : 4970 1012 3456 7890, exp 08/28")).toBe(
      "ma carte : [numéro de carte masqué], exp 08/28",
    );
    expect(maskCardNumbers("4970-1012-3456-7890")).toBe("[numéro de carte masqué]");
    expect(maskCardNumbers("4970101234567890")).toBe("[numéro de carte masqué]");
  });

  it("keeps ordinary numbers", () => {
    expect(maskCardNumbers("Je paie 150000 XOF le 12/12/2026 au +225 07 01 67 60 09")).toBe(
      "Je paie 150000 XOF le 12/12/2026 au +225 07 01 67 60 09",
    );
    expect(maskCardNumbers("référence 8F3A2C1B, 2 adultes")).toBe("référence 8F3A2C1B, 2 adultes");
  });
});
