import { formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

export function UsageBar({ label, used, limit, unit = "" }: { label: string; used: number; limit: number; unit?: string }) {
  const pct = formatPercent(used, limit);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="font-mono text-xs text-muted-foreground">
          {used}
          {unit} / {limit}
          {unit}
        </span>
      </div>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-muted"
        role="meter"
        aria-label={label}
        aria-valuenow={used}
        aria-valuemin={0}
        aria-valuemax={limit}
      >
        <div
          className={cn("h-full rounded-full bg-primary", pct >= 90 && "bg-amber-500", pct > 100 && "bg-destructive")}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  );
}
