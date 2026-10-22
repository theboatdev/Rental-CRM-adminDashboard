"use client";

import { Lock, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type { TenantConfig } from "@/lib/contract";
import { cn } from "@/lib/utils";
import type { SectionProps } from "../types";

type ListKey = keyof TenantConfig["lists"];

const LISTS: Array<{ key: ListKey; title: string; description: string }> = [
  { key: "documentTypes", title: "Identity documents", description: "Documents collected from renters, and who must provide them." },
  { key: "paymentMethods", title: "Payment methods", description: "Methods staff can choose when recording a payment." },
  { key: "costCategories", title: "Cost categories", description: "Categories for workshop bills and other operating costs." },
];

export function ListsSection(props: SectionProps) {
  return (
    <div className="space-y-8">
      <p className="text-sm text-muted-foreground">
        Records store the <span className="font-mono">KEY</span>, so labels can change freely. Keys marked with a lock are
        used by the published config: deactivate them instead of renaming or removing.
      </p>
      {LISTS.map((list) => (
        <ListEditor key={list.key} listKey={list.key} title={list.title} description={list.description} {...props} />
      ))}
    </div>
  );
}

function ListEditor({
  listKey,
  title,
  description,
  config,
  baseline,
  update,
  issue,
  meta,
}: SectionProps & { listKey: ListKey; title: string; description: string }) {
  const items = config.lists[listKey];
  const publishedKeys = new Set(baseline.lists[listKey].map((item) => item.key));
  const path = `lists.${listKey}`;

  const addRow = () =>
    update((d) => {
      if (listKey === "documentTypes") d.lists.documentTypes.push({ key: "", label: "", active: true, requiredFor: [] });
      else d.lists[listKey].push({ key: "", label: "", active: true });
    });

  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
        {issue(path) && <p className="text-xs text-destructive">{issue(path)}</p>}
      </div>
      <div className="space-y-2">
        {items.map((item, index) => {
          const keyError = issue(`${path}[${index}].key`);
          const labelError = issue(`${path}[${index}].label`);
          const published = publishedKeys.has(item.key);
          return (
            <div key={index} className={cn("flex flex-wrap items-start gap-2 rounded-lg border p-2", !item.active && "bg-muted/40")}>
              <div className="w-full sm:w-52">
                <div className="relative">
                  <Input
                    aria-label={`${title} key ${index + 1}`}
                    value={item.key}
                    placeholder="NEW_KEY"
                    className={cn("font-mono text-xs", published && "pr-7")}
                    aria-invalid={!!keyError}
                    onChange={(e) =>
                      update((d) => {
                        d.lists[listKey][index]!.key = e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_");
                      })
                    }
                  />
                  {published && (
                    <Lock className="absolute top-1/2 right-2 size-3.5 -translate-y-1/2 text-muted-foreground" aria-label="In use" />
                  )}
                </div>
                {keyError && <p className="mt-1 text-xs text-destructive">{keyError}</p>}
              </div>
              <div className="min-w-48 flex-1">
                <Input
                  aria-label={`${title} label ${index + 1}`}
                  value={item.label}
                  placeholder="Label"
                  aria-invalid={!!labelError}
                  onChange={(e) => update((d) => { d.lists[listKey][index]!.label = e.target.value; })}
                />
                {labelError && <p className="mt-1 text-xs text-destructive">{labelError}</p>}
              </div>
              {listKey === "documentTypes" && "requiredFor" in item && (
                <div className="flex items-center gap-1" role="group" aria-label="Required for">
                  {meta.residentTypes.map((type) => {
                    const on = item.requiredFor.includes(type);
                    return (
                      <Button
                        key={type}
                        size="sm"
                        variant={on ? "secondary" : "ghost"}
                        aria-pressed={on}
                        title={`Required for ${type === "local" ? "local residents" : "tourists"}`}
                        onClick={() =>
                          update((d) => {
                            const doc = d.lists.documentTypes[index]!;
                            doc.requiredFor = on ? doc.requiredFor.filter((t) => t !== type) : [...doc.requiredFor, type];
                          })
                        }
                      >
                        {type === "local" ? "Local" : "Tourist"}
                      </Button>
                    );
                  })}
                </div>
              )}
              <div className="flex items-center gap-2 pt-1.5">
                <Switch
                  aria-label={`${item.label || "Item"} active`}
                  checked={item.active}
                  onCheckedChange={(on) => update((d) => { d.lists[listKey][index]!.active = on; })}
                />
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label="Remove"
                  onClick={() => update((d) => { d.lists[listKey].splice(index, 1); })}
                >
                  <Trash2 />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
      <Button size="sm" variant="outline" onClick={addRow}>
        <Plus /> Add
      </Button>
    </section>
  );
}
