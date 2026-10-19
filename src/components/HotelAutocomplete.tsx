import { useState, useEffect, useRef } from "react";
import { MapPin, Hotel, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Price } from "@/components/ui/price";

interface Suggestion {
  id: string;
  name: string;
  type: string;
  country: string;
  region: string;
  description: string;
  image: string;
  hotels_count: number;
  average_price?: number;
  price_range?: {
    min: number;
    max: number;
  };
}

interface HotelAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const HotelAutocomplete = ({
  value,
  onChange,
  placeholder = "Ville ou pays",
  className,
}: HotelAutocompleteProps) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (value.length < 2) {
        setSuggestions([]);
        setIsOpen(false);
        return;
      }

      setIsLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('hotel-autocomplete', {
          body: { query: value }
        });

        if (error) throw error;

        if (data?.success && data?.data) {
          setSuggestions(data.data);
          setIsOpen(data.data.length > 0);
        }
      } catch (error) {
        console.error('Autocomplete error:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounce);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          handleSelect(suggestions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  const handleSelect = (suggestion: Suggestion) => {
    onChange(suggestion.name);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  return (
    <div className="relative w-full">
      <Input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => value.length >= 2 && suggestions.length > 0 && setIsOpen(true)}
        className={cn(className)}
        required
      />
      {isLoading && (
        <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
      )}

      {isOpen && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-popover w-full mt-1 bg-popover/100 backdrop-blur-sm border-2 border-border rounded-lg shadow-2xl max-h-[400px] overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.id}
              type="button"
              onClick={() => handleSelect(suggestion)}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={cn(
                "w-full flex items-start gap-3 p-3 hover:bg-accent transition-colors text-left",
                highlightedIndex === index && "bg-accent",
                index !== suggestions.length - 1 && "border-b border-border"
              )}
            >
              <div className="w-16 h-16 flex-shrink-0 rounded-md overflow-hidden bg-muted">
                <img
                  src={suggestion.image}
                  alt={suggestion.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {suggestion.type === 'HOTEL' ? (
                      <Hotel className="w-4 h-4 text-primary flex-shrink-0" />
                    ) : (
                      <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                    )}
                    <h4 className="font-semibold text-sm text-foreground truncate">
                      {suggestion.name}
                    </h4>
                  </div>
                  {suggestion.average_price && (
                    <div className="flex flex-col items-end flex-shrink-0">
                      <span className="text-xs font-semibold text-primary">
                        <Price amount={suggestion.average_price} fromCurrency="EUR" />
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Prix moyen/nuit
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mb-1">
                  {suggestion.country} {suggestion.region && `• ${suggestion.region}`}
                </p>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">
                    {suggestion.description}
                  </p>
                  {suggestion.price_range && (
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      <Price amount={suggestion.price_range.min} fromCurrency="EUR" /> - <Price amount={suggestion.price_range.max} fromCurrency="EUR" />
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
