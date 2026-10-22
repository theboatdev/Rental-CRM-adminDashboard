import { CheckCircle2, Circle, Loader2, XCircle } from "lucide-react";
import type { ProvisioningStep } from "@/lib/platform-api/types";

const icons = {
  done: <CheckCircle2 className="size-4 text-emerald-600" aria-label="Done" />,
  failed: <XCircle className="size-4 text-destructive" aria-label="Failed" />,
  running: <Loader2 className="size-4 animate-spin text-muted-foreground" aria-label="Running" />,
  pending: <Circle className="size-4 text-muted-foreground" aria-label="Pending" />,
};

export function ProvisioningSteps({ steps }: { steps: ProvisioningStep[] }) {
  return (
    <ol className="space-y-2">
      {steps.map((step) => (
        <li key={step.key} className="flex items-start gap-2 text-sm">
          <span className="mt-0.5 shrink-0">{icons[step.status]}</span>
          <span className="min-w-0">
            <span className={step.status === "pending" ? "text-muted-foreground" : undefined}>{step.label}</span>
            {step.error && <span className="block text-xs text-destructive">{step.error}</span>}
          </span>
        </li>
      ))}
    </ol>
  );
}
