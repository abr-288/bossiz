import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

export interface ValidationIndicatorProps {
  status: "idle" | "validating" | "valid" | "invalid";
  message?: string;
  className?: string;
  /** Référencé par aria-describedby sur le champ */
  id?: string;
}

/**
 * ValidationIndicator - Indicateur visuel de l'état de validation
 * Affiche une icône et un message selon l'état de validation
 */
export const ValidationIndicator = ({
  status,
  message,
  className,
  id,
}: ValidationIndicatorProps) => {
  const { t } = useTranslation();
  return (
    <div id={id} aria-live="polite">
    <AnimatePresence mode="wait">
      {status !== "idle" && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          className={cn("flex items-center gap-2", className)}
        >
          {status === "validating" && (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{t("ux.form.validating")}</span>
            </>
          )}
          
          {status === "valid" && (
            <>
              <CheckCircle2 className="h-4 w-4 text-success" />
              {message && (
                <span className="text-sm text-success">
                  {message}
                </span>
              )}
            </>
          )}
          
          {status === "invalid" && message && (
            <>
              <XCircle className="h-4 w-4 text-destructive" />
              <span role="alert" className="text-sm text-destructive">{message}</span>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
    </div>
  );
};
