import { Moon, Sun, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";

interface DarkModeToggleProps {
  variant?: "default" | "compact";
  className?: string;
}

export function DarkModeToggle({ variant = "default", className = "" }: DarkModeToggleProps) {
  const { colorMode, isDark, setColorMode, toggleColorMode } = useTheme();
  const { t } = useTranslation();

  // Compact version - just a toggle button
  if (variant === "compact") {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleColorMode}
        className={`h-8 w-8 ${className}`}
        title={isDark ? t("common.lightMode") : t("common.darkMode")}
      >
        {isDark ? (
          <Sun className="h-4 w-4 text-gold" />
        ) : (
          <Moon className="h-4 w-4" />
        )}
        <span className="sr-only">
          {isDark ? t("common.lightMode") : t("common.darkMode")}
        </span>
      </Button>
    );
  }

  // Full dropdown version
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={`h-8 w-8 ${className}`}>
          {isDark ? (
            <Moon className="h-4 w-4" />
          ) : (
            <Sun className="h-4 w-4" />
          )}
          <span className="sr-only">{t("common.toggleTheme")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => setColorMode("light")}
          className={colorMode === "light" ? "bg-accent" : ""}
        >
          <Sun className="mr-2 h-4 w-4" />
          {t("common.lightMode")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setColorMode("dark")}
          className={colorMode === "dark" ? "bg-accent" : ""}
        >
          <Moon className="mr-2 h-4 w-4" />
          {t("common.darkMode")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setColorMode("system")}
          className={colorMode === "system" ? "bg-accent" : ""}
        >
          <Monitor className="mr-2 h-4 w-4" />
          {t("common.systemMode")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default DarkModeToggle;
