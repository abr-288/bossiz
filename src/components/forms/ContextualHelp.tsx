import { HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface ContextualHelpProps {
  content: string;
  className?: string;
}

/**
 * ContextualHelp - Aide contextuelle avec tooltip
 * Affiche une icône d'aide avec un message au survol
 */
export const ContextualHelp = ({ content, className }: ContextualHelpProps) => {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger type="button" className={cn("inline-flex", className)}>
          <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors cursor-help" />
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="text-sm">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
