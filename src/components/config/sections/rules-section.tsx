"use client";

import { Button } from "@/components/ui/button";
import { NumberField, TextField } from "../field";
import type { SectionProps } from "../types";

const PREFIXES = [
  { key: "rental", label: "Rental contracts", sample: "2026-0042" },
  { key: "booking", label: "Early bookings", sample: "2026-0043" },
  { key: "receipt", label: "Payment receipts", sample: "2026-0091" },
  { key: "advance", label: "Booking advances", sample: "2026-0043" },
  { key: "renter", label: "Renter profiles", sample: "0146" },
] as const;

export function RulesSection({ config, update, issue }: SectionProps) {
  const r = config.rules;
  const documents = config.lists.documentTypes;

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField
          id="rules-defaultDepositAmount"
          label="Default security deposit"
          suffix={config.locale.currency}
          min={0}
          hint="Prefilled for new vehicles; each vehicle can override it."
          value={r.defaultDepositAmount}
          onChange={(v) => update((d) => { d.rules.defaultDepositAmount = v; })}
          error={issue("rules.defaultDepositAmount")}
        />
        <NumberField
          id="rules-minRentalDays"
          label="Minimum rental length"
          suffix="days"
          min={1}
          value={r.minRentalDays}
          onChange={(v) => update((d) => { d.rules.minRentalDays = v; })}
          error={issue("rules.minRentalDays")}
        />
      </div>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold">Tourist driving permit</h3>
        <p className="text-xs text-muted-foreground">
          A tourist must hold at least one of the selected documents before a rental starts. Select none to turn the check off.
        </p>
        <div className="flex flex-wrap gap-2">
          {documents.map((doc) => {
            const on = r.touristPermitDocumentKeys.includes(doc.key);
            return (
              <Button
                key={doc.key || doc.label}
                size="sm"
                variant={on ? "secondary" : "outline"}
                aria-pressed={on}
                disabled={!doc.key}
                onClick={() =>
                  update((d) => {
                    const keys = d.rules.touristPermitDocumentKeys;
                    d.rules.touristPermitDocumentKeys = on ? keys.filter((k) => k !== doc.key) : [...keys, doc.key];
                  })
                }
              >
                {doc.label || doc.key}
              </Button>
            );
          })}
        </div>
        {r.touristPermitDocumentKeys.map((key, i) => {
          const error = issue(`rules.touristPermitDocumentKeys[${i}]`);
          return error ? (
            <p key={key} className="text-xs text-destructive">
              {error}
            </p>
          ) : null;
        })}
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Reference code prefixes</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PREFIXES.map(({ key, label, sample }) => (
            <TextField
              key={key}
              id={`rules-prefix-${key}`}
              label={label}
              mono
              hint={`${r.codePrefixes[key] || "XX"}-${sample}`}
              value={r.codePrefixes[key]}
              onChange={(v) => update((d) => { d.rules.codePrefixes[key] = v.toUpperCase(); })}
              error={issue(`rules.codePrefixes.${key}`)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
