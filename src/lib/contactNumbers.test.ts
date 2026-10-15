import { describe, expect, it } from "vitest";
import { realPhoneNumber, whatsAppLink } from "./contactNumbers";

describe("realPhoneNumber", () => {
  it("hides demonstration numbers", () => {
    expect(realPhoneNumber("+225 00 00 00 00")).toBeNull();
    expect(realPhoneNumber("+225 07 00 00 00 00")).toBeNull();
    expect(realPhoneNumber("+225 27 20 00 00 00")).toBeNull();
    expect(realPhoneNumber("+225 XX XX XX XX")).toBeNull();
    expect(realPhoneNumber("")).toBeNull();
    expect(realPhoneNumber(undefined)).toBeNull();
  });

  it("keeps a real number", () => {
    expect(realPhoneNumber(" +225 07 01 67 60 09 ")).toBe("+225 07 01 67 60 09");
  });
});

describe("whatsAppLink", () => {
  it("builds a wa.me link only for a real number", () => {
    expect(whatsAppLink("+225 07 01 67 60 09", "Bonjour")).toBe("https://wa.me/2250701676009?text=Bonjour");
    expect(whatsAppLink("+225 00 00 00 00", "Bonjour")).toBeNull();
  });
});
