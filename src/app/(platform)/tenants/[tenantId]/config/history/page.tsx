import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ChangeList } from "@/components/config/change-list";
import { RestoreButton } from "@/components/config/restore-button";
import { PageHeader } from "@/components/shell/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardAction, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getConfigVersions, getTenantOrNotFound } from "@/lib/dal";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Config history" };

export default function ConfigHistoryPage({ params }: PageProps<"/tenants/[tenantId]/config/history">) {
  return (
    <Suspense fallback={<Skeleton className="h-96" aria-label="Loading history" />}>
      <History params={params} />
    </Suspense>
  );
}

async function History({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
  const tenant = await getTenantOrNotFound(tenantId);
  const versions = await getConfigVersions(tenantId); // newest first, with changes from the previous version

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { href: "/tenants", label: "Tenants" },
          { href: `/tenants/${tenant.id}`, label: tenant.name },
        ]}
        title="Config history"
        description="Every publish creates an immutable version. Restoring republishes an old version as the newest one."
        actions={
          <Button asChild>
            <Link href={`/tenants/${tenant.id}/config`}>Edit config</Link>
          </Button>
        }
      />
      <div className="space-y-3">
        {versions.map((version, index) => {
          const previous = versions[index + 1];
          const isActive = version.version === tenant.activeConfigVersion;
          return (
            <Card key={version.version}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  v{version.version}
                  {isActive && <Badge variant="secondary">Active</Badge>}
                </CardTitle>
                <CardDescription>
                  {version.note} · {version.createdBy.name} · {formatDateTime(version.createdAt)}
                </CardDescription>
                {!isActive && (
                  <CardAction>
                    <RestoreButton tenantId={tenant.id} version={version.version} activeVersion={tenant.activeConfigVersion} />
                  </CardAction>
                )}
              </CardHeader>
              <CardContent>
                {previous ? (
                  <details>
                    <summary className="cursor-pointer text-sm text-muted-foreground">
                      {version.changes.length} change{version.changes.length === 1 ? "" : "s"} from v{previous.version}
                    </summary>
                    <div className="mt-3">
                      <ChangeList changes={version.changes} />
                    </div>
                  </details>
                ) : (
                  <p className="text-sm text-muted-foreground">First version, created at provisioning.</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}
