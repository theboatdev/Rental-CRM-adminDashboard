"use client";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { ModuleKey, TenantConfig } from "@/lib/contract";
import { cn } from "@/lib/utils";
import { Field, NumberField, SwitchField, TextField } from "../field";
import { LinesTextarea } from "../lines-textarea";
import type { SectionProps } from "../types";

type ReservationMode = TenantConfig["modules"]["rentals"]["reservationMode"];

export function ModulesSection(props: SectionProps) {
  const { config, update, issue, meta } = props;
  const labelOf = (key: ModuleKey) => meta.modules.find((m) => m.key === key)?.label ?? key;

  const toggle = (key: ModuleKey, enabled: boolean) =>
    update((d) => {
      d.modules[key].enabled = enabled;
      // Keep the config valid: an enabled tab module must be reachable from navigation.
      const mod = meta.modules.find((m) => m.key === key);
      if (enabled && mod?.tab && !d.navigation.some((item) => item.module === key)) {
        const item = { module: key, label: mod.label };
        // Suppliers sits between Rentals and Calendar when both are present.
        if (key === "suppliers") {
          const afterRentals = d.navigation.findIndex((n) => n.module === "rentals");
          if (afterRentals >= 0) d.navigation.splice(afterRentals + 1, 0, item);
          else d.navigation.push(item);
        } else {
          d.navigation.push(item);
        }
      }
    });

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Disabled modules disappear from the tenant app and their API routes return 404. Permissions tied to a disabled
        module are dropped from every role.
      </p>
      {meta.modules.map((mod) => {
        const key = mod.key;
        const enabled = config.modules[key].enabled;
        const error = issue(`modules.${key}.enabled`);
        return (
          <div key={key} className={cn("rounded-lg border p-4", !enabled && "bg-muted/30", error && "border-destructive/50")}>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-0.5">
                <Label htmlFor={`module-${key}`} className="text-sm font-medium">
                  {mod.label}
                  {!mod.tab && <span className="ml-2 text-xs font-normal text-muted-foreground">(no tab)</span>}
                </Label>
                <p className="text-xs text-muted-foreground">{mod.description}</p>
                {mod.requires.length > 0 && (
                  <p className="text-xs text-muted-foreground">Requires {mod.requires.map(labelOf).join(", ")}</p>
                )}
                {error && <p className="text-xs text-destructive">{error}</p>}
              </div>
              <Switch id={`module-${key}`} checked={enabled} onCheckedChange={(checked) => toggle(key, checked)} />
            </div>
            {enabled && <ModuleSettings moduleKey={key} {...props} />}
          </div>
        );
      })}
    </div>
  );
}

function ModuleSettings({ moduleKey, config, update, issue, meta }: SectionProps & { moduleKey: ModuleKey }) {
  const m = config.modules;
  const wrap = (children: React.ReactNode) => <div className="mt-4 grid gap-4 border-t pt-4 sm:grid-cols-2">{children}</div>;

  switch (moduleKey) {
    case "vehicles":
      return wrap(
        <>
          <NumberField
            id="vehicles-serviceIntervalKm"
            label="Service interval"
            suffix="km"
            min={1}
            hint="Drives the service-due warning on the dashboard."
            value={m.vehicles.serviceIntervalKm}
            onChange={(v) => update((d) => { d.modules.vehicles.serviceIntervalKm = v; })}
            error={issue("modules.vehicles.serviceIntervalKm")}
          />
          <SwitchField
            id="vehicles-thirdPartyVehicles"
            label="Third-party vehicle tracking"
            description="Marks vehicles as owned or supplier-sourced, adds a supplier rental cost on those bookings, and breaks profit into gross and net."
            checked={m.vehicles.thirdPartyVehicles ?? false}
            onCheckedChange={(v) => update((d) => { d.modules.vehicles.thirdPartyVehicles = v; })}
          />
          <SwitchField
            id="vehicles-rateOnVehicle"
            label="Require daily rate on vehicle"
            description="Off: staff enter the rate when making a booking instead of storing it on the vehicle."
            checked={m.vehicles.rateOnVehicle ?? true}
            onCheckedChange={(v) => update((d) => { d.modules.vehicles.rateOnVehicle = v; })}
          />
        </>,
      );
    case "rentals":
      return wrap(
        <>
          <Field
            label="Inspection photo points"
            htmlFor="rentals-inspectionPoints"
            hint="One per line, captured at pickup and drop."
            error={
              issue("modules.rentals.inspectionPoints") ??
              firstIssueUnder(issue, "modules.rentals.inspectionPoints", m.rentals.inspectionPoints.length)
            }
            className="sm:row-span-2"
          >
            <LinesTextarea
              id="rentals-inspectionPoints"
              rows={6}
              value={m.rentals.inspectionPoints}
              onChange={(v) => update((d) => { d.modules.rentals.inspectionPoints = v; })}
              invalid={!!issue("modules.rentals.inspectionPoints")}
            />
          </Field>
          <div className="space-y-4">
            <SwitchField
              id="rentals-requirePickupInspection"
              label="Require pickup inspection"
              description="Block handover until every point has a photo."
              checked={m.rentals.requirePickupInspection}
              onCheckedChange={(v) => update((d) => { d.modules.rentals.requirePickupInspection = v; })}
            />
            <SwitchField
              id="rentals-requireDropInspection"
              label="Require drop inspection"
              description="Block closing a rental until return photos are in."
              checked={m.rentals.requireDropInspection}
              onCheckedChange={(v) => update((d) => { d.modules.rentals.requireDropInspection = v; })}
            />
            <Field
              label="Reservation mode"
              htmlFor="rentals-reservationMode"
              hint="Specific plate keeps today’s flow. Make &amp; model lets staff hold a class and assign a registration later."
              error={issue("modules.rentals.reservationMode")}
            >
              <Select
                value={m.rentals.reservationMode ?? "specificVehicle"}
                onValueChange={(v) => update((d) => { d.modules.rentals.reservationMode = v as ReservationMode; })}
              >
                <SelectTrigger id="rentals-reservationMode" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="specificVehicle">Specific vehicle (registration required)</SelectItem>
                  <SelectItem value="vehicleClass">Make &amp; model (assign plate later)</SelectItem>
                  <SelectItem value="both">Both (staff choose per booking)</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <SwitchField
              id="rentals-hideBookingPricingWithoutFinancials"
              label="Hide booking prices from Staff"
              description="Staff can still manage bookings and record payments, but won’t see rates, totals, deposits, supplier costs, or amounts owed. Owners and accountants keep full access."
              checked={m.rentals.hideBookingPricingWithoutFinancials ?? false}
              onCheckedChange={(v) => update((d) => { d.modules.rentals.hideBookingPricingWithoutFinancials = v; })}
            />
          </div>
        </>,
      );
    case "costs":
      return wrap(
        <SwitchField
          id="costs-requireBillUpload"
          label="Require a bill upload"
          description="Cost entries need an attached invoice or receipt."
          checked={m.costs.requireBillUpload}
          onCheckedChange={(v) => update((d) => { d.modules.costs.requireBillUpload = v; })}
        />,
      );
    case "whatsappDigest":
      return wrap(
        <>
          <TextField
            id="whatsapp-cron"
            label="Schedule (cron)"
            mono
            hint={`Runs in ${config.locale.timezone}. 0 8 * * 1 = Mondays 08:00.`}
            value={m.whatsappDigest.cron}
            onChange={(v) => update((d) => { d.modules.whatsappDigest.cron = v; })}
            error={issue("modules.whatsappDigest.cron")}
          />
          <Field
            label="Recipients"
            htmlFor="whatsapp-recipients"
            hint="One number per line in international format. API credentials are stored as tenant secrets, not here."
            error={issue("modules.whatsappDigest.recipients") ?? firstIssueUnder(issue, "modules.whatsappDigest.recipients", m.whatsappDigest.recipients.length)}
          >
            <LinesTextarea
              id="whatsapp-recipients"
              rows={3}
              placeholder="+94770000000"
              value={m.whatsappDigest.recipients}
              onChange={(v) => update((d) => { d.modules.whatsappDigest.recipients = v; })}
            />
          </Field>
        </>,
      );
    case "guestPortal":
      return wrap(
        <>
          <div className="space-y-2">
            <p className="text-sm font-medium">Who can self-register</p>
            {meta.residentTypes.map((type) => (
              <SwitchField
                key={type}
                id={`guestPortal-${type}`}
                label={type === "local" ? "Local residents" : "Tourists"}
                checked={m.guestPortal.residentTypes.includes(type)}
                onCheckedChange={(on) =>
                  update((d) => {
                    const types = new Set(d.modules.guestPortal.residentTypes);
                    if (on) types.add(type);
                    else types.delete(type);
                    d.modules.guestPortal.residentTypes = meta.residentTypes.filter((t) => types.has(t));
                  })
                }
              />
            ))}
            {issue("modules.guestPortal.residentTypes") && (
              <p className="text-xs text-destructive">{issue("modules.guestPortal.residentTypes")}</p>
            )}
          </div>
          <SwitchField
            id="guestPortal-requireDocumentUpload"
            label="Require document photos"
            description="Guests attach ID and licence scans when registering."
            checked={m.guestPortal.requireDocumentUpload}
            onCheckedChange={(v) => update((d) => { d.modules.guestPortal.requireDocumentUpload = v; })}
          />
        </>,
      );
    default:
      return null;
  }
}

/** Surfaces an error on any item of a list field (e.g. recipients[1]) next to the list. */
function firstIssueUnder(issue: SectionProps["issue"], path: string, length: number) {
  for (let i = 0; i < length; i++) {
    const message = issue(`${path}[${i}]`);
    if (message) return `Line ${i + 1}: ${message}`;
  }
  return undefined;
}
