import { basename, extname } from "node:path";
import type { RouteExport, RouteHandler, RouteOptions } from "../module";

export function isHandler(value: RouteExport): value is RouteHandler {
  return typeof value === "function";
}

export function normalizeRouteExport(value: RouteExport): {
  handler: RouteHandler;
  options: RouteOptions;
} {
  if (isHandler(value)) {
    return { handler: value, options: {} };
  }
  const { handler, ...options } = value;
  return { handler, options };
}

export function filenameToRoutePath(file: string): string {
  let name = basename(file, extname(file));
  if (name.endsWith(".d")) name = name.slice(0, -2);
  if (name === "index") return "";
  const segments = name.split(".");
  const path = segments
    .map((segment) =>
      segment.startsWith("$") ? `:${segment.slice(1)}` : segment,
    )
    .join("/");
  return `/${path}`;
}
