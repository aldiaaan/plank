import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const QUEUE_FILE = /\.queue\.(ts|js|mjs|cjs)$/;
const PROCESSOR_FILE = /\.processor\.(ts|js|mjs|cjs)$/;

function isLoadableSource(file: string): boolean {
  if (file.endsWith(".d.ts")) return false;
  if (/\.(test|spec)\./.test(file)) return false;
  return true;
}

async function walkFiles(dir: string, pattern: RegExp): Promise<string[]> {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }

  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkFiles(fullPath, pattern)));
      continue;
    }
    if (!isLoadableSource(entry.name)) continue;
    if (pattern.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

export async function discoverQueueFiles(modulesDir: string): Promise<string[]> {
  const moduleNames = await listModuleDirs(modulesDir);
  const files: string[] = [];
  for (const name of moduleNames) {
    const queuesDir = join(modulesDir, name, "worker", "queues");
    files.push(...(await walkFiles(queuesDir, QUEUE_FILE)));
  }
  return files;
}

export async function discoverProcessorFiles(
  modulesDir: string,
): Promise<string[]> {
  const moduleNames = await listModuleDirs(modulesDir);
  const files: string[] = [];
  for (const name of moduleNames) {
    const processorsDir = join(modulesDir, name, "worker", "processors");
    files.push(...(await walkFiles(processorsDir, PROCESSOR_FILE)));
  }
  return files;
}

async function listModuleDirs(modulesDir: string): Promise<string[]> {
  let entries;
  try {
    entries = await readdir(modulesDir, { withFileTypes: true });
  } catch {
    return [];
  }
  return entries.filter((e) => e.isDirectory()).map((e) => e.name);
}

/**
 * Dynamic `import()` via file URL — works under tsx and compiled ESM (no eval).
 */
export async function importDefaultExport<T>(
  filePath: string,
): Promise<T | null> {
  const mod = (await import(pathToFileURL(filePath).href)) as {
    default?: T | { default?: T };
  };

  const exported = mod.default;
  if (exported == null) {
    return null;
  }

  // Some toolchains nest `default` once more.
  if (
    typeof exported === "object" &&
    "default" in exported &&
    (exported as { default?: T }).default != null
  ) {
    return (exported as { default: T }).default;
  }

  return exported as T;
}
