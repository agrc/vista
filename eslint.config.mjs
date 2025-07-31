// eslint.config.js
import { browser } from "@ugrc/eslint-config";

export default [
  ...browser,
  {
    languageOptions: { globals: { __APP_VERSION__: "readonly" } },
    rules: { "react/prop-types": "off" },
  },
];
