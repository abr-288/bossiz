import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Users, Plus, Minus } from "lucide-react";

interface TravelersSelectorProps {
  adults: number;
  children: number;
  rooms?: number;
  onAdultsChange: (value: number) => void;
  onChildrenChange: (value: number) => void;
  onRoomsChange?: (value: number) => void;
  showRooms?: boolean;
}

export const TravelersSelector = ({
  adults,
  children,
  rooms = 1,
  onAdultsChange,
  onChildrenChange,
  onRoomsChange,
  showRooms = false,
}: TravelersSelectorProps) => {
  const getTravelersText = () => {
    const parts = [];
    if (adults > 0) parts.push(`${adults} Adulte${adults > 1 ? 's' : ''}`);
    if (children > 0) parts.push(`${children} Enfant${children > 1 ? 's' : ''}`);
    if (showRooms && rooms > 0) parts.push(`${rooms} Chambre${rooms > 1 ? 's' : ''}`);
    return parts.join(', ') || 'Voyageurs';
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full h-12 justify-start text-left font-normal">
          <Users className="mr-2 h-4 w-4" />
          {getTravelersText()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Adultes</p>
              <p className="text-sm text-muted-foreground">13 ans et plus</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                aria-label="Diminuer"
                variant="outline"
                size="icon"
                onClick={() => onAdultsChange(Math.max(1, adults - 1))}
                disabled={adults <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center font-medium">{adults}</span>
              <Button
                aria-label="Augmenter"
                variant="outline"
                size="icon"
                onClick={() => onAdultsChange(adults + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Enfants</p>
              <p className="text-sm text-muted-foreground">0-12 ans</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                aria-label="Diminuer"
                variant="outline"
                size="icon"
                onClick={() => onChildrenChange(Math.max(0, children - 1))}
                disabled={children <= 0}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center font-medium">{children}</span>
              <Button
                aria-label="Augmenter"
                variant="outline"
                size="icon"
                onClick={() => onChildrenChange(children + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {showRooms && onRoomsChange && (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Chambres</p>
                <p className="text-sm text-muted-foreground">Nombre de chambres</p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  aria-label="Diminuer"
                  variant="outline"
                  size="icon"
                  onClick={() => onRoomsChange(Math.max(1, rooms - 1))}
                  disabled={rooms <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center font-medium">{rooms}</span>
                <Button
                  aria-label="Augmenter"
                  variant="outline"
                  size="icon"
                  onClick={() => onRoomsChange(rooms + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
