import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, TrendingDown, TrendingUp, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, addDays, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isWeekend, getDay } from "date-fns";
import { fr } from "date-fns/locale";
import { Price } from "@/components/ui/price";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface PriceCalendarProps {
  departureDate: string;
  prices?: Record<string, number>;
  currency?: string;
  onDateSelect: (date: string) => void;
  lowestPrice?: number;
  viewMode?: "week" | "month";
  onPriceFilterChange?: (filters: { low: boolean; medium: boolean; high: boolean }) => void;
}

/**
 * Génère un prix simulé basé sur des règles réalistes avec graine fixe
 */
const generatePrice = (date: Date, basePrice: number): number => {
  const dayOfWeek = getDay(date);
  const isWeekendDay = isWeekend(date);
  
  // Créer une graine fixe basée sur la date pour éviter les variations aléatoires
  const dateSeed = format(date, 'yyyy-MM-dd');
  let hash = 0;
  for (let i = 0; i < dateSeed.length; i++) {
    hash = ((hash << 5) - hash) + dateSeed.charCodeAt(i);
    hash = hash & hash; // Convertir en entier 32-bit
  }
  const randomSeed = (hash % 1000) / 1000; // Valeur entre 0 et 1
  
  // Prix de base
  let price = basePrice;
  
  // Week-end + 25-35% (plus cher pour aller-retour)
  if (isWeekendDay) {
    price *= 1.25 + randomSeed * 0.1;
  }
  
  // Vendredi + 20%
  if (dayOfWeek === 5) {
    price *= 1.2;
  }
  
  // Mardi/Mercredi -5% (jours moins chers mais pas trop)
  if (dayOfWeek === 2 || dayOfWeek === 3) {
    price *= 0.95;
  }
  
  // Lundi/Jeudi + 10% (jours modérés)
  if (dayOfWeek === 1 || dayOfWeek === 4) {
    price *= 1.1;
  }
  
  // Samedi + 30% (jour de week-end cher)
  if (dayOfWeek === 6) {
    price *= 1.3;
  }
  
  // Dimanche + 35% (jour le plus cher)
  if (dayOfWeek === 0) {
    price *= 1.35;
  }
  
  // Variation fixe basée sur la graine ±5% (moins de variation)
  price *= 0.95 + randomSeed * 0.1;
  
  return Math.round(price);
};

export const PriceCalendar = ({ 
  departureDate, 
  prices = {}, 
  currency = "€", 
  onDateSelect, 
  lowestPrice = 250,
  viewMode: initialViewMode = "week",
  onPriceFilterChange
}: PriceCalendarProps) => {
  const baseDate = parseISO(departureDate);
  const [currentMonth, setCurrentMonth] = useState(baseDate);
  const [viewMode, setViewMode] = useState<"week" | "month">(initialViewMode);
  
  // États pour les filtres de prix
  const [priceFilters, setPriceFilters] = useState({
    low: false,
    medium: false,
    high: false
  });

  // Génération des prix avec cache
  const pricesWithDefaults = useMemo(() => {
    const result: Record<string, number> = { ...prices };
    
    if (viewMode === "week") {
      const weekDates = Array.from({ length: 7 }, (_, i) => addDays(baseDate, i - 3));
      weekDates.forEach(date => {
        const dateStr = format(date, "yyyy-MM-dd");
        if (!result[dateStr]) {
          result[dateStr] = generatePrice(date, lowestPrice);
        }
      });
    } else {
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);
      const monthDates = eachDayOfInterval({ start, end });
      
      monthDates.forEach(date => {
        const dateStr = format(date, "yyyy-MM-dd");
        if (!result[dateStr]) {
          result[dateStr] = generatePrice(date, lowestPrice);
        }
      });
    }
    
    return result;
  }, [viewMode, baseDate, currentMonth, prices, lowestPrice]);

  // Gestion des filtres de prix
  const handlePriceFilterChange = (filterType: 'low' | 'medium' | 'high') => {
    const newFilters = {
      ...priceFilters,
      [filterType]: !priceFilters[filterType]
    };
    setPriceFilters(newFilters);
    onPriceFilterChange?.(newFilters);
  };
  
  // Filtrage des prix selon les filtres sélectionnés
  const filteredPrices = useMemo(() => {
    const result: Record<string, number> = {};
    
    // D'abord calculer les statistiques originales
    const priceValues = Object.values(pricesWithDefaults);
    const min = Math.min(...priceValues);
    const max = Math.max(...priceValues);
    
    Object.entries(pricesWithDefaults).forEach(([date, price]) => {
      const range = max - min;
      const position = (price - min) / range;
      
      let includePrice = true;
      
      if (priceFilters.low && position >= 0.66) includePrice = false;
      if (priceFilters.medium && (position < 0.33 || position >= 0.66)) includePrice = false;
      if (priceFilters.high && position < 0.33) includePrice = false;
      
      if (includePrice) {
        result[date] = price;
      }
    });
    
    return result;
  }, [pricesWithDefaults, priceFilters]);
  
  // Calcul du meilleur prix et prix moyen (original)
  const priceStats = useMemo(() => {
    const priceValues = Object.values(pricesWithDefaults);
    const min = Math.min(...priceValues);
    const max = Math.max(...priceValues);
    const avg = priceValues.reduce((a, b) => a + b, 0) / priceValues.length;
    return { min, max, avg };
  }, [pricesWithDefaults]);
  
  // Recalculer les statistiques avec les prix filtrés
  const filteredPriceStats = useMemo(() => {
    const priceValues = Object.values(filteredPrices);
    if (priceValues.length === 0) return { min: 0, max: 0, avg: 0 };
    
    const min = Math.min(...priceValues);
    const max = Math.max(...priceValues);
    const avg = priceValues.reduce((a, b) => a + b, 0) / priceValues.length;
    return { min, max, avg };
  }, [filteredPrices]);

  // Fonction pour obtenir la couleur selon le prix et les filtres
  const getPriceColor = (price: number) => {
    // Utiliser les statistiques originales pour le coloriage
    const priceValues = Object.values(pricesWithDefaults);
    const min = Math.min(...priceValues);
    const max = Math.max(...priceValues);
    const range = max - min;
    const position = (price - min) / range;
    
    if (position < 0.33) return "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800";
    if (position < 0.66) return "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800";
    return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800";
  };

  const handlePrevMonth = () => setCurrentMonth(prev => subMonths(prev, 1));
  const handleNextMonth = () => setCurrentMonth(prev => addMonths(prev, 1));

  if (viewMode === "week") {
    const dates = Array.from({ length: 7 }, (_, i) => addDays(baseDate, i - 3));

    return (
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-background to-muted/20 border-b border-border"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">
                Meilleur prix: <Price amount={priceStats.min} fromCurrency={currency} />
              </span>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setViewMode("month")}
              className="text-xs"
            >
              <CalendarIcon className="h-3 w-3 mr-1" />
              Vue mois
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex-1 flex gap-2 overflow-x-auto scrollbar-hide pb-2">
              {dates.map((date) => {
                const dateStr = format(date, "yyyy-MM-dd");
                const isSelected = dateStr === departureDate;
                const price = filteredPrices[dateStr];
                
                // Si le prix est filtré, ne pas afficher cette date
                if (!price && pricesWithDefaults[dateStr]) {
                  return (
                    <div key={dateStr} className="flex-shrink-0 flex flex-col items-center px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-300 min-w-[100px] opacity-50" />
                  );
                }
                
                const colorClass = getPriceColor(price);
                
                return (
                  <motion.button
                    key={dateStr}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onDateSelect(dateStr)}
                    className={cn(
                      "flex-shrink-0 flex flex-col items-center px-4 py-2.5 rounded-xl border-2 transition-all min-w-[100px]",
                      isSelected
                        ? "border-primary bg-primary/10 shadow-lg ring-2 ring-primary/20"
                        : colorClass
                    )}
                  >
                    <span className="text-xs font-medium capitalize opacity-80">
                      {format(date, "EEE", { locale: fr })}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {format(date, "d MMM", { locale: fr })}
                    </span>
                    <span className="text-lg font-bold mt-1">
                      <Price amount={price} fromCurrency={currency} />
                    </span>
                    {price === priceStats.min && (
                      <span className="text-[10px] font-semibold text-green-600 dark:text-green-400 mt-0.5">
                        Meilleur prix
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Vue mois
  const start = startOfMonth(currentMonth);
  const end = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start, end });

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-gradient-to-br from-background to-muted/20 border-b border-border"
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="text-lg font-semibold capitalize min-w-[140px] text-center">
              {format(currentMonth, "MMMM yyyy", { locale: fr })}
            </h3>
            <Button variant="ghost" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <TrendingDown className="h-4 w-4 text-green-600" />
              <span className="font-medium">
                Min: <Price amount={filteredPriceStats.min} fromCurrency={currency} />
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-red-600" />
              <span className="font-medium">
                Max: <Price amount={filteredPriceStats.max} fromCurrency={currency} />
              </span>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setViewMode("week")}
              className="text-xs"
            >
              Vue semaine
            </Button>
          </div>
        </div>

        {/* Jours de la semaine */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map(day => (
            <div key={day} className="text-center text-xs font-semibold text-muted-foreground py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Grille des jours */}
        <div className="grid grid-cols-7 gap-2">
          <AnimatePresence mode="wait">
            {days.map((date, idx) => {
              const dateStr = format(date, "yyyy-MM-dd");
              const isSelected = isSameDay(date, baseDate);
              const price = pricesWithDefaults[dateStr];
              const colorClass = getPriceColor(price);
              const isPast = date < new Date();

              return (
                <motion.button
                  key={dateStr}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.01 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => !isPast && onDateSelect(dateStr)}
                  disabled={isPast}
                  className={cn(
                    "flex flex-col items-center justify-center p-2 rounded-lg border transition-all min-h-[70px]",
                    isSelected
                      ? "border-primary bg-primary/10 shadow-md ring-2 ring-primary/20"
                      : isPast
                      ? "opacity-40 cursor-not-allowed bg-muted/50"
                      : colorClass
                  )}
                >
                  <span className="text-xs font-medium mb-1">
                    {format(date, "d")}
                  </span>
                  <span className="text-xs font-bold">
                    <Price amount={price} fromCurrency={currency} className="text-[10px]" />
                  </span>
                  {price === priceStats.min && !isPast && (
                    <TrendingDown className="h-3 w-3 text-green-600 mt-0.5" />
                  )}
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Légende interactive */}
        <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="price-low"
              checked={priceFilters.low}
              onChange={() => handlePriceFilterChange('low')}
              className="w-4 h-4 text-green-600 bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 rounded focus:ring-green-500"
            />
            <label htmlFor="price-low" className="text-xs text-muted-foreground cursor-pointer">Prix bas</label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="price-medium"
              checked={priceFilters.medium}
              onChange={() => handlePriceFilterChange('medium')}
              className="w-4 h-4 text-orange-600 bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800 rounded focus:ring-orange-500"
            />
            <label htmlFor="price-medium" className="text-xs text-muted-foreground cursor-pointer">Prix moyen</label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="price-high"
              checked={priceFilters.high}
              onChange={() => handlePriceFilterChange('high')}
              className="w-4 h-4 text-red-600 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 rounded focus:ring-red-500"
            />
            <label htmlFor="price-high" className="text-xs text-muted-foreground cursor-pointer">Prix élevé</label>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
