import { motion } from "framer-motion";
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Users, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { MOTION } from "@/lib/motion";

interface PassengerCount {
  adults: number;
  children: number;
  infants?: number;
  rooms?: number;
}

interface UnifiedPassengerSelectorProps {
  label?: string;
  value: PassengerCount;
  onChange: (value: PassengerCount) => void;
  showRooms?: boolean;
  showInfants?: boolean;
  maxAdults?: number;
  maxChildren?: number;
  className?: string;
  required?: boolean;
}

/**
 * UnifiedPassengerSelector - Sélecteur de voyageurs type Opodo
 * Design premium avec animations fluides
 */
export const UnifiedPassengerSelector = ({
  label,
  value,
  onChange,
  showRooms = false,
  showInfants = false,
  maxAdults = 9,
  maxChildren = 9,
  className,
  required = false,
}: UnifiedPassengerSelectorProps) => {
  const [open, setOpen] = useState(false);

  const updateCount = (field: keyof PassengerCount, delta: number) => {
    const newValue = Math.max(0, (value[field] || 0) + delta);
    onChange({ ...value, [field]: newValue });
  };

  const getTotalPassengers = () => {
    return value.adults + value.children + (value.infants || 0);
  };

  const getDisplayText = () => {
    const parts: string[] = [];
    if (value.adults > 0) parts.push(`${value.adults} adulte${value.adults > 1 ? 's' : ''}`);
    if (value.children > 0) parts.push(`${value.children} enfant${value.children > 1 ? 's' : ''}`);
    if (showInfants && (value.infants || 0) > 0) parts.push(`${value.infants} bébé${(value.infants || 0) > 1 ? 's' : ''}`);
    if (showRooms && (value.rooms || 0) > 0) parts.push(`${value.rooms} chambre${(value.rooms || 0) > 1 ? 's' : ''}`);
    
    return parts.length > 0 ? parts.join(', ') : 'Sélectionner';
  };

  const CounterRow = ({ 
    label, 
    description, 
    count, 
    onIncrement, 
    onDecrement, 
    min = 0,
    max = 9 
  }: { 
    label: string; 
    description?: string; 
    count: number; 
    onIncrement: () => void; 
    onDecrement: () => void;
    min?: number;
    max?: number;
  }) => (
    <motion.div 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center justify-between py-3 border-b border-border last:border-0"
    >
      <div>
        <p className="font-semibold text-sm text-foreground">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className="flex items-center gap-3">
        <Button
          aria-label={`Retirer : ${label}`}
          type="button"
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-full"
          onClick={onDecrement}
          disabled={count <= min}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <span className="font-bold text-lg min-w-[24px] text-center tabular-nums" aria-live="polite">{count}</span>
        <Button
          aria-label={`Ajouter : ${label}`}
          type="button"
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-full"
          onClick={onIncrement}
          disabled={count >= max}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );

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
          <Users className="w-4 h-4 text-primary" />
          {label}
        </Label>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full h-12 justify-start text-left font-medium",
              "border-2 border-input hover:border-primary/50",
              "transition-all duration-base ease-standard",
              "group overflow-hidden"
            )}
          >
            <Users className="mr-2 h-5 w-5 flex-shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="flex-1 truncate text-sm">{getDisplayText()}</span>
            <span className="text-xs text-muted-foreground ml-2 flex-shrink-0 hidden sm:inline">
              {getTotalPassengers()} voyageur{getTotalPassengers() > 1 ? 's' : ''}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4 pointer-events-auto" align="start">
          <div className="space-y-1">
            <CounterRow
              label="Adultes"
              description="12 ans et plus"
              count={value.adults}
              onIncrement={() => updateCount('adults', 1)}
              onDecrement={() => updateCount('adults', -1)}
              min={1}
              max={maxAdults}
            />
            <CounterRow
              label="Enfants"
              description="2-11 ans"
              count={value.children}
              onIncrement={() => updateCount('children', 1)}
              onDecrement={() => updateCount('children', -1)}
              max={maxChildren}
            />
            {showInfants && (
              <CounterRow
                label="Bébés"
                description="0-2 ans"
                count={value.infants || 0}
                onIncrement={() => updateCount('infants', 1)}
                onDecrement={() => updateCount('infants', -1)}
                max={value.adults}
              />
            )}
            {showRooms && (
              <CounterRow
                label="Chambres"
                count={value.rooms || 1}
                onIncrement={() => updateCount('rooms', 1)}
                onDecrement={() => updateCount('rooms', -1)}
                min={1}
                max={9}
              />
            )}
          </div>
          <Button
            onClick={() => setOpen(false)}
            className="w-full mt-4 bg-primary hover:bg-primary/90 font-semibold"
          >
            Valider
          </Button>
        </PopoverContent>
      </Popover>
    </motion.div>
  );
};
