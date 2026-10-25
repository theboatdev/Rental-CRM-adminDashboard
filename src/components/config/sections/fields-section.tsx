"use client";

import { Lock, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { BuiltInFieldMeta, CustomField, CustomFieldType, FieldSection, TenantConfig } from "@/lib/contract";
import { cn } from "@/lib/utils";
import { NumberField } from "../field";
import type { SectionProps } from "../types";

const SECTIONS: Array<{ key: FieldSection; title: string; description: string }> = [
  { key: "vehicles", title: "Vehicles", description: "The vehicle form, its dossier and the fleet cards." },
  { key: "renters", title: "Renters", description: "The registration form, renter profiles and the renters list." },
  { key: "rentals", title: "Rentals", description: "The booking form, rental details and the rentals list. Notes and custom fields stay editable." },
  { key: "payments", title: "Payments", description: "The payment form (also a booking's advance) and the ledger. Entries can't be edited later." },
  { key: "costs", title: "Costs", description: "The cost form and the costs list. Entries can't be edited later." },
];

const TYPES: Array<{ value: CustomFieldType; label: string }> = [
  { value: "text", label: "Text" },
  { value: "longText", label: "Long text" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "boolean", label: "Yes / no" },
  { value: "select", label: "Choice list" },
];

const BUILT_IN_TYPE_LABELS: Record<BuiltInFieldMeta["type"], string> = {
  text: "Text",
  longText: "Long text",
  number: "Number",
  money: "Amount",
  distance: "Distance",
  date: "Date",
  select: "Choice",
  contact: "Contact",
  documents: "Documents",
  reference: "Record",
};

const MAX_FIELDS = 20;

/** "Insurance expiry" → "insuranceExpiry". */
function camelCase(label: string) {
  const words = label
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);
  const joined = words.map((word, index) => (index === 0 ? word.toLowerCase() : word[0]!.toUpperCase() + word.slice(1).toLowerCase())).join("");
  return joined.replace(/^\d+/, "").slice(0, 40);
}

/** The field as `type`, keeping its shared settings and starting the type's own from defaults. */
function withType(field: CustomField, type: CustomFieldType): CustomField {
  const base = {
    key: field.key,
    label: field.label,
    required: field.required,
    active: field.active,
    showInList: field.showInList,
    helpText: field.helpText,
  };
  switch (type) {
    case "text":
      return { ...base, type, maxLength: 200 };
    case "longText":
      return { ...base, type, maxLength: 2000 };
    case "number":
      return { ...base, type, min: null, max: null };
    case "select":
      return { ...base, type, options: [{ key: "", label: "", active: true }] };
    default:
      return { ...base, type };
  }
}

const toOptionalNumber = (value: string) => (value === "" ? null : Number(value));

export function FieldsSection(props: SectionProps) {
  const [section, setSection] = useState<FieldSection>("vehicles");
  const current = SECTIONS.find((s) => s.key === section)!;

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Every field of each record type: the built-in ones, then the tenant&apos;s own. Rename fields, add help text, make them
        required, choose list columns, or switch fields off so they disappear from forms, views and lists. Records keep the values
        of fields that are off. Core fields are ones the booking and payment rules depend on, so they always stay on.
      </p>

      <div className="flex flex-wrap gap-1" role="tablist" aria-label="Record type">
        {SECTIONS.map(({ key, title }) => {
          const fields = props.config.fields[key];
          const on = Object.values(fields.builtIn).filter((f) => f.active).length + fields.custom.filter((f) => f.active).length;
          const issues = props.issueCount(`fields.${key}`);
          return (
            <Button
              key={key}
              size="sm"
              role="tab"
              aria-selected={section === key}
              variant={section === key ? "secondary" : "ghost"}
              onClick={() => setSection(key)}
              className="gap-1.5"
            >
              {title}
              <span className="text-xs text-muted-foreground">{on} on</span>
              {issues > 0 && (
                <Badge variant="destructive" className="h-4 min-w-4 px-1 text-[10px]">
                  {issues}
                </Badge>
              )}
            </Button>
          );
        })}
      </div>

      <div>
        <h3 className="text-sm font-semibold">{current.title}</h3>
        <p className="text-xs text-muted-foreground">{current.description}</p>
        {!props.config.modules[section].enabled && (
          <p className="mt-1 text-xs text-muted-foreground">The {current.title} module is off, so these fields only show once it&apos;s on.</p>
        )}
      </div>

      <BuiltInFieldList key={`built-in-${section}`} section={section} {...props} />
      <CustomFieldList key={`custom-${section}`} section={section} {...props} />
    </div>
  );
}

function BuiltInFieldList({ section, config, meta, update, issue }: SectionProps & { section: FieldSection }) {
  return (
    <section className="space-y-2">
      <h4 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Built-in fields</h4>
      {meta.builtInFields[section].map((field) => (
        <BuiltInFieldRow
          key={field.key}
          section={section}
          field={field}
          settings={config.fields[section].builtIn[field.key]!}
          secondaryCurrency={config.locale.secondaryCurrency}
          update={update}
          issue={issue}
        />
      ))}
    </section>
  );
}

function BuiltInFieldRow({
  section,
  field,
  settings,
  secondaryCurrency,
  update,
  issue,
}: {
  section: FieldSection;
  field: BuiltInFieldMeta;
  settings: TenantConfig["fields"][FieldSection]["builtIn"][string];
  secondaryCurrency: string | null;
  update: SectionProps["update"];
  issue: SectionProps["issue"];
}) {
  const path = `fields.${section}.builtIn.${field.key}`;
  const id = `bf-${section}-${field.key}`;
  const edit = (mutate: (s: typeof settings) => void) => update((d) => mutate(d.fields[section].builtIn[field.key]!));
  const error = (key: string) => issue(`${path}.${key}`);
  const errors = ["active", "required", "showInList"].map(error).filter(Boolean);
  const unused = field.secondaryCurrencyOnly && !secondaryCurrency;

  return (
    <div className={cn("grid gap-3 rounded-lg border p-3 lg:grid-cols-[1fr_1fr_auto]", !settings.active && "bg-muted/40")}>
      <div>
        <Input
          aria-label={`Label of ${field.label}`}
          value={settings.label}
          placeholder={field.label}
          aria-invalid={!!error("label")}
          onChange={(e) => edit((s) => { s.label = e.target.value; })}
        />
        {error("label") && <p className="mt-1 text-xs text-destructive">{error("label")}</p>}
        <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <span className="font-mono">{field.key}</span>
          <span>· {BUILT_IN_TYPE_LABELS[field.type]}</span>
          {field.core && (
            <Badge variant="secondary" className="h-4 gap-1 px-1.5 text-[10px]">
              <Lock className="size-2.5" aria-hidden /> Core
            </Badge>
          )}
          {settings.label !== field.label && (
            <button type="button" className="underline-offset-2 hover:underline" onClick={() => edit((s) => { s.label = field.label; })}>
              Reset to “{field.label}”
            </button>
          )}
        </p>
      </div>
      <div>
        <Input
          aria-label={`Help text of ${field.label}`}
          value={settings.helpText}
          placeholder="Help text (optional)"
          aria-invalid={!!error("helpText")}
          onChange={(e) => edit((s) => { s.helpText = e.target.value; })}
        />
        {error("helpText") && <p className="mt-1 text-xs text-destructive">{error("helpText")}</p>}
        {(field.note || unused) && (
          <p className="mt-1 text-xs text-muted-foreground">{unused ? "Not used: the tenant has no second currency." : field.note}</p>
        )}
      </div>
      <div className="flex flex-wrap items-start gap-x-5 gap-y-2 pt-2">
        {(
          [
            ["active", "On"],
            ["required", "Required"],
            ["showInList", "In list"],
          ] as const
        ).map(([setting, label]) => (
          <div key={setting} className="flex items-center gap-2" title={field.core ? "Core field: always on, required and in lists" : undefined}>
            <Switch
              id={`${id}-${setting}`}
              checked={settings[setting]}
              disabled={field.core || (setting !== "active" && !settings.active)}
              onCheckedChange={(on) => edit((s) => { s[setting] = on; })}
            />
            <Label htmlFor={`${id}-${setting}`} className="font-normal">
              {label}
            </Label>
          </div>
        ))}
        {errors.length > 0 && <p className="w-full text-xs text-destructive">{errors[0]}</p>}
      </div>
    </div>
  );
}

function CustomFieldList({ section, config, baseline, update, issue }: SectionProps & { section: FieldSection }) {
  const fields = config.fields[section].custom;
  const path = `fields.${section}.custom`;

  const addField = () =>
    update((d) => {
      d.fields[section].custom.push({ key: "", label: "", type: "text", maxLength: 200, required: false, active: true, showInList: false, helpText: "" });
    });

  return (
    <section className="space-y-3">
      <div>
        <h4 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Custom fields</h4>
        <p className="text-xs text-muted-foreground">
          Shown after the built-in ones, in this order. Records store values under the field&apos;s <span className="font-mono">key</span>, so
          labels can change freely. Keys with a lock are in use: switch a field off rather than removing it or changing its type.
        </p>
        {issue(path) && <p className="text-xs text-destructive">{issue(path)}</p>}
      </div>

      {fields.length === 0 && <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">No custom fields yet.</p>}

      <div className="space-y-3">
        {fields.map((field, index) => (
          <FieldCard
            key={index}
            section={section}
            index={index}
            field={field}
            published={baseline.fields[section].custom.find((f) => f.key === field.key && field.key !== "")}
            update={update}
            issue={issue}
          />
        ))}
      </div>

      <Button size="sm" variant="outline" onClick={addField} disabled={fields.length >= MAX_FIELDS}>
        <Plus /> Add field
      </Button>
      {fields.length >= MAX_FIELDS && <p className="text-xs text-muted-foreground">{MAX_FIELDS} custom fields is the limit per record type.</p>}
    </section>
  );
}

function FieldCard({
  section,
  index,
  field,
  published,
  update,
  issue,
}: {
  section: FieldSection;
  index: number;
  field: CustomField;
  published: CustomField | undefined;
  update: SectionProps["update"];
  issue: SectionProps["issue"];
}) {
  const path = `fields.${section}.custom[${index}]`;
  const id = `cf-${section}-${index}`;
  const name = field.label || `Field ${index + 1}`;
  const edit = (mutate: (f: CustomField) => void) => update((d) => mutate(d.fields[section].custom[index]!));
  const error = (key: string) => issue(`${path}.${key}`);

  return (
    <div className={cn("space-y-3 rounded-lg border p-3", !field.active && "bg-muted/40")}>
      {issue(path) && <p className="text-xs text-destructive">{issue(path)}</p>}

      <div className="flex flex-wrap items-start gap-2">
        <div className="min-w-48 flex-1">
          <Input
            aria-label={`Label of field ${index + 1}`}
            value={field.label}
            placeholder="Label, e.g. Insurance expiry"
            aria-invalid={!!error("label")}
            onChange={(e) =>
              edit((f) => {
                // New fields take their key from the label until the key is edited by hand.
                if (!published && f.key === camelCase(f.label)) f.key = camelCase(e.target.value);
                f.label = e.target.value;
              })
            }
          />
          {error("label") && <p className="mt-1 text-xs text-destructive">{error("label")}</p>}
        </div>
        <div className="w-full sm:w-48">
          <div className="relative">
            <Input
              aria-label={`Key of field ${index + 1}`}
              value={field.key}
              placeholder="fieldKey"
              className={cn("font-mono text-xs", published && "pr-7")}
              aria-invalid={!!error("key")}
              onChange={(e) => edit((f) => { f.key = e.target.value.replace(/[^a-zA-Z0-9]/g, ""); })}
            />
            {published && <Lock className="absolute top-1/2 right-2 size-3.5 -translate-y-1/2 text-muted-foreground" aria-label="In use" />}
          </div>
          {error("key") && <p className="mt-1 text-xs text-destructive">{error("key")}</p>}
        </div>
        <div className="w-full sm:w-40">
          <Select
            value={field.type}
            onValueChange={(type) => update((d) => { d.fields[section].custom[index] = withType(d.fields[section].custom[index]!, type as CustomFieldType); })}
          >
            <SelectTrigger aria-label={`Type of ${name}`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {error("type") && <p className="mt-1 text-xs text-destructive">{error("type")}</p>}
        </div>
        <Button size="icon-sm" variant="ghost" className="mt-1" aria-label={`Remove ${name}`} onClick={() => update((d) => { d.fields[section].custom.splice(index, 1); })}>
          <Trash2 />
        </Button>
      </div>

      {published && published.type !== field.type && (
        <p className="text-xs text-amber-700 dark:text-amber-400">
          Records already hold {TYPES.find((t) => t.value === published.type)?.label.toLowerCase()} values for this key. Consider a new field instead.
        </p>
      )}

      <div>
        <Input
          aria-label={`Help text of ${name}`}
          value={field.helpText}
          placeholder="Help text shown under the input (optional)"
          aria-invalid={!!error("helpText")}
          onChange={(e) => edit((f) => { f.helpText = e.target.value; })}
        />
        {error("helpText") && <p className="mt-1 text-xs text-destructive">{error("helpText")}</p>}
      </div>

      {(field.type === "text" || field.type === "longText") && (
        <div className="max-w-48">
          <NumberField
            id={`${id}-maxLength`}
            label="Maximum length"
            min={1}
            step={1}
            suffix="characters"
            value={field.maxLength}
            onChange={(value) => edit((f) => { if (f.type === "text" || f.type === "longText") f.maxLength = value; })}
            error={error("maxLength")}
          />
        </div>
      )}

      {field.type === "number" && (
        <div className="grid max-w-md grid-cols-2 gap-3">
          {(["min", "max"] as const).map((bound) => (
            <div key={bound} className="space-y-1.5">
              <Label htmlFor={`${id}-${bound}`}>{bound === "min" ? "Minimum" : "Maximum"}</Label>
              <Input
                id={`${id}-${bound}`}
                type="number"
                inputMode="decimal"
                placeholder="None"
                className="font-mono"
                value={field[bound] ?? ""}
                aria-invalid={!!error(bound)}
                onChange={(e) => edit((f) => { if (f.type === "number") f[bound] = toOptionalNumber(e.target.value); })}
              />
              {error(bound) && <p className="text-xs text-destructive">{error(bound)}</p>}
            </div>
          ))}
        </div>
      )}

      {field.type === "select" && (
        <OptionsEditor
          path={`${path}.options`}
          name={name}
          options={field.options}
          publishedKeys={new Set(published?.type === "select" ? published.options.map((o) => o.key) : [])}
          edit={edit}
          issue={issue}
        />
      )}

      <div className="flex flex-wrap gap-x-6 gap-y-2">
        {(
          [
            ["active", "On"],
            ["required", field.type === "boolean" ? "Must be ticked" : "Required"],
            ["showInList", "In list"],
          ] as const
        ).map(([setting, label]) => (
          <div key={setting} className="flex items-center gap-2">
            <Switch id={`${id}-${setting}`} checked={field[setting]} onCheckedChange={(on) => edit((f) => { f[setting] = on; })} />
            <Label htmlFor={`${id}-${setting}`} className="font-normal">
              {label}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
}

function OptionsEditor({
  path,
  name,
  options,
  publishedKeys,
  edit,
  issue,
}: {
  path: string;
  name: string;
  options: Array<{ key: string; label: string; active: boolean }>;
  publishedKeys: Set<string>;
  edit: (mutate: (f: CustomField) => void) => void;
  issue: SectionProps["issue"];
}) {
  const editOptions = (mutate: (options: Array<{ key: string; label: string; active: boolean }>) => void) =>
    edit((f) => {
      if (f.type === "select") mutate(f.options);
    });

  return (
    <div className="space-y-2 rounded-md bg-muted/30 p-2">
      <p className="text-xs font-medium">Options</p>
      {issue(path) && <p className="text-xs text-destructive">{issue(path)}</p>}
      {options.map((option, index) => {
        const keyError = issue(`${path}[${index}].key`);
        const labelError = issue(`${path}[${index}].label`);
        const published = publishedKeys.has(option.key);
        return (
          <div key={index} className="flex flex-wrap items-start gap-2">
            <div className="w-full sm:w-44">
              <div className="relative">
                <Input
                  aria-label={`${name} option ${index + 1} key`}
                  value={option.key}
                  placeholder="OPTION_KEY"
                  className={cn("h-8 font-mono text-xs", published && "pr-7")}
                  aria-invalid={!!keyError}
                  onChange={(e) => editOptions((o) => { o[index]!.key = e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_"); })}
                />
                {published && <Lock className="absolute top-1/2 right-2 size-3.5 -translate-y-1/2 text-muted-foreground" aria-label="In use" />}
              </div>
              {keyError && <p className="mt-1 text-xs text-destructive">{keyError}</p>}
            </div>
            <div className="min-w-40 flex-1">
              <Input
                aria-label={`${name} option ${index + 1} label`}
                value={option.label}
                placeholder="Label"
                className="h-8"
                aria-invalid={!!labelError}
                onChange={(e) => editOptions((o) => { o[index]!.label = e.target.value; })}
              />
              {labelError && <p className="mt-1 text-xs text-destructive">{labelError}</p>}
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Switch
                aria-label={`${option.label || "Option"} active`}
                checked={option.active}
                onCheckedChange={(on) => editOptions((o) => { o[index]!.active = on; })}
              />
              <Button size="icon-sm" variant="ghost" aria-label="Remove option" onClick={() => editOptions((o) => { o.splice(index, 1); })}>
                <Trash2 />
              </Button>
            </div>
          </div>
        );
      })}
      <Button size="sm" variant="ghost" onClick={() => editOptions((o) => { o.push({ key: "", label: "", active: true }); })}>
        <Plus /> Add option
      </Button>
    </div>
  );
}
