import { ZodError, ZodSchema } from "zod";

/**
 * Utilitaires pour la gestion des formulaires avec validation Zod
 */

/**
 * Formate les erreurs Zod pour un affichage user-friendly
 */
export const formatZodErrors = (error: ZodError): Record<string, string> => {
  const errors: Record<string, string> = {};

  error.errors.forEach((err) => {
    const path = err.path.join(".");
    errors[path] = err.message;
  });

  return errors;
};

/**
 * Valide des données avec un schéma Zod et retourne le résultat
 */
export const validateWithSchema = <T>(
  schema: ZodSchema<T>,
  data: unknown,
): { success: true; data: T } | { success: false; errors: Record<string, string> } => {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof ZodError) {
      return { success: false, errors: formatZodErrors(error) };
    }
    return {
      success: false,
      errors: { _general: "Une erreur de validation s'est produite" },
    };
  }
};

/**
 * Safe parse avec gestion d'erreurs améliorée
 */
export const safeValidate = <T>(
  schema: ZodSchema<T>,
  data: unknown,
): { success: true; data: T; errors: null } | { success: false; data: null; errors: Record<string, string> } => {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data, errors: null };
  }

  return {
    success: false,
    data: null,
    errors: formatZodErrors(result.error),
  };
};

/**
 * Affiche les erreurs de formulaire dans la console (dev uniquement)
 */
export const logFormErrors = (errors: Record<string, string>, formName: string) => {
  if (import.meta.env.DEV) {
    console.group(`🔴 Erreurs de formulaire: ${formName}`);
    Object.entries(errors).forEach(([field, error]) => {
      console.error(`  • ${field}: ${error}`);
    });
    console.groupEnd();
  }
};

/**
 * Nettoie les données du formulaire avant validation
 */
export const sanitizeFormData = <T extends object>(data: T): T => {
  const sanitized = { ...data } as Record<string, unknown>;

  Object.keys(sanitized).forEach((key) => {
    const value = sanitized[key];

    // Trim les strings
    if (typeof value === "string") {
      sanitized[key] = value.trim();
    }

    // Convertit les strings vides en undefined
    if (value === "") {
      sanitized[key] = undefined;
    }
  });

  return sanitized as T;
};

/**
 * Hook-like function pour gérer l'état des erreurs de formulaire
 */
export class FormErrorManager {
  private errors: Record<string, string> = {};

  setError(field: string, message: string) {
    this.errors[field] = message;
  }

  clearError(field: string) {
    delete this.errors[field];
  }

  clearAll() {
    this.errors = {};
  }

  getError(field: string): string | undefined {
    return this.errors[field];
  }

  hasErrors(): boolean {
    return Object.keys(this.errors).length > 0;
  }

  getAllErrors(): Record<string, string> {
    return { ...this.errors };
  }

  setErrors(errors: Record<string, string>) {
    this.errors = { ...errors };
  }
}

/**
 * Génère un message d'erreur utilisateur amical à partir d'une erreur technique
 */
export const getUserFriendlyErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    // Mapping des erreurs communes vers des messages user-friendly
    const errorMappings: Record<string, string> = {
      "Network error": "Problème de connexion. Veuillez vérifier votre connexion internet.",
      Unauthorized: "Vous devez être connecté pour effectuer cette action.",
      Forbidden: "Vous n'avez pas les permissions nécessaires.",
      "Not found": "La ressource demandée n'a pas été trouvée.",
      "Validation error": "Les données saisies sont invalides.",
      "Server error": "Une erreur serveur s'est produite. Veuillez réessayer plus tard.",
    };

    for (const [key, message] of Object.entries(errorMappings)) {
      if (error.message.includes(key)) {
        return message;
      }
    }

    return error.message;
  }

  return "Une erreur inattendue s'est produite. Veuillez réessayer.";
};

/**
 * Retry avec backoff exponentiel pour les appels API
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000,
): Promise<T> => {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
};
