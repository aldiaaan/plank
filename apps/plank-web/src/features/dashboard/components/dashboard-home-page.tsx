import type { Route } from "./+types/dashboard-home-page";

export const meta: Route.MetaFunction = () => [
  { title: "Dashboard | Plank" },
  {
    name: "description",
    content: "Plank admin dashboard home.",
  },
];

export default function DashboardHomePage() {
  return (
    <div>
      <h1>Dashboard Home Page</h1>
    </div>
  );
}
