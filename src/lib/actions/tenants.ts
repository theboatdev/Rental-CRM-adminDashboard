"use server";

import { revalidatePath } from "next/cache";
import type { CreateTenantInput, TenantStatus } from "@/lib/contract";
import { requireSuperAdmin } from "@/lib/dal";
import { platformApi, type ProvisioningJob } from "@/lib/platform-api";
import { toActionError, type ActionResult } from "./result";

/** The backend validates the input; field issues come back in `issues` with paths like `slug`. */
export async function createTenantAction(
  input: CreateTenantInput,
): Promise<ActionResult<{ tenantId: string; job: ProvisioningJob }>> {
  await requireSuperAdmin();
  try {
    const { tenant, job } = await platformApi().createTenant(input);
    revalidatePath("/", "layout");
    return { ok: true, data: { tenantId: tenant.id, job } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function setTenantStatusAction(tenantId: string, status: TenantStatus): Promise<ActionResult> {
  await requireSuperAdmin();
  try {
    await platformApi().setTenantStatus(tenantId, status);
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (error) {
    return toActionError(error);
  }
}

export async function retryProvisioningAction(tenantId: string): Promise<ActionResult> {
  await requireSuperAdmin();
  try {
    await platformApi().retryProvisioning(tenantId);
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (error) {
    return toActionError(error);
  }
}
