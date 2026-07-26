import baseReact from "@plank/eslint/baseReact";
import { defineConfig } from "eslint/config";

export default defineConfig(
  {
    ignores: ["**/.react-router/**"],
  },
  ...baseReact,
);
