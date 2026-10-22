import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/shell/page-header";
import { CreateTenantForm } from "@/components/tenants/create-tenant-form";
import { Skeleton } from "@/components/ui/skeleton";
import { getPlatformMeta } from "@/lib/dal";

export const metadata: Metadata = { title: "New tenant" };

export default function NewTenantPage() {
  return (
    <>
      <PageHeader
        title="New tenant"
        description="Provision a rental company: Clerk organization, tenant database, starting config and an Owner invite."
        breadcrumbs={[{ href: "/tenants", label: "Tenants" }]}
      />
      <Suspense fallback={<Skeleton className="h-[520px]" aria-label="Loading form" />}>
        <CreateTenantFormWithTemplates />
      </Suspense>
    </>
  );
}

async function CreateTenantFormWithTemplates() {
  const meta = await getPlatformMeta();
  return <CreateTenantForm templates={meta.templates} />;
}
