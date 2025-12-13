import js from "@eslint/js"
import tseslint from "typescript-eslint"

export default [
  {
    ignores: ["node_modules/**", ".next/**", "out/**", "dist/**", "build/**"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    rules: {
      "prefer-const": "error",
      "no-var": "error",
      "no-console": "warn",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
]
