import type { PlatformMeta, TenantConfig } from "@/lib/contract";

export interface SectionProps {
  config: TenantConfig;
  /** Module catalog and other config metadata from the backend. */
  meta: PlatformMeta;
  /** The active (published) config, for showing what's already in use. */
  baseline: TenantConfig;
  /** Applies a mutation to a copy of the draft. */
  update: (mutate: (draft: TenantConfig) => void) => void;
  /** First validation message at an exact path such as `branding.primaryColor`. */
  issue: (path: string) => string | undefined;
}

export const toNullable = (value: string) => (value.trim() === "" ? null : value);
/** Empty input becomes NaN so validation reports it instead of silently using 0. */
export const toNumber = (value: string) => (value === "" ? Number.NaN : Number(value));
export const numberValue = (value: number) => (Number.isFinite(value) ? value : "");
