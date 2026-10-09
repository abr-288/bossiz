import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "dev-dist", "android", "ios"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },
  {
    // Design system : les couleurs passent par les tokens (bg-primary, text-muted-foreground,
    // bg-success…). Les palettes Tailwind brutes ignorent le mode sombre et les contrastes
    // vérifiés. En avertissement tant que l'existant n'est pas migré.
    files: ["src/**/*.tsx"],
    ignores: ["src/pages/bossiz/**", "src/components/bossiz/**", "src/components/ui/**"],
    rules: {
      "no-restricted-syntax": [
        "warn",
        {
          selector:
            "Literal[value=/(^|[\\s:])(bg|text|border|from|via|to|ring)-(gray|slate|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\\d{2,3}/]",
          message: "Couleur Tailwind brute : utilisez un token (primary, secondary, action, muted, success, warning, info, destructive…).",
        },
        {
          selector:
            "TemplateElement[value.raw=/(^|[\\s:])(bg|text|border|from|via|to|ring)-(gray|slate|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\\d{2,3}/]",
          message: "Couleur Tailwind brute : utilisez un token (primary, secondary, action, muted, success, warning, info, destructive…).",
        },
      ],
    },
  },
);
