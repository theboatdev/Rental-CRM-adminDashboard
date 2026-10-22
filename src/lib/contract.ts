/**
 * Types for what the backend's /api/platform returns. The backend owns the
 * config schema, templates and permissions (backend/src/platform) and
 * validates everything; these types only describe the shapes for the UI.
 * Keep them in step with backend/src/platform/config/schema.js.
 */

export type ModuleKey =
  | "dashboard"
  | "vehicles"
  | "renters"
  | "rentals"
  | "calendar"
  | "payments"
  | "costs"
  | "fuelLogs"
  | "whatsappDigest"
  | "guestPortal";

export type ResidentType = "local" | "tourist";
export type TenantStatus = "provisioning" | "active" | "suspended" | "archived";

interface Toggle {
  enabled: boolean;
}

export interface ListItem {
  key: string;
  label: string;
  active: boolean;
}

export interface DocumentType extends ListItem {
  requiredFor: ResidentType[];
}

export interface TenantConfig {
  schemaVersion: number;
  branding: {
    displayName: string;
    shortName: string;
    tagline: string;
    logoUrl: string | null;
    primaryColor: string;
    supportEmail: string | null;
    supportPhone: string | null;
    whatsappNumber: string | null;
  };
  locale: {
    country: string;
    currency: string;
    secondaryCurrency: string | null;
    timezone: string;
    dateLocale: string;
    distanceUnit: "km" | "mi";
  };
  modules: {
    dashboard: Toggle;
    vehicles: Toggle & { serviceIntervalKm: number };
    renters: Toggle;
    rentals: Toggle & { inspectionPoints: string[]; requirePickupInspection: boolean; requireDropInspection: boolean };
    calendar: Toggle;
    payments: Toggle;
    costs: Toggle & { requireBillUpload: boolean };
    fuelLogs: Toggle;
    whatsappDigest: Toggle & { cron: string; recipients: string[] };
    guestPortal: Toggle & { residentTypes: ResidentType[]; requireDocumentUpload: boolean };
  };
  navigation: Array<{ module: ModuleKey; label: string }>;
  lists: {
    documentTypes: DocumentType[];
    paymentMethods: ListItem[];
    costCategories: ListItem[];
  };
  rules: {
    defaultDepositAmount: number;
    minRentalDays: number;
    touristPermitDocumentKeys: string[];
    codePrefixes: { rental: string; booking: string; receipt: string; advance: string; renter: string };
  };
  limits: { maxVehicles: number; maxUsers: number; storageGb: number };
}

export interface ModuleMeta {
  key: ModuleKey;
  label: string;
  description: string;
  tab: boolean;
  requires: ModuleKey[];
}

export interface ConfigTemplate {
  key: string;
  label: string;
  description: string;
  config: TenantConfig;
}

export interface PermissionMeta {
  key: string;
  group: string;
  label: string;
  module: ModuleKey | null;
}

export interface SystemRole {
  key: string;
  name: string;
  description: string;
  permissions: string[];
  system: boolean;
}

/** GET /api/platform/meta: the config contract and permission catalog. */
export interface PlatformMeta {
  configSchemaVersion: number;
  configJsonSchema: Record<string, unknown>;
  modules: ModuleMeta[];
  residentTypes: ResidentType[];
  templates: ConfigTemplate[];
  tenantStatuses: TenantStatus[];
  tenantStatusTransitions: Record<TenantStatus, TenantStatus[]>;
  provisioningSteps: Array<{ key: string; label: string }>;
  permissions: PermissionMeta[];
  systemRoles: SystemRole[];
}

export interface ConfigIssue {
  /** Dotted path such as `modules.rentals.inspectionPoints[2]`; empty for the whole document. */
  path: string;
  message: string;
}

export interface ConfigChange {
  path: string;
  kind: "added" | "removed" | "changed";
  before?: unknown;
  after?: unknown;
}

/** Result of POST /api/platform/tenants/:id/config/validate. */
export interface ConfigValidation {
  valid: boolean;
  issues: ConfigIssue[];
  /** The normalized config (defaults applied); present when valid. */
  config?: TenantConfig;
  changes: ConfigChange[];
  removedListKeys: Array<{ list: string; key: string }>;
}

export interface CreateTenantInput {
  name: string;
  slug: string;
  template: string;
  adminEmail: string;
  adminName?: string;
  limits: { maxVehicles: number; maxUsers: number; storageGb: number };
}
