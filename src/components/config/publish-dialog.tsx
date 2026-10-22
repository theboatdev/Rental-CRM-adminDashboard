"use client";

import type { ConfigChange } from "@/lib/contract";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ChangeList } from "./change-list";

export function PublishDialog({
  open,
  onOpenChange,
  tenantName,
  nextVersion,
  changes,
  removedKeys,
  pending,
  onPublish,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantName: string;
  nextVersion: number;
  changes: ConfigChange[];
  removedKeys: Array<{ list: string; key: string }>;
  pending: boolean;
  onPublish: (note: string) => void;
}) {
  const [note, setNote] = useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Publish v{nextVersion} for {tenantName}
          </DialogTitle>
          <DialogDescription>
            The tenant app picks up the new config on its next load. You can restore the current version from history.
          </DialogDescription>
        </DialogHeader>

        {removedKeys.length > 0 && (
          <Alert variant="destructive">
            <AlertTitle>Removing keys that records may use</AlertTitle>
            <AlertDescription>
              {removedKeys.map(({ list, key }) => `${list}.${key}`).join(", ")}. Existing records keep the old key and lose
              their label. Deactivating the item is usually safer.
            </AlertDescription>
          </Alert>
        )}

        <div className="max-h-[40vh] overflow-y-auto pr-1">
          <ChangeList changes={changes} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="publish-note">Change note</Label>
          <Textarea
            id="publish-note"
            rows={2}
            placeholder="What changed and why, e.g. Enable fuel logs for the Q4 pilot"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={() => onPublish(note)} disabled={pending || note.trim().length < 3}>
            {pending ? "Publishing…" : `Publish v${nextVersion}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
