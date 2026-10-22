import { SignOutButton } from "@clerk/nextjs";
import { ShieldAlert } from "lucide-react";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "No platform access" };

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <div className="max-w-md space-y-4 text-center">
        <ShieldAlert className="mx-auto size-10 text-muted-foreground" aria-hidden />
        <h1 className="text-xl font-semibold">This account can&apos;t use the super admin console</h1>
        <p className="text-sm text-muted-foreground">
          Platform access needs the <code className="font-mono">super_admin</code> platform role on your Clerk user.
          Tenant admins and staff sign in to their company&apos;s workspace in the tenant app instead.
        </p>
        <SignOutButton redirectUrl="/sign-in">
          <Button variant="outline">Sign out and switch account</Button>
        </SignOutButton>
      </div>
    </main>
  );
}
