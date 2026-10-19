import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Plane, Building2, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { ContextualHelp } from "@/components/forms/ContextualHelp";
import { MOTION } from "@/lib/motion";

export interface AutocompleteSuggestion {
  id: string;
  name: string;
  code?: string;
  country?: string;
  city?: string;
  type: "airport" | "city" | "hotel" | "location";
}

interface UnifiedAutocompleteProps {
  label?: string;
  value: string;
  onChange: (value: string, suggestion?: AutocompleteSuggestion) => void;
  type: "airport" | "city" | "hotel" | "location";
  placeholder?: string;
  required?: boolean;
  error?: string;
  className?: string;
  disabled?: boolean;
  helpText?: string;
}

/**
 * UnifiedAutocomplete - Autocomplétion universelle premium
 * Support aéroports, villes, hôtels, locations
 * Design type Booking/Opodo avec thème Bossiz
 */
export const UnifiedAutocomplete = ({
  label,
  value,
  onChange,
  type,
  placeholder,
  required = false,
  error,
  className,
  disabled = false,
  helpText,
}: UnifiedAutocompleteProps) => {
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLDivElement>(null);

  const getIcon = (): LucideIcon => {
    switch (type) {
      case "airport": return Plane;
      case "city": return MapPin;
      case "hotel": return Building2;
      case "location": return MapPin;
    }
  };

  const Icon = getIcon();

  const fetchSuggestions = async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      let endpoint = "";
      switch (type) {
        case "airport":
          endpoint = "airport-autocomplete";
          break;
        case "city":
          endpoint = "airport-autocomplete"; // Réutilise le même endpoint
          break;
        case "hotel":
          endpoint = "hotel-autocomplete";
          break;
        case "location":
          endpoint = "car-location-autocomplete";
          break;
      }

      const { data, error } = await supabase.functions.invoke(endpoint, {
        body: { query }
      });

      if (error) throw error;

      const formattedSuggestions: AutocompleteSuggestion[] = (data?.suggestions || []).map((s: any) => ({
        id: s.iata || s.id || s.code || `${s.name}-${Math.random()}`,
        name: s.name || s.city,
        code: s.iata || s.code,
        country: s.country,
        city: s.city,
        type
      }));

      setSuggestions(formattedSuggestions);
    } catch (err) {
      console.error("Autocomplete error:", err);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    fetchSuggestions(newValue);
    setIsOpen(true);
  };

  const handleSelect = (suggestion: AutocompleteSuggestion) => {
    const displayValue = suggestion.code 
      ? `${suggestion.name} (${suggestion.code})`
      : suggestion.name;
    onChange(displayValue, suggestion);
    setIsOpen(false);
    setSuggestions([]);
  };

  return (
    <motion.div
      ref={inputRef}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: MOTION.slow }}
      className={cn("space-y-2 relative", className)}
    >
      {label && (
        <div className="flex items-center gap-2">
          <Label 
            className={cn(
              "text-sm font-semibold text-foreground flex items-center gap-2",
              required && "after:content-['*'] after:text-destructive after:ml-0.5"
            )}
          >
            <Icon className="w-4 h-4 text-primary" />
            {label}
          </Label>
          {helpText && <ContextualHelp content={helpText} />}
        </div>
      )}

      <div className="relative group">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors pointer-events-none z-10" />
        <Input
          value={value}
          onChange={handleInputChange}
          onFocus={() => value.length >= 2 && setIsOpen(true)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={cn(
            "pl-11 h-12 border-2 border-input hover:border-primary/50 focus:border-primary",
            "transition-all duration-base ease-standard",
            "placeholder:text-muted-foreground/60",
            "font-medium",
            error && "border-destructive focus:border-destructive"
          )}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      <AnimatePresence>
        {isOpen && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: MOTION.base }}
            className="absolute z-50 w-full mt-1 bg-popover border-2 border-primary/20 rounded-xl shadow-xl overflow-hidden"
          >
            <div className="max-h-64 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <motion.button
                  key={suggestion.id}
                  type="button"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => handleSelect(suggestion)}
                  className={cn(
                    "w-full px-4 py-3 text-left hover:bg-primary/5 transition-colors",
                    "border-b border-border/30 last:border-0",
                    "group cursor-pointer"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Icon className="w-5 h-5 mt-0.5 text-primary group-hover:scale-110 transition-transform flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate">
                        {suggestion.name}
                        {suggestion.code && (
                          <span className="ml-2 text-primary font-bold">({suggestion.code})</span>
                        )}
                      </p>
                      {(suggestion.city || suggestion.country) && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {[suggestion.city, suggestion.country].filter(Boolean).join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
