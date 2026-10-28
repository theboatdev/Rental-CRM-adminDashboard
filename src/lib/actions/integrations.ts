"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/dal";
import { platformApi, type WhatsAppConnection, type WhatsAppConnectionInput } from "@/lib/platform-api";
import { toActionError, type ActionResult } from "./result";

/**
 * A tenant's WhatsApp connection, which sends its digest. The backend
 * encrypts it and never returns the access token; field issues come back in
 * `issues` with paths like `phoneNumberId`.
 */

async function run(tenantId: string, call: () => Promise<WhatsAppConnection>): Promise<ActionResult<WhatsAppConnection>> {
  await requireSuperAdmin();
  try {
    const data = await call();
    revalidatePath(`/tenants/${tenantId}`);
    return { ok: true, data } as ActionResult<WhatsAppConnection>;
  } catch (error) {
    return toActionError(error);
  }
}

export async function setWhatsAppAction(tenantId: string, input: WhatsAppConnectionInput) {
  return run(tenantId, () => platformApi().setWhatsAppConnection(tenantId, input));
}

export async function removeWhatsAppAction(tenantId: string) {
  return run(tenantId, () => platformApi().removeWhatsAppConnection(tenantId));
}
