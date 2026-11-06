"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { categories, getGroupEntries, getEntry } from "@/registry";

const gettingStarted = [{ title: "Introduction", href: "/" }];

export function AppSidebar() {
  const pathname = usePathname();
  const activeSlug = pathname.startsWith("/components/") ? pathname.split("/")[2] : undefined;
  const activeEntry = activeSlug ? getEntry(activeSlug) : undefined;

  return (
    <Sidebar className="border-r-0">
      <SidebarHeader className="px-4 pt-5 pb-2">
        <Link href="/" className="flex items-center gap-2 text-[15px] font-medium tracking-tight">
          <span className="grid size-6 place-items-center rounded-md bg-foreground text-[11px] font-semibold text-background">
            AL
          </span>
          Animation Library
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 pb-6">
        <SidebarGroup>
          <SidebarGroupLabel>Getting started</SidebarGroupLabel>
          <SidebarMenu>
            {gettingStarted.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild isActive={pathname === item.href}>
                  <Link href={item.href}>{item.title}</Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        {categories.map((category) => (
          <SidebarGroup key={category.id}>
            <SidebarGroupLabel>{category.title}</SidebarGroupLabel>
            <SidebarMenu>
              {category.groups.map((group) => {
                const entries = getGroupEntries(category.id, group.id);

                if (entries.length === 0) {
                  return (
                    <SidebarMenuItem key={group.id}>
                      <SidebarMenuButton disabled className="justify-between opacity-50">
                        {group.title}
                        <span className="text-[11px] text-muted-foreground">Soon</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                }

                const containsActive =
                  activeEntry?.category === category.id && activeEntry.group === group.id;

                return (
                  <Collapsible
                    key={group.id}
                    defaultOpen={containsActive || category.id === "interactions"}
                    className="group/collapsible"
                    asChild
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton className="justify-between">
                          {group.title}
                          <ChevronRight className="text-muted-foreground transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] group-data-[state=open]/collapsible:rotate-90 motion-reduce:transition-none" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub className="mx-0 border-l-0 px-0">
                          {entries.map((entry) => (
                            <SidebarMenuSubItem key={entry.slug}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={entry.slug === activeSlug}
                                className="pl-4"
                              >
                                <Link href={`/components/${entry.slug}`}>{entry.title}</Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
