import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // Boutons pilules (border-radius:100px) - conforme à la proposition Golden
  // Hour : c'est la forme, pas seulement la couleur, qui distingue le
  // langage visuel des boutons Opodo/eDreams (rectangles arrondis génériques).
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold ring-offset-background transition-colors duration-fast ease-standard active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      // Un seul bouton `default` (action, jade) par écran ; le reste en
      // `secondary`, `outline` ou `ghost`. L'or est réservé aux prix et badges.
      variant: {
        default: "bg-action text-action-foreground hover:bg-action-hover shadow-sm",
        secondary: "bg-primary/10 text-primary hover:bg-primary/15",
        outline: "border border-input bg-card text-foreground hover:bg-muted",
        ghost: "text-foreground hover:bg-muted",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        link: "text-primary underline underline-offset-4 decoration-primary/40 hover:decoration-primary rounded-none px-1",
      },
      // 44 px par défaut : taille tactile minimale recommandée (WCAG 2.5.5).
      // `sm` (36 px) est réservé aux tableaux et barres d'outils sur desktop.
      size: {
        default: "h-11 px-5",
        sm: "h-9 px-4",
        lg: "h-12 px-7 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
