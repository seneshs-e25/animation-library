"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { getEntry, getGroup } from "@/registry";

/** Top bar of the content area: sidebar toggle, then where you are. */
export function SiteHeader() {
  const pathname = usePathname();
  const slug = pathname.startsWith("/components/") ? pathname.split("/")[2] : undefined;
  const entry = slug ? getEntry(slug) : undefined;
  const group = entry ? getGroup(entry) : undefined;

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 px-4 md:px-6">
      <SidebarTrigger className="-ml-1.5 text-muted-foreground hover:text-foreground" />
      <Separator orientation="vertical" className="mr-1 data-[orientation=vertical]:h-4" />
      <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-sm">
        {entry ? (
          <>
            {group && (
              <>
                <span className="truncate text-muted-foreground">{group.title}</span>
                <ChevronRight aria-hidden className="size-3.5 shrink-0 text-muted-foreground" />
              </>
            )}
            <span aria-current="page" className="truncate">
              {entry.title}
            </span>
          </>
        ) : pathname === "/" ? (
          <span aria-current="page">Introduction</span>
        ) : (
          <Link href="/" className="text-muted-foreground hover:text-foreground">
            Animation Library
          </Link>
        )}
      </nav>
    </header>
  );
}
