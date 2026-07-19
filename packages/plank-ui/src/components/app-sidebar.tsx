"use client"

import * as React from "react"

import { NavMain } from "@plank/ui/components/nav-main"
import { NavProjects } from "@plank/ui/components/nav-projects"
import { NavUser } from "@plank/ui/components/nav-user"
import { TeamSwitcher } from "@plank/ui/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@plank/ui/components/sidebar"

export type AppSidebarUser = {
  name: string
  email: string
  avatar?: string
}

export type AppSidebarTeam = {
  name: string
  logo: React.ReactNode
  plan: string
}

export type AppSidebarNavItem = {
  title: string
  url: string
  icon?: React.ReactNode
  isActive?: boolean
  items?: {
    title: string
    url: string
    icon?: React.ReactNode
  }[]
}

export type AppSidebarProject = {
  name: string
  url: string
  icon: React.ReactNode
}

export type AppSidebarNavGroup = {
  label?: string
  type: "nav"
  items: AppSidebarNavItem[]
}

export type AppSidebarProjectsGroup = {
  label?: string
  type: "projects"
  items: AppSidebarProject[]
}

export type AppSidebarGroup = AppSidebarNavGroup | AppSidebarProjectsGroup

export type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  user: AppSidebarUser
  teams: AppSidebarTeam[]
  groups: AppSidebarGroup[]
  onLogout?: () => void
}

export function AppSidebar({
  user,
  teams,
  groups,
  onLogout,
  ...props
}: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={teams} />
      </SidebarHeader>
      <SidebarContent>
        {groups.map((group, index) =>
          group.type === "nav" ? (
            <NavMain key={group.label ?? index} label={group.label} items={group.items} />
          ) : (
            <NavProjects
              key={group.label ?? index}
              label={group.label}
              projects={group.items}
            />
          )
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} onLogout={onLogout} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
