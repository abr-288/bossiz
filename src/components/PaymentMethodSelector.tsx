import { Check, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const paymentMethods: PaymentMethod[] = [
  {
    id: "jeko",
    name: "Jèko",
    description: "Mobile Money ou carte bancaire sur la page sécurisée Jèko",
    icon: <Wallet className="h-6 w-6" />,
    color: "bg-warning text-warning-foreground border-warning-foreground/20",
  },
];

interface PaymentMethodSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function PaymentMethodSelector({ value, onChange }: PaymentMethodSelectorProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {paymentMethods.map((method) => {
        const isSelected = value === method.id;
        return (
          <button
            key={method.id}
            type="button"
            onClick={() => onChange(method.id)}
            className={cn(
              "relative flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-base ease-standard",
              "hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
              isSelected
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-border bg-card hover:border-muted-foreground/30"
            )}
          >
            {/* Icon container */}
            <div
              className={cn(
                "flex items-center justify-center w-12 h-12 rounded-lg border",
                method.color
              )}
            >
              {method.icon}
            </div>

            {/* Text content */}
            <div className="flex-1 text-left">
              <p className={cn(
                "font-semibold text-sm",
                isSelected ? "text-primary" : "text-foreground"
              )}>
                {method.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {method.description}
              </p>
            </div>

            {/* Selected indicator */}
            {isSelected && (
              <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                <Check className="h-3 w-3 text-primary-foreground" />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
