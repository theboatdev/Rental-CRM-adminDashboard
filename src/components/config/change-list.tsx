import type { ConfigChange } from "@/lib/contract";

const preview = (value: unknown) => {
  const text = JSON.stringify(value);
  return text === undefined ? "—" : text.length > 80 ? `${text.slice(0, 77)}…` : text;
};

export function ChangeList({ changes }: { changes: ConfigChange[] }) {
  if (changes.length === 0) return <p className="text-sm text-muted-foreground">No differences.</p>;
  return (
    <ul className="space-y-2">
      {changes.map((change) => (
        <li key={`${change.kind}:${change.path}`} className="rounded-md border bg-muted/30 p-2 text-xs">
          <p className="font-mono font-medium">
            {change.path || "(document)"} <span className="font-sans font-normal text-muted-foreground">· {change.kind}</span>
          </p>
          <p className="mt-1 font-mono break-all">
            {change.kind !== "added" && <span className="text-red-700 dark:text-red-400">{preview(change.before)}</span>}
            {change.kind === "changed" && <span className="text-muted-foreground"> → </span>}
            {change.kind !== "removed" && <span className="text-emerald-700 dark:text-emerald-400">{preview(change.after)}</span>}
          </p>
        </li>
      ))}
    </ul>
  );
}
