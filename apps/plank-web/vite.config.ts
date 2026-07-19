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
    // Keep nuqs in the SSR graph so it shares the same react-router instance
    // as the app. If externalized, Node resolves react-router's production
    // build while Vite SSR uses development — NavigationContext mismatches
    // and useNavigate throws "may be used only in the context of a <Router>".
    noExternal: [
      "react-router",
      "@react-router/express",
      "@react-router/node",
      "nuqs",
    ],
  },
  chunkSizeWarningLimit: 1024 * 4,
  reportCompressedSize: true,
  resolve: {
    tsconfigPaths: true,
    dedupe: ["react", "react-dom", "react-router"],
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router",
      "nuqs",
      "nuqs/adapters/react-router/v8",
    ],
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
