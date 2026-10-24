import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { PageHeader } from "@/components/shell/page-header";
import { LifecycleActions } from "@/components/tenants/lifecycle-actions";
import { ProvisioningSteps } from "@/components/tenants/provisioning-steps";
import { StatusBadge } from "@/components/tenants/status-badge";
import { UsageBar } from "@/components/tenants/usage-bar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { siteConfig } from "@/config/site";
import { getActiveConfig, getAuditLog, getPlatformMeta, getProvisioningJob, getTenantOrNotFound } from "@/lib/dal";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Tenant" };

export default function TenantPage({ params }: PageProps<"/tenants/[tenantId]">) {
  return (
    <Suspense fallback={<Skeleton className="h-[480px]" aria-label="Loading tenant" />}>
      <TenantDetail params={params} />
    </Suspense>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-2 py-1.5 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}

async function TenantDetail({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
  const tenant = await getTenantOrNotFound(tenantId);
  const [job, active, activity, meta] = await Promise.all([
    getProvisioningJob(tenantId),
    getActiveConfig(tenantId),
    getAuditLog({ tenantId, limit: 8 }),
    getPlatformMeta(),
  ]);

  const failedStep = job?.steps.find((step) => step.status === "failed");
  const inviteStep = job?.steps.find((step) => step.key === "invite_admin");
  const inviteStatus =
    inviteStep?.status === "done" ? "Invitation sent" : inviteStep?.status === "failed" ? "Invitation failed" : "Not sent yet";
  const config = active?.config;

  return (
    <>
      <PageHeader
        breadcrumbs={[{ href: "/tenants", label: "Tenants" }]}
        title={
          <span className="flex flex-wrap items-center gap-3">
            {tenant.name}
            <StatusBadge status={tenant.status} />
          </span>
        }
        description={<span className="font-mono">{tenant.slug}</span>}
        actions={
          <>
            <LifecycleActions
              tenantId={tenant.id}
              tenantName={tenant.name}
              status={tenant.status}
              allowedTransitions={tenant.allowedTransitions}
              provisioningFailed={job?.status === "failed"}
            />
            <Button asChild variant="outline">
              <Link href={`/tenants/${tenant.id}/users`}>Users</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/tenants/${tenant.id}/config/history`}>Config history</Link>
            </Button>
            <Button asChild>
              <Link href={`/tenants/${tenant.id}/config`}>Edit config</Link>
            </Button>
          </>
        }
      />

      {failedStep && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Provisioning stopped at “{failedStep.label}”</AlertTitle>
          <AlertDescription>{failedStep.error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Tenant</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="divide-y">
              <Row label="Tenant ID">
                <code className="font-mono text-xs">{tenant.id}</code>
              </Row>
              <Row label="Database">
                <code className="font-mono text-xs">{tenant.dbName}</code>
              </Row>
              <Row label="Clerk org">
                <code className="font-mono text-xs">{tenant.clerkOrgId ?? "Not created"}</code>
              </Row>
              <Row label="Booking link">
                <code className="font-mono text-xs">
                  {siteConfig.tenantAppUrl}/book/{tenant.slug}
                </code>
                {config && !config.modules.guestPortal.enabled && (
                  <span className="ml-2 text-xs text-muted-foreground">(guest portal off)</span>
                )}
              </Row>
              <Row label="Template">{tenant.template}</Row>
              <Row label="Created">{formatDateTime(tenant.createdAt)}</Row>
              <Row label="Updated">{formatDateTime(tenant.updatedAt)}</Row>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tenant admin</CardTitle>
            <CardDescription>Owner role · Clerk org:admin</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {tenant.adminName && <p className="font-medium">{tenant.adminName}</p>}
            <p className="break-all">{tenant.adminEmail}</p>
            <p className="text-muted-foreground">{inviteStatus}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Usage</CardTitle>
            <CardDescription>Against the limits in config v{tenant.activeConfigVersion ?? "—"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <UsageBar label="Vehicles" used={tenant.usage.vehicles} limit={tenant.limits.maxVehicles} />
            <UsageBar label="Users" used={tenant.usage.members} limit={tenant.limits.maxUsers} />
            <UsageBar label="Storage" used={tenant.usage.storageGb} limit={tenant.limits.storageGb} unit=" GB" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active config</CardTitle>
            <CardDescription>
              {active ? `v${active.version} · ${active.note}` : "No config published"}
            </CardDescription>
          </CardHeader>
          {config && (
            <CardContent className="space-y-3 text-sm">
              <p>
                {config.locale.currency} · {config.locale.timezone} · {config.locale.dateLocale}
              </p>
              <div className="flex flex-wrap gap-1">
                {meta.modules.map(({ key, label }) => (
                  <Badge
                    key={key}
                    variant={config.modules[key].enabled ? "secondary" : "outline"}
                    className={config.modules[key].enabled ? undefined : "text-muted-foreground line-through"}
                  >
                    {label}
                  </Badge>
                ))}
              </div>
            </CardContent>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Provisioning</CardTitle>
            <CardDescription>{job ? `Job ${job.status}` : "No job recorded"}</CardDescription>
          </CardHeader>
          {job && (
            <CardContent>
              <ProvisioningSteps steps={job.steps} />
            </CardContent>
          )}
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {activity.map((entry) => (
                <li key={entry.id} className="flex flex-col gap-1 py-2 text-sm sm:flex-row sm:justify-between">
                  <span>{entry.summary}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {entry.actor.name} · {formatDateTime(entry.at)}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
