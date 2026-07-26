import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  route("/", "features/home/components/home-page.tsx"),
  route("/login", "features/home/auth/components/login-page.tsx"),
  route("/dashboard", "features/dashboard/components/dashboard-page-layout.tsx", [
    index("features/dashboard/components/dashboard-home-page.tsx"),
    route(
      "users",
      "features/dashboard/users-management/components/manage-users-page.tsx",
    ),
    route(
      "users/create",
      "features/dashboard/users-management/components/create-user-page.tsx",
    ),
    route(
      "users/sessions",
      "features/dashboard/sessions-management/components/manage-sessions-page.tsx",
    ),
    route(
      "roles",
      "features/dashboard/roles-management/components/manage-roles-page.tsx",
    ),
    route(
      "roles/create",
      "features/dashboard/roles-management/components/create-role-page.tsx",
    ),
    route("*", "features/dashboard/components/dashboard-not-found-page.tsx"),
  ]),
] satisfies RouteConfig;
