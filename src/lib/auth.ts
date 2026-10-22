/**
 * Super admin = Clerk user with publicMetadata.platformRole "super_admin",
 * exposed via the session token claim `metadata`. The backend applies the
 * same rule (backend/src/platform/platformRole.js) and is the real gate.
 */
export function isSuperAdmin(sessionClaims: unknown): boolean {
  const metadata = (sessionClaims as { metadata?: { platformRole?: unknown } } | null)?.metadata;
  return metadata?.platformRole === "super_admin";
}
