import type { Config } from "@react-router/dev/config";

export default {
  ssr: true,
  appDirectory: "src",
  buildDirectory: "dist",
  serverBuildFile: "module.js",
} satisfies Config;
