import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

export interface BookingStepItem {
  number: number;
  title: string;
}

interface BookingStepperProps {
  steps: BookingStepItem[];
  currentStep: number;
  className?: string;
}

// Stepper commun aux tunnels de réservation.
// Mobile : barres segmentées + libellé de l'étape (4 cercles de 40 px ne
// tenaient pas sous 360 px). À partir de sm : cercles numérotés reliés.
export function BookingStepper({ steps, currentStep, className }: BookingStepperProps) {
  const { t } = useTranslation();
  const current = steps.find((s) => s.number === currentStep);

  return (
    <nav aria-label={t("ux.stepper.label")} className={cn("rounded-2xl border border-border bg-card p-4 shadow-sm md:p-6", className)}>
      {/* Mobile */}
      <div className="sm:hidden">
        <p className="mb-2 text-sm font-semibold text-foreground">
          {t("ux.booking.stepOf", { current: currentStep, total: steps.length })} · {current?.title}
        </p>
        <ol className="flex gap-1.5">
          {steps.map((step) => (
            <li
              key={step.number}
              aria-current={step.number === currentStep ? "step" : undefined}
              className={cn(
                "h-1.5 flex-1 rounded-full",
                step.number < currentStep ? "bg-success" : step.number === currentStep ? "bg-primary" : "bg-muted",
              )}
            >
              <span className="sr-only">{step.title}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Tablette et ordinateur */}
      <ol className="hidden items-center justify-between gap-2 sm:flex">
        {steps.map((step, index) => {
          const done = step.number < currentStep;
          const active = step.number === currentStep;
          return (
            <li key={step.number} className="flex flex-1 items-center last:flex-none" aria-current={active ? "step" : undefined}>
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-colors duration-base",
                    done && "bg-success text-success-foreground",
                    active && "bg-primary text-primary-foreground ring-4 ring-primary/15",
                    !done && !active && "bg-muted text-muted-foreground",
                  )}
                >
                  {done ? <Check className="h-4 w-4" aria-hidden="true" /> : step.number}
                </span>
                <span className={cn("mt-2 text-center text-sm font-medium", active ? "text-foreground" : "text-muted-foreground")}>
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <span aria-hidden="true" className={cn("mx-3 h-0.5 flex-1 rounded-full", done ? "bg-success" : "bg-border")} />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
