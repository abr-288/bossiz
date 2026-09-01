import { motion } from "framer-motion";
import { User, Users, Calendar, Globe, FileText } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { NationalitySelect } from "@/components/NationalitySelect";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useTranslation } from "react-i18next";

interface Passenger {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  documentType: "passport" | "id_card";
  documentNumber: string;
  documentIssueDate?: string;
  documentExpiryDate?: string;
}

// Schema de validation des passagers avec dates de document
const passengerSchema = z.object({
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
  documentIssueDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "La date doit être au format AAAA-MM-JJ")
    .optional()
    .or(z.literal("")),
  documentExpiryDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "La date doit être au format AAAA-MM-JJ")
    .refine((date) => {
      if (!date) return true;
      const expiryDate = new Date(date);
      const today = new Date();
      // Le document doit être valide au moins 6 mois après la date du voyage
      const sixMonthsFromNow = new Date();
      sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
      return expiryDate > sixMonthsFromNow;
    }, "Le document doit être valide au moins 6 mois après le voyage")
    .optional()
    .or(z.literal("")),
});

const passengersFormSchema = z.object({
  passengers: z.array(passengerSchema).min(1, "Au moins un passager est requis"),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: "Vous devez accepter les conditions générales",
  }),
});

interface PassengerStepProps {
  passengers: Passenger[];
  onPassengersChange: (passengers: Passenger[]) => void;
  adultsCount: number;
  childrenCount: number;
  onNext: () => void;
  serviceType?: string;
}

type PassengersFormValues = z.infer<typeof passengersFormSchema>;

export const PassengerStep = ({
  passengers,
  onPassengersChange,
  adultsCount,
  childrenCount,
  onNext,
  serviceType = "flight",
}: PassengerStepProps) => {
  const { t } = useTranslation();
  const totalPassengers = adultsCount + childrenCount;

  // Initialize form with react-hook-form and zod validation
  const form = useForm<PassengersFormValues>({
    resolver: zodResolver(passengersFormSchema),
    mode: "onChange", // Validation en temps réel
    defaultValues: {
      passengers: Array.from({ length: totalPassengers }, (_, i) => passengers[i] || {
        firstName: "",
        lastName: "",
        dateOfBirth: "",
        nationality: "",
        documentType: "passport",
        documentNumber: "",
        documentIssueDate: "",
        documentExpiryDate: "",
      }),
      termsAccepted: false,
    },
  });

  const handleSubmit = (data: PassengersFormValues) => {
    // Cast the validated data to Passenger[] type
    const validatedPassengers: Passenger[] = data.passengers.map(p => ({
      firstName: p.firstName || "",
      lastName: p.lastName || "",
      dateOfBirth: p.dateOfBirth || "",
      nationality: p.nationality || "",
      documentType: p.documentType || "passport",
      documentNumber: p.documentNumber || "",
    }));
    onPassengersChange(validatedPassengers);
    onNext();
  };

  const getParticipantLabel = () => {
    switch (serviceType) {
      case "flight": return { title: "Informations des passagers", main: "Passager principal (Adulte)", other: "Passager" };
      case "hotel":
      case "stay": return { title: "Informations des voyageurs", main: "Voyageur principal (Adulte)", other: "Voyageur" };
      case "car": return { title: "Informations du conducteur", main: "Conducteur principal", other: "Conducteur additionnel" };
      case "tour":
      case "event":
      case "destination": return { title: "Informations des participants", main: "Participant principal (Adulte)", other: "Participant" };
      default: return { title: "Informations des participants", main: "Contact principal", other: "Participant" };
    }
  };

  const labels = getParticipantLabel();

  const getNextButtonText = () => {
    switch (serviceType) {
      case "flight": return "Continuer vers les bagages";
      case "hotel":
      case "stay": return "Continuer vers les options";
      case "car": return "Continuer vers les assurances";
      default: return "Continuer vers les extras";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 rounded-lg border border-primary/20">
        <h2 className="text-2xl font-bold text-primary mb-2">{labels.title}</h2>
        <p className="text-muted-foreground">
          Veuillez renseigner les informations exactement comme indiqué sur les documents d'identité
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Participant principal */}
          <Card className="p-6 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">{labels.main}</h3>
                <p className="text-sm text-muted-foreground">Contact de réservation</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="passengers.0.firstName"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <User className="w-4 h-4 text-primary" />
                      {t('passengerStep.firstNameLabel')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t('passengerStep.firstNamePlaceholder')}
                        className="h-12 border-2"
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="passengers.0.lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <User className="w-4 h-4 text-primary" />
                      Nom *
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Nom"
                        className="h-12 border-2"
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="passengers.0.dateOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      Date de naissance *
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="date"
                        className="h-12 border-2"
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="passengers.0.nationality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nationalité *</FormLabel>
                    <FormControl>
                      <NationalitySelect
                        value={field.value}
                        onValueChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="passengers.0.documentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type de document *</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="h-12 border-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="passport">Passeport</SelectItem>
                          <SelectItem value="id_card">Carte d'identité</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="passengers.0.documentNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-primary" />
                      {t('passengerStep.documentNumberLabel')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Ex: 123456789"
                        className="h-12 border-2"
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="passengers.0.documentIssueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      {t('passengerStep.documentIssueDateLabel')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="date"
                        className="h-12 border-2"
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="passengers.0.documentExpiryDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      Date d'expiration *
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="date"
                        className="h-12 border-2"
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>
          </Card>

          {/* Passagers additionnels */}
          {totalPassengers > 1 && (
            <div className="space-y-4">
              {Array.from({ length: totalPassengers - 1 }, (_, i) => i + 1).map((index) => (
                <Card key={index} className="p-6 border border-border/50">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        {labels.other} {index + 1} ({index < adultsCount ? "Adulte" : "Enfant"})
                      </h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`passengers.${index}.firstName`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <User className="w-4 h-4 text-primary" />
                            {t('passengerStep.firstNameLabel')}
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder={t('passengerStep.firstNamePlaceholder')}
                              className="h-12 border-2"
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`passengers.${index}.lastName`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <User className="w-4 h-4 text-primary" />
                            Nom *
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Nom"
                              className="h-12 border-2"
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`passengers.${index}.dateOfBirth`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-primary" />
                            Date de naissance *
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="date"
                              className="h-12 border-2"
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`passengers.${index}.nationality`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nationalité *</FormLabel>
                          <FormControl>
                            <NationalitySelect
                              value={field.value}
                              onValueChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`passengers.${index}.documentType`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type de document *</FormLabel>
                          <FormControl>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger className="h-12 border-2">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="passport">Passeport</SelectItem>
                                <SelectItem value="id_card">Carte d'identité</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`passengers.${index}.documentNumber`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-primary" />
                            {t('passengerStep.documentNumberLabel')}
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Ex: 123456789"
                              className="h-12 border-2"
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                  </div>
                </Card>
              ))}
            </div>
          )}

          <FormField
            control={form.control}
            name="termsAccepted"
            render={({ field }) => (
              <FormItem className="flex items-start space-x-2 p-4 bg-muted/50 rounded-lg">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-sm font-normal cursor-pointer">
                    J'accepte les conditions générales de vente et la politique de confidentialité de B-reserve
                  </FormLabel>
                  <FormMessage className="text-xs" />
                </div>
              </FormItem>
            )}
          />

          <div className="mt-8">
            <Button
              type="submit"
              className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? "Vérification..." : getNextButtonText()}
            </Button>
          </div>
        </form>
      </Form>
    </motion.div>
  );
};
