"use client";

import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ModuleKey } from "@/lib/contract";
import type { SectionProps } from "../types";

export function NavigationSection({ config, update, issue, meta }: SectionProps) {
  const nav = config.navigation;
  const labelOf = (key: ModuleKey) => meta.modules.find((m) => m.key === key)?.label ?? key;
  const missing = meta.modules
    .filter((m) => m.tab && !nav.some((item) => item.module === m.key))
    .map((m) => m.key);
  const visible = nav.filter((item) => config.modules[item.module].enabled);

  const move = (from: number, to: number) =>
    update((d) => {
      const [item] = d.navigation.splice(from, 1);
      if (item) d.navigation.splice(to, 0, item);
    });

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Order and labels of the tenant app&apos;s tabs. Tabs for disabled modules stay in the list but are hidden.
      </p>
      {issue("navigation") && <p className="text-sm text-destructive">{issue("navigation")}</p>}

      <ol className="space-y-2">
        {nav.map((item, index) => {
          const enabled = config.modules[item.module].enabled;
          const error = issue(`navigation[${index}].label`) ?? issue(`navigation[${index}].module`);
          return (
            <li key={item.module} className="flex flex-wrap items-center gap-2 rounded-lg border p-2 sm:flex-nowrap">
              <span className="w-6 text-center font-mono text-xs text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
              <span className="w-40 shrink-0 text-sm">
                {labelOf(item.module)}
                {!enabled && (
                  <Badge variant="outline" className="ml-2 text-muted-foreground">
                    hidden
                  </Badge>
                )}
              </span>
              <div className="min-w-40 flex-1">
                <Input
                  aria-label={`Tab label for ${labelOf(item.module)}`}
                  value={item.label}
                  onChange={(e) => update((d) => { d.navigation[index]!.label = e.target.value; })}
                  aria-invalid={!!error}
                />
                {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
              </div>
              <div className="flex gap-1">
                <Button size="icon-sm" variant="ghost" aria-label="Move up" disabled={index === 0} onClick={() => move(index, index - 1)}>
                  <ArrowUp />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label="Move down"
                  disabled={index === nav.length - 1}
                  onClick={() => move(index, index + 1)}
                >
                  <ArrowDown />
                </Button>
                <Button size="icon-sm" variant="ghost" aria-label="Remove tab" onClick={() => update((d) => { d.navigation.splice(index, 1); })}>
                  <Trash2 />
                </Button>
              </div>
            </li>
          );
        })}
      </ol>

      {missing.length > 0 && (
        <Select value="" onValueChange={(key) => update((d) => { d.navigation.push({ module: key as ModuleKey, label: labelOf(key as ModuleKey) }); })}>
          <SelectTrigger className="w-60" aria-label="Add a tab">
            <SelectValue placeholder="Add a tab…" />
          </SelectTrigger>
          <SelectContent>
            {missing.map((key) => (
              <SelectItem key={key} value={key}>
                {labelOf(key)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <div className="space-y-2">
        <p className="text-sm font-medium">Preview</p>
        <div className="flex overflow-x-auto rounded-lg border">
          {visible.map((item, i) => (
            <span key={item.module} className="flex items-center gap-1.5 border-r px-4 py-3 font-mono text-xs whitespace-nowrap uppercase">
              <span className="text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
              {item.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
