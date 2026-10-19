import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LucideIcon, Search, ArrowRight, Lock, CreditCard, Send } from "lucide-react";
import { Loader2 } from "lucide-react";

interface UnifiedSubmitButtonProps {
  children: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  variant?: "search" | "booking" | "payment" | "auth" | "default";
  className?: string;
  icon?: LucideIcon;
  fullWidth?: boolean;
  onClick?: () => void;
}

/**
 * UnifiedSubmitButton - Bouton de soumission premium
 * Design type OTA (Opodo/Booking)
 */
export const UnifiedSubmitButton = ({
  children,
  loading = false,
  disabled = false,
  variant = "default",
  className,
  icon,
  fullWidth = true,
  onClick,
}: UnifiedSubmitButtonProps) => {
  const getDefaultIcon = (): LucideIcon => {
    switch (variant) {
      case "search": return Search;
      case "booking": return ArrowRight;
      case "payment": return CreditCard;
      case "auth": return Lock;
      default: return Send;
    }
  };

  const { t } = useTranslation();
  const Icon = icon || getDefaultIcon();

  // Le bouton de soumission est l'action principale de l'écran : couleur
  // `action` (jade). Le paiement garde `success` pour signaler l'étape finale.
  // Le texte suit *-foreground, lisible dans les deux thèmes.
  const variantStyles = {
    search: "",
    booking: "",
    payment: "bg-success hover:bg-success/90 text-success-foreground",
    auth: "",
    default: "",
  };

  return (
    <div className={cn(!fullWidth && "inline-block")}>
      <Button
        size="lg"
        type={onClick ? "button" : "submit"}
        disabled={disabled || loading}
        onClick={onClick}
        className={cn(
          "font-semibold",
          fullWidth && "w-full",
          variantStyles[variant],
          className
        )}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
            {t("common.loading")}
          </>
        ) : (
          <>
            <Icon className="mr-2 h-5 w-5" aria-hidden="true" />
            {children}
          </>
        )}
      </Button>
    </div>
  );
};
