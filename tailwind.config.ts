import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  // Les variantes hover: ne s'appliquent qu'aux appareils avec survol réel
  // (souris, trackpad) : sur écran tactile, hover:scale-105 et consorts
  // restaient « collés » après un appui.
  future: {
    hoverOnlyWhenSupported: true,
  },
  theme: {
    // Un seul conteneur : 1200 px et les mêmes marges que .site-container
    // (avant : 1400 px et 2rem, les bords des sections ne s'alignaient pas).
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        md: "1.5rem",
        lg: "2rem",
      },
      screens: {
        xl: "1200px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          light: "hsl(var(--primary-light))",
          dark: "hsl(var(--primary-dark))",
        },
        brand: {
          DEFAULT: "hsl(var(--brand))",
          foreground: "hsl(var(--brand-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        gold: {
          DEFAULT: "hsl(var(--gold))",
          foreground: "hsl(var(--gold-foreground))",
          light: "hsl(var(--gold-light))",
          dark: "hsl(var(--gold-dark))",
          text: "hsl(var(--gold-text))",
        },
        action: {
          DEFAULT: "hsl(var(--action))",
          hover: "hsl(var(--action-hover))",
          foreground: "hsl(var(--action-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        /* Bossiz Conciergerie — palette réelle extraite de bossiz.com (valeurs HSL dans src/index.css) */
        bossiz: {
          teal: {
            DEFAULT: "hsl(var(--bossiz-teal))",
            dark: "hsl(var(--bossiz-teal-dark))",
            light: "hsl(var(--bossiz-teal-light))",
          },
          navy: {
            DEFAULT: "hsl(var(--bossiz-navy))",
            dark: "hsl(var(--bossiz-navy-dark))",
          },
          gold: {
            DEFAULT: "hsl(var(--bossiz-gold))",
            light: "hsl(var(--bossiz-gold-light))",
            dark: "hsl(var(--bossiz-gold-dark))",
          },
          "ci-green": {
            DEFAULT: "hsl(var(--bossiz-ci-green))",
            light: "hsl(var(--bossiz-ci-green-light))",
            pale: "hsl(var(--bossiz-ci-green-pale))",
          },
          cream: {
            DEFAULT: "hsl(var(--bossiz-cream))",
            warm: "hsl(var(--bossiz-cream-warm))",
            mint: "hsl(var(--bossiz-cream-mint))",
            taupe: "hsl(var(--bossiz-cream-taupe))",
          },
        },
      },
      // Échelle de superposition nommée (avant : de z-10 à z-[10000]).
      // Les composants Radix (modales, menus) restent à z-50.
      zIndex: {
        raised: "10",
        sticky: "20",
        "bottom-nav": "40",
        header: "50",
        chat: "60",
        banner: "70",
        popover: "80",
      },
      fontFamily: {
        // --font-body / --font-heading : posées par ThemeContext depuis la config admin.
        sans: ['var(--font-body)', 'Archivo', 'system-ui', 'sans-serif'],
        display: ['var(--font-heading)', '"Bricolage Grotesque"', 'Archivo', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'sm': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
        'primary': 'var(--shadow-primary)',
      },
      borderRadius: {
        // Échelle : badge 8 / champ 12 / carte 16 / modale 24 / bouton plein
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 8px)",
        badge: "calc(var(--radius) - 8px)",
        field: "calc(var(--radius) - 4px)",
        card: "var(--radius)",
        modal: "calc(var(--radius) + 8px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "fadeIn": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" }
        },
        "slideUp": {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" }
        },
        "scaleIn": {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" }
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.15s ease-out",
        "accordion-up": "accordion-up 0.15s ease-out",
        "fade-in": "fadeIn 0.2s ease-out",
        "slide-up": "slideUp 0.25s ease-out",
        "scale-in": "scaleIn 0.2s ease-out"
      },
      transitionProperty: {
        'height': 'height',
        'spacing': 'margin, padding',
        'colors': 'background-color, border-color, color',
        'opacity': 'opacity',
        'shadow': 'box-shadow',
        'transform': 'transform'
      },
      transitionTimingFunction: {
        standard: "var(--ease-standard)",
      },
      transitionDuration: {
        fast: "var(--dur-fast)",
        base: "var(--dur-base)",
        slow: "var(--dur-slow)",
        '75': '75ms',
        '100': '100ms',
        '150': '150ms',
        '200': '200ms',
        '300': '300ms'
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
