import { motion } from "framer-motion";
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

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
  placeholder = "Sélectionner une date",
  required = false,
  disabled = false,
  minDate,
  maxDate,
  className,
  error,
}: UnifiedDatePickerProps) => {
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
      transition={{ duration: 0.3 }}
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
              "transition-all duration-200",
              !value && "text-muted-foreground",
              error && "border-destructive",
              "group"
            )}
          >
            <CalendarIcon className="mr-2 h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
            <span className="truncate flex-1">
              {value ? format(value, "dd MMMM yyyy", { locale: fr }) : placeholder}
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
            locale={fr}
            className="rounded-xl border-2 border-primary/20 pointer-events-auto"
          />
        </PopoverContent>
      </Popover>

      {error && (
        <motion.p
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-xs text-destructive font-medium flex items-center gap-1"
        >
          ⚠️ {error}
        </motion.p>
      )}
    </motion.div>
  );
};
