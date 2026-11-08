"use client";

import { Download, FileText, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { previewReturnReceiptAction } from "@/lib/actions/config";
import type { ReturnReceiptSettings, TenantConfig } from "@/lib/contract";
import { cn } from "@/lib/utils";
import { Field, SwitchField, TextField } from "../field";
import { LinesTextarea } from "../lines-textarea";
import type { SectionProps } from "../types";

type PlaceholderText = "returnStatement" | "footer";

const INCLUDED: Array<{ key: keyof ReturnReceiptSettings & `show${string}`; label: string; description: string }> = [
  { key: "showInspections", label: "Inspections", description: "Pickup and return: when, by whom, the odometer, the checked points and notes." },
  { key: "showInspectionPhotos", label: "Inspection photos", description: "A photo per checked point. Makes the PDF larger." },
  { key: "showPayments", label: "Payments", description: "Each payment of the rental, for members who may see the ledger. Totals always show." },
  { key: "showCustomFields", label: "Rental details", description: "The rental's custom fields and notes." },
  { key: "showSignatures", label: "Signature lines", description: "For the renter and the business." },
];

/** Sample values for the placeholders, to show how a text reads. */
function sampleValues(config: TenantConfig): Record<string, string> {
  let returnDate: string;
  try {
    returnDate = new Intl.DateTimeFormat(config.locale.dateLocale, { day: "numeric", month: "short", year: "numeric" }).format(new Date());
  } catch {
    returnDate = new Date().toISOString().slice(0, 10);
  }
  return {
    businessName: config.branding.displayName || "Your business",
    renterName: "Sample Renter",
    vehicle: "Toyota Aqua",
    plateNumber: "CAB-4321",
    rentalCode: `${config.rules.codePrefixes.rental || "RNT"}-${new Date().getFullYear()}-0042`,
    returnDate,
  };
}

const fill = (text: string, values: Record<string, string>) => text.replace(/\{([^{}\s]*)\}/g, (match, name: string) => values[name] ?? match);

export function DocumentsSection({ config, update, issue, meta }: SectionProps) {
  const receipt = config.documents.returnReceipt;
  const path = "documents.returnReceipt";
  const edit = (mutate: (settings: ReturnReceiptSettings) => void) => update((d) => mutate(d.documents.returnReceipt));
  const placeholders = meta.documentPlaceholders?.returnReceipt ?? [];
  const samples = sampleValues(config);

  // Placeholder chips insert into the text last focused, at the cursor.
  const refs = { returnStatement: useRef<HTMLTextAreaElement>(null), footer: useRef<HTMLTextAreaElement>(null) };
  const [target, setTarget] = useState<PlaceholderText>("returnStatement");
  const insert = (key: string) => {
    const element = refs[target].current;
    const text = receipt[target];
    const start = element?.selectionStart ?? text.length;
    const end = element?.selectionEnd ?? text.length;
    const token = `{${key}}`;
    edit((s) => { s[target] = text.slice(0, start) + token + text.slice(end); });
    requestAnimationFrame(() => {
      element?.focus();
      element?.setSelectionRange(start + token.length, start + token.length);
    });
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Documents the tenant app issues as PDFs. They use the tenant&apos;s branding, locale and field labels from the other tabs.
      </p>

      <section className={cn("space-y-5 rounded-lg border p-4", !receipt.enabled && "bg-muted/30")}>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-0.5">
            <Label htmlFor="receipt-enabled" className="flex items-center gap-2 text-sm font-medium">
              <FileText className="size-4" aria-hidden /> Return receipt
            </Label>
            <p className="text-xs text-muted-foreground">
              Once a rental is returned, staff can download it from the rental&apos;s details as a PDF bill for the renter, confirming the vehicle
              came back. It lists the charges, payments and inspections.
            </p>
            {issue(`${path}.enabled`) && <p className="text-xs text-destructive">{issue(`${path}.enabled`)}</p>}
          </div>
          <Switch id="receipt-enabled" checked={receipt.enabled} onCheckedChange={(on) => edit((s) => { s.enabled = on; })} />
        </div>

        {receipt.enabled && (
          <>
            <div className="grid gap-4 sm:grid-cols-[1fr_12rem]">
              <TextField
                id="receipt-title"
                label="Title"
                value={receipt.title}
                onChange={(v) => edit((s) => { s.title = v; })}
                error={issue(`${path}.title`)}
              />
              <Field label="Paper size" htmlFor="receipt-paper" error={issue(`${path}.paperSize`)}>
                <Select value={receipt.paperSize} onValueChange={(v) => edit((s) => { s.paperSize = v as ReturnReceiptSettings["paperSize"]; })}>
                  <SelectTrigger id="receipt-paper" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A4">A4</SelectItem>
                    <SelectItem value="LETTER">US Letter</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <Field
              label="Business details"
              htmlFor="receipt-issuer"
              hint="Printed under the business name: address, registration or tax number. One per line, up to 6."
              error={issue(`${path}.issuerDetails`) ?? receipt.issuerDetails.map((_, i) => issue(`${path}.issuerDetails[${i}]`)).find(Boolean)}
            >
              <LinesTextarea
                id="receipt-issuer"
                rows={3}
                value={receipt.issuerDetails}
                placeholder={"No. 12, Galle Road, Colombo 03\nBusiness reg. PV 00123456"}
                invalid={!!issue(`${path}.issuerDetails`)}
                onChange={(lines) => edit((s) => { s.issuerDetails = lines; })}
              />
            </Field>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                The texts below can name the rental. Click a placeholder to add it where the cursor is in the{" "}
                {target === "footer" ? "footer" : "return statement"}.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {placeholders.map((placeholder) => (
                  <Button key={placeholder.key} size="sm" variant="outline" className="h-7 font-mono text-xs" title={placeholder.description} onClick={() => insert(placeholder.key)}>
                    {`{${placeholder.key}}`}
                  </Button>
                ))}
              </div>
            </div>

            {(["returnStatement", "footer"] as const).map((key) => {
              const error = issue(`${path}.${key}`);
              const text = receipt[key];
              return (
                <Field
                  key={key}
                  label={key === "returnStatement" ? "Return statement" : "Footer"}
                  htmlFor={`receipt-${key}`}
                  error={error}
                  hint={
                    text.trim() ? (
                      <>
                        <span className="font-medium">Reads:</span> {fill(text, samples)}
                      </>
                    ) : key === "footer" ? (
                      "Terms or a thank-you at the end. Leave empty for none."
                    ) : undefined
                  }
                >
                  <Textarea
                    ref={refs[key]}
                    id={`receipt-${key}`}
                    rows={key === "returnStatement" ? 3 : 2}
                    value={text}
                    aria-invalid={!!error}
                    onFocus={() => setTarget(key)}
                    onChange={(e) => edit((s) => { s[key] = e.target.value; })}
                  />
                </Field>
              );
            })}

            <section className="space-y-3">
              <h4 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">What it includes</h4>
              <p className="text-xs text-muted-foreground">
                Always: the business, the return statement, the renter and vehicle, the dates and odometer, and the charges with what&apos;s left to
                pay.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {INCLUDED.map(({ key, label, description }) => {
                  const needsInspections = key === "showInspectionPhotos" && !receipt.showInspections;
                  return (
                    <div key={key} className={cn(needsInspections && "opacity-60")}>
                      <SwitchField
                        id={`receipt-${key}`}
                        label={label}
                        description={needsInspections ? "Needs inspections on." : description}
                        checked={receipt[key] && !needsInspections}
                        disabled={needsInspections}
                        onCheckedChange={(on) => edit((s) => { s[key] = on; })}
                      />
                    </div>
                  );
                })}
              </div>
            </section>

            <ReceiptPreview config={config} />
          </>
        )}
      </section>
    </div>
  );
}

/** Renders the receipt of a sample rental with the draft config, and shows it in a dialog. */
function ReceiptPreview({ config }: { config: TenantConfig }) {
  const [pending, setPending] = useState(false);
  const [file, setFile] = useState<{ url: string; filename: string } | null>(null);
  useEffect(() => () => void (file && URL.revokeObjectURL(file.url)), [file]);

  const open = async () => {
    setPending(true);
    try {
      const res = await previewReturnReceiptAction({ config });
      if (!res.ok) {
        toast.error(res.error, { description: res.issues?.[0] ? `${res.issues[0].path}: ${res.issues[0].message}` : undefined });
        return;
      }
      const bytes = Uint8Array.from(atob(res.data.base64), (char) => char.charCodeAt(0));
      setFile({ url: URL.createObjectURL(new Blob([bytes], { type: "application/pdf" })), filename: res.data.filename });
    } catch {
      toast.error("Couldn't make the preview. Try again.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3 border-t pt-4">
      <Button variant="outline" onClick={open} disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : <FileText />} Preview PDF
      </Button>
      <p className="text-xs text-muted-foreground">
        A sample rental with this draft: the tenant&apos;s codes, inspection points, payment methods and custom fields.{" "}
        <Badge variant="secondary" className="ml-1">Not published yet</Badge>
      </p>

      <Dialog open={!!file} onOpenChange={(next) => !next && setFile(null)}>
        <DialogContent className="flex h-[90vh] flex-col gap-3 sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Return receipt preview</DialogTitle>
            <DialogDescription>A sample rental, with photos as grey placeholders. Real receipts use the rental&apos;s own data.</DialogDescription>
          </DialogHeader>
          {file && <iframe src={file.url} title="Return receipt preview" className="min-h-0 w-full flex-1 rounded-md border" />}
          <DialogFooter>
            {file && (
              <Button asChild variant="outline">
                <a href={file.url} download={file.filename}>
                  <Download /> Download
                </a>
              </Button>
            )}
            <Button onClick={() => setFile(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
