import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  foregroundColor: string;
  mutedColor: string;
  borderRadius: string;
  fontHeading: string;
  fontBody: string;
  darkMode: {
    backgroundColor: string;
    foregroundColor: string;
    mutedColor: string;
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
  };
}

// Ces valeurs reprennent exactement les tokens définis dans src/index.css.
// Elles ne doivent JAMAIS diverger de index.css : ce contexte applique ses
// couleurs par-dessus les variables CSS via des styles inline, donc le moindre
// écart écrase silencieusement le thème (clair ou sombre) défini en CSS et
// peut rendre du texte illisible (ex: primary sombre sur fond sombre).
const DEFAULT_THEME: ThemeConfig = {
  primaryColor: "225 45% 18%",
  secondaryColor: "158 100% 48%",
  accentColor: "190 100% 95%",
  backgroundColor: "0 0% 100%",
  foregroundColor: "210 24% 16%",
  mutedColor: "210 20% 96%",
  borderRadius: "0.75rem",
  fontHeading: "Poppins",
  fontBody: "Inter",
  darkMode: {
    backgroundColor: "222 47% 6%",
    foregroundColor: "210 40% 98%",
    mutedColor: "222 40% 16%",
    // Une couleur primaire/secondaire/accent dédiée est indispensable ici :
    // sans elle, le fallback `darkMode.xColor || xColor` réutilise la teinte
    // du mode clair (très sombre) en mode sombre, la rendant invisible.
    primaryColor: "158 100% 45%",
    secondaryColor: "222 47% 18%",
    accentColor: "222 47% 20%",
  },
};

const FONT_URLS: Record<string, string> = {
  "Inter": "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap",
  "Poppins": "https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap",
  "Roboto": "https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap",
  "Open Sans": "https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700&display=swap",
  "Lato": "https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&display=swap",
  "Montserrat": "https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap",
  "Playfair Display": "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&display=swap",
  "Merriweather": "https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;700&display=swap",
  "Source Sans Pro": "https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@300;400;600;700&display=swap",
  "Nunito": "https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;500;600;700&display=swap",
  "Raleway": "https://fonts.googleapis.com/css2?family=Raleway:wght@300;400;500;600;700&display=swap",
  "Work Sans": "https://fonts.googleapis.com/css2?family=Work+Sans:wght@300;400;500;600;700&display=swap",
};

type ColorMode = "light" | "dark" | "system";

interface ThemeContextType {
  theme: ThemeConfig;
  loading: boolean;
  colorMode: ColorMode;
  isDark: boolean;
  setColorMode: (mode: ColorMode) => void;
  toggleColorMode: () => void;
  updateTheme: (newTheme: Partial<ThemeConfig>) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const getSystemPreference = (): boolean => {
  if (typeof window !== "undefined") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  return false;
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<ThemeConfig>(DEFAULT_THEME);
  const [loading, setLoading] = useState(true);
  const [loadedFonts, setLoadedFonts] = useState<Set<string>>(new Set());
  const [colorMode, setColorModeState] = useState<ColorMode>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("colorMode") as ColorMode) || "system";
    }
    return "system";
  });
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("colorMode") as ColorMode;
      if (stored === "dark") return true;
      if (stored === "light") return false;
      return getSystemPreference();
    }
    return false;
  });

  // Load font dynamically
  const loadFont = (fontName: string) => {
    if (loadedFonts.has(fontName) || !FONT_URLS[fontName]) return;
    
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = FONT_URLS[fontName];
    document.head.appendChild(link);
    setLoadedFonts((prev) => new Set(prev).add(fontName));
  };

  // Apply theme to CSS variables
  const applyTheme = (themeConfig: ThemeConfig, dark: boolean) => {
    const root = document.documentElement;
    
    // Load fonts
    loadFont(themeConfig.fontHeading);
    loadFont(themeConfig.fontBody);

    // Apply common CSS variables
    root.style.setProperty("--radius", themeConfig.borderRadius);
    root.style.setProperty("--font-heading", themeConfig.fontHeading);
    root.style.setProperty("--font-body", themeConfig.fontBody);

    // Apply color mode
    if (dark) {
      root.classList.add("dark");
      root.style.setProperty("--background", themeConfig.darkMode.backgroundColor);
      root.style.setProperty("--foreground", themeConfig.darkMode.foregroundColor);
      root.style.setProperty("--muted", themeConfig.darkMode.mutedColor);
      root.style.setProperty("--primary", themeConfig.darkMode.primaryColor || themeConfig.primaryColor);
      root.style.setProperty("--secondary", themeConfig.darkMode.secondaryColor || themeConfig.secondaryColor);
      root.style.setProperty("--accent", themeConfig.darkMode.accentColor || themeConfig.accentColor);
      // Card and popover backgrounds for dark mode
      root.style.setProperty("--card", themeConfig.darkMode.mutedColor);
      root.style.setProperty("--popover", themeConfig.darkMode.mutedColor);
    } else {
      root.classList.remove("dark");
      root.style.setProperty("--background", themeConfig.backgroundColor);
      root.style.setProperty("--foreground", themeConfig.foregroundColor);
      root.style.setProperty("--muted", themeConfig.mutedColor);
      root.style.setProperty("--primary", themeConfig.primaryColor);
      root.style.setProperty("--secondary", themeConfig.secondaryColor);
      root.style.setProperty("--accent", themeConfig.accentColor);
      // Card and popover backgrounds for light mode
      root.style.setProperty("--card", themeConfig.backgroundColor);
      root.style.setProperty("--popover", themeConfig.backgroundColor);
    }

    // Apply font families to body
    document.body.style.fontFamily = `"${themeConfig.fontBody}", sans-serif`;
  };

  // Set color mode
  const setColorMode = (mode: ColorMode) => {
    setColorModeState(mode);
    localStorage.setItem("colorMode", mode);
    
    let dark: boolean;
    if (mode === "system") {
      dark = getSystemPreference();
    } else {
      dark = mode === "dark";
    }
    
    setIsDark(dark);
    applyTheme(theme, dark);
  };

  // Toggle between light and dark
  const toggleColorMode = () => {
    const newMode = isDark ? "light" : "dark";
    setColorMode(newMode);
  };

  // Listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    
    const handleChange = (e: MediaQueryListEvent) => {
      if (colorMode === "system") {
        setIsDark(e.matches);
        applyTheme(theme, e.matches);
      }
    };
    
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [colorMode, theme]);

  // Fetch theme from database
  useEffect(() => {
    const fetchTheme = async () => {
      try {
        const { data, error } = await supabase
          .from("site_config")
          .select("config_value")
          .eq("config_key", "theme")
          .maybeSingle();

        if (error) throw error;

        if (data?.config_value && typeof data.config_value === "object") {
          const configValue = data.config_value as Partial<ThemeConfig>;
          const fetchedTheme: ThemeConfig = { 
            ...DEFAULT_THEME, 
            ...configValue,
            darkMode: { ...DEFAULT_THEME.darkMode, ...(configValue.darkMode || {}) }
          };
          setTheme(fetchedTheme);
          applyTheme(fetchedTheme, isDark);
        } else {
          applyTheme(DEFAULT_THEME, isDark);
        }
      } catch (error) {
        console.error("Error fetching theme:", error);
        applyTheme(DEFAULT_THEME, isDark);
      } finally {
        setLoading(false);
      }
    };

    fetchTheme();
  }, []);

  // Apply theme when isDark changes
  useEffect(() => {
    if (!loading) {
      applyTheme(theme, isDark);
    }
  }, [isDark, loading]);

  const updateTheme = async (newTheme: Partial<ThemeConfig>) => {
    const updatedTheme = { 
      ...theme, 
      ...newTheme,
      darkMode: { ...theme.darkMode, ...(newTheme.darkMode || {}) }
    };
    setTheme(updatedTheme);
    applyTheme(updatedTheme, isDark);

    try {
      await supabase
        .from("site_config")
        .update({ config_value: updatedTheme })
        .eq("config_key", "theme");
    } catch (error) {
      console.error("Error saving theme:", error);
    }
  };

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      loading, 
      colorMode, 
      isDark, 
      setColorMode, 
      toggleColorMode, 
      updateTheme 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};

export const AVAILABLE_FONTS = Object.keys(FONT_URLS);
