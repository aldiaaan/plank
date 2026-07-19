import { Button } from "@plank/ui/components/button";
import { getPingOptions } from "@plank/client";
import type { Route } from "./+types/home-page";

export const meta: Route.MetaFunction = () => [
  { title: "Home | Plank" },
  {
    name: "description",
    content: "Welcome to Plank.",
  },
];

export default function HomePage() {
  return (
    <div className="text-2xl font-bold">
      HomePage!!
      <Button>asdass32324das me</Button>
    </div>
  );
}
