import { fileURLToPath } from "node:url";

/**
 * Resolve `packages/plank-server/src/modules/` (or `dist/modules/` after build).
 */
export function modulesRootDir(): string {
  return fileURLToPath(new URL("../../modules/", import.meta.url));
}
