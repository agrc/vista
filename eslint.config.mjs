import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import prettier from "eslint-plugin-prettier";
import reactPlugin from "eslint-plugin-react";
import globals from "globals";

// eslint.config.js
export default [
  js.configs.recommended,
  reactPlugin.configs.flat.recommended,
  reactPlugin.configs.flat["jsx-runtime"],
  {
    ...reactPlugin.configs.flat.recommended,
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      ...reactPlugin.configs.flat.recommended.languageOptions,
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2022,
        ...globals.jest,
      },
    },
    settings: { react: { version: "detect" } },
    plugins: {
      react: reactPlugin,
      prettier,
    },
    files: ["**/*.{js,mjs,cjs,jsx,ts,tsx}"],
    rules: {
      ...eslintConfigPrettier.rules,
      ...reactPlugin.configs["jsx-runtime"].rules,
      "react/prop-types": "off",
    },
  },
  {
    ignores: [
      "build/*",
      ".firebase",
      ".github/*",
      ".vscode/*",
      "data/*",
      "dist/*",
      "forklift/*",
      "maps/*",
      "mockups/*",
      "node_modules/*",
      "package-lock.json",
      "public/*",
      "scripts/*",
    ],
  },
];
