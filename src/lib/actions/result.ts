import type { ConfigIssue } from "@/lib/contract";
import { PlatformApiError } from "@/lib/platform-api/types";

export type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? object : { data: T }))
  | { ok: false; error: string; issues?: ConfigIssue[] };

/** Turns API errors into a result the UI can show; rethrows anything else. */
export function toActionError(error: unknown): { ok: false; error: string; issues?: ConfigIssue[] } {
  if (error instanceof PlatformApiError) return { ok: false, error: error.message, issues: error.issues };
  throw error;
}
