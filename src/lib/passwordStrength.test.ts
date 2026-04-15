import { describe, it, expect } from "vitest";
import { getPasswordStrength } from "@/lib/authValidation";

describe("getPasswordStrength - edge cases", () => {
  const testCases = [
    { input: "", expected: 0, label: "empty string" },
    { input: "a", expected: 1, label: "single lowercase" },
    { input: "A", expected: 1, label: "single uppercase" },
    { input: "1", expected: 1, label: "single digit" },
    { input: "!", expected: 1, label: "single special char" },
    { input: "aA", expected: 2, label: "lower + upper" },
    { input: "aA1", expected: 3, label: "lower + upper + digit" },
    { input: "aA1!", expected: 4, label: "lower + upper + digit + special" },
    { input: "aA1!bcde", expected: 5, label: "all criteria met (8+ chars)" },
    { input: "abcdefgh", expected: 2, label: "8 lowercase chars" },
    { input: "ABCDEFGH", expected: 2, label: "8 uppercase chars" },
    { input: "12345678", expected: 2, label: "8 digits" },
    { input: "Mot2Passe!", expected: 5, label: "typical strong password" },
    { input: "Àéîöü123!", expected: 3, label: "accented chars with numbers and special (accented chars don't match [A-Z]/[a-z])" },
  ];

  testCases.forEach(({ input, expected, label }) => {
    it(`should return ${expected} for: ${label}`, () => {
      expect(getPasswordStrength(input)).toBe(expected);
    });
  });
});
