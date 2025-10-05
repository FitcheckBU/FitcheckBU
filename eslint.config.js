// eslint.config.ts — ESLint 9 flat-config
import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import jsxA11y from "eslint-plugin-jsx-a11y";
import prettier from "eslint-config-prettier";

export default [
  // 1️⃣  Base configs (no “extends” keyword anywhere)
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,

  // 2️⃣  Your project config
  {
    ignores: [
      "dist",
      "node_modules",
      "cypress.config.ts",
      "eslint.config.*",
      "vite.config.*",
    ],

    files: ["**/*.{ts,tsx}"],

    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: { ecmaFeatures: { jsx: true }, sourceType: "module" },
    },

    plugins: {
      react,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      "jsx-a11y": jsxA11y,
    },

    settings: { react: { version: "detect" } },

    rules: {
      ...reactHooks.configs.recommended.rules,

      // React best-practices
      "react/prop-types": "off",
      "react/react-in-jsx-scope": "off",
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],

      // Environment-specific restrictions
      "no-console": process.env.NODE_ENV === "production" ? "warn" : "off",
      "no-debugger": process.env.NODE_ENV === "production" ? "warn" : "off",
    },
  },
];
