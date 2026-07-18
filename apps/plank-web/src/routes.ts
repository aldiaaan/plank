import { type RouteConfig, route } from "@react-router/dev/routes";

export default [
  route("/", "features/home/components/home-page.tsx"),
  route("/login", "features/home/auth/components/login-page.tsx"),
] satisfies RouteConfig;
