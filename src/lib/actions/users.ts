"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/dal";
import { platformApi } from "@/lib/platform-api";
import { toActionError, type ActionResult } from "./result";

/**
 * A tenant's users. The backend applies the tenant's rules (maxUsers counting
 * pending invitations, at least one Owner) and keeps Clerk in step; field
 * issues come back in `issues` with paths like `email`.
 */

const usersPath = (tenantId: string) => `/tenants/${tenantId}/users`;

async function run<T>(tenantId: string, call: () => Promise<T>): Promise<ActionResult<T>> {
  await requireSuperAdmin();
  try {
    const data = await call();
    revalidatePath(usersPath(tenantId));
    revalidatePath(`/tenants/${tenantId}`);
    return { ok: true, data } as ActionResult<T>;
  } catch (error) {
    return toActionError(error);
  }
}

/** Sends a Clerk invitation; accepting it makes them a member with `roleKey`. */
export async function inviteUserAction(tenantId: string, input: { email: string; roleKey: string }) {
  return run(tenantId, () => platformApi().inviteTenantUser(tenantId, input));
}

export async function changeMemberRoleAction(tenantId: string, memberId: string, roleKey: string) {
  return run(tenantId, () => platformApi().changeTenantMemberRole(tenantId, memberId, roleKey));
}

/** Removes them from the tenant and its Clerk organization; they lose access at once. */
export async function removeMemberAction(tenantId: string, memberId: string) {
  return run(tenantId, () => platformApi().removeTenantMember(tenantId, memberId));
}

export async function revokeInvitationAction(tenantId: string, invitationId: string) {
  return run(tenantId, () => platformApi().revokeTenantInvitation(tenantId, invitationId));
}
