import type {
  ConfigChange,
  ConfigIssue,
  ConfigValidation,
  CreateTenantInput,
  PlatformMeta,
  TenantConfig,
  TenantStatus,
} from "@/lib/contract";

export interface Actor {
  id: string;
  name: string;
}

export interface TenantLimits {
  maxVehicles: number;
  maxUsers: number;
  storageGb: number;
}

export interface TenantUsage {
  vehicles: number;
  members: number;
  storageGb: number;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: TenantStatus;
  /** Status changes the backend currently allows for this tenant. */
  allowedTransitions: TenantStatus[];
  template: string;
  adminEmail: string;
  adminName: string | null;
  clerkOrgId: string | null;
  dbName: string;
  activeConfigVersion: number | null;
  limits: TenantLimits;
  usage: TenantUsage;
  /** Currency of the active config, for list views. */
  currency: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProvisioningStep {
  key: string;
  label: string;
  status: "pending" | "running" | "done" | "failed";
  error?: string;
  finishedAt?: string;
}

export interface ProvisioningJob {
  id: string;
  tenantId: string;
  status: "running" | "succeeded" | "failed";
  steps: ProvisioningStep[];
  startedAt: string;
  finishedAt: string | null;
}

export interface ConfigVersion {
  tenantId: string;
  version: number;
  config: TenantConfig;
  note: string;
  createdBy: Actor;
  createdAt: string;
}

/** A version in the history list, with its changes from the previous version. */
export interface ConfigVersionWithChanges extends ConfigVersion {
  changes: ConfigChange[];
}

export type AuditAction =
  | "tenant.created"
  | "tenant.status_changed"
  | "tenant.provisioning_retried"
  | "tenant.deleted"
  | "config.published"
  | "config.restored"
  | "member.invited"
  | "member.role_changed"
  | "member.removed"
  | "invitation.revoked";

/** A member of a tenant (its Clerk organization and its `members` collection). */
export interface TenantMember {
  id: string;
  clerkUserId: string;
  name: string | null;
  email: string;
  roleKey: string;
  status: "active" | "removed";
  joinedAt: string;
  removedAt: string | null;
}

/** A pending Clerk organization invitation, with the tenant role it grants on acceptance. */
export interface TenantInvitation {
  id: string;
  email: string;
  roleKey: string | null;
  createdAt: string;
  expiresAt: string | null;
}

/** One of a tenant's roles: the four system roles plus the tenant's custom roles. */
export interface TenantRole {
  key: string;
  name: string;
  description: string;
  permissions: string[];
  system: boolean;
  memberCount: number;
}

export interface AuditEntry {
  id: string;
  at: string;
  actor: Actor;
  action: AuditAction;
  tenantId: string;
  tenantName: string;
  summary: string;
}

export interface PlatformStats {
  tenantsByStatus: Record<TenantStatus, number>;
  totalMembers: number;
  totalVehicles: number;
  failedProvisioning: number;
}

export type PlatformApiErrorCode =
  | "not_found"
  | "conflict"
  | "invalid"
  | "unauthenticated"
  | "forbidden"
  | "unavailable"
  | "internal";

export class PlatformApiError extends Error {
  constructor(
    message: string,
    readonly code: PlatformApiErrorCode,
    readonly issues?: ConfigIssue[],
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "PlatformApiError";
  }
}

/** The config to validate or publish: an object from the form, or the raw text of an uploaded file. */
export type ConfigPayload = { config: unknown } | { configText: string };

/** Client for the backend's /api/platform routes, authenticated as the signed-in super admin. */
export interface PlatformApi {
  getMeta(): Promise<PlatformMeta>;
  getStats(): Promise<PlatformStats>;
  listTenants(): Promise<Tenant[]>;
  getTenant(tenantId: string): Promise<Tenant>;
  getProvisioningJob(tenantId: string): Promise<ProvisioningJob | null>;
  createTenant(input: CreateTenantInput): Promise<{ tenant: Tenant; job: ProvisioningJob }>;
  retryProvisioning(tenantId: string): Promise<ProvisioningJob>;
  setTenantStatus(tenantId: string, status: TenantStatus): Promise<Tenant>;
  /**
   * Permanently deletes a tenant: its Clerk organization, database, configs and secrets.
   * Only archived tenants or ones whose provisioning failed; `confirmSlug` must repeat the slug.
   */
  deleteTenant(tenantId: string, confirmSlug: string): Promise<{ id: string; deleted: boolean }>;
  listConfigVersions(tenantId: string): Promise<ConfigVersionWithChanges[]>;
  getActiveConfig(tenantId: string): Promise<ConfigVersion | null>;
  validateConfig(tenantId: string, payload: ConfigPayload): Promise<ConfigValidation>;
  /** Fails with `conflict` when `baseVersion` is no longer the active version. */
  publishConfig(tenantId: string, input: ConfigPayload & { note: string; baseVersion: number | null }): Promise<ConfigVersion>;
  restoreConfigVersion(tenantId: string, version: number, baseVersion: number | null): Promise<ConfigVersion>;
  listAudit(filter?: { tenantId?: string; limit?: number }): Promise<AuditEntry[]>;
  /** A tenant's users. Changes need an active tenant and follow its rules: maxUsers, at least one Owner. */
  listTenantMembers(tenantId: string): Promise<TenantMember[]>;
  listTenantInvitations(tenantId: string): Promise<TenantInvitation[]>;
  listTenantRoles(tenantId: string): Promise<TenantRole[]>;
  inviteTenantUser(tenantId: string, input: { email: string; roleKey: string }): Promise<TenantInvitation>;
  changeTenantMemberRole(tenantId: string, memberId: string, roleKey: string): Promise<TenantMember>;
  removeTenantMember(tenantId: string, memberId: string): Promise<TenantMember>;
  revokeTenantInvitation(tenantId: string, invitationId: string): Promise<{ id: string; email: string; revoked: boolean }>;
}
