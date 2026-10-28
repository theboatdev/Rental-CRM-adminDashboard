"use client";

import { Loader2, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signLogoUploadAction } from "@/lib/actions/config";
import { Field, TextField } from "../field";
import { toNullable, type SectionProps } from "../types";

/**
 * Uploads a logo straight to Cloudinary: the backend signs the upload, the
 * browser posts the file, and the public URL goes into the draft. It's live
 * once the config is published.
 */
function LogoUpload({ tenantId, onUploaded }: { tenantId: string; onUploaded: (url: string) => void }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setPending(true);
    setError(null);
    try {
      const signed = await signLogoUploadAction(tenantId);
      if (!signed.ok) throw new Error(signed.error);
      const form = new FormData();
      for (const [key, value] of Object.entries(signed.data.fields)) form.append(key, String(value));
      form.append("file", file);
      const res = await fetch(signed.data.uploadUrl, { method: "POST", body: form });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error?.message ?? `The upload failed (${res.status})`);
      onUploaded(data.secure_url);
      toast.success("Logo uploaded", { description: "Publish the config to use it." });
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "The upload failed");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="space-y-1">
      <Button asChild variant="outline" size="sm" className={pending ? "pointer-events-none opacity-60" : "cursor-pointer"}>
        <label>
          {pending ? <Loader2 className="animate-spin" /> : <Upload />}
          {pending ? "Uploading…" : "Upload logo"}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            onChange={(e) => {
              void upload(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>
      </Button>
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

export function BrandingSection({ tenantId, config, update, issue }: SectionProps) {
  const b = config.branding;
  const validColor = /^#[0-9A-Fa-f]{6}$/.test(b.primaryColor);
  const validLogo = typeof b.logoUrl === "string" && b.logoUrl.startsWith("https://");

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
        <div className="space-y-2">
          <TextField
            id="branding-logoUrl"
            label="Logo URL"
            type="url"
            placeholder="https://…"
            hint="Upload a PNG, JPG or WebP (stored at most 512 px), or paste an https URL. The booking page shows it too."
            value={b.logoUrl}
            onChange={(v) => update((d) => { d.branding.logoUrl = toNullable(v); })}
            error={issue("branding.logoUrl")}
          />
          <LogoUpload tenantId={tenantId} onUploaded={(url) => update((d) => { d.branding.logoUrl = url; })} />
        </div>
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
            {validLogo ? (
              // A tenant-supplied URL, which next/image can't optimize without listing its host.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={b.logoUrl!} alt="" className="size-10 shrink-0 object-contain" />
            ) : (
              <span
                className="flex size-10 shrink-0 items-center justify-center rounded-md text-lg font-black text-white"
                style={{ background: validColor ? b.primaryColor : "var(--muted-foreground)" }}
              >
                {b.shortName.trim().charAt(0).toUpperCase() || "?"}
              </span>
            )}
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
