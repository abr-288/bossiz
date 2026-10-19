import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { MOTION } from "@/lib/motion";

export interface FormProgressBarProps {
  totalFields: number;
  completedFields: number;
  className?: string;
}

/**
 * FormProgressBar - Barre de progression du formulaire
 * Affiche visuellement la progression de remplissage du formulaire
 */
export const FormProgressBar = ({
  totalFields,
  completedFields,
  className
}: FormProgressBarProps) => {
  const { t } = useTranslation();
  const progress = (completedFields / totalFields) * 100;
  const isComplete = completedFields === totalFields;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          {isComplete && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-success"
            >
              <CheckCircle2 className="h-4 w-4" />
            </motion.div>
          )}
          <span className={cn(
            "font-medium",
            isComplete ? "text-success" : "text-muted-foreground"
          )}>
            {isComplete ? t("ux.form.complete") : t("ux.form.progress", { done: completedFields, total: totalFields })}
          </span>
        </div>
        <span className="text-muted-foreground font-semibold">
          {Math.round(progress)}%
        </span>
      </div>
      
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className={cn(
            "h-full rounded-full transition-colors duration-slow ease-standard",
            isComplete 
              ? "bg-gradient-to-r from-success to-success/80" 
              : "bg-primary"
          )}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: MOTION.slow, ease: "easeOut" }}
        />
      </div>
    </div>
  );
};
