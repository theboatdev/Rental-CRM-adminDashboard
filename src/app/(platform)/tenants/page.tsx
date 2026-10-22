import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PageHeader } from "@/components/shell/page-header";
import { TenantsTable } from "@/components/tenants/tenants-table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getTenants } from "@/lib/dal";

export const metadata: Metadata = { title: "Tenants" };

export default function TenantsPage() {
  return (
    <>
      <PageHeader
        title="Tenants"
        description="Each tenant is a rental company with its own Clerk organization, database and config."
        actions={
          <Button asChild>
            <Link href="/tenants/new">New tenant</Link>
          </Button>
        }
      />
      <Suspense fallback={<Skeleton className="h-80" aria-label="Loading tenants" />}>
        <TenantsList />
      </Suspense>
    </>
  );
}

async function TenantsList() {
  return <TenantsTable tenants={await getTenants()} />;
}
