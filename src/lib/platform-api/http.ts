import "server-only";
import { auth } from "@clerk/nextjs/server";
import { PlatformApiError, type PdfFile, type PlatformApi, type PlatformApiErrorCode } from "./types";

function baseUrl() {
  const url = process.env.PLATFORM_API_URL;
  if (!url) throw new PlatformApiError("PLATFORM_API_URL is not set", "unavailable");
  return url.replace(/\/+$/, "");
}

const CODE_FOR_STATUS: Record<number, PlatformApiErrorCode> = {
  400: "invalid",
  401: "unauthenticated",
  403: "forbidden",
  404: "not_found",
  409: "conflict",
  422: "invalid",
  502: "unavailable",
  503: "unavailable",
};

/** Sends a request to the backend with the signed-in user's Clerk session token. */
async function send(method: string, path: string, body?: unknown): Promise<Response> {
  const token = await (await auth()).getToken();
  try {
    return await fetch(`${baseUrl()}${path}`, {
      method,
      headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    });
  } catch (cause) {
    throw new PlatformApiError(`Can't reach the platform API at ${baseUrl()}`, "unavailable", undefined, { cause });
  }
}

/** The error an unsuccessful response describes. */
async function errorOf(res: Response) {
  const error = (await res.json().catch(() => null))?.error;
  return new PlatformApiError(error?.message ?? `Platform API returned ${res.status}`, error?.code ?? CODE_FOR_STATUS[res.status] ?? "internal", error?.issues);
}

/** Calls the backend and reads its JSON response. */
async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await send(method, path, body);
  if (!res.ok) throw await errorOf(res);
  return (await res.json().catch(() => null)) as T;
}

/** Calls the backend for a PDF. */
async function requestPdf(method: string, path: string, body?: unknown): Promise<PdfFile> {
  const res = await send(method, path, body);
  if (!res.ok) throw await errorOf(res);
  const filename = /filename="([^"]+)"/.exec(res.headers.get("content-disposition") ?? "")?.[1] ?? "document.pdf";
  return { filename, base64: Buffer.from(await res.arrayBuffer()).toString("base64") };
}

const tenantPath = (tenantId: string) => `/tenants/${encodeURIComponent(tenantId)}`;

export const httpPlatformApi: PlatformApi = {
  getMeta: () => request("GET", "/meta"),
  getStats: () => request("GET", "/stats"),
  listTenants: () => request("GET", "/tenants"),
  getTenant: (tenantId) => request("GET", tenantPath(tenantId)),
  getProvisioningJob: (tenantId) => request("GET", `${tenantPath(tenantId)}/provisioning`),
  createTenant: (input) => request("POST", "/tenants", input),
  retryProvisioning: (tenantId) => request("POST", `${tenantPath(tenantId)}/provisioning/retry`),
  setTenantStatus: (tenantId, status) => request("PATCH", `${tenantPath(tenantId)}/status`, { status }),
  deleteTenant: (tenantId, confirmSlug) => request("DELETE", tenantPath(tenantId), { confirmSlug }),
  listConfigVersions: (tenantId) => request("GET", `${tenantPath(tenantId)}/config/versions`),
  getActiveConfig: (tenantId) => request("GET", `${tenantPath(tenantId)}/config`),
  validateConfig: (tenantId, payload) => request("POST", `${tenantPath(tenantId)}/config/validate`, payload),
  previewReturnReceipt: (payload) => requestPdf("POST", "/documents/return-receipt/preview", payload),
  publishConfig: (tenantId, input) => request("POST", `${tenantPath(tenantId)}/config`, input),
  restoreConfigVersion: (tenantId, version, baseVersion) =>
    request("POST", `${tenantPath(tenantId)}/config/versions/${version}/restore`, { baseVersion }),
  listAudit: (filter = {}) => {
    const query = new URLSearchParams();
    if (filter.tenantId) query.set("tenantId", filter.tenantId);
    if (filter.limit) query.set("limit", String(filter.limit));
    return request("GET", `/audit${query.size ? `?${query}` : ""}`);
  },
  listTenantMembers: (tenantId) => request("GET", `${tenantPath(tenantId)}/members`),
  listTenantInvitations: (tenantId) => request("GET", `${tenantPath(tenantId)}/invitations`),
  listTenantRoles: (tenantId) => request("GET", `${tenantPath(tenantId)}/roles`),
  inviteTenantUser: (tenantId, input) => request("POST", `${tenantPath(tenantId)}/invitations`, input),
  changeTenantMemberRole: (tenantId, memberId, roleKey) =>
    request("PATCH", `${tenantPath(tenantId)}/members/${encodeURIComponent(memberId)}`, { roleKey }),
  removeTenantMember: (tenantId, memberId) => request("DELETE", `${tenantPath(tenantId)}/members/${encodeURIComponent(memberId)}`),
  revokeTenantInvitation: (tenantId, invitationId) =>
    request("DELETE", `${tenantPath(tenantId)}/invitations/${encodeURIComponent(invitationId)}`),
  signLogoUpload: (tenantId) => request("POST", `${tenantPath(tenantId)}/uploads/logo`),
  getWhatsAppConnection: (tenantId) => request("GET", `${tenantPath(tenantId)}/integrations/whatsapp`),
  setWhatsAppConnection: (tenantId, input) => request("PUT", `${tenantPath(tenantId)}/integrations/whatsapp`, input),
  removeWhatsAppConnection: (tenantId) => request("DELETE", `${tenantPath(tenantId)}/integrations/whatsapp`),
};
