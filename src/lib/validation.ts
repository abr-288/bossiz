// Schémas de validation pour les formulaires de l'application
// Utilise Zod pour la validation des données
import { z } from "zod";

// Schéma de validation pour les réservations de base
export const bookingSchema = z.object({
  customerName: z.string()
    .trim()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100, "Le nom doit contenir moins de 100 caractères")
    .regex(/^[a-zA-Z\s\-']+$/, "Le nom ne peut contenir que des lettres, espaces, tirets et apostrophes"),
  customerEmail: z.string()
    .trim()
    .email("Adresse email invalide")
    .max(255, "L'email doit contenir moins de 255 caractères"),
  customerPhone: z.string()
    .trim()
    .regex(/^\+?[0-9]{8,15}$/, "Le téléphone doit contenir 8-15 chiffres, optionnellement précédés de +"),
  notes: z.string()
    .max(1000, "Les notes doivent contenir moins de 1000 caractères")
    .optional()
    .nullable(),
});

// Schéma de validation pour les réservations de vols
export const flightBookingSchema = bookingSchema.extend({
  passportNumber: z.string()
    .trim()
    .min(6, "Le numéro de passeport doit contenir au moins 6 caractères")
    .max(20, "Le numéro de passeport doit contenir moins de 20 caractères")
    .regex(/^[A-Z0-9]+$/, "Le numéro de passeport ne peut contenir que des lettres majuscules et des chiffres"),
  nationality: z.string()
    .trim()
    .min(2, "La nationalité doit contenir au moins 2 caractères")
    .max(50, "La nationalité doit contenir moins de 50 caractères"),
  dateOfBirth: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "La date doit être au format YYYY-MM-DD"),
  specialRequests: z.string()
    .max(500, "Les demandes spéciales doivent contenir moins de 500 caractères")
    .optional()
    .nullable(),
});

// Schéma de validation pour les réservations de voitures
export const carBookingSchema = bookingSchema.extend({
  driverLicense: z.string()
    .trim()
    .min(5, "Le numéro de permis doit contenir au moins 5 caractères")
    .max(30, "Le numéro de permis doit contenir moins de 30 caractères")
    .regex(/^[A-Z0-9\-]+$/, "Le permis ne peut contenir que des lettres majuscules, des chiffres et des tirets"),
  pickupLocation: z.string()
    .trim()
    .min(3, "Le lieu de récupération doit contenir au moins 3 caractères")
    .max(200, "Le lieu de récupération doit contenir moins de 200 caractères"),
  dropoffLocation: z.string()
    .trim()
    .min(3, "Le lieu de dépôt doit contenir au moins 3 caractères")
    .max(200, "Le lieu de dépôt doit contenir moins de 200 caractères"),
});

// Schéma de validation pour les réservations d'hôtels
export const hotelBookingSchema = bookingSchema.extend({
  specialRequests: z.string()
    .max(500, "Les demandes spéciales doivent contenir moins de 500 caractères")
    .optional()
    .nullable(),
});

// Schéma de validation pour les messages de support
export const supportMessageSchema = z.object({
  name: z.string()
    .trim()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100, "Le nom doit contenir moins de 100 caractères"),
  email: z.string()
    .trim()
    .email("Adresse email invalide")
    .max(255, "L'email doit contenir moins de 255 caractères"),
  bookingReference: z.string()
    .trim()
    .max(50, "La référence de réservation doit contenir moins de 50 caractères")
    .optional(),
  subject: z.string()
    .trim()
    .min(3, "Le sujet doit contenir au moins 3 caractères")
    .max(200, "Le sujet doit contenir moins de 200 caractères"),
  message: z.string()
    .trim()
    .min(10, "Le message doit contenir au moins 10 caractères")
    .max(2000, "Le message doit contenir moins de 2000 caractères"),
});

// Schéma de validation pour les candidatures "Devenir partenaire"
export const partnerApplicationSchema = z.object({
  name: z.string()
    .trim()
    .min(2, "Le nom de l'agence doit contenir au moins 2 caractères")
    .max(150, "Le nom doit contenir moins de 150 caractères"),
  contactEmail: z.string()
    .trim()
    .email("Adresse email invalide")
    .max(255, "L'email doit contenir moins de 255 caractères"),
  contactPhone: z.string()
    .trim()
    .max(30, "Le téléphone doit contenir moins de 30 caractères")
    .optional(),
  description: z.string()
    .trim()
    .max(1000, "La description doit contenir moins de 1000 caractères")
    .optional(),
  logoUrl: z.string()
    .trim()
    .url("URL invalide")
    .max(500, "L'URL doit contenir moins de 500 caractères")
    .optional()
    .or(z.literal('')),
});

// Schéma de validation pour les passagers
export const passengerSchema = z.object({
  firstName: z.string()
    .trim()
    .min(2, "Le prénom doit contenir au moins 2 caractères")
    .max(50, "Le prénom doit contenir moins de 50 caractères")
    .regex(/^[a-zA-ZÀ-ÿ\s\-']+$/, "Le prénom ne peut contenir que des lettres"),
  lastName: z.string()
    .trim()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(50, "Le nom doit contenir moins de 50 caractères")
    .regex(/^[a-zA-ZÀ-ÿ\s\-']+$/, "Le nom ne peut contenir que des lettres"),
  dateOfBirth: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "La date doit être au format AAAA-MM-JJ")
    .refine((date) => {
      const birthDate = new Date(date);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      return age >= 0 && age <= 120;
    }, "Date de naissance invalide"),
  nationality: z.string()
    .trim()
    .min(2, "La nationalité est requise"),
  documentType: z.enum(["passport", "id_card"], {
    errorMap: () => ({ message: "Type de document invalide" }),
  }),
  documentNumber: z.string()
    .trim()
    .min(5, "Le numéro de document doit contenir au moins 5 caractères")
    .max(30, "Le numéro de document doit contenir moins de 30 caractères")
    .regex(/^[A-Z0-9\-]+$/i, "Le numéro ne peut contenir que des lettres, chiffres et tirets"),
});

// Schéma de validation pour le formulaire multi-passagers
export const passengersFormSchema = z.object({
  passengers: z.array(passengerSchema).min(1, "Au moins un passager est requis"),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: "Vous devez accepter les conditions générales",
  }),
});

// Schéma de validation pour les paiements
export const paymentSchema = z.object({
  bookingId: z.string().uuid("ID de réservation invalide"),
  amount: z.number().positive("Le montant doit être positif").max(10000000, "Montant trop élevé"),
  currency: z.string().trim().min(3).max(3),
  paymentMethod: z.enum(["card", "mobile_money", "bank_transfer"]),
  customerInfo: z.object({
    name: z.string().trim().min(2).max(100),
    email: z.string().email().max(255),
    phone: z.string().regex(/^\+?[0-9]{8,15}$/).optional(),
    address: z.string().max(200).optional(),
    city: z.string().max(100).optional(),
  }),
});
