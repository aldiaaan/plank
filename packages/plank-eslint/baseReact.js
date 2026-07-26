import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "eslint/config";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import eslintPluginTailwindcss from "eslint-plugin-tailwindcss";
import globals from "globals";

import base from "./base.js";

const cssConfigPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../plank-ui/src/styles.css",
);

const baseReactConfig = defineConfig(
  ...base,
  {
    files: ["**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx}"],
    ...react.configs.flat.recommended,
    languageOptions: {
      ...react.configs.flat.recommended.languageOptions,
      globals: {
        ...globals.browser,
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      ...react.configs.flat.recommended.rules,
      // TypeScript covers prop types
      "react/prop-types": "off",
    },
  },
  {
    files: ["**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx}"],
    ...react.configs.flat["jsx-runtime"],
  },
  {
    files: ["**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx}"],
    ...reactHooks.configs.flat.recommended,
  },
  {
    files: ["**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx}"],
    extends: [eslintPluginTailwindcss.configs.recommended],
    settings: {
      tailwindcss: {
        cssConfigPath,
      },
    },
  },
);

export default baseReactConfig;
