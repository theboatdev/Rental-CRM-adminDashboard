import type { TenantStatus } from "@/lib/contract";
import { TENANT_STATUS_META } from "@/lib/tenant-status";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const styles: Record<TenantStatus, string> = {
  active: "border-emerald-600/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  provisioning: "border-amber-600/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  suspended: "border-red-600/30 bg-red-500/10 text-red-700 dark:text-red-400",
  archived: "border-border bg-muted text-muted-foreground",
};

export function StatusBadge({ status, className }: { status: TenantStatus; className?: string }) {
  return (
    <Badge variant="outline" className={cn(styles[status], className)} title={TENANT_STATUS_META[status].description}>
      {TENANT_STATUS_META[status].label}
    </Badge>
  );
}
