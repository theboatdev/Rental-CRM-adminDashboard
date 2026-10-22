"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * The editor renders client-only: it reads browser Intl data and loads Monaco,
 * neither of which should be server-rendered and then hydrated.
 */
export const ConfigEditorLoader = dynamic(() => import("./config-editor").then((m) => m.ConfigEditor), {
  ssr: false,
  loading: () => <Skeleton className="h-[640px]" aria-label="Loading config editor" />,
});
