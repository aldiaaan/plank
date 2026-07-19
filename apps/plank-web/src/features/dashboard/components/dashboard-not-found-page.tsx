import type { Route } from "./+types/dashboard-not-found-page";

export const meta: Route.MetaFunction = () => [
  { title: "Not Found | Plank" },
  {
    name: "description",
    content: "This dashboard page could not be found.",
  },
];

export default function DashboardNotFoundPage() {
  return (
    <div>
      <h1>404</h1>
      <p>This page could not be found.</p>
    </div>
  );
}
