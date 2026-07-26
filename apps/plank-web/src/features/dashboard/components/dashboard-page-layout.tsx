import { postAuthSignout, postAuthVerify } from "@plank/client";
import {
  IMPERSONATION_COOKIE_NAME,
  SESSION_COOKIE_NAME,
} from "@plank/common";
import {
  AppSidebar,
  type AppSidebarGroup,
} from "@plank/ui/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@plank/ui/components/breadcrumb";
import { Separator } from "@plank/ui/components/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@plank/ui/components/sidebar";
import {
  BookIcon,
  HomeIcon,
  LogInIcon,
  ShieldIcon,
  StepBackIcon,
  Users2,
  UsersIcon,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Fragment, useMemo } from "react";
import {
  Link,
  Outlet,
  redirect,
  useLoaderData,
  useLocation,
  useSubmit,
  type LoaderFunctionArgs,
} from "react-router";
import type { Route } from "./+types/dashboard-page-layout";
import { ImpersonationBanner } from "./impersonation-banner";

export const meta: Route.MetaFunction = () => [
  { title: "Dashboard | Plank" },
  {
    name: "description",
    content: "Plank admin dashboard.",
  },
];

const groups = [
  {
    type: "nav" as const,
    items: [
      {
        title: "Home",
        url: "/dashboard",
        icon: <HomeIcon />,
      },
      {
        title: "API Docs",
        url: "http://localhost:4000/externals/scalar",
        icon: <BookIcon />,
        external: true, // optional if url is already http(s)
      },
      {
        title: "Bull Board",
        url: "http://localhost:4000/externals/bull-board",
        icon: <StepBackIcon />,
        external: true, // optional if url is already http(s)
      },
    ],
  },
  {
    label: "Administration",
    type: "nav" as const,
    items: [
      {
        title: "Users",
        url: "/dashboard/users",
        icon: <Users2 />,
        isActive: true,
        items: [
          {
            title: "Manage Users",
            url: "/dashboard/users",
            icon: <UsersIcon />,
          },
          {
            title: "Manage Roles",
            url: "/dashboard/roles",
            icon: <ShieldIcon />,
          },
          // {
          //   title: "Manage Permissions",
          //   url: "/dashboard/permissions",
          //   icon: <KeyRoundIcon />,
          // },
          {
            title: "Manage Sessions",
            url: "/dashboard/users/sessions",
            icon: <LogInIcon />,
          },
        ],
      },
    ],
  },
];

function getCookie(request: Request, name: string) {
  const header = request.headers.get("Cookie");
  if (!header) return null;

  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) {
      return decodeURIComponent(rest.join("="));
    }
  }

  return null;
}

function clearAuthCookieHeaders(): [string, string][] {
  return [
    [
      "Set-Cookie",
      `${SESSION_COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`,
    ],
    [
      "Set-Cookie",
      `${IMPERSONATION_COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`,
    ],
  ];
}

export async function loader({ request }: LoaderFunctionArgs) {
  const cookie = getCookie(request, SESSION_COOKIE_NAME);
  if (!cookie) throw redirect("/login");

  const impersonationCookie =
    getCookie(request, IMPERSONATION_COOKIE_NAME) ?? undefined;

  const { data, error } = await postAuthVerify({
    body: {
      cookie,
      ...(impersonationCookie ? { impersonationCookie } : {}),
    },
  });

  if (error || !data) {
    throw redirect("/login", {
      headers: clearAuthCookieHeaders(),
    });
  }

  return data.result;
}

export async function action({ request }: LoaderFunctionArgs) {
  const cookie = getCookie(request, SESSION_COOKIE_NAME);
  const impersonationCookie =
    getCookie(request, IMPERSONATION_COOKIE_NAME) ?? undefined;

  if (cookie) {
    await postAuthSignout({
      body: {
        cookie,
        ...(impersonationCookie ? { impersonationCookie } : {}),
      },
    });
  }

  throw redirect("/login", {
    headers: clearAuthCookieHeaders(),
  });
}

function formatSegmentLabel(segment: string) {
  return segment
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function useDashboardBreadcrumbs(navGroups: AppSidebarGroup[]) {
  const { pathname } = useLocation();

  const labelsByUrl = useMemo(() => {
    const labels = new Map<string, string>();

    for (const group of navGroups) {
      if (group.type !== "nav") continue;

      for (const item of group.items) {
        labels.set(item.url, item.title);
        for (const subItem of item.items ?? []) {
          labels.set(subItem.url, subItem.title);
        }
      }
    }

    return labels;
  }, [navGroups]);

  return useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    const crumbs: { label: string; href: string }[] = [];
    let href = "";

    for (const segment of segments) {
      href += `/${segment}`;
      crumbs.push({
        href,
        label: labelsByUrl.get(href) ?? formatSegmentLabel(segment),
      });
    }

    return crumbs;
  }, [pathname, labelsByUrl]);
}

export default function DashboardPage() {
  const user = useLoaderData<typeof loader>();
  const breadcrumbs = useDashboardBreadcrumbs(groups);
  const submit = useSubmit();
  const queryClient = useQueryClient();
  const isImpersonating = user.impersonator != null;

  return (
    <>
      {isImpersonating ? (
        <ImpersonationBanner userName={user.name} userEmail={user.email} />
      ) : null}
      <div className={isImpersonating ? "pt-10" : undefined}>
        <SidebarProvider
          className={
            isImpersonating
              ? "h-[calc(100svh-2.5rem)] overflow-hidden"
              : "h-svh overflow-hidden"
          }
        >
          <AppSidebar
            user={{
              name: user.name,
              email: user.email,
            }}
            groups={groups}
            onLogout={() => {
              queryClient.clear();
              submit(null, { method: "post" });
            }}
          />
          <SidebarInset className="min-h-0 overflow-hidden">
            <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
              <div className="flex items-center gap-2 px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator
                  orientation="vertical"
                  className="mr-2 data-[orientation=vertical]:h-4"
                />
                <Breadcrumb>
                  <BreadcrumbList>
                    {breadcrumbs.map((crumb, index) => {
                      const isLast = index === breadcrumbs.length - 1;

                      return (
                        <Fragment key={crumb.href}>
                          {index > 0 ? (
                            <BreadcrumbSeparator className="hidden md:block" />
                          ) : null}
                          <BreadcrumbItem
                            className={isLast ? undefined : "hidden md:block"}
                          >
                            {isLast ? (
                              <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                            ) : (
                              <BreadcrumbLink asChild>
                                <Link to={crumb.href}>{crumb.label}</Link>
                              </BreadcrumbLink>
                            )}
                          </BreadcrumbItem>
                        </Fragment>
                      );
                    })}
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            </header>
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4 pt-0">
              <Outlet context={{ user }} />
            </div>
          </SidebarInset>
        </SidebarProvider>
      </div>
    </>
  );
}
