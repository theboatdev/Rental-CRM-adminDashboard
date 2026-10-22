"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { retryProvisioningAction, setTenantStatusAction } from "@/lib/actions/tenants";
import type { TenantStatus } from "@/lib/contract";

const transitions: Partial<Record<TenantStatus, { label: string; confirm: string; destructive?: boolean }>> = {
  active: { label: "Reactivate", confirm: "Team members can sign in again and the API accepts requests." },
  suspended: {
    label: "Suspend",
    confirm: "Everyone in this tenant is signed out of the tenant app and the API returns 403. No data is deleted.",
    destructive: true,
  },
  archived: {
    label: "Archive",
    confirm: "The tenant becomes read-only and hidden. Its database is kept until the retention period ends.",
    destructive: true,
  },
};

export function LifecycleActions({
  tenantId,
  tenantName,
  status,
  allowedTransitions,
  provisioningFailed,
}: {
  tenantId: string;
  tenantName: string;
  status: TenantStatus;
  /** From the backend, which owns the lifecycle rules. */
  allowedTransitions: TenantStatus[];
  provisioningFailed: boolean;
}) {
  const [pending, startTransition] = useTransition();

  const run = (action: () => Promise<{ ok: boolean; error?: string }>, success: string) =>
    startTransition(async () => {
      const res = await action();
      if (res.ok) toast.success(success);
      else toast.error(res.error ?? "Something went wrong");
    });

  return (
    <>
      {provisioningFailed && (
        <Button disabled={pending} onClick={() => run(() => retryProvisioningAction(tenantId), "Provisioning finished")}>
          Retry provisioning
        </Button>
      )}
      {allowedTransitions.map((next) => {
        const meta = transitions[next];
        if (!meta) return null;
        return (
          <AlertDialog key={next}>
            <AlertDialogTrigger asChild>
              <Button variant={meta.destructive ? "destructive" : "outline"} disabled={pending}>
                {next === "suspended" && status === "archived" ? "Restore (suspended)" : meta.label}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {meta.label} {tenantName}?
                </AlertDialogTitle>
                <AlertDialogDescription>{meta.confirm}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  variant={meta.destructive ? "destructive" : "default"}
                  onClick={() => run(() => setTenantStatusAction(tenantId, next), `${tenantName} is now ${next}`)}
                >
                  {meta.label}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        );
      })}
    </>
  );
}
