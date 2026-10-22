import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ConfigEditorLoader } from "@/components/config/config-editor-loader";
import { PageHeader } from "@/components/shell/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getActiveConfig, getPlatformMeta, getTenantOrNotFound } from "@/lib/dal";

export const metadata: Metadata = { title: "Tenant config" };

export default function ConfigPage({ params }: PageProps<"/tenants/[tenantId]/config">) {
  return (
    <Suspense fallback={<Skeleton className="h-[640px]" aria-label="Loading config" />}>
      <ConfigContent params={params} />
    </Suspense>
  );
}

async function ConfigContent({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
  const tenant = await getTenantOrNotFound(tenantId);
  const [active, meta] = await Promise.all([getActiveConfig(tenantId), getPlatformMeta()]);

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { href: "/tenants", label: "Tenants" },
          { href: `/tenants/${tenant.id}`, label: tenant.name },
        ]}
        title="Config"
        description="Branding, locale, modules and business rules for this tenant's app. Publishing creates a new version."
        actions={
          <Button asChild variant="outline">
            <Link href={`/tenants/${tenant.id}/config/history`}>History</Link>
          </Button>
        }
      />
      {active ? (
        <ConfigEditorLoader
          key={active.version}
          tenantId={tenant.id}
          tenantName={tenant.name}
          tenantSlug={tenant.slug}
          version={active.version}
          activeConfig={active.config}
          usage={tenant.usage}
          meta={meta}
        />
      ) : (
        <Alert>
          <AlertTitle>No config yet</AlertTitle>
          <AlertDescription>Provisioning writes config v1. Retry provisioning from the tenant page.</AlertDescription>
        </Alert>
      )}
    </>
  );
}
