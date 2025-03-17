import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginVue from "eslint-plugin-vue";
import simpleImportSort from "eslint-plugin-simple-import-sort";


/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    plugins: {
      "simple-import-sort": simpleImportSort
    },
    ignores: ["tailwind.config.js","eslint.config.js", "node_modules", "dist", "dev-dist", "build", "coverage", "docs", "public", "static", "src/assets"],
    files: ["**/*.{ts,js,mjs,cjs,ts,vue}"]
  },
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node
      }
    }
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs["flat/strongly-recommended"],
  {
    files: ["**/*.vue"],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser
      }
    },
    rules: {
      "indent": ["error", 4],
      "prefer-const": "error",
      "vue/multi-word-component-names": "off",
      "simple-import-sort/imports": ["error", {
        "groups": [["^\\u0000", "^@?\\w", "^[^.]", "^\\."]],
      }],
      "simple-import-sort/exports": "error",
      quotes: ["error", "double"]
    },
    },
];