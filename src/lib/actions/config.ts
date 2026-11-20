"use server";

import { revalidatePath } from "next/cache";
import type { ConfigValidation } from "@/lib/contract";
import { getSuperAdmin, requireSuperAdmin } from "@/lib/dal";
import { platformApi, type ConfigPayload, type PdfFile, type UploadSignature } from "@/lib/platform-api";
import { toActionError, type ActionResult } from "./result";

/** Signs a browser upload of the tenant's logo; the browser posts the file to Cloudinary itself. */
export async function signLogoUploadAction(tenantId: string): Promise<ActionResult<UploadSignature>> {
  await requireSuperAdmin();
  try {
    return { ok: true, data: await platformApi().signLogoUpload(tenantId) };
  } catch (error) {
    return toActionError(error);
  }
}

/** The return receipt of a sample rental under the draft config, for the Documents tab's preview. */
export async function previewReturnReceiptAction(payload: ConfigPayload): Promise<ActionResult<PdfFile>> {
  await requireSuperAdmin();
  try {
    return { ok: true, data: await platformApi().previewReturnReceipt(payload) };
  } catch (error) {
    return toActionError(error);
  }
}

/** Asks the backend to validate a draft or an uploaded file and diff it against the active version. */
export async function validateConfigAction(input: {
  tenantId: string;
  payload: ConfigPayload;
}): Promise<ActionResult<ConfigValidation>> {
  // No redirect(): this action is called from a debounced effect; redirects break the action protocol.
  if (!(await getSuperAdmin())) return { ok: false, error: "Super admin access required. Sign in again." };
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
