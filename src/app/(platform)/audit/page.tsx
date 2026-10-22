import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PageHeader } from "@/components/shell/page-header";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAuditLog } from "@/lib/dal";
import { formatDateTime } from "@/lib/format";
import type { AuditAction } from "@/lib/platform-api/types";

export const metadata: Metadata = { title: "Audit log" };

const actionLabels: Record<AuditAction, string> = {
  "tenant.created": "Tenant created",
  "tenant.status_changed": "Status changed",
  "tenant.provisioning_retried": "Provisioning retried",
  "config.published": "Config published",
  "config.restored": "Config restored",
};

export default function AuditPage() {
  return (
    <>
      <PageHeader title="Audit log" description="Every super admin action across the platform, newest first." />
      <Suspense fallback={<Skeleton className="h-96" aria-label="Loading audit log" />}>
        <AuditTable />
      </Suspense>
    </>
  );
}

async function AuditTable() {
  const entries = await getAuditLog();
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>When</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Tenant</TableHead>
            <TableHead className="hidden md:table-cell">Details</TableHead>
            <TableHead className="hidden sm:table-cell">By</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell className="text-xs whitespace-nowrap text-muted-foreground">{formatDateTime(entry.at)}</TableCell>
              <TableCell>
                <Badge variant="outline">{actionLabels[entry.action]}</Badge>
              </TableCell>
              <TableCell>
                <Link href={`/tenants/${entry.tenantId}`} className="hover:underline">
                  {entry.tenantName}
                </Link>
              </TableCell>
              <TableCell className="hidden max-w-md text-sm whitespace-normal md:table-cell">{entry.summary}</TableCell>
              <TableCell className="hidden text-sm sm:table-cell">{entry.actor.name}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
