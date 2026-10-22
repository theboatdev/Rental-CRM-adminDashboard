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
import { restoreConfigVersionAction } from "@/lib/actions/config";

export function RestoreButton({ tenantId, version, activeVersion }: { tenantId: string; version: number; activeVersion: number | null }) {
  const [pending, startTransition] = useTransition();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="outline" disabled={pending}>
          Restore
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Restore v{version}?</AlertDialogTitle>
          <AlertDialogDescription>
            This publishes the v{version} config as a new version. Version history is never rewritten, so you can undo it the
            same way.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() =>
              startTransition(async () => {
                const res = await restoreConfigVersionAction({ tenantId, version, baseVersion: activeVersion });
                if (res.ok) toast.success(`Restored v${version} as v${res.data.version}`);
                else toast.error(res.error);
              })
            }
          >
            Restore
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
