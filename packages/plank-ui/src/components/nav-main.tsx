import { Link, useLocation } from "react-router";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@plank/ui/components/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@plank/ui/components/sidebar";
import { ArrowUpRightIcon, ChevronRightIcon } from "lucide-react";
import type { AppSidebarNavItem } from "@plank/ui/components/app-sidebar";

function isExternalLink(item: { url: string; external?: boolean }) {
  return (
    item.external === true ||
    item.url.startsWith("http://") ||
    item.url.startsWith("https://")
  );
}

export function NavMain({
  label,
  items,
}: {
  label?: string;
  items: AppSidebarNavItem[];
}) {
  const location = useLocation();

  return (
    <SidebarGroup className={label ? undefined : "py-0"}>
      {label ? <SidebarGroupLabel>{label}</SidebarGroupLabel> : null}
      <SidebarMenu className="gap-0">
        {items.map((item) => {
          const hasChildren = !!item.items?.length;
          const external = isExternalLink(item);

          if (!hasChildren) {
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  isActive={!external && location.pathname === item.url}
                >
                  <Link
                    to={item.url}
                    viewTransition={!external}
                    target={external ? "_blank" : undefined}
                    rel={external ? "noopener noreferrer" : undefined}
                  >
                    {item.icon}
                    <span>{item.title}</span>
                    {external ? (
                      <ArrowUpRightIcon className="ml-auto size-4 shrink-0 opacity-60" />
                    ) : null}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          }

          return (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={
                item.isActive ||
                item.items?.some(
                  (subItem) =>
                    !isExternalLink(subItem) &&
                    location.pathname === subItem.url,
                )
              }
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={item.title}>
                    {item.icon}
                    <span>{item.title}</span>
                    <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items?.map((subItem) => {
                      const subExternal = isExternalLink(subItem);

                      return (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={
                              !subExternal && location.pathname === subItem.url
                            }
                          >
                            <Link
                              to={subItem.url}
                              viewTransition={!subExternal}
                              target={subExternal ? "_blank" : undefined}
                              rel={
                                subExternal ? "noopener noreferrer" : undefined
                              }
                            >
                              {subItem.icon}
                              <span>{subItem.title}</span>
                              {subExternal ? (
                                <ArrowUpRightIcon className="ml-auto size-4 shrink-0 opacity-60" />
                              ) : null}
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      );
                    })}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
