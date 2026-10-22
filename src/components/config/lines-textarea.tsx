"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";

const toLines = (text: string) =>
  text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
const sameLines = (a: string[], b: readonly string[]) => a.length === b.length && a.every((line, i) => line === b[i]);

/** Edits a string array as one item per line, keeping blank lines while the user types. */
export function LinesTextarea({
  id,
  value,
  onChange,
  rows = 4,
  invalid,
  placeholder,
}: {
  id: string;
  value: readonly string[];
  onChange: (value: string[]) => void;
  rows?: number;
  invalid?: boolean;
  placeholder?: string;
}) {
  const [text, setText] = useState(value.join("\n"));
  const [synced, setSynced] = useState(value);

  // Adopt outside changes (discard, import) without clobbering in-progress typing.
  if (value !== synced) {
    setSynced(value);
    if (!sameLines(toLines(text), value)) setText(value.join("\n"));
  }

  return (
    <Textarea
      id={id}
      rows={rows}
      value={text}
      placeholder={placeholder}
      aria-invalid={invalid}
      className="font-mono text-xs"
      onChange={(e) => {
        setText(e.target.value);
        onChange(toLines(e.target.value));
      }}
    />
  );
}
