import { motion } from "framer-motion";
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { enUS, fr, zhCN } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { useTranslation } from "react-i18next";
import { MOTION } from "@/lib/motion";

interface UnifiedDatePickerProps {
  label?: string;
  value?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
  error?: string;
}

/**
 * UnifiedDatePicker - Sélecteur de date premium type Booking
 * Design moderne avec thème Bossiz
 */
export const UnifiedDatePicker = ({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  minDate,
  maxDate,
  className,
  error,
}: UnifiedDatePickerProps) => {
  const { t, i18n } = useTranslation();
  // Mois et jours dans la langue de l'interface (avant : toujours en français)
  const dateLocale = i18n.language.startsWith("zh") ? zhCN : i18n.language.startsWith("en") ? enUS : fr;
  const [open, setOpen] = useState(false);

  const handleClear = () => {
    onChange(undefined);
    setOpen(false);
  };

  const handleDateSelect = (date: Date | undefined) => {
    onChange(date);
    setOpen(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: MOTION.slow }}
      className={cn("space-y-2", className)}
    >
      {label && (
        <Label 
          className={cn(
            "text-sm font-semibold text-foreground flex items-center gap-2",
            required && "after:content-['*'] after:text-destructive after:ml-0.5"
          )}
        >
          <CalendarIcon className="w-4 h-4 text-primary" />
          {label}
        </Label>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full h-12 justify-start text-left font-medium",
              "border-2 border-input hover:border-primary/50",
              "transition-all duration-base ease-standard",
              !value && "text-muted-foreground",
              error && "border-destructive",
              "group"
            )}
          >
            <CalendarIcon className="mr-2 h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
            <span className="truncate flex-1">
              {value ? format(value, "dd MMMM yyyy", { locale: dateLocale }) : placeholder ?? t("ux.datepicker.placeholder")}
            </span>
            {value && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="ml-2 h-8 w-8 p-0 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={handleDateSelect}
            disabled={(date) => {
              if (minDate && date < minDate) return true;
              if (maxDate && date > maxDate) return true;
              return false;
            }}
            initialFocus
            locale={dateLocale}
            className="rounded-xl border-2 border-primary/20 pointer-events-auto"
          />
        </PopoverContent>
      </Popover>

      {error && (
        <motion.p role="alert"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-sm text-destructive font-medium flex items-center gap-1"
        >
          ⚠️ {error}
        </motion.p>
      )}
    </motion.div>
  );
};
