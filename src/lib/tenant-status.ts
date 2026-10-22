import type { TenantStatus } from "@/lib/contract";

export const TENANT_STATUSES: TenantStatus[] = ["provisioning", "active", "suspended", "archived"];

export const TENANT_STATUS_META: Record<TenantStatus, { label: string; description: string }> = {
  provisioning: { label: "Provisioning", description: "Setup is running or stopped on a failed step." },
  active: { label: "Active", description: "Team members can sign in and use the app." },
  suspended: { label: "Suspended", description: "Sign-in blocked and API returns 403. Data is kept." },
  archived: { label: "Archived", description: "Read-only and hidden. Eligible for deletion after retention." },
};
