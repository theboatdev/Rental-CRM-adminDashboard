"use client";

import { Lock, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type { DocumentType, ListItem, TenantConfig, VehicleDocumentType } from "@/lib/contract";
import { cn } from "@/lib/utils";
import type { SectionProps } from "../types";

type ListKey = keyof TenantConfig["lists"];

const LISTS: Array<{ key: ListKey; title: string; description: string }> = [
  { key: "documentTypes", title: "Identity documents", description: "Documents collected from renters, and who must provide them." },
  { key: "paymentMethods", title: "Payment methods", description: "Methods staff can choose when recording a payment." },
  { key: "costCategories", title: "Cost categories", description: "Categories for workshop bills and other operating costs." },
  { key: "vehicleDocumentTypes", title: "Vehicle compliance documents", description: "Document types vehicles must carry (e.g. insurance, revenue licence). An alert fires on the dashboard before each expires." },
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
  const items: ListItem[] = config.lists[listKey] ?? [];
  const publishedKeys = new Set((baseline.lists[listKey] ?? []).map((item) => item.key));
  const path = `lists.${listKey}`;

  const ensureVehicleDocs = (d: TenantConfig): VehicleDocumentType[] => {
    d.lists.vehicleDocumentTypes ??= [];
    return d.lists.vehicleDocumentTypes;
  };

  const setItemField = (index: number, field: "key" | "label" | "active", value: string | boolean) =>
    update((d) => {
      if (listKey === "documentTypes") {
        const item = d.lists.documentTypes[index]!;
        if (field === "active") item.active = value as boolean;
        else item[field] = value as string;
        return;
      }
      if (listKey === "vehicleDocumentTypes") {
        const item = ensureVehicleDocs(d)[index]!;
        if (field === "active") item.active = value as boolean;
        else item[field] = value as string;
        return;
      }
      if (listKey === "paymentMethods") {
        const item = d.lists.paymentMethods[index]!;
        if (field === "active") item.active = value as boolean;
        else item[field] = value as string;
        return;
      }
      const item = d.lists.costCategories[index]!;
      if (field === "active") item.active = value as boolean;
      else item[field] = value as string;
    });

  const addRow = () =>
    update((d) => {
      if (listKey === "documentTypes") {
        d.lists.documentTypes.push({ key: "", label: "", active: true, requiredFor: [] });
        return;
      }
      if (listKey === "vehicleDocumentTypes") {
        ensureVehicleDocs(d).push({ key: "", label: "", active: true, alertDaysBefore: 7 });
        return;
      }
      if (listKey === "paymentMethods") {
        d.lists.paymentMethods.push({ key: "", label: "", active: true });
        return;
      }
      d.lists.costCategories.push({ key: "", label: "", active: true });
    });

  const removeRow = (index: number) =>
    update((d) => {
      if (listKey === "documentTypes") d.lists.documentTypes.splice(index, 1);
      else if (listKey === "vehicleDocumentTypes") ensureVehicleDocs(d).splice(index, 1);
      else if (listKey === "paymentMethods") d.lists.paymentMethods.splice(index, 1);
      else d.lists.costCategories.splice(index, 1);
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
          const documentItem = listKey === "documentTypes" ? (item as DocumentType) : null;
          const vehicleDocItem = listKey === "vehicleDocumentTypes" ? (item as VehicleDocumentType) : null;
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
                    onChange={(e) => setItemField(index, "key", e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_"))}
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
                  onChange={(e) => setItemField(index, "label", e.target.value)}
                />
                {labelError && <p className="mt-1 text-xs text-destructive">{labelError}</p>}
              </div>
              {documentItem && (
                <div className="flex items-center gap-1" role="group" aria-label="Required for">
                  {meta.residentTypes.map((type) => {
                    const on = documentItem.requiredFor.includes(type);
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
              {vehicleDocItem && (
                <div className="flex items-center gap-1.5" title="Days before expiry to show a dashboard alert">
                  <Input
                    aria-label={`Alert days before expiry for ${item.label || "item"} ${index + 1}`}
                    type="number"
                    min={1}
                    max={365}
                    value={vehicleDocItem.alertDaysBefore}
                    className="w-16 text-xs"
                    onChange={(e) =>
                      update((d) => {
                        const doc = ensureVehicleDocs(d)[index]!;
                        doc.alertDaysBefore = Math.max(1, parseInt(e.target.value, 10) || 7);
                      })
                    }
                  />
                  <span className="text-xs text-muted-foreground whitespace-nowrap">days alert</span>
                </div>
              )}
              <div className="flex items-center gap-2 pt-1.5">
                <Switch
                  aria-label={`${item.label || "Item"} active`}
                  checked={item.active}
                  onCheckedChange={(on) => setItemField(index, "active", on)}
                />
                <Button size="icon-sm" variant="ghost" aria-label="Remove" onClick={() => removeRow(index)}>
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
