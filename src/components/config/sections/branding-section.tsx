"use client";

import { Input } from "@/components/ui/input";
import { Field, TextField } from "../field";
import { toNullable, type SectionProps } from "../types";

export function BrandingSection({ config, update, issue }: SectionProps) {
  const b = config.branding;
  const validColor = /^#[0-9A-Fa-f]{6}$/.test(b.primaryColor);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          id="branding-displayName"
          label="Display name"
          value={b.displayName}
          onChange={(v) => update((d) => { d.branding.displayName = v; })}
          error={issue("branding.displayName")}
        />
        <TextField
          id="branding-shortName"
          label="Short name"
          hint="Used where space is tight, e.g. the app header."
          value={b.shortName}
          onChange={(v) => update((d) => { d.branding.shortName = v; })}
          error={issue("branding.shortName")}
        />
        <TextField
          id="branding-tagline"
          label="Tagline"
          className="sm:col-span-2"
          value={b.tagline}
          onChange={(v) => update((d) => { d.branding.tagline = v; })}
          error={issue("branding.tagline")}
        />
        <TextField
          id="branding-logoUrl"
          label="Logo URL"
          type="url"
          placeholder="https://…"
          hint="Upload to storage comes in Phase 5; paste an https URL for now."
          value={b.logoUrl}
          onChange={(v) => update((d) => { d.branding.logoUrl = toNullable(v); })}
          error={issue("branding.logoUrl")}
        />
        <Field label="Primary colour" htmlFor="branding-primaryColor" error={issue("branding.primaryColor")}>
          <div className="flex gap-2">
            <input
              type="color"
              aria-label="Pick primary colour"
              value={validColor ? b.primaryColor : "#000000"}
              onChange={(e) => update((d) => { d.branding.primaryColor = e.target.value.toUpperCase(); })}
              className="h-9 w-12 cursor-pointer rounded-md border bg-transparent p-1"
            />
            <Input
              id="branding-primaryColor"
              className="font-mono"
              value={b.primaryColor}
              onChange={(e) => update((d) => { d.branding.primaryColor = e.target.value; })}
              aria-invalid={!!issue("branding.primaryColor")}
            />
          </div>
        </Field>
        <TextField
          id="branding-supportEmail"
          label="Support email"
          type="email"
          value={b.supportEmail}
          onChange={(v) => update((d) => { d.branding.supportEmail = toNullable(v); })}
          error={issue("branding.supportEmail")}
        />
        <TextField
          id="branding-supportPhone"
          label="Support phone"
          placeholder="+94 77 123 4567"
          value={b.supportPhone}
          onChange={(v) => update((d) => { d.branding.supportPhone = toNullable(v); })}
          error={issue("branding.supportPhone")}
        />
        <TextField
          id="branding-whatsappNumber"
          label="WhatsApp booking number"
          placeholder="+94771234567"
          mono
          hint="Guests send their booking voucher here."
          value={b.whatsappNumber}
          onChange={(v) => update((d) => { d.branding.whatsappNumber = toNullable(v); })}
          error={issue("branding.whatsappNumber")}
        />
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Preview</p>
        <div className="overflow-hidden rounded-lg border">
          <div className="h-1.5" style={{ background: validColor ? b.primaryColor : undefined }} />
          <div className="flex items-center gap-3 p-4">
            <span
              className="flex size-10 shrink-0 items-center justify-center rounded-md text-lg font-black text-white"
              style={{ background: validColor ? b.primaryColor : "var(--muted-foreground)" }}
            >
              {b.shortName.trim().charAt(0).toUpperCase() || "?"}
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold">{b.displayName || "Display name"}</p>
              <p className="truncate text-xs text-muted-foreground">{b.tagline || "Tagline"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
