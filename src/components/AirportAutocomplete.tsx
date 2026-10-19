import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Plane, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Price } from "@/components/ui/price";

interface Suggestion {
  name: string;
  code?: string;
  country: string;
  type: string;
  averagePrice?: number;
  priceRange?: string;
}

interface AirportAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  type?: "flight" | "train";
}

export const AirportAutocomplete = ({
  value,
  onChange,
  placeholder = "Ville ou aéroport",
  className,
  type = "flight"
}: AirportAutocompleteProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (value.length > 1) {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      debounceTimer.current = setTimeout(async () => {
        setLoading(true);
        try {
          const { data } = await supabase.functions.invoke('airport-autocomplete', {
            body: { query: value, type }
          });

          if (data?.success && data.suggestions) {
            setSuggestions(data.suggestions);
            setIsOpen(true);
          }
        } catch (error) {
          console.error('Autocomplete error:', error);
        } finally {
          setLoading(false);
        }
      }, 300);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [value, type]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (suggestion: Suggestion) => {
    onChange(suggestion.code ? `${suggestion.name} (${suggestion.code})` : suggestion.name);
    setIsOpen(false);
  };

  return (
    <div ref={inputRef} className="relative">
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => value.length > 1 && setIsOpen(true)}
        className={className}
      />
      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover/100 backdrop-blur-sm border-2 border-border rounded-lg shadow-2xl z-popover max-h-[400px] overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSelect(suggestion)}
              className="w-full px-4 py-3 text-left hover:bg-secondary/10 flex items-start gap-3 transition-all duration-base ease-standard first:rounded-t-lg last:rounded-b-lg border-b border-border/50 last:border-b-0 group"
            >
              {type === "flight" ? (
                <Plane className="w-4 h-4 mt-0.5 text-primary flex-shrink-0 group-hover:scale-110 transition-transform" />
              ) : (
                <MapPin className="w-4 h-4 mt-0.5 text-primary flex-shrink-0 group-hover:scale-110 transition-transform" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-foreground group-hover:text-primary">
                      {suggestion.name} {suggestion.code && `(${suggestion.code})`}
                    </p>
                    <p className="text-sm text-muted-foreground">{suggestion.country}</p>
                  </div>
                  {suggestion.averagePrice && (
                    <div className="text-right flex-shrink-0">
                      <p className="font-semibold text-primary">
                        <Price amount={suggestion.averagePrice} fromCurrency="EUR" />
                      </p>
                      {suggestion.priceRange && (
                        <p className="text-xs text-muted-foreground">{suggestion.priceRange}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
      {loading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};
