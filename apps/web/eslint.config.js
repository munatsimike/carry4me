// eslint.config.js (Flat config for ESLint v9)
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

export default tseslint.config(
  // Global ignores
  { ignores: ["dist", "build", "node_modules"] },

  // Base JS recommended rules
  js.configs.recommended,

  // TypeScript recommended rules (flat-config aware)
  ...tseslint.configs.recommended,

  // React Hooks + React Refresh
  {
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
    },
  }
);