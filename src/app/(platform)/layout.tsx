import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import type { ReactNode } from "react";
import { Nav } from "@/components/shell/nav";
import { siteConfig } from "@/config/site";

// No session read here: the proxy gates these routes and each page's data
// access re-checks through the DAL, so the shell can prerender.
export default function PlatformLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh">
      <aside className="hidden w-60 shrink-0 flex-col border-r bg-sidebar p-4 md:flex">
        <Link href="/" className="mb-6 flex items-center gap-2 px-2">
          <span className="flex size-8 items-center justify-center rounded-md bg-primary font-mono text-sm font-bold text-primary-foreground">
            FP
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-semibold">{siteConfig.name}</span>
            <span className="block text-xs text-muted-foreground">Super admin</span>
          </span>
        </Link>
        <Nav />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center gap-4 border-b px-4 md:justify-end md:px-8">
          <div className="min-w-0 flex-1 md:hidden">
            <Nav orientation="horizontal" />
          </div>
          <UserButton />
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
