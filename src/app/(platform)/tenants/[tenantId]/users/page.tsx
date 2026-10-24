import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/shell/page-header";
import { StatusBadge } from "@/components/tenants/status-badge";
import { InviteUserForm, MemberRoleSelect, RemoveMemberButton, RevokeInvitationButton } from "@/components/tenants/tenant-users";
import { UsageBar } from "@/components/tenants/usage-bar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getTenantOrNotFound, getTenantUsers } from "@/lib/dal";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Users" };

export default function TenantUsersPage({ params }: PageProps<"/tenants/[tenantId]/users">) {
  return (
    <Suspense fallback={<Skeleton className="h-[480px]" aria-label="Loading users" />}>
      <TenantUsers params={params} />
    </Suspense>
  );
}

/**
 * A tenant's users, managed by super admins. The tenant's Owners can manage
 * the same team from the tenant app; both go through the same backend rules.
 */
async function TenantUsers({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
  const tenant = await getTenantOrNotFound(tenantId);
  const { members, invitations, roles } = await getTenantUsers(tenantId);
  const roleName = (key: string | null) => roles.find((r) => r.key === key)?.name ?? key ?? "—";
  const active = tenant.status === "active";
  const seats = members.length + invitations.length;

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { href: "/tenants", label: "Tenants" },
          { href: `/tenants/${tenant.id}`, label: tenant.name },
        ]}
        title={
          <span className="flex flex-wrap items-center gap-3">
            Users
            <StatusBadge status={tenant.status} />
          </span>
        }
        description="Invite people to this tenant with a role. Clerk emails the invitation; they set up their account from it and sign in to the tenant app."
      />

      {!active && (
        <Alert className="mb-6">
          <AlertTitle>Users can be changed while the tenant is active</AlertTitle>
          <AlertDescription>
            This tenant is {tenant.status}. {tenant.status === "provisioning" ? "Finish provisioning first." : "Reactivate it to invite or change users."}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Invite a user</CardTitle>
            <CardDescription>They join the tenant&apos;s Clerk organization with the role you pick here.</CardDescription>
          </CardHeader>
          <CardContent>
            <InviteUserForm tenantId={tenant.id} roles={roles} disabled={!active} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Seats</CardTitle>
            <CardDescription>Members plus pending invitations</CardDescription>
          </CardHeader>
          <CardContent>
            <UsageBar label="Users" used={seats} limit={tenant.limits.maxUsers} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Members ({members.length})</CardTitle>
            <CardDescription>A tenant always keeps at least one Owner.</CardDescription>
          </CardHeader>
          <CardContent>
            {members.length === 0 ? (
              <p className="text-sm text-muted-foreground">No members yet. They appear here once they accept their invitation.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <p className="font-medium">{member.name ?? member.email}</p>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      </TableCell>
                      <TableCell>
                        <MemberRoleSelect tenantId={tenant.id} member={member} roles={roles} disabled={!active} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDateTime(member.joinedAt)}</TableCell>
                      <TableCell className="text-right">
                        <RemoveMemberButton tenantId={tenant.id} member={member} disabled={!active} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Pending invitations ({invitations.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {invitations.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending invitations.</p>
            ) : (
              <ul className="divide-y">
                {invitations.map((invitation) => (
                  <li key={invitation.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{invitation.email}</span>
                      <Badge variant="secondary">{roleName(invitation.roleKey)}</Badge>
                      <span className="text-xs text-muted-foreground">sent {formatDateTime(invitation.createdAt)}</span>
                    </span>
                    <RevokeInvitationButton tenantId={tenant.id} invitation={invitation} disabled={!active} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
