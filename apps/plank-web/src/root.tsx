import {
  isRouteErrorResponse,
  Links,
  type LoaderFunctionArgs,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useNavigation,
} from "react-router";
import "@plank/ui/styles.css";
import { Progress } from "@plank/ui/components/progress";
import { Toaster } from "@plank/ui/components/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { NuqsAdapter } from "nuqs/adapters/react-router/v8";
import type { Route } from "./+types/root";

export const meta: Route.MetaFunction = () => [
  { title: "Plank" },
  {
    name: "description",
    content: "Plank application.",
  },
];

export async function loader({ request, context }: LoaderFunctionArgs) {
  return {};
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="antialiased">
        <QueryClientProvider client={queryClient}>
          {children}
          <Toaster />
        </QueryClientProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const navigation = useNavigation();
  const isPageLoading = navigation.state === "loading";

  return (
    <NuqsAdapter>
      {isPageLoading ? (
        <div className="pointer-events-none fixed inset-x-0 top-0 z-50">
          <Progress
            indeterminate
            className="h-0.5 rounded-none bg-transparent"
            aria-label="Loading page"
          />
        </div>
      ) : null}
      <Outlet />
    </NuqsAdapter>
  );
}

export function ErrorBoundary({ error }: { error: Error }) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="container mx-auto p-4 pt-16">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full overflow-x-auto p-4">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
