import { z } from "zod";

/**
 * Schémas de validation Zod pour tous les formulaires de réservation
 * Centralisation pour cohérence et maintenance
 */

// Helpers de validation personnalisés
const futureDate = z.string().refine(
  (date) => new Date(date) >= new Date(new Date().setHours(0, 0, 0, 0)),
  { message: "La date doit être dans le futur" }
);

const phoneNumber = z.string()
  .min(8, "Le numéro doit contenir au moins 8 chiffres")
  .regex(/^[\d\s\-\+\(\)]{8,}$/, "Format de numéro invalide");

const iataCode = z.string()
  .min(3, "Code IATA invalide")
  .max(3, "Code IATA invalide")
  .regex(/^[A-Z]{3}$/, "Le code IATA doit contenir 3 lettres majuscules");

// Schéma de recherche de vols
export const flightSearchSchema = z.object({
  origin: z.string()
    .min(3, "L'origine doit contenir au moins 3 caractères")
    .max(100, "L'origine est trop longue")
    .trim(),
  destination: z.string()
    .min(3, "La destination doit contenir au moins 3 caractères")
    .max(100, "La destination est trop longue")
    .trim(),
  departureDate: futureDate,
  returnDate: z.string().optional(),
  adults: z.number()
    .min(1, "Au moins 1 adulte requis")
    .max(9, "Maximum 9 adultes"),
  children: z.number()
    .min(0, "Nombre d'enfants invalide")
    .max(9, "Maximum 9 enfants"),
  infants: z.number()
    .min(0, "Nombre de bébés invalide")
    .max(4, "Maximum 4 bébés"),
  travelClass: z.enum(["economy", "premium_economy", "business", "first"], {
    errorMap: () => ({ message: "Classe de voyage invalide" })
  }),
  tripType: z.enum(["one-way", "round-trip", "multi-city"], {
    errorMap: () => ({ message: "Type de voyage invalide" })
  })
}).refine(
  (data) => {
    if (data.tripType === "round-trip" && !data.returnDate) {
      return false;
    }
    return true;
  },
  { message: "La date de retour est requise pour un aller-retour", path: ["returnDate"] }
).refine(
  (data) => {
    if (data.returnDate && data.departureDate) {
      return new Date(data.returnDate) > new Date(data.departureDate);
    }
    return true;
  },
  { message: "La date de retour doit être après la date de départ", path: ["returnDate"] }
);

// Schéma de recherche d'hôtels
export const hotelSearchSchema = z.object({
  destination: z.string()
    .min(3, "La destination doit contenir au moins 3 caractères")
    .max(100, "La destination est trop longue")
    .trim(),
  checkIn: futureDate,
  checkOut: futureDate,
  adults: z.number()
    .min(1, "Au moins 1 adulte requis")
    .max(9, "Maximum 9 adultes"),
  children: z.number()
    .min(0, "Nombre d'enfants invalide")
    .max(9, "Maximum 9 enfants"),
  rooms: z.number()
    .min(1, "Au moins 1 chambre requise")
    .max(9, "Maximum 9 chambres")
}).refine(
  (data) => new Date(data.checkOut) > new Date(data.checkIn),
  { message: "La date de départ doit être après la date d'arrivée", path: ["checkOut"] }
).refine(
  (data) => {
    const daysDiff = Math.ceil(
      (new Date(data.checkOut).getTime() - new Date(data.checkIn).getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysDiff <= 30;
  },
  { message: "La durée du séjour ne peut pas dépasser 30 jours", path: ["checkOut"] }
);

// Schéma de location de voiture
export const carRentalSchema = z.object({
  pickupLocation: z.string()
    .min(3, "Le lieu de prise en charge doit contenir au moins 3 caractères")
    .max(100, "Le lieu est trop long")
    .trim(),
  dropoffLocation: z.string()
    .min(3, "Le lieu de restitution doit contenir au moins 3 caractères")
    .max(100, "Le lieu est trop long")
    .trim(),
  pickupDate: futureDate,
  pickupTime: z.string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format d'heure invalide (HH:MM)"),
  dropoffDate: futureDate,
  dropoffTime: z.string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format d'heure invalide (HH:MM)"),
  driverAge: z.number()
    .min(21, "L'âge minimum est 21 ans")
    .max(99, "L'âge maximum est 99 ans")
}).refine(
  (data) => {
    const pickupDateTime = new Date(`${data.pickupDate}T${data.pickupTime}`);
    const dropoffDateTime = new Date(`${data.dropoffDate}T${data.dropoffTime}`);
    return dropoffDateTime > pickupDateTime;
  },
  { message: "La date et l'heure de restitution doivent être après la prise en charge", path: ["dropoffDate"] }
);

// Schéma de recherche d'événements
export const eventSearchSchema = z.object({
  location: z.string()
    .min(3, "La localisation doit contenir au moins 3 caractères")
    .max(100, "La localisation est trop longue")
    .trim(),
  startDate: futureDate,
  endDate: z.string().optional(),
  category: z.enum(["all", "concert", "sport", "theater", "festival", "conference"], {
    errorMap: () => ({ message: "Catégorie invalide" })
  }),
  guests: z.number()
    .min(1, "Au moins 1 participant requis")
    .max(50, "Maximum 50 participants")
}).refine(
  (data) => {
    if (data.endDate && data.startDate) {
      return new Date(data.endDate) >= new Date(data.startDate);
    }
    return true;
  },
  { message: "La date de fin doit être après ou égale à la date de début", path: ["endDate"] }
);

// Schéma de recherche de trains
export const trainSearchSchema = z.object({
  origin: z.string()
    .min(3, "L'origine doit contenir au moins 3 caractères")
    .max(100, "L'origine est trop longue")
    .trim(),
  destination: z.string()
    .min(3, "La destination doit contenir au moins 3 caractères")
    .max(100, "La destination est trop longue")
    .trim(),
  departureDate: futureDate,
  returnDate: z.string().optional(),
  adults: z.number()
    .min(1, "Au moins 1 adulte requis")
    .max(9, "Maximum 9 adultes"),
  children: z.number()
    .min(0, "Nombre d'enfants invalide")
    .max(9, "Maximum 9 enfants"),
  travelClass: z.enum(["economy", "first"], {
    errorMap: () => ({ message: "Classe de voyage invalide" })
  })
}).refine(
  (data) => {
    if (data.returnDate && data.departureDate) {
      return new Date(data.returnDate) > new Date(data.departureDate);
    }
    return true;
  },
  { message: "La date de retour doit être après la date de départ", path: ["returnDate"] }
);

// Schéma de recherche de séjours
export const staySearchSchema = z.object({
  destination: z.string()
    .min(3, "La destination doit contenir au moins 3 caractères")
    .max(100, "La destination est trop longue")
    .trim(),
  checkIn: futureDate,
  checkOut: futureDate,
  guests: z.number()
    .min(1, "Au moins 1 participant requis")
    .max(16, "Maximum 16 participants"),
  propertyType: z.enum(["all", "apartment", "house", "villa", "guesthouse"], {
    errorMap: () => ({ message: "Type de propriété invalide" })
  })
}).refine(
  (data) => new Date(data.checkOut) > new Date(data.checkIn),
  { message: "La date de départ doit être après la date d'arrivée", path: ["checkOut"] }
);

// Schéma de paiement
export const paymentSchema = z.object({
  customerName: z.string()
    .min(3, "Le nom doit contenir au moins 3 caractères")
    .max(100, "Le nom est trop long")
    .trim(),
  customerEmail: z.string()
    .trim()
    .toLowerCase()
    .email("Adresse email invalide")
    .max(255, "L'email est trop long"),
  customerPhone: phoneNumber,
  customerAddress: z.string()
    .max(200, "L'adresse est trop longue")
    .trim()
    .optional(),
  customerCity: z.string()
    .min(2, "La ville doit contenir au moins 2 caractères")
    .max(100, "La ville est trop longue")
    .trim(),
  paymentMethod: z.enum(["wave", "mobile_money", "card", "bank_transfer"], {
    errorMap: () => ({ message: "Méthode de paiement invalide" })
  })
});

// Schéma de passager
export const passengerSchema = z.object({
  firstName: z.string()
    .min(2, "Le prénom doit contenir au moins 2 caractères")
    .max(50, "Le prénom est trop long")
    .trim()
    .regex(/^[a-zA-ZÀ-ÿ\s\-']+$/, "Le prénom ne doit contenir que des lettres"),
  lastName: z.string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(50, "Le nom est trop long")
    .trim()
    .regex(/^[a-zA-ZÀ-ÿ\s\-']+$/, "Le nom ne doit contenir que des lettres"),
  dateOfBirth: z.string()
    .refine((date) => {
      const birthDate = new Date(date);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      return age >= 0 && age <= 120;
    }, "Date de naissance invalide"),
  nationality: z.string()
    .min(2, "La nationalité doit contenir au moins 2 caractères")
    .max(50, "La nationalité est trop longue")
    .trim(),
  documentType: z.enum(["passport", "id_card"], {
    errorMap: () => ({ message: "Type de document invalide" })
  }),
  documentNumber: z.string()
    .min(5, "Le numéro de document doit contenir au moins 5 caractères")
    .max(20, "Le numéro de document est trop long")
    .trim()
    .regex(/^[A-Z0-9]+$/, "Le numéro ne doit contenir que des lettres majuscules et des chiffres")
});

// Schéma de réservation complète
export const bookingSchema = z.object({
  serviceId: z.string().uuid("ID de service invalide"),
  startDate: futureDate,
  endDate: z.string().optional(),
  guests: z.number()
    .min(1, "Au moins 1 participant requis")
    .max(50, "Maximum 50 participants"),
  customerName: z.string().min(3).max(100).trim(),
  customerEmail: z.string().email().trim().toLowerCase(),
  customerPhone: phoneNumber,
  notes: z.string().max(500, "Les notes sont trop longues").trim().optional()
});

// Types TypeScript générés à partir des schémas
export type FlightSearchInput = z.infer<typeof flightSearchSchema>;
export type HotelSearchInput = z.infer<typeof hotelSearchSchema>;
export type CarRentalInput = z.infer<typeof carRentalSchema>;
export type EventSearchInput = z.infer<typeof eventSearchSchema>;
export type TrainSearchInput = z.infer<typeof trainSearchSchema>;
export type StaySearchInput = z.infer<typeof staySearchSchema>;
export type PaymentInput = z.infer<typeof paymentSchema>;
export type PassengerInput = z.infer<typeof passengerSchema>;
export type BookingInput = z.infer<typeof bookingSchema>;
