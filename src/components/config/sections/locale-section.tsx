"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field, TextField } from "../field";
import { toNullable, type SectionProps } from "../types";

const TIME_ZONES = typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : [];
// A fixed sample keeps the preview deterministic.
const SAMPLE_DATE = new Date("2026-10-21T09:30:00Z");

function preview(fn: () => string) {
  try {
    return fn();
  } catch {
    return "—";
  }
}

export function LocaleSection({ config, update, issue }: SectionProps) {
  const l = config.locale;
  const money = (currency: string) =>
    preview(() => new Intl.NumberFormat(l.dateLocale, { style: "currency", currency }).format(22500));

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          id="locale-country"
          label="Country"
          hint="ISO 3166-1 alpha-2, e.g. LK"
          mono
          value={l.country}
          onChange={(v) => update((d) => { d.locale.country = v.toUpperCase(); })}
          error={issue("locale.country")}
        />
        <TextField
          id="locale-currency"
          label="Currency"
          hint="ISO 4217, e.g. LKR"
          mono
          value={l.currency}
          onChange={(v) => update((d) => { d.locale.currency = v.toUpperCase(); })}
          error={issue("locale.currency")}
        />
        <TextField
          id="locale-secondaryCurrency"
          label="Secondary currency"
          hint="Optional, for showing tourist prices (e.g. USD)"
          mono
          value={l.secondaryCurrency}
          onChange={(v) => update((d) => { d.locale.secondaryCurrency = toNullable(v.toUpperCase()); })}
          error={issue("locale.secondaryCurrency")}
        />
        <Field label="Time zone" htmlFor="locale-timezone" hint="Also schedules the WhatsApp digest." error={issue("locale.timezone")}>
          <input
            id="locale-timezone"
            list="time-zones"
            value={l.timezone}
            onChange={(e) => update((d) => { d.locale.timezone = e.target.value; })}
            aria-invalid={!!issue("locale.timezone")}
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 font-mono text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive"
          />
          <datalist id="time-zones">
            {TIME_ZONES.map((tz) => (
              <option key={tz} value={tz} />
            ))}
          </datalist>
        </Field>
        <TextField
          id="locale-dateLocale"
          label="Formatting locale"
          hint="BCP 47 tag for dates and numbers, e.g. en-GB"
          mono
          value={l.dateLocale}
          onChange={(v) => update((d) => { d.locale.dateLocale = v; })}
          error={issue("locale.dateLocale")}
        />
        <Field label="Distance unit" htmlFor="locale-distanceUnit">
          <Select value={l.distanceUnit} onValueChange={(v) => update((d) => { d.locale.distanceUnit = v as "km" | "mi"; })}>
            <SelectTrigger id="locale-distanceUnit" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="km">Kilometres</SelectItem>
              <SelectItem value="mi">Miles</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>

      <div className="space-y-2 text-sm">
        <p className="font-medium">Preview</p>
        <dl className="space-y-2 rounded-lg border p-4">
          <div>
            <dt className="text-xs text-muted-foreground">Daily rate</dt>
            <dd className="font-mono">
              {money(l.currency)}
              {l.secondaryCurrency && <span className="text-muted-foreground"> · {money(l.secondaryCurrency)}</span>}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Pickup time</dt>
            <dd className="font-mono">
              {preview(() =>
                new Intl.DateTimeFormat(l.dateLocale, { dateStyle: "medium", timeStyle: "short", timeZone: l.timezone }).format(SAMPLE_DATE),
              )}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
