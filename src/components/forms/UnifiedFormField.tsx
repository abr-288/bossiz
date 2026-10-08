import { motion } from "framer-motion";
import { ReactNode, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { ValidationIndicator } from "@/components/forms/ValidationIndicator";
import { ContextualHelp } from "@/components/forms/ContextualHelp";
import { PhoneNumberInput } from "@/components/PhoneNumberInput";

interface UnifiedFormFieldProps {
  label?: string;
  icon?: LucideIcon;
  type?: "text" | "email" | "password" | "number" | "tel" | "date" | "time" | "textarea";
  placeholder?: string;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onPhoneChange?: (value: string) => void;
  onBlur?: () => void;
  required?: boolean;
  error?: string;
  hint?: string;
  helpText?: string;
  validMessage?: string;
  className?: string;
  disabled?: boolean;
  children?: ReactNode;
  name?: string;
  id?: string;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  defaultValue?: string | number;
}

/**
 * UnifiedFormField - Champ de formulaire premium avec animations
 * Style Opodo/Booking avec thème Bossiz
 */
export const UnifiedFormField = ({
  label,
  icon: Icon,
  type = "text",
  placeholder,
  value,
  onChange,
  onPhoneChange,
  onBlur,
  required = false,
  error,
  hint,
  helpText,
  validMessage,
  className,
  disabled = false,
  children,
  name,
  id,
  min,
  max,
  minLength,
  maxLength,
  defaultValue,
}: UnifiedFormFieldProps) => {
  const fieldId = id || name || `field-${Math.random()}`;
  const [touched, setTouched] = useState(false);

  const handleBlur = () => {
    setTouched(true);
    onBlur?.();
  };

  const getValidationStatus = () => {
    if (!touched || !value) return "idle";
    if (error) return "invalid";
    if (validMessage) return "valid";
    return "idle";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("space-y-2", className)}
    >
      {label && (
        <div className="flex items-center gap-2">
          <Label 
            htmlFor={fieldId}
            className={cn(
              "text-sm font-semibold text-foreground flex items-center gap-2",
              required && "after:content-['*'] after:text-destructive after:ml-0.5"
            )}
          >
            {Icon && <Icon className="w-4 h-4 text-primary" />}
            {label}
          </Label>
          {helpText && <ContextualHelp content={helpText} />}
        </div>
      )}

      <div className="relative group">
        {children ? (
          children
        ) : type === "textarea" ? (
          <Textarea
            id={fieldId}
            name={name}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            onBlur={handleBlur}
            required={required}
            disabled={disabled}
            minLength={minLength}
            maxLength={maxLength}
            className={cn(
              "min-h-[120px] resize-none",
              "border-2 border-input hover:border-primary/50 focus:border-primary",
              "transition-all duration-200",
              "placeholder:text-muted-foreground/60",
              error && touched && "border-destructive focus:border-destructive",
              !error && touched && value && "border-green-500 focus:ring-green-500"
            )}
          />
        ) : type === "tel" ? (
          <PhoneNumberInput
            id={fieldId}
            name={name}
            value={typeof value === "string" ? value : undefined}
            defaultValue={defaultValue}
            onValueChange={onPhoneChange}
            onBlur={handleBlur}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            className={cn(
              error && touched && "[&_input]:border-destructive",
              !error && touched && value && "[&_input]:border-green-500"
            )}
          />
        ) : (
          <>
            {Icon && (
              <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors pointer-events-none z-10" />
            )}
            <Input
              id={fieldId}
              name={name}
              type={type}
              placeholder={placeholder}
              value={value}
              onChange={onChange}
              onBlur={handleBlur}
              required={required}
              disabled={disabled}
              min={min}
              max={max}
              minLength={minLength}
              maxLength={maxLength}
              defaultValue={defaultValue}
              className={cn(
                Icon && "pl-11",
                "h-12 border-2 border-input hover:border-primary/50 focus:border-primary",
                "transition-all duration-200",
                "placeholder:text-muted-foreground/60",
                "font-medium",
                error && touched && "border-destructive focus:border-destructive",
                !error && touched && value && "border-green-500 focus:ring-green-500"
              )}
            />
          </>
        )}
      </div>

      {hint && !error && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          {hint}
        </p>
      )}

      <ValidationIndicator
        status={getValidationStatus()}
        message={error || (touched && value ? validMessage : undefined)}
      />
    </motion.div>
  );
};
