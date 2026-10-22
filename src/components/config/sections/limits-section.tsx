"use client";

import type { TenantUsage } from "@/lib/platform-api/types";
import { NumberField } from "../field";
import type { SectionProps } from "../types";

export function LimitsSection({ config, update, issue, usage }: SectionProps & { usage: TenantUsage }) {
  const l = config.limits;
  const hint = (used: number, limit: number, unit: string) =>
    Number.isFinite(limit) && limit < used ? (
      <span className="text-amber-700 dark:text-amber-400">
        Below current usage ({used}
        {unit}). Existing records stay, but new ones are blocked.
      </span>
    ) : (
      `Currently ${used}${unit}`
    );

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Plan limits the API enforces when the tenant adds vehicles, users or files.</p>
      <div className="grid gap-4 sm:grid-cols-3">
        <NumberField
          id="limits-maxVehicles"
          label="Max vehicles"
          min={1}
          value={l.maxVehicles}
          onChange={(v) => update((d) => { d.limits.maxVehicles = v; })}
          error={issue("limits.maxVehicles")}
          hint={hint(usage.vehicles, l.maxVehicles, "")}
        />
        <NumberField
          id="limits-maxUsers"
          label="Max users"
          min={1}
          value={l.maxUsers}
          onChange={(v) => update((d) => { d.limits.maxUsers = v; })}
          error={issue("limits.maxUsers")}
          hint={hint(usage.members, l.maxUsers, "")}
        />
        <NumberField
          id="limits-storageGb"
          label="Storage"
          suffix="GB"
          min={0.5}
          step="0.5"
          value={l.storageGb}
          onChange={(v) => update((d) => { d.limits.storageGb = v; })}
          error={issue("limits.storageGb")}
          hint={hint(usage.storageGb, l.storageGb, " GB")}
        />
      </div>
    </div>
  );
}
