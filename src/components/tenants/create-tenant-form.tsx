"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Controller, useForm, useWatch, type FieldPath } from "react-hook-form";
import { toast } from "sonner";
import { ProvisioningSteps } from "@/components/tenants/provisioning-steps";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createTenantAction } from "@/lib/actions/tenants";
import type { ConfigTemplate, CreateTenantInput } from "@/lib/contract";
import type { ProvisioningJob } from "@/lib/platform-api/types";

/** Suggests a slug from the company name; the backend decides whether it's valid. */
function slugify(name: string) {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32)
    .replace(/-+$/g, "");
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-xs text-destructive">{message}</p> : null;
}

export function CreateTenantForm({ templates }: { templates: ConfigTemplate[] }) {
  const [pending, startTransition] = useTransition();
  const [slugEdited, setSlugEdited] = useState(false);
  const [result, setResult] = useState<{ tenantId: string; job: ProvisioningJob } | null>(null);

  const defaultTemplate = templates.find((t) => t.key === "sri-lanka") ?? templates[0]!;
  const form = useForm<CreateTenantInput>({
    defaultValues: {
      name: "",
      slug: "",
      template: defaultTemplate.key,
      adminEmail: "",
      adminName: "",
      limits: { ...defaultTemplate.config.limits },
    },
  });
  const { errors } = form.formState;
  const [templateKey, slug] = useWatch({ control: form.control, name: ["template", "slug"] });
  const template = templates.find((t) => t.key === templateKey) ?? defaultTemplate;
  const enabledModules = Object.values(template.config.modules).filter((m) => m.enabled).length;

  const nameField = form.register("name", {
    required: "Enter the company name",
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!slugEdited) form.setValue("slug", slugify(e.target.value), { shouldValidate: form.formState.isSubmitted });
    },
  });

  const onSubmit = form.handleSubmit((values) =>
    startTransition(async () => {
      const res = await createTenantAction(values);
      if (!res.ok) {
        // The backend validates the input; show its field issues next to the fields.
        for (const issue of res.issues ?? []) {
          if (issue.path) form.setError(issue.path as FieldPath<CreateTenantInput>, { message: issue.message });
        }
        if (res.error.includes("slug")) form.setError("slug", { message: res.error });
        toast.error(res.error);
        return;
      }
      setResult(res.data);
      if (res.data.job.status === "succeeded") toast.success(`${values.name} is ready`);
      else toast.warning("Provisioning stopped on a failed step");
    }),
  );

  if (result) {
    const failed = result.job.status === "failed";
    return (
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>{failed ? "Provisioning stopped" : "Tenant provisioned"}</CardTitle>
          <CardDescription>
            {failed
              ? "Fix the cause and retry from the tenant page. Completed steps won't run again."
              : "The tenant admin gets a Clerk invitation to join their organization as Owner."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProvisioningSteps steps={result.job.steps} />
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href={`/tenants/${result.tenantId}`}>Open tenant</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/tenants/${result.tenantId}/config`}>Edit config</Link>
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              form.reset();
              setSlugEdited(false);
              setResult(null);
            }}
          >
            Create another
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Company</CardTitle>
            <CardDescription>The slug is used for the Clerk organization and the public booking link.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">Company name</Label>
              <Input id="name" placeholder="Shenaly Rent a Car" aria-invalid={!!errors.name} {...nameField} />
              <FieldError message={errors.name?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                className="font-mono"
                placeholder="shenaly"
                aria-invalid={!!errors.slug}
                {...form.register("slug", { required: "Enter a slug", onChange: () => setSlugEdited(true) })}
              />
              <FieldError message={errors.slug?.message} />
              <p className="font-mono text-xs text-muted-foreground">/book/{slug || "<slug>"}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="template">Config template</Label>
              <Controller
                control={form.control}
                name="template"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="template" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((t) => (
                        <SelectItem key={t.key} value={t.key}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <p className="text-xs text-muted-foreground">{template.description}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tenant admin</CardTitle>
            <CardDescription>Invited by email as the Owner. They manage their own team and roles.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="adminEmail">Email</Label>
              <Input id="adminEmail" type="email" placeholder="owner@company.com" aria-invalid={!!errors.adminEmail} {...form.register("adminEmail", { required: "Enter the tenant admin's email" })} />
              <FieldError message={errors.adminEmail?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adminName">Name (optional)</Label>
              <Input id="adminName" {...form.register("adminName")} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Plan limits</CardTitle>
            <CardDescription>Stored in the tenant config, so they can be changed later from the config editor.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            {(
              [
                ["maxVehicles", "Max vehicles"],
                ["maxUsers", "Max users"],
                ["storageGb", "Storage (GB)"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={key}>{label}</Label>
                <Input
                  id={key}
                  type="number"
                  min={1}
                  step={key === "storageGb" ? "0.5" : "1"}
                  aria-invalid={!!errors.limits?.[key]}
                  {...form.register(`limits.${key}`, { valueAsNumber: true })}
                />
                <FieldError message={errors.limits?.[key]?.message} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>What gets created</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <ul className="list-disc space-y-1 pl-4 text-muted-foreground">
              <li>A Clerk organization for the company</li>
              <li>A dedicated tenant database with default roles</li>
              <li>
                Config v1 from <strong className="text-foreground">{template.label}</strong>: {template.config.locale.currency},{" "}
                {template.config.locale.timezone}, {enabledModules} modules on
              </li>
              <li>An Owner invitation for the tenant admin</li>
            </ul>
          </CardContent>
        </Card>
        <Alert>
          <AlertTitle>In-memory backend</AlertTitle>
          <AlertDescription>
            Until Phase 2 the backend keeps tenants in memory and simulates provisioning. Use an email at{" "}
            <code className="font-mono">fail.test</code> (e.g. owner@fail.test) to simulate a failed invite.
          </AlertDescription>
        </Alert>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Provisioning…" : "Create tenant"}
        </Button>
      </div>
    </form>
  );
}
