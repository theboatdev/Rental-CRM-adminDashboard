"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Field, TextField } from "@/components/config/field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { removeWhatsAppAction, setWhatsAppAction } from "@/lib/actions/integrations";
import type { ConfigIssue } from "@/lib/contract";
import { formatDateTime } from "@/lib/format";
import type { WhatsAppConnection as Connection } from "@/lib/platform-api/types";

/**
 * The tenant's WhatsApp Cloud API connection: its own business number sends
 * its digest, on the schedule in its config. The backend stores it encrypted
 * and never returns the access token.
 */
export function WhatsAppConnection({ tenantId, connection }: { tenantId: string; connection: Connection }) {
  const router = useRouter();
  const connected = connection.connected ? connection : null;
  const [editing, setEditing] = useState(!connected);
  const [form, setForm] = useState({
    phoneNumberId: connected?.phoneNumberId ?? "",
    accessToken: "",
    templateName: connected?.templateName ?? "",
    templateLanguage: connected?.templateLanguage ?? "en",
  });
  const [issues, setIssues] = useState<ConfigIssue[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const issue = (path: string) => issues.find((i) => i.path === path)?.message;
  const set = (patch: Partial<typeof form>) => setForm((current) => ({ ...current, ...patch }));

  if (!connection.available) {
    return (
      <Alert>
        <AlertDescription>Set TENANT_SECRETS_KEY on the backend to connect WhatsApp. Credentials are stored encrypted with it.</AlertDescription>
      </Alert>
    );
  }

  const save = () =>
    startTransition(async () => {
      const res = await setWhatsAppAction(tenantId, {
        phoneNumberId: form.phoneNumberId.trim(),
        ...(form.accessToken.trim() ? { accessToken: form.accessToken.trim() } : {}),
        templateName: form.templateName.trim() || null,
        templateLanguage: form.templateLanguage.trim() || "en",
      });
      if (!res.ok) {
        setError(res.error);
        setIssues(res.issues ?? []);
        return;
      }
      setError(null);
      setIssues([]);
      set({ accessToken: "" });
      setEditing(false);
      toast.success("WhatsApp connected");
      router.refresh();
    });

  const disconnect = () =>
    startTransition(async () => {
      if (!confirm("Disconnect WhatsApp? Digests stop going out until it's connected again.")) return;
      const res = await removeWhatsAppAction(tenantId);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      toast.success("WhatsApp disconnected");
      setEditing(true);
      router.refresh();
    });

  return (
    <div className="space-y-4 text-sm">
      {connected && !editing && (
        <dl className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Connected</Badge>
            <span className="text-muted-foreground">{connected.mode === "template" ? `Template ${connected.templateName} (${connected.templateLanguage})` : "Plain text"}</span>
          </div>
          <p>
            Phone number ID <code className="font-mono text-xs">{connected.phoneNumberId}</code> · token ••••{connected.tokenEnding}
          </p>
          {connected.updatedAt && (
            <p className="text-xs text-muted-foreground">
              Updated {formatDateTime(connected.updatedAt)}
              {connected.updatedBy ? ` by ${connected.updatedBy.name}` : ""}
            </p>
          )}
          {connected.mode === "text" && (
            <p className="text-xs text-muted-foreground">
              WhatsApp only delivers plain text within 24 hours of the recipient&apos;s last message. Add an approved template for weekly delivery.
            </p>
          )}
        </dl>
      )}

      {editing ? (
        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            save();
          }}
        >
          <TextField
            id="whatsapp-phoneNumberId"
            label="Phone number ID"
            mono
            hint="WhatsApp Manager → API setup. Not the phone number itself."
            value={form.phoneNumberId}
            onChange={(phoneNumberId) => set({ phoneNumberId })}
            error={issue("phoneNumberId")}
          />
          <Field
            label="Access token"
            htmlFor="whatsapp-accessToken"
            hint={connected ? "Leave empty to keep the current token." : "A permanent system user token with whatsapp_business_messaging."}
            error={issue("accessToken")}
          >
            <Input
              id="whatsapp-accessToken"
              type="password"
              autoComplete="off"
              className="font-mono"
              value={form.accessToken}
              onChange={(e) => set({ accessToken: e.target.value })}
              aria-invalid={Boolean(issue("accessToken"))}
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
            <TextField
              id="whatsapp-templateName"
              label="Message template (optional)"
              mono
              placeholder="weekly_fleet_digest"
              hint="An approved Utility template whose body has two variables: {{1}} the company name, {{2}} the digest."
              value={form.templateName}
              onChange={(templateName) => set({ templateName })}
              error={issue("templateName")}
            />
            <TextField
              id="whatsapp-templateLanguage"
              label="Language"
              mono
              value={form.templateLanguage}
              onChange={(templateLanguage) => set({ templateLanguage })}
              error={issue("templateLanguage")}
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={pending}>
              {connected ? "Save" : "Connect WhatsApp"}
            </Button>
            {connected && (
              <Button type="button" variant="outline" disabled={pending} onClick={() => setEditing(false)}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            Edit
          </Button>
          <Button variant="outline" size="sm" disabled={pending} onClick={disconnect}>
            Disconnect
          </Button>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
