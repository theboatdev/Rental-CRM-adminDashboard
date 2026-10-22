"use server";

import { revalidatePath } from "next/cache";
import type { ConfigValidation } from "@/lib/contract";
import { requireSuperAdmin } from "@/lib/dal";
import { platformApi, type ConfigPayload } from "@/lib/platform-api";
import { toActionError, type ActionResult } from "./result";

/** Asks the backend to validate a draft or an uploaded file and diff it against the active version. */
export async function validateConfigAction(input: {
  tenantId: string;
  payload: ConfigPayload;
}): Promise<ActionResult<ConfigValidation>> {
  await requireSuperAdmin();
  try {
    return { ok: true, data: await platformApi().validateConfig(input.tenantId, input.payload) };
  } catch (error) {
    return toActionError(error);
  }
}

export async function publishConfigAction(input: {
  tenantId: string;
  baseVersion: number | null;
  config: unknown;
  note: string;
}): Promise<ActionResult<{ version: number }>> {
  await requireSuperAdmin();
  try {
    const version = await platformApi().publishConfig(input.tenantId, {
      config: input.config,
      note: input.note,
      baseVersion: input.baseVersion,
    });
    revalidatePath("/", "layout");
    return { ok: true, data: { version: version.version } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function restoreConfigVersionAction(input: {
  tenantId: string;
  version: number;
  baseVersion: number | null;
}): Promise<ActionResult<{ version: number }>> {
  await requireSuperAdmin();
  try {
    const restored = await platformApi().restoreConfigVersion(input.tenantId, input.version, input.baseVersion);
    revalidatePath("/", "layout");
    return { ok: true, data: { version: restored.version } };
  } catch (error) {
    return toActionError(error);
  }
}
