import { Toaster as Sonner, toast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";
import { useIsMobile } from "@/hooks/use-mobile";

type ToasterProps = React.ComponentProps<typeof Sonner>;

// Seul système de notifications de l'application (voir hooks/use-toast.ts).
// Le thème suit le sélecteur clair/sombre du site (ThemeContext), pas
// seulement la préférence du système. En haut sur mobile, pour ne pas
// recouvrir le chat ni les boutons collants du tunnel de réservation.
const Toaster = ({ ...props }: ToasterProps) => {
  const { isDark } = useTheme();
  const isMobile = useIsMobile();

  return (
    <Sonner
      theme={isDark ? "dark" : "light"}
      position={isMobile ? "top-center" : "bottom-right"}
      closeButton
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-card group-[.toaster]:text-card-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:rounded-2xl",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-action group-[.toast]:text-action-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          error: "group-[.toaster]:border-destructive/40",
          success: "group-[.toaster]:border-success/40",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
