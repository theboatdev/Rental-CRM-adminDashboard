import "server-only";
import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth";
import { PlatformApiError, platformApi } from "@/lib/platform-api";

/**
 * Data access layer. Every read and every Server Action goes through
 * requireSuperAdmin() before calling the backend, which checks the same
 * session token again and is the real authority.
 */
export async function requireSuperAdmin(): Promise<{ userId: string }> {
  const { userId, sessionClaims } = await auth();
  if (!userId) redirect("/sign-in");
  if (!isSuperAdmin(sessionClaims)) redirect("/unauthorized");
  return { userId };
}

export async function getPlatformMeta() {
  await requireSuperAdmin();
  return platformApi().getMeta();
}

export async function getPlatformStats() {
  await requireSuperAdmin();
  return platformApi().getStats();
}

export async function getTenants() {
  await requireSuperAdmin();
  return platformApi().listTenants();
}

/** Loads a tenant or renders the not-found page. */
export async function getTenantOrNotFound(tenantId: string) {
  await requireSuperAdmin();
  try {
    return await platformApi().getTenant(tenantId);
  } catch (error) {
    if (error instanceof PlatformApiError && error.code === "not_found") notFound();
    throw error;
  }
}

export async function getProvisioningJob(tenantId: string) {
  await requireSuperAdmin();
  return platformApi().getProvisioningJob(tenantId);
}

export async function getActiveConfig(tenantId: string) {
  await requireSuperAdmin();
  return platformApi().getActiveConfig(tenantId);
}

export async function getConfigVersions(tenantId: string) {
  await requireSuperAdmin();
  return platformApi().listConfigVersions(tenantId);
}

export async function getAuditLog(filter?: { tenantId?: string; limit?: number }) {
  await requireSuperAdmin();
  return platformApi().listAudit(filter);
}
