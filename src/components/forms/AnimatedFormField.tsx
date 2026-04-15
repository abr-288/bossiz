import { useState } from "react";
import { motion, AnimatePresence, type Transition } from "framer-motion";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Animation configurations
export const containerVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { 
      duration: 0.5,
      staggerChildren: 0.1
    } as Transition
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
    transition: { duration: 0.3 } as Transition
  }
};

export const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4 } as Transition
  }
};

interface FormFieldProps {
  label: string;
  name: string;
  type: string;
  placeholder: string;
  icon: React.ReactNode;
  error?: string;
  value: string;
  onChange: (value: string) => void;
  showPasswordToggle?: boolean;
}

const AnimatedFormField = ({ 
  label, 
  name, 
  type, 
  placeholder, 
  icon, 
  error,
  value,
  onChange,
  showPasswordToggle 
}: FormFieldProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <motion.div 
      variants={itemVariants}
      className="space-y-1.5 md:space-y-2"
    >
      <Label htmlFor={name} className="flex items-center gap-2 text-xs md:text-sm font-medium text-foreground/80">
        <span className="text-primary">{icon}</span>
        {label}
      </Label>
      <div className="relative group">
        <motion.div
          animate={{
            boxShadow: isFocused 
              ? "0 0 0 3px hsl(var(--primary) / 0.15)" 
              : "0 0 0 0px transparent"
          }}
          className="rounded-xl overflow-hidden"
        >
          <Input
            id={name}
            name={name}
            type={showPasswordToggle && showPassword ? "text" : type}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={`h-12 md:h-11 text-base md:text-sm rounded-xl border-2 bg-background/50 backdrop-blur-sm transition-all duration-300 pr-12 placeholder:text-muted-foreground/50 ${
              error 
                ? "border-destructive/50 focus:border-destructive focus:ring-destructive/20" 
                : isFocused 
                  ? "border-primary/50 bg-background" 
                  : "border-border/50 hover:border-border"
            }`}
          />
        </motion.div>
        {showPasswordToggle && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors p-1 rounded-lg hover:bg-primary/10"
          >
            <motion.div
              initial={false}
              animate={{ rotate: showPassword ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              {showPassword ? <EyeOff className="h-5 w-5 md:h-4 md:w-4" /> : <Eye className="h-5 w-5 md:h-4 md:w-4" />}
            </motion.div>
          </button>
        )}
      </div>
      <AnimatePresence mode="wait">
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -5, height: 0 }}
            className="text-xs text-destructive flex items-center gap-1.5 pt-0.5"
          >
            <AlertCircle className="h-3 w-3 flex-shrink-0" />
            <span>{error}</span>
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AnimatedFormField;
