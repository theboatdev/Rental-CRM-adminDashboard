"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteTenantAction } from "@/lib/actions/tenants";

/**
 * Deletes a tenant for good, after the super admin types its slug. Shown for
 * archived tenants and failed provisioning; the backend enforces both rules.
 */
export function DeleteTenantButton({ tenantId, tenantName, slug }: { tenantId: string; tenantName: string; slug: string }) {
  const router = useRouter();
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <AlertDialog
      onOpenChange={(open) => {
        if (open) return;
        setTyped("");
        setError(null);
      }}
    >
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Delete tenant</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {tenantName} permanently?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p>This can&apos;t be undone. It deletes:</p>
              <ul className="list-inside list-disc">
                <li>the tenant&apos;s Clerk organization, with its memberships and pending invitations;</li>
                <li>its files: document scans, inspection photos, bills and logo;</li>
                <li>its database: vehicles, renters, rentals, payments, costs, members and roles;</li>
                <li>its configs, provisioning job and secrets.</li>
              </ul>
              <p>Members keep their Clerk accounts but lose this workspace. The audit log keeps the tenant&apos;s history.</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form
          className="space-y-2"
          onSubmit={(event) => {
            event.preventDefault();
            startTransition(async () => {
              const res = await deleteTenantAction(tenantId, typed);
              if (!res.ok) {
                setError(res.error);
                return;
              }
              toast.success(`${tenantName} deleted`);
              router.replace("/tenants");
            });
          }}
        >
          <Label htmlFor="confirm-slug">
            Type <code className="font-mono">{slug}</code> to confirm
          </Label>
          <Input id="confirm-slug" autoComplete="off" value={typed} onChange={(e) => setTyped(e.target.value)} aria-invalid={Boolean(error)} />
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <AlertDialogFooter className="pt-2">
            <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
            <Button type="submit" variant="destructive" disabled={typed !== slug || pending}>
              {pending ? "Deleting…" : "Delete for good"}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
