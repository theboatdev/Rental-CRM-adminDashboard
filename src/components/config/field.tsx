"use client";

import type { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { numberValue, toNumber } from "./types";

export function Field({
  label,
  htmlFor,
  hint,
  error,
  className,
  children,
}: {
  label: ReactNode;
  htmlFor: string;
  hint?: ReactNode;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="text-xs text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export function TextField({
  id,
  label,
  value,
  onChange,
  error,
  hint,
  placeholder,
  mono,
  type = "text",
  className,
}: {
  id: string;
  label: ReactNode;
  value: string | null;
  onChange: (value: string) => void;
  error?: string;
  hint?: ReactNode;
  placeholder?: string;
  mono?: boolean;
  type?: string;
  className?: string;
}) {
  return (
    <Field label={label} htmlFor={id} hint={hint} error={error} className={className}>
      <Input
        id={id}
        type={type}
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(mono && "font-mono")}
      />
    </Field>
  );
}

export function NumberField({
  id,
  label,
  value,
  onChange,
  error,
  hint,
  min,
  step,
  suffix,
}: {
  id: string;
  label: ReactNode;
  value: number;
  onChange: (value: number) => void;
  error?: string;
  hint?: ReactNode;
  min?: number;
  step?: number | string;
  suffix?: string;
}) {
  return (
    <Field label={label} htmlFor={id} hint={hint} error={error}>
      <div className="flex items-center gap-2">
        <Input
          id={id}
          type="number"
          inputMode="decimal"
          min={min}
          step={step}
          value={numberValue(value)}
          onChange={(e) => onChange(toNumber(e.target.value))}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className="font-mono"
        />
        {suffix && <span className="shrink-0 text-xs text-muted-foreground">{suffix}</span>}
      </div>
    </Field>
  );
}

export function SwitchField({
  id,
  label,
  description,
  checked,
  onCheckedChange,
}: {
  id: string;
  label: ReactNode;
  description?: ReactNode;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-0.5">
        <Label htmlFor={id}>{label}</Label>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
