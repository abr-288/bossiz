import { Briefcase, Luggage, ShoppingBag, AlertTriangle, Plus, Info } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Price } from "@/components/ui/price";
import { getBaggageAllowance, isLowCostCarrier, formatBaggageInfo } from "@/utils/baggageUtils";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface ApiBaggageData {
  cabin: {
    pieces: number;
    weightKg: number;
    description?: string;
    included: boolean;
  };
  checked: {
    pieces: number;
    weightKg: number;
    included: boolean;
  };
  personalItem: boolean;
  additionalBagPrice?: number;
}

interface BaggageInfoProps {
  airline: string;
  fareType?: string;
  cabinClass?: string;
  compact?: boolean;
  apiBaggageData?: ApiBaggageData;
}

export function BaggageInfo({ 
  airline, 
  fareType = "basic", 
  cabinClass = "ECONOMY",
  compact = false,
  apiBaggageData
}: BaggageInfoProps) {
  const { t } = useTranslation();
  // Use API data if available, otherwise fall back to static policies
  const staticAllowance = getBaggageAllowance(airline, fareType, cabinClass);
  
  // Merge API data with static data structure
  const allowance = apiBaggageData ? {
    cabin: {
      pieces: apiBaggageData.cabin.pieces,
      weightKg: apiBaggageData.cabin.weightKg,
      description: apiBaggageData.cabin.description || `Sac${apiBaggageData.cabin.pieces > 1 ? 's' : ''} cabine`
    },
    checked: apiBaggageData.checked,
    personalItem: apiBaggageData.personalItem,
    additionalBagPrice: apiBaggageData.additionalBagPrice || staticAllowance.additionalBagPrice
  } : staticAllowance;
  
  const { cabinText, checkedText, personalItemText } = formatBaggageInfo(allowance);
  const isLowCost = isLowCostCarrier(airline);
  
  // For API data, show a badge indicating real-time data
  const isRealTimeData = !!apiBaggageData;

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2 text-xs">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Briefcase className="h-3 w-3" />
                <span>{allowance.cabin.weightKg}kg</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Bagage cabine: {cabinText}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={cn(
                "flex items-center gap-1",
                allowance.checked.included ? "text-muted-foreground" : "text-amber-600"
              )}>
                <Luggage className="h-3 w-3" />
                <span>{allowance.checked.included ? `${allowance.checked.weightKg}kg` : "Non inclus"}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Bagage en soute: {checkedText}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

  return (
    <Card className="p-4 bg-gradient-to-br from-card to-muted/10">
      <div className="flex items-center gap-2 mb-3">
        <Luggage className="h-4 w-4 text-primary" />
        <h4 className="font-semibold text-sm">Bagages inclus</h4>
        {isRealTimeData && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-green-600 border-green-300">
            {t('baggageInfo.realDataBadge')}
          </Badge>
        )}
        {isLowCost && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-amber-600 border-amber-300">
            Low-cost
          </Badge>
        )}
      </div>

      <div className="space-y-2.5">
        {/* Personal item */}
        {personalItemText && (
          <div className="flex items-start gap-2">
            <div className="w-7 h-7 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
              <ShoppingBag className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-foreground">Accessoire personnel</p>
              <p className="text-[10px] text-muted-foreground truncate">{personalItemText}</p>
            </div>
            <Badge className="ml-auto shrink-0 text-[9px] px-1.5 py-0 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              Inclus
            </Badge>
          </div>
        )}

        {/* Cabin baggage */}
        <div className="flex items-start gap-2">
          <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
            <Briefcase className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-foreground">Bagage cabine</p>
            <p className="text-[10px] text-muted-foreground">{cabinText}</p>
          </div>
          <Badge className="ml-auto shrink-0 text-[9px] px-1.5 py-0 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            Inclus
          </Badge>
        </div>

        {/* Checked baggage */}
        <div className="flex items-start gap-2">
          <div className={cn(
            "w-7 h-7 rounded-full flex items-center justify-center shrink-0",
            allowance.checked.included 
              ? "bg-purple-100 dark:bg-purple-900/30" 
              : "bg-amber-100 dark:bg-amber-900/30"
          )}>
            <Luggage className={cn(
              "h-3.5 w-3.5",
              allowance.checked.included 
                ? "text-purple-600 dark:text-purple-400" 
                : "text-amber-600 dark:text-amber-400"
            )} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-foreground">Bagage en soute</p>
            <p className="text-[10px] text-muted-foreground">{checkedText}</p>
          </div>
          {allowance.checked.included ? (
            <Badge className="ml-auto shrink-0 text-[9px] px-1.5 py-0 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
              Inclus
            </Badge>
          ) : (
            <Badge variant="outline" className="ml-auto shrink-0 text-[9px] px-1.5 py-0 text-amber-600 border-amber-300">
              Payant
            </Badge>
          )}
        </div>

        {/* Low-cost warning */}
        {isLowCost && !allowance.checked.included && (
          <div className="flex items-start gap-2 p-2 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[10px] text-amber-700 dark:text-amber-400">
              {t('baggageInfo.lowCostWarning')}
            </p>
          </div>
        )}

        {/* Additional bag option */}
        {allowance.additionalBagPrice && (
          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <div className="flex items-center gap-1.5">
              <Plus className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">Valise supplémentaire</span>
            </div>
            <span className="text-[10px] font-medium text-primary">
              +<Price amount={allowance.additionalBagPrice} fromCurrency="EUR" showLoader={false} />
            </span>
          </div>
        )}
      </div>

      {/* Info tooltip */}
      <div className="mt-3 pt-2 border-t border-border/50">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground cursor-help">
                <Info className="h-3 w-3" />
                <span>Franchise bagages {airline}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[200px]">
              <p className="text-xs">
                Franchise basée sur le tarif {fareType === "benefits" ? "Benefits" : "Basic"} 
                en classe {cabinClass === "ECONOMY" ? "Économique" : cabinClass}. 
                {t('baggageInfo.confirmationNote')}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </Card>
  );
}
