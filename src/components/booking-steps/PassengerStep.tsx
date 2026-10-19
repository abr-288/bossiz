import { useMemo } from "react";
import { motion } from "framer-motion";
import { User, Users, Calendar, Globe, FileText } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { NationalitySelect } from "@/components/NationalitySelect";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import type { TFunction } from "i18next";

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
// Messages traduits : le schéma est construit avec la fonction t courante.
const createPassengersFormSchema = (t: TFunction) => {
  const passengerSchema = z.object({
    firstName: z.string()
      .trim()
      .min(2, t("ux.passenger.errFirstNameMin"))
      .max(50, t("ux.passenger.errFirstNameMax"))
      .regex(/^[a-zA-ZÀ-ÿ\s\-']+$/, t("ux.passenger.errFirstNameChars")),
    lastName: z.string()
      .trim()
      .min(2, t("ux.passenger.errLastNameMin"))
      .max(50, t("ux.passenger.errLastNameMax"))
      .regex(/^[a-zA-ZÀ-ÿ\s\-']+$/, t("ux.passenger.errLastNameChars")),
    dateOfBirth: z.string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, t("ux.passenger.errDateFormat"))
      .refine((date) => {
        const birthDate = new Date(date);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        return age >= 0 && age <= 120;
      }, t("ux.passenger.errBirthDate")),
    nationality: z.string()
      .trim()
      .min(2, t("ux.passenger.errNationality")),
    documentType: z.enum(["passport", "id_card"], {
      errorMap: () => ({ message: t("ux.passenger.errDocType") }),
    }),
    documentNumber: z.string()
      .trim()
      .min(5, t("ux.passenger.errDocMin"))
      .max(30, t("ux.passenger.errDocMax"))
      .regex(/^[A-Z0-9-]+$/i, t("ux.passenger.errDocChars")),
    documentIssueDate: z.string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, t("ux.passenger.errDateFormat"))
      .optional()
      .or(z.literal("")),
    documentExpiryDate: z.string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, t("ux.passenger.errDateFormat"))
      .refine((date) => {
        if (!date) return true;
        const expiryDate = new Date(date);
        const today = new Date();
        // Le document doit être valide au moins 6 mois après la date du voyage
        const sixMonthsFromNow = new Date();
        sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
        return expiryDate > sixMonthsFromNow;
      }, t("ux.passenger.errDocExpiry"))
      .optional()
      .or(z.literal("")),
  });

  return z.object({
    passengers: z.array(passengerSchema).min(1, t("ux.passenger.errPassengers")),
    termsAccepted: z.boolean().refine((val) => val === true, {
      message: t("ux.passenger.errTerms"),
    }),
  });
};

interface PassengerStepProps {
  passengers: Passenger[];
  onPassengersChange: (passengers: Passenger[]) => void;
  adultsCount: number;
  childrenCount: number;
  onNext: () => void;
  serviceType?: string;
}

type PassengersFormValues = z.infer<ReturnType<typeof createPassengersFormSchema>>;

export const PassengerStep = ({
  passengers,
  onPassengersChange,
  adultsCount,
  childrenCount,
  onNext,
  serviceType = "flight",
}: PassengerStepProps) => {
  const { t } = useTranslation();
  const passengersFormSchema = useMemo(() => createPassengersFormSchema(t), [t]);
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
      case "flight": return { title: t("ux.passenger.flightTitle"), main: t("ux.passenger.flightMain"), other: t("ux.passenger.flightOther") };
      case "hotel":
      case "stay": return { title: t("ux.passenger.stayTitle"), main: t("ux.passenger.stayMain"), other: t("ux.passenger.stayOther") };
      case "car": return { title: t("ux.passenger.carTitle"), main: t("ux.passenger.carMain"), other: t("ux.passenger.carOther") };
      case "tour":
      case "event":
      case "destination": return { title: t("ux.passenger.tourTitle"), main: t("ux.passenger.tourMain"), other: t("ux.passenger.otherLabel") };
      default: return { title: t("ux.passenger.tourTitle"), main: t("ux.passenger.defaultMain"), other: t("ux.passenger.otherLabel") };
    }
  };

  const labels = getParticipantLabel();

  const getNextButtonText = () => {
    switch (serviceType) {
      case "flight": return t("ux.passenger.continueBaggage");
      case "hotel":
      case "stay": return t("ux.passenger.continueOptions");
      case "car": return t("ux.passenger.continueInsurance");
      default: return t("ux.passenger.continueExtras");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 md:space-y-7"
    >
      <div className="flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-sm md:flex-row md:items-center md:justify-between md:p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <Badge variant="secondary" className="mb-2 rounded-full px-3 text-[11px]">
              {t("ux.passenger.stepBadge")}
            </Badge>
            <h2 className="text-xl font-bold tracking-tight text-foreground md:text-2xl">{labels.title}</h2>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">
              {t("ux.passenger.stepIntro")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start rounded-full bg-muted/70 px-3 py-2 text-xs font-medium text-muted-foreground md:self-center">
          <Users className="h-4 w-4 text-primary" />
          {t("ux.passenger.count", { count: totalPassengers })}
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-7">
          {/* Participant principal */}
          <Card className="overflow-hidden rounded-2xl border shadow-sm">
            <div className="flex items-center gap-4 border-b bg-muted/20 px-5 py-4 md:px-7 md:py-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                <User className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-foreground">{labels.main}</h3>
                <p className="mt-0.5 text-sm text-muted-foreground">{t("ux.passenger.bookingContact")}</p>
              </div>
              <Badge variant="outline" className="shrink-0 rounded-full bg-background">{t("ux.passenger.main")}</Badge>
            </div>

            <div className="grid grid-cols-1 gap-x-6 gap-y-6 p-5 md:p-8 lg:grid-cols-2">
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
                        className="h-11 rounded-xl bg-background"
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
                      {t("ux.passenger.lastName")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t("ux.passenger.lastNamePlaceholder")}
                        className="h-11 rounded-xl bg-background"
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
                      {t("ux.passenger.birthDate")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="date"
                        className="h-11 rounded-xl bg-background"
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
                    <FormLabel>{t("ux.passenger.nationality")}</FormLabel>
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
                    <FormLabel>{t("ux.passenger.docType")}</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="h-11 rounded-xl bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="passport">{t("ux.passenger.passport")}</SelectItem>
                          <SelectItem value="id_card">{t("ux.passenger.idCard")}</SelectItem>
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
                        placeholder={t("ux.passenger.docPlaceholder")}
                        className="h-11 rounded-xl bg-background"
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
                        className="h-11 rounded-xl bg-background"
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
                      {t("ux.passenger.expiry")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="date"
                        className="h-11 rounded-xl bg-background"
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
                <Card key={index} className="overflow-hidden rounded-2xl border shadow-sm">
                  <div className="flex items-center gap-4 border-b bg-muted/20 px-5 py-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary">
                      <Users className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-foreground">{labels.other} {index + 1}</h3>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        Participant {index < adultsCount ? "adulte" : "enfant"}
                      </p>
                    </div>
                    <Badge variant="outline" className="shrink-0 rounded-full bg-background">
                      {index < adultsCount ? t("ux.passenger.adult") : t("ux.passenger.child")}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 gap-x-6 gap-y-6 p-5 md:p-7 lg:grid-cols-2">
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
                              className="h-11 rounded-xl bg-background"
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
                            {t("ux.passenger.lastName")}
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder={t("ux.passenger.lastNamePlaceholder")}
                              className="h-11 rounded-xl bg-background"
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
                            {t("ux.passenger.birthDate")}
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="date"
                              className="h-11 rounded-xl bg-background"
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
                          <FormLabel>{t("ux.passenger.nationality")}</FormLabel>
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
                          <FormLabel>{t("ux.passenger.docType")}</FormLabel>
                          <FormControl>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger className="h-11 rounded-xl bg-background">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="passport">{t("ux.passenger.passport")}</SelectItem>
                                <SelectItem value="id_card">{t("ux.passenger.idCard")}</SelectItem>
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
                              placeholder={t("ux.passenger.docPlaceholder")}
                              className="h-11 rounded-xl bg-background"
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
              <FormItem className="flex items-start space-x-3 rounded-xl border bg-card p-4 shadow-sm">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-sm font-normal cursor-pointer">
                    {t("ux.passenger.terms")}
                  </FormLabel>
                  <FormMessage className="text-xs" />
                </div>
              </FormItem>
            )}
          />

          <div className="booking-actions md:mt-8">
            <Button
              type="submit"
              size="lg"
              className="w-full font-semibold"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? t("ux.passenger.checking") : getNextButtonText()}
            </Button>
          </div>
        </form>
      </Form>
    </motion.div>
  );
};
