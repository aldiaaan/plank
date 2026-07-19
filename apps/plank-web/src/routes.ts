import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  route("/", "features/home/components/home-page.tsx"),
  route("/login", "features/home/auth/components/login-page.tsx"),
  route("/dashboard", "features/dashboard/components/dashboard-page-layout.tsx", [
    index("features/dashboard/components/dashboard-home-page.tsx"),
    route("users", "features/dashboard/components/manage-users-page.tsx"),
    route("*", "features/dashboard/components/dashboard-not-found-page.tsx"),
  ]),
] satisfies RouteConfig;
