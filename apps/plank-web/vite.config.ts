import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import devtoolsJson from "vite-plugin-devtools-json";

const devPlugins = [devtoolsJson()];

export default defineConfig(({ isSsrBuild }) => ({
  plugins: [
    tailwindcss(),
    reactRouter(),
    ...(process.env.NODE_ENV === "development" ? devPlugins : []),
  ],
  emptyOutDir: true,
  ssr: {
    external: ["react-router", "@react-router/express", "@react-router/node"],
  },
  chunkSizeWarningLimit: 1024 * 4,
  reportCompressedSize: true,
  resolve: {
    tsconfigPaths: true,
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react-router"],
  },
  build: {
    manifest: true,
    rollupOptions: isSsrBuild
      ? {
          input: {
            entry: "./src/entry.node.ts",
            server:
              process.env.NODE_ENV === "production"
                ? "./bin/start.ts"
                : "./bin/dev.ts",
          },
          output: {
            assetFileNames: "assets/[hash:16].[ext]",
            chunkFileNames: "chunks/[hash:16].js",
            entryFileNames: "[hash:16].js",
          },
        }
      : {
          output: {
            assetFileNames: "assets/[hash:16].[ext]",
            chunkFileNames: "chunks/[hash:16].js",
            entryFileNames: "[hash:16].js",
            manualChunks: undefined,
          },
        },
  },
}));
