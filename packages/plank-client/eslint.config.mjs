import base from "@plank/eslint/base";
import { defineConfig } from "eslint/config";

export default defineConfig(
  {
    ignores: ["**/src/__generated__/**"],
  },
  ...base,
);
