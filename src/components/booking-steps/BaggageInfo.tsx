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
  
  const { cabinText, checkedText, personalItemText } = formatBaggageInfo(allowance, t);
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
              <p>{t("ux.baggage.cabinTooltip", { text: cabinText })}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={cn(
                "flex items-center gap-1",
                allowance.checked.included ? "text-muted-foreground" : "text-warning-foreground"
              )}>
                <Luggage className="h-3 w-3" />
                <span>{allowance.checked.included ? `${allowance.checked.weightKg}kg` : t("ux.baggage.notIncluded")}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t("ux.baggage.checkedTooltip", { text: checkedText })}</p>
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
        <h4 className="font-semibold text-sm">{t("ux.baggage.includedBags")}</h4>
        {isRealTimeData && (
          <Badge variant="outline" className="text-xs px-1.5 py-0 text-success border-success/30">
            {t('baggageInfo.realDataBadge')}
          </Badge>
        )}
        {isLowCost && (
          <Badge variant="outline" className="text-xs px-1.5 py-0 text-warning-foreground border-warning-foreground/20">
            Low-cost
          </Badge>
        )}
      </div>

      <div className="space-y-2.5">
        {/* Personal item */}
        {personalItemText && (
          <div className="flex items-start gap-2">
            <div className="w-7 h-7 rounded-full bg-success/10 flex items-center justify-center shrink-0">
              <ShoppingBag className="h-3.5 w-3.5 text-success" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-foreground">{t("ux.baggage.personal")}</p>
              <p className="text-xs text-muted-foreground truncate">{personalItemText}</p>
            </div>
            <Badge className="ml-auto shrink-0 text-xs px-1.5 py-0 bg-success/10 text-success">
              {t("ux.baggage.included")}
            </Badge>
          </div>
        )}

        {/* Cabin baggage */}
        <div className="flex items-start gap-2">
          <div className="w-7 h-7 rounded-full bg-info/10 flex items-center justify-center shrink-0">
            <Briefcase className="h-3.5 w-3.5 text-info" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-foreground">{t("ux.baggage.cabinTitle")}</p>
            <p className="text-xs text-muted-foreground">{cabinText}</p>
          </div>
          <Badge className="ml-auto shrink-0 text-xs px-1.5 py-0 bg-info/10 text-info">
            {t("ux.baggage.included")}
          </Badge>
        </div>

        {/* Checked baggage */}
        <div className="flex items-start gap-2">
          <div className={cn(
            "w-7 h-7 rounded-full flex items-center justify-center shrink-0",
            allowance.checked.included 
              ? "bg-primary/10" 
              : "bg-warning"
          )}>
            <Luggage className={cn(
              "h-3.5 w-3.5",
              allowance.checked.included 
                ? "text-primary" 
                : "text-warning-foreground"
            )} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-foreground">{t("ux.baggage.checkedTitle")}</p>
            <p className="text-xs text-muted-foreground">{checkedText}</p>
          </div>
          {allowance.checked.included ? (
            <Badge className="ml-auto shrink-0 text-xs px-1.5 py-0 bg-primary/10 text-primary">
              {t("ux.baggage.included")}
            </Badge>
          ) : (
            <Badge variant="outline" className="ml-auto shrink-0 text-xs px-1.5 py-0 text-warning-foreground border-warning-foreground/20">
              {t("ux.baggage.paid")}
            </Badge>
          )}
        </div>

        {/* Low-cost warning */}
        {isLowCost && !allowance.checked.included && (
          <div className="flex items-start gap-2 p-2 rounded-md bg-warning border border-warning-foreground/20">
            <AlertTriangle className="h-3.5 w-3.5 text-warning-foreground shrink-0 mt-0.5" />
            <p className="text-xs text-warning-foreground">
              {t('baggageInfo.lowCostWarning')}
            </p>
          </div>
        )}

        {/* Additional bag option */}
        {allowance.additionalBagPrice && (
          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <div className="flex items-center gap-1.5">
              <Plus className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{t("ux.baggage.extraSuitcase")}</span>
            </div>
            <span className="text-xs font-medium text-primary">
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
              <div className="flex items-center gap-1 text-xs text-muted-foreground cursor-help">
                <Info className="h-3 w-3" />
                <span>{t("ux.baggage.allowance", { airline })}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[200px]">
              <p className="text-xs">
                {t("ux.baggage.basedOn", { fare: fareType === "benefits" ? "Benefits" : "Basic", cabin: cabinClass === "ECONOMY" ? t("ux.baggage.economy") : cabinClass })}{" "}
                {t('baggageInfo.confirmationNote')}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </Card>
  );
}
