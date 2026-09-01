import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// ============================================
// Flight Search Validation
// ============================================
export const flightSearchSchema = z.object({
  origin: z.string()
    .min(3, "Origin code must be at least 3 characters")
    .max(100, "Origin is too long")
    .transform(val => val.trim()),
  destination: z.string()
    .min(3, "Destination code must be at least 3 characters")
    .max(100, "Destination is too long")
    .transform(val => val.trim()),
  departureDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Departure date must be in YYYY-MM-DD format")
    .refine(val => new Date(val) >= new Date(new Date().setHours(0, 0, 0, 0)), {
      message: "Departure date cannot be in the past"
    }),
  returnDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Return date must be in YYYY-MM-DD format")
    .optional(),
  adults: z.number()
    .int("Adults must be an integer")
    .min(1, "At least 1 adult is required")
    .max(9, "Maximum 9 adults allowed"),
  children: z.number()
    .int("Children must be an integer")
    .min(0, "Children cannot be negative")
    .max(9, "Maximum 9 children allowed")
    .optional()
    .default(0),
  travelClass: z.string()
    .transform(val => val.toUpperCase())
    .pipe(z.enum(["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"]))
    .optional()
    .default("ECONOMY")
}).refine(
  data => !data.returnDate || new Date(data.returnDate) > new Date(data.departureDate),
  {
    message: "Return date must be after departure date",
    path: ["returnDate"]
  }
);

// ============================================
// Hotel Search Validation
// ============================================
export const hotelSearchSchema = z.object({
  location: z.string()
    .min(2, "Location must be at least 2 characters")
    .max(200, "Location is too long")
    .transform(val => val.trim()),
  checkIn: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Check-in date must be in YYYY-MM-DD format")
    .refine(val => new Date(val) >= new Date(new Date().setHours(0, 0, 0, 0)), {
      message: "Check-in date cannot be in the past"
    }),
  checkOut: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Check-out date must be in YYYY-MM-DD format"),
  adults: z.number()
    .int("Adults must be an integer")
    .min(1, "At least 1 adult is required")
    .max(30, "Maximum 30 adults allowed"),
  children: z.number()
    .int("Children must be an integer")
    .min(0, "Children cannot be negative")
    .max(30, "Maximum 30 children allowed")
    .optional()
    .default(0),
  rooms: z.number()
    .int("Rooms must be an integer")
    .min(1, "At least 1 room is required")
    .max(10, "Maximum 10 rooms allowed")
    .optional()
    .default(1),
  partnerOnly: z.boolean().optional()
}).refine(
  data => new Date(data.checkOut) > new Date(data.checkIn),
  {
    message: "Check-out date must be after check-in date",
    path: ["checkOut"]
  }
);

// ============================================
// Car Rental Validation
// ============================================
export const carRentalSchema = z.object({
  pickupLocation: z.string()
    .min(2, "Pickup location must be at least 2 characters")
    .max(200, "Pickup location is too long")
    .transform(val => val.trim()),
  dropoffLocation: z.string()
    .min(2, "Dropoff location must be at least 2 characters")
    .max(200, "Dropoff location is too long")
    .transform(val => val.trim())
    .optional()
    .nullable(),
  pickupDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Pickup date must be in YYYY-MM-DD format")
    .refine(val => new Date(val) >= new Date(new Date().setHours(0, 0, 0, 0)), {
      message: "Pickup date cannot be in the past"
    }),
  dropoffDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Dropoff date must be in YYYY-MM-DD format"),
  pickupTime: z.string()
    .regex(/^\d{2}:\d{2}$/, "Pickup time must be in HH:MM format")
    .optional()
    .default("10:00"),
  dropoffTime: z.string()
    .regex(/^\d{2}:\d{2}$/, "Dropoff time must be in HH:MM format")
    .optional()
    .default("10:00"),
  partnerOnly: z.boolean().optional()
}).refine(
  data => new Date(data.dropoffDate) > new Date(data.pickupDate),
  {
    message: "Dropoff date must be after pickup date",
    path: ["dropoffDate"]
  }
);

// ============================================
// Payment Processing Validation
// ============================================
export const paymentProcessSchema = z.object({
  bookingId: z.string()
    .uuid("Invalid booking ID format"),
  amount: z.number()
    .positive("Amount must be positive")
    .max(10000000, "Amount exceeds maximum allowed"),
  currency: z.string()
    .min(3, "Currency must be at least 3 characters")
    .max(4, "Currency must be at most 4 characters")
    .regex(/^[A-Z]{3,4}$/, "Currency must be uppercase letters"),
  paymentMethod: z.enum(["card", "mobile_money", "bank_transfer", "wave", "all"], {
    errorMap: () => ({ message: "Invalid payment method" })
  }),
  customerInfo: z.object({
    name: z.string()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name is too long")
      .transform(val => val.trim()),
    email: z.string()
      .email("Invalid email address")
      .max(255, "Email is too long")
      .transform(val => val.trim().toLowerCase()),
    phone: z.preprocess(
      (val) => typeof val === 'string' ? val.replace(/[\s\-\(\)]/g, '') : val,
      z.string()
        .regex(/^\+?[0-9]{8,15}$/, "Phone must be 8-15 digits")
        .optional()
    ),
    address: z.string().max(255).optional(),
    city: z.string().max(100).optional()
  })
});

// ============================================
// Helper Functions
// ============================================

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: ValidationError[];
}

/**
 * Validate data against a Zod schema and return structured result
 */
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  try {
    const validatedData = schema.parse(data);
    return {
      success: true,
      data: validatedData
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: ValidationError[] = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
      
      return {
        success: false,
        errors
      };
    }
    
    // Unexpected error
    return {
      success: false,
      errors: [{ field: 'unknown', message: 'Validation failed' }]
    };
  }
}

/**
 * Create a standardized error response for validation failures
 */
export function createValidationErrorResponse(
  errors: ValidationError[],
  corsHeaders: Record<string, string>
): Response {
  console.error('Validation errors:', errors);
  
  return new Response(
    JSON.stringify({
      success: false,
      error: 'Validation failed',
      validationErrors: errors,
      data: []
    }),
    {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}

/**
 * Sanitize string input to prevent injection attacks
 */
export function sanitizeString(input: string, maxLength: number = 1000): string {
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, ''); // Remove potential HTML tags
}
