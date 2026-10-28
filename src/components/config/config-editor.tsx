"use client";

import { Download, Loader2, RotateCcw, Upload } from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { publishConfigAction, validateConfigAction } from "@/lib/actions/config";
import type { ConfigValidation, PlatformMeta, TenantConfig } from "@/lib/contract";
import type { ConfigPayload, TenantUsage } from "@/lib/platform-api/types";
import { PublishDialog } from "./publish-dialog";
import { BrandingSection } from "./sections/branding-section";
import { FieldsSection } from "./sections/fields-section";
import { LimitsSection } from "./sections/limits-section";
import { ListsSection } from "./sections/lists-section";
import { LocaleSection } from "./sections/locale-section";
import { ModulesSection } from "./sections/modules-section";
import { NavigationSection } from "./sections/navigation-section";
import { RulesSection } from "./sections/rules-section";
import type { SectionProps } from "./types";

const JsonEditor = dynamic(() => import("./json-editor"), {
  ssr: false,
  loading: () => <Skeleton className="h-[560px] w-full" />,
});

const TABS = [
  { value: "branding", label: "Branding" },
  { value: "locale", label: "Locale" },
  { value: "modules", label: "Modules" },
  { value: "navigation", label: "Navigation" },
  { value: "lists", label: "Lists" },
  { value: "rules", label: "Rules" },
  { value: "fields", label: "Fields" },
  { value: "limits", label: "Limits" },
  { value: "json", label: "Raw JSON" },
] as const;
type Tab = (typeof TABS)[number]["value"];

const FORM_TABS = new Set<string>(TABS.map((t) => t.value).filter((t) => t !== "json"));
/** Which tab shows an issue, from the first segment of its path. */
const tabForPath = (path: string): Tab => {
  const section = path.split(/[.[]/)[0] ?? "";
  return FORM_TABS.has(section) ? (section as Tab) : "json";
};

const VALIDATION_DELAY_MS = 400;

/**
 * Validates the current draft on the backend, debounced. `pending` is true
 * until the result matches the latest draft, so stale results never publish.
 */
function useServerValidation(tenantId: string, key: string, payload: ConfigPayload, initial: ConfigValidation) {
  const [validated, setValidated] = useState({ key, result: initial });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (validated.key === key) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      const res = await validateConfigAction({ tenantId, payload });
      if (cancelled) return;
      if (res.ok) {
        setValidated({ key, result: res.data });
        setError(null);
      } else {
        setError(res.error);
      }
    }, VALIDATION_DELAY_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [tenantId, key, payload, validated.key]);

  /** Records a result obtained elsewhere (e.g. while switching tabs) to skip a round trip. */
  const prime = useCallback((primeKey: string, result: ConfigValidation) => setValidated({ key: primeKey, result }), []);

  return { result: validated.result, pending: validated.key !== key, error, prime };
}

export interface ConfigEditorProps {
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  version: number;
  activeConfig: TenantConfig;
  usage: TenantUsage;
  meta: PlatformMeta;
}

export function ConfigEditor({ tenantId, tenantName, tenantSlug, version, activeConfig, usage, meta }: ConfigEditorProps) {
  const [tab, setTab] = useState<Tab>("branding");
  const [draft, setDraft] = useState<TenantConfig>(activeConfig);
  // While the Raw JSON tab is open its text is the source of truth; null otherwise.
  const [jsonText, setJsonText] = useState<string | null>(null);
  const [plainText, setPlainText] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishing, startPublish] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);

  const key = jsonText ?? JSON.stringify(draft);
  const payload = useMemo<ConfigPayload>(() => (jsonText === null ? { config: draft } : { configText: jsonText }), [draft, jsonText]);
  const { result, pending, error, prime } = useServerValidation(tenantId, key, payload, {
    valid: true,
    issues: [],
    config: activeConfig,
    changes: [],
    removedListKeys: [],
    customFieldChanges: [],
  });

  const issues = result.issues;
  const changes = result.changes;
  const issueAt = useMemo(() => {
    const map = new Map<string, string>();
    for (const i of issues) if (!map.has(i.path)) map.set(i.path, i.message);
    return (path: string) => map.get(path);
  }, [issues]);
  const issueCount = useCallback(
    (path: string) => issues.filter((i) => i.path === path || i.path.startsWith(`${path}.`) || i.path.startsWith(`${path}[`)).length,
    [issues],
  );
  const issueCounts = useMemo(() => {
    const counts: Partial<Record<Tab, number>> = {};
    for (const i of issues) counts[tabForPath(i.path)] = (counts[tabForPath(i.path)] ?? 0) + 1;
    return counts;
  }, [issues]);

  const update = useCallback<SectionProps["update"]>((mutate) => {
    setDraft((previous) => {
      const next = structuredClone(previous);
      mutate(next);
      return next;
    });
  }, []);

  const dirty = changes.length > 0 || !result.valid;
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const changeTab = async (next: string) => {
    const target = next as Tab;
    if (target === tab) return;
    if (target === "json") {
      setJsonText(JSON.stringify(draft, null, 2));
      setTab("json");
      return;
    }
    if (jsonText !== null) {
      // The form needs a valid document; reuse the latest check if it covers this text.
      let check: ConfigValidation = result;
      if (pending || error) {
        const res = await validateConfigAction({ tenantId, payload: { configText: jsonText } });
        if (!res.ok) {
          toast.error(res.error);
          return;
        }
        check = res.data;
      }
      if (!check.valid || !check.config) {
        toast.error("Fix the JSON issues before switching to the form view", {
          description: `${check.issues.length} issue${check.issues.length === 1 ? "" : "s"} remaining`,
        });
        return;
      }
      prime(JSON.stringify(check.config), check);
      setDraft(check.config);
      setJsonText(null);
    }
    setTab(target);
  };

  const discard = () => {
    setDraft(activeConfig);
    setJsonText(tab === "json" ? JSON.stringify(activeConfig, null, 2) : null);
  };

  const exportFile = () => {
    const text = jsonText ?? JSON.stringify(draft, null, 2);
    const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${tenantSlug}.config.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const uploadFile = async (file: File | undefined) => {
    if (!file) return;
    setJsonText(await file.text());
    setTab("json");
    toast.info(`Uploaded ${file.name}`, { description: "The backend checks it now. Review issues and changes, then publish." });
  };

  const publish = (note: string) =>
    startPublish(async () => {
      if (!result.valid || !result.config) return;
      const res = await publishConfigAction({ tenantId, baseVersion: version, config: result.config, note });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setPublishOpen(false);
      // The page re-renders with the new active version and remounts this editor.
      toast.success(`Published v${res.data.version}`);
    });

  const sectionProps: SectionProps = { tenantId, config: draft, baseline: activeConfig, update, issue: issueAt, issueCount, meta };
  const canPublish = !pending && !error && result.valid && changes.length > 0;

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-10 -mx-1 flex flex-col gap-3 rounded-lg border bg-background/95 p-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2 text-sm" aria-live="polite">
          <span className="font-medium">v{version} active</span>
          <span className="text-muted-foreground">·</span>
          {pending ? (
            <span className="flex items-center gap-1 text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" aria-hidden /> Checking with the backend…
            </span>
          ) : (
            <span className="text-muted-foreground">
              {issues.length > 0
                ? `${issues.length} issue${issues.length === 1 ? "" : "s"}`
                : changes.length > 0
                  ? `${changes.length} unpublished change${changes.length === 1 ? "" : "s"}`
                  : "No changes"}
            </span>
          )}
        </p>
        <div className="flex flex-wrap gap-2">
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              void uploadFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <Button size="sm" variant="outline" onClick={() => fileInput.current?.click()}>
            <Upload /> Upload JSON
          </Button>
          <Button size="sm" variant="outline" onClick={exportFile}>
            <Download /> Download
          </Button>
          <Button size="sm" variant="ghost" onClick={discard} disabled={!dirty && jsonText === null}>
            <RotateCcw /> Discard
          </Button>
          <Button size="sm" onClick={() => setPublishOpen(true)} disabled={!canPublish}>
            Review &amp; publish
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Couldn&apos;t check the config</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {issues.length > 0 && (
        <Alert variant="destructive">
          <AlertTitle>Fix these before publishing</AlertTitle>
          <AlertDescription>
            <ul className="mt-1 space-y-0.5">
              {issues.slice(0, 8).map((i) => (
                <li key={`${i.path}:${i.message}`}>
                  <button type="button" className="text-left hover:underline" onClick={() => void changeTab(tabForPath(i.path))}>
                    <span className="font-mono">{i.path || "(document)"}</span> — {i.message}
                  </button>
                </li>
              ))}
              {issues.length > 8 && <li>…and {issues.length - 8} more</li>}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={tab} onValueChange={(value) => void changeTab(value)}>
        <div className="overflow-x-auto">
          <TabsList variant="line">
            {TABS.map(({ value, label }) => (
              <TabsTrigger key={value} value={value} className="gap-1.5">
                {label}
                {issueCounts[value] ? (
                  <Badge variant="destructive" className="h-4 min-w-4 px-1 text-[10px]">
                    {issueCounts[value]}
                  </Badge>
                ) : null}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="rounded-lg border p-4 sm:p-6">
          <TabsContent value="branding">
            <BrandingSection {...sectionProps} />
          </TabsContent>
          <TabsContent value="locale">
            <LocaleSection {...sectionProps} />
          </TabsContent>
          <TabsContent value="modules">
            <ModulesSection {...sectionProps} />
          </TabsContent>
          <TabsContent value="navigation">
            <NavigationSection {...sectionProps} />
          </TabsContent>
          <TabsContent value="lists">
            <ListsSection {...sectionProps} />
          </TabsContent>
          <TabsContent value="rules">
            <RulesSection {...sectionProps} />
          </TabsContent>
          <TabsContent value="fields">
            <FieldsSection {...sectionProps} />
          </TabsContent>
          <TabsContent value="limits">
            <LimitsSection {...sectionProps} usage={usage} />
          </TabsContent>
          <TabsContent value="json" className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">
                The full config file. Autocomplete comes from the backend&apos;s schema; the backend checks every change.
              </p>
              <div className="flex items-center gap-2">
                <Switch id="plain-text" checked={plainText} onCheckedChange={setPlainText} />
                <Label htmlFor="plain-text">Plain text editor</Label>
              </div>
            </div>
            {jsonText !== null &&
              (plainText ? (
                <Textarea
                  aria-label="Config JSON"
                  value={jsonText}
                  onChange={(e) => setJsonText(e.target.value)}
                  spellCheck={false}
                  className="h-[560px] font-mono text-xs"
                />
              ) : (
                <div className="overflow-hidden rounded-md border">
                  <JsonEditor value={jsonText} onChange={setJsonText} schema={meta.configJsonSchema} />
                </div>
              ))}
          </TabsContent>
        </div>
      </Tabs>

      <PublishDialog
        open={publishOpen}
        onOpenChange={setPublishOpen}
        tenantName={tenantName}
        nextVersion={version + 1}
        changes={changes}
        removedKeys={result.removedListKeys}
        customFieldChanges={result.customFieldChanges}
        pending={publishing}
        onPublish={publish}
      />
    </div>
  );
}
