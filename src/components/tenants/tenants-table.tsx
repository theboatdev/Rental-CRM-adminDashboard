"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { StatusBadge } from "@/components/tenants/status-badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { TenantStatus } from "@/lib/contract";
import { formatDate } from "@/lib/format";
import type { Tenant } from "@/lib/platform-api/types";
import { TENANT_STATUSES, TENANT_STATUS_META } from "@/lib/tenant-status";

export function TenantsTable({ tenants }: { tenants: Tenant[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<TenantStatus | "all">("all");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tenants.filter(
      (t) =>
        (status === "all" || t.status === status) &&
        (!q || [t.name, t.slug, t.adminEmail].some((field) => field.toLowerCase().includes(q))),
    );
  }, [tenants, query, status]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          type="search"
          placeholder="Search by name, slug or admin email"
          aria-label="Search tenants"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="sm:max-w-sm"
        />
        <Select value={status} onValueChange={(value) => setStatus(value as TenantStatus | "all")}>
          <SelectTrigger className="sm:w-44" aria-label="Filter by status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {TENANT_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {TENANT_STATUS_META[s].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tenant</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Vehicles</TableHead>
              <TableHead className="hidden md:table-cell">Users</TableHead>
              <TableHead className="hidden lg:table-cell">Config</TableHead>
              <TableHead className="hidden lg:table-cell">Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((t) => (
              <TableRow key={t.id}>
                <TableCell>
                  <Link href={`/tenants/${t.id}`} className="font-medium hover:underline">
                    {t.name}
                  </Link>
                  <div className="font-mono text-xs text-muted-foreground">
                    {t.slug} · {t.currency ?? "—"}
                  </div>
                </TableCell>
                <TableCell>
                  <StatusBadge status={t.status} />
                </TableCell>
                <TableCell className="hidden font-mono text-xs md:table-cell">
                  {t.usage.vehicles} / {t.limits.maxVehicles}
                </TableCell>
                <TableCell className="hidden font-mono text-xs md:table-cell">
                  {t.usage.members} / {t.limits.maxUsers}
                </TableCell>
                <TableCell className="hidden font-mono text-xs lg:table-cell">
                  {t.activeConfigVersion ? `v${t.activeConfigVersion}` : "—"}
                </TableCell>
                <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">{formatDate(t.createdAt)}</TableCell>
              </TableRow>
            ))}
            {visible.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                  No tenants match these filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
