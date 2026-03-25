const js = require("@eslint/js");
const tsParser = require("@typescript-eslint/parser");
const tsPlugin = require("@typescript-eslint/eslint-plugin");
const prettierConfig = require("eslint-config-prettier/flat");
const globals = require("globals");

module.exports = [
  {
    ignores: ["**/node_modules/**", "**/dist/**", "**/coverage/**", "**/.turbo/**"]
  },
  js.configs.recommended,
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.es2022
      },
      parserOptions: {
        project: false
      }
    },
    plugins: {
      "@typescript-eslint": tsPlugin
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      "sort-imports": "off",
      "no-duplicate-imports": "error",
      "@typescript-eslint/no-explicit-any": "error"
    }
  },
  prettierConfig
];
