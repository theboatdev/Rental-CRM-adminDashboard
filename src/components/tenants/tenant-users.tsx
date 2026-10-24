"use client";

import { useState, useTransition } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { changeMemberRoleAction, inviteUserAction, removeMemberAction, revokeInvitationAction } from "@/lib/actions/users";
import type { TenantInvitation, TenantMember, TenantRole } from "@/lib/platform-api/types";

type RoleOption = Pick<TenantRole, "key" | "name">;

function RoleSelect({ roles, value, onChange, disabled, label }: { roles: RoleOption[]; value: string; onChange: (key: string) => void; disabled?: boolean; label: string }) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-44" aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {roles.map((role) => (
          <SelectItem key={role.key} value={role.key}>
            {role.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Invites someone by email with a role. Clerk emails the invitation; accepting it creates their account. */
export function InviteUserForm({ tenantId, roles, disabled }: { tenantId: string; roles: RoleOption[]; disabled?: boolean }) {
  const [email, setEmail] = useState("");
  const [roleKey, setRoleKey] = useState("staff");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="flex flex-col gap-3 sm:flex-row sm:items-end"
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(async () => {
          const res = await inviteUserAction(tenantId, { email, roleKey });
          if (!res.ok) {
            setError(res.issues?.find((issue) => issue.path === "email")?.message ?? res.error);
            return;
          }
          setError(null);
          setEmail("");
          toast.success(`Invitation sent to ${res.data.email}`);
        });
      }}
    >
      <div className="flex-1 space-y-1.5">
        <Label htmlFor="invite-email">Email</Label>
        <Input
          id="invite-email"
          type="email"
          required
          placeholder="name@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={Boolean(error)}
          disabled={disabled}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Role</Label>
        <RoleSelect roles={roles} value={roleKey} onChange={setRoleKey} disabled={disabled} label="Role for the invitation" />
      </div>
      <Button type="submit" disabled={pending || disabled}>
        Send invitation
      </Button>
      {error && (
        <p role="alert" className="text-sm text-destructive sm:basis-full">
          {error}
        </p>
      )}
    </form>
  );
}

export function MemberRoleSelect({ tenantId, member, roles, disabled }: { tenantId: string; member: TenantMember; roles: RoleOption[]; disabled?: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <RoleSelect
      roles={roles}
      value={member.roleKey}
      disabled={pending || disabled}
      label={`Role of ${member.name ?? member.email}`}
      onChange={(roleKey) =>
        startTransition(async () => {
          const res = await changeMemberRoleAction(tenantId, member.id, roleKey);
          if (res.ok) toast.success(`${member.name ?? member.email} is now ${roles.find((r) => r.key === roleKey)?.name ?? roleKey}`);
          else toast.error(res.error);
        })
      }
    />
  );
}

export function RemoveMemberButton({ tenantId, member, disabled }: { tenantId: string; member: TenantMember; disabled?: boolean }) {
  const [pending, startTransition] = useTransition();
  const name = member.name ?? member.email;
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" disabled={pending || disabled}>
          Remove from tenant
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove {name} from this tenant?</AlertDialogTitle>
          <AlertDialogDescription>
            They lose access to this tenant at once and leave its Clerk organization. Their Clerk account isn&apos;t deleted, so they
            can be invited again, and their name stays in the history.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() =>
              startTransition(async () => {
                const res = await removeMemberAction(tenantId, member.id);
                if (res.ok) toast.success(`${name} removed`);
                else toast.error(res.error);
              })
            }
          >
            Remove from tenant
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function RevokeInvitationButton({ tenantId, invitation, disabled }: { tenantId: string; invitation: TenantInvitation; disabled?: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending || disabled}
      onClick={() =>
        startTransition(async () => {
          const res = await revokeInvitationAction(tenantId, invitation.id);
          if (res.ok) toast.success(`Invitation to ${invitation.email} revoked`);
          else toast.error(res.error);
        })
      }
    >
      Revoke
    </Button>
  );
}
