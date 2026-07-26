import { defineConfig } from "eslint/config";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import eslintPluginTailwindcss from "eslint-plugin-tailwindcss";
import globals from "globals";

import base from "./base.js";

/**
 * @param {{ cssConfigPath: string }} options Absolute path to the app's Tailwind v4 CSS entry
 *   (e.g. `fileURLToPath(import.meta.resolve("@plank/ui/styles.css"))`).
 */
export default function baseReact({ cssConfigPath }) {
  if (!cssConfigPath) {
    throw new Error(
      '@plank/eslint/baseReact: cssConfigPath is required (e.g. fileURLToPath(import.meta.resolve("@plank/ui/styles.css")))',
    );
  }

  return defineConfig(
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
}
