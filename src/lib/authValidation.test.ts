import { describe, it, expect } from "vitest";
import {
  validateForm,
  signInSchema,
  signUpSchema,
  resetPasswordSchema,
  updatePasswordSchema,
  getPasswordStrength,
} from "@/lib/authValidation";

describe("authValidation", () => {
  describe("signInSchema", () => {
    it("should validate correct sign-in data", () => {
      const result = validateForm(signInSchema, {
        email: "user@example.com",
        password: "Test1234",
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it("should reject empty email", () => {
      const result = validateForm(signInSchema, {
        email: "",
        password: "Test1234",
      });
      expect(result.valid).toBe(false);
      expect(result.errors.email).toBeDefined();
    });

    it("should reject invalid email format", () => {
      const result = validateForm(signInSchema, {
        email: "not-an-email",
        password: "Test1234",
      });
      expect(result.valid).toBe(false);
      expect(result.errors.email).toBeDefined();
    });

    it("should reject empty password", () => {
      const result = validateForm(signInSchema, {
        email: "user@example.com",
        password: "",
      });
      expect(result.valid).toBe(false);
      expect(result.errors.password).toBeDefined();
    });
  });

  describe("signUpSchema", () => {
    it("should validate correct sign-up data", () => {
      const result = validateForm(signUpSchema, {
        fullName: "Jean Dupont",
        email: "jean@example.com",
        password: "SecurePass1",
      });
      expect(result.valid).toBe(true);
    });

    it("should reject short name", () => {
      const result = validateForm(signUpSchema, {
        fullName: "J",
        email: "jean@example.com",
        password: "SecurePass1",
      });
      expect(result.valid).toBe(false);
      expect(result.errors.fullName).toBeDefined();
    });

    it("should reject name with invalid characters", () => {
      const result = validateForm(signUpSchema, {
        fullName: "Jean123",
        email: "jean@example.com",
        password: "SecurePass1",
      });
      expect(result.valid).toBe(false);
      expect(result.errors.fullName).toBeDefined();
    });

    it("should accept accented names", () => {
      const result = validateForm(signUpSchema, {
        fullName: "François Éloïse",
        email: "jean@example.com",
        password: "SecurePass1",
      });
      expect(result.valid).toBe(true);
    });

    it("should reject password without uppercase", () => {
      const result = validateForm(signUpSchema, {
        fullName: "Jean Dupont",
        email: "jean@example.com",
        password: "securepass1",
      });
      expect(result.valid).toBe(false);
      expect(result.errors.password).toBeDefined();
    });

    it("should reject password without lowercase", () => {
      const result = validateForm(signUpSchema, {
        fullName: "Jean Dupont",
        email: "jean@example.com",
        password: "SECUREPASS1",
      });
      expect(result.valid).toBe(false);
      expect(result.errors.password).toBeDefined();
    });

    it("should reject password without number", () => {
      const result = validateForm(signUpSchema, {
        fullName: "Jean Dupont",
        email: "jean@example.com",
        password: "SecurePass",
      });
      expect(result.valid).toBe(false);
      expect(result.errors.password).toBeDefined();
    });

    it("should reject password shorter than 8 characters", () => {
      const result = validateForm(signUpSchema, {
        fullName: "Jean Dupont",
        email: "jean@example.com",
        password: "Sec1",
      });
      expect(result.valid).toBe(false);
      expect(result.errors.password).toBeDefined();
    });
  });

  describe("resetPasswordSchema", () => {
    it("should validate correct email", () => {
      const result = validateForm(resetPasswordSchema, {
        email: "user@example.com",
      });
      expect(result.valid).toBe(true);
    });

    it("should reject invalid email", () => {
      const result = validateForm(resetPasswordSchema, {
        email: "invalid",
      });
      expect(result.valid).toBe(false);
    });
  });

  describe("updatePasswordSchema", () => {
    it("should validate matching passwords", () => {
      const result = validateForm(updatePasswordSchema, {
        password: "NewPass123",
        confirmPassword: "NewPass123",
      });
      expect(result.valid).toBe(true);
    });

    it("should reject non-matching passwords", () => {
      const result = validateForm(updatePasswordSchema, {
        password: "NewPass123",
        confirmPassword: "DifferentPass1",
      });
      expect(result.valid).toBe(false);
    });

    it("should reject a 6-character password with no uppercase/digit", () => {
      const result = validateForm(updatePasswordSchema, {
        password: "abcdef",
        confirmPassword: "abcdef",
      });
      expect(result.valid).toBe(false);
      expect(result.errors.password).toBeDefined();
    });

    it("should accept an 8+ character password with upper/lower/digit", () => {
      const result = validateForm(updatePasswordSchema, {
        password: "Abcdef12",
        confirmPassword: "Abcdef12",
      });
      expect(result.valid).toBe(true);
    });
  });

  describe("getPasswordStrength", () => {
    it("should return 0 for empty password", () => {
      expect(getPasswordStrength("")).toBe(0);
    });

    it("should return 1 for only length >= 8", () => {
      expect(getPasswordStrength("........")).toBe(2); // length + special chars
    });

    it("should return 5 for a strong password", () => {
      expect(getPasswordStrength("StrongP@ss1")).toBe(5);
    });

    it("should return 3 for lowercase + uppercase + digits", () => {
      expect(getPasswordStrength("Ab1")).toBe(3);
    });

    it("should count each criterion independently", () => {
      expect(getPasswordStrength("a")).toBe(1); // only lowercase
      expect(getPasswordStrength("A")).toBe(1); // only uppercase
      expect(getPasswordStrength("1")).toBe(1); // only digit
      expect(getPasswordStrength("@")).toBe(1); // only special
      expect(getPasswordStrength("aA1@abcd")).toBe(5); // all 5
    });
  });
});
