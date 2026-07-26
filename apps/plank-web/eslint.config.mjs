import { fileURLToPath } from "node:url";

import baseReact from "@plank/eslint/baseReact";
import { defineConfig } from "eslint/config";

export default defineConfig(
  {
    ignores: ["**/.react-router/**"],
  },
  ...baseReact({
    cssConfigPath: fileURLToPath(import.meta.resolve("@plank/ui/styles.css")),
  }),
);
