"use client";

import { Building2, LayoutDashboard, ScrollText } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/tenants", label: "Tenants", icon: Building2 },
  { href: "/audit", label: "Audit log", icon: ScrollText },
];

type Orientation = "vertical" | "horizontal";

/**
 * The links prerender into the static shell; only the active highlight waits
 * for the pathname, which is request data on dynamic routes like /tenants/[id].
 */
export function Nav({ orientation = "vertical" }: { orientation?: Orientation }) {
  return (
    <Suspense fallback={<NavLinks orientation={orientation} pathname={null} />}>
      <ActiveNav orientation={orientation} />
    </Suspense>
  );
}

function ActiveNav({ orientation }: { orientation: Orientation }) {
  return <NavLinks orientation={orientation} pathname={usePathname()} />;
}

function NavLinks({ orientation, pathname }: { orientation: Orientation; pathname: string | null }) {
  const isActive = (href: string) =>
    pathname !== null && (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <nav
      aria-label="Main"
      className={cn("flex gap-1", orientation === "vertical" ? "flex-col" : "flex-row overflow-x-auto")}
    >
      {items.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          aria-current={isActive(href) ? "page" : undefined}
          className={cn(
            "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground",
            isActive(href) && "bg-sidebar-accent text-foreground",
          )}
        >
          <Icon className="size-4" aria-hidden />
          {label}
        </Link>
      ))}
    </nav>
  );
}
