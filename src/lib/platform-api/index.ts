import "server-only";
import { httpPlatformApi } from "./http";
import type { PlatformApi } from "./types";

export * from "./types";

export function platformApi(): PlatformApi {
  return httpPlatformApi;
}
