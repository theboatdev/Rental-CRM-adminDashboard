import { SignIn } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted/40 p-4">
      <div className="text-center">
        <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">{siteConfig.name}</p>
        <h1 className="text-xl font-semibold">Super admin console</h1>
      </div>
      {/* SignIn reads the pathname of this catch-all route, which is request data. */}
      <Suspense fallback={<Skeleton className="h-[420px] w-full max-w-[400px]" />}>
        <SignIn />
      </Suspense>
    </main>
  );
}
