import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

const sources = [
  "artifacts/agentnex/src/**/*.{ts,tsx}",
  "artifacts/api-server/src/**/*.ts",
  "lib/db/src/**/*.ts",
];

export default tseslint.config(
  { ignores: ["**/dist/**", "**/node_modules/**", "**/generated/**"] },
  { ...js.configs.recommended, files: sources },
  ...tseslint.configs.recommended.map((config) => ({
    ...config,
    files: sources,
  })),
  {
    files: sources,
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" }],
    },
  },
  {
    files: ["artifacts/agentnex/src/**/*.{ts,tsx}"],
    plugins: { "react-hooks": reactHooks },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
);
