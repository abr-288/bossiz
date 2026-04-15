import { CreditCard, Smartphone, Building2, Check, Wallet } from "lucide-react";
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
    id: "cinetpay",
    name: "CinetPay",
    description: "Orange Money, MTN, Moov, Carte bancaire",
    icon: <Wallet className="h-6 w-6" />,
    color: "bg-orange-500/10 text-orange-500 border-orange-500/30",
  },
  {
    id: "orange_money",
    name: "Orange Money",
    description: "Paiement mobile Orange",
    icon: <Smartphone className="h-6 w-6" />,
    color: "bg-orange-500/10 text-orange-500 border-orange-500/30",
  },
  {
    id: "mtn_money",
    name: "MTN Mobile Money",
    description: "Paiement mobile MTN",
    icon: <Smartphone className="h-6 w-6" />,
    color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
  },
  {
    id: "moov_money",
    name: "Moov Money",
    description: "Paiement mobile Moov",
    icon: <Smartphone className="h-6 w-6" />,
    color: "bg-green-500/10 text-green-500 border-green-500/30",
  },
  {
    id: "card",
    name: "Carte bancaire",
    description: "Visa, Mastercard via CinetPay",
    icon: <CreditCard className="h-6 w-6" />,
    color: "bg-blue-500/10 text-blue-500 border-blue-500/30",
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
              "relative flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200",
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
