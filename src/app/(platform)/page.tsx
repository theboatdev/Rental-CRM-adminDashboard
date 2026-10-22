import { AlertTriangle, Building2, Car, Users } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { PageHeader } from "@/components/shell/page-header";
import { StatusBadge } from "@/components/tenants/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getAuditLog, getPlatformStats, getTenants } from "@/lib/dal";
import { formatDateTime, formatPercent } from "@/lib/format";

export default function OverviewPage() {
  return (
    <>
      <PageHeader
        title="Overview"
        description="Tenants on the platform, what needs attention, and recent changes."
        actions={
          <Button asChild>
            <Link href="/tenants/new">New tenant</Link>
          </Button>
        }
      />
      <Suspense fallback={<OverviewSkeleton />}>
        <OverviewContent />
      </Suspense>
    </>
  );
}

async function OverviewContent() {
  const [stats, tenants, audit] = await Promise.all([getPlatformStats(), getTenants(), getAuditLog({ limit: 6 })]);

  const attention = tenants.flatMap((tenant) => {
    const reasons: string[] = [];
    if (tenant.status === "provisioning") reasons.push("Provisioning hasn't finished");
    if (tenant.status === "active" && formatPercent(tenant.usage.vehicles, tenant.limits.maxVehicles) >= 90) {
      reasons.push("Near its vehicle limit");
    }
    if (tenant.status === "active" && formatPercent(tenant.usage.members, tenant.limits.maxUsers) >= 90) {
      reasons.push("Near its user limit");
    }
    return reasons.length ? [{ tenant, reasons }] : [];
  });

  const kpis = [
    { label: "Active tenants", value: stats.tenantsByStatus.active, icon: Building2 },
    { label: "Needs attention", value: attention.length, icon: AlertTriangle },
    { label: "Team members", value: stats.totalMembers, icon: Users },
    { label: "Vehicles managed", value: stats.totalVehicles, icon: Car },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader>
              <CardDescription className="flex items-center gap-2">
                <Icon className="size-4" aria-hidden />
                {label}
              </CardDescription>
              <CardTitle className="text-3xl tabular-nums">{value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Needs attention</CardTitle>
            <CardDescription>
              {stats.tenantsByStatus.suspended} suspended · {stats.failedProvisioning} failed provisioning job
              {stats.failedProvisioning === 1 ? "" : "s"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {attention.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing needs attention.</p>
            ) : (
              <ul className="divide-y">
                {attention.map(({ tenant, reasons }) => (
                  <li key={tenant.id} className="flex items-center justify-between gap-3 py-2">
                    <div className="min-w-0">
                      <Link href={`/tenants/${tenant.id}`} className="font-medium hover:underline">
                        {tenant.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">{reasons.join(" · ")}</p>
                    </div>
                    <StatusBadge status={tenant.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>
              <Link href="/audit" className="hover:underline">
                View the full audit log
              </Link>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {audit.map((entry) => (
                <li key={entry.id} className="text-sm">
                  <p>
                    <Link href={`/tenants/${entry.tenantId}`} className="font-medium hover:underline">
                      {entry.tenantName}
                    </Link>{" "}
                    <span className="text-muted-foreground">— {entry.summary}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {entry.actor.name} · {formatDateTime(entry.at)}
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading overview">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}
