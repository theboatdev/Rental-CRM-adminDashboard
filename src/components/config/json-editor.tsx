"use client";

import Editor, { loader, type BeforeMount } from "@monaco-editor/react";
import { useTheme } from "next-themes";
import { Skeleton } from "@/components/ui/skeleton";

// Served from public/monaco (copied by scripts/copy-monaco.mjs), not a CDN.
loader.config({ paths: { vs: "/monaco/vs" } });

const SCHEMA_URI = "https://fleet-platform.internal/schemas/tenant-config.json";

export default function JsonEditor({
  value,
  onChange,
  schema,
}: {
  value: string;
  onChange: (value: string) => void;
  schema: Record<string, unknown>;
}) {
  const { resolvedTheme } = useTheme();

  const beforeMount: BeforeMount = (monaco) => {
    monaco.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      allowComments: false,
      enableSchemaRequest: false,
      schemas: [{ uri: SCHEMA_URI, fileMatch: ["*"], schema }],
    });
  };

  return (
    <Editor
      height="560px"
      language="json"
      path="tenant-config.json"
      value={value}
      onChange={(next) => onChange(next ?? "")}
      beforeMount={beforeMount}
      theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
      loading={<Skeleton className="h-[560px] w-full" />}
      options={{
        minimap: { enabled: false },
        fontSize: 13,
        tabSize: 2,
        scrollBeyondLastLine: false,
        automaticLayout: true,
        formatOnPaste: true,
      }}
    />
  );
}
