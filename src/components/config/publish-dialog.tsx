"use client";

import type { ConfigChange, CustomFieldChange } from "@/lib/contract";
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

function describeCustomFieldChange(change: CustomFieldChange) {
  switch (change.kind) {
    case "removed":
      return "is removed: records keep their values, but nobody can see or edit them.";
    case "typeChanged":
      return `changes from ${change.before} to ${change.after}: values already entered may no longer fit.`;
    case "optionRemoved":
      return `loses the option ${change.option}: records that picked it show the raw key.`;
  }
}

export function PublishDialog({
  open,
  onOpenChange,
  tenantName,
  nextVersion,
  changes,
  removedKeys,
  customFieldChanges,
  pending,
  onPublish,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantName: string;
  nextVersion: number;
  changes: ConfigChange[];
  removedKeys: Array<{ list: string; key: string }>;
  customFieldChanges: CustomFieldChange[];
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

        {customFieldChanges.length > 0 && (
          <Alert variant="destructive">
            <AlertTitle>Changing custom fields that records may use</AlertTitle>
            <AlertDescription>
              <ul className="mt-1 space-y-0.5">
                {customFieldChanges.map((change) => (
                  <li key={`${change.section}.${change.key}:${change.kind}:${"option" in change ? change.option : ""}`}>
                    <span className="font-mono">
                      {change.section}.{change.key}
                    </span>{" "}
                    {describeCustomFieldChange(change)}
                  </li>
                ))}
              </ul>
              Deactivating a field or option hides it without touching existing values.
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
