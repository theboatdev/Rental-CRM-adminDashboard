"use client";

import { Button } from "@/components/ui/button";

/** Shown when a page can't load data, most often because the backend isn't reachable. */
export default function PlatformError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md space-y-3 py-16 text-center">
      <h1 className="text-xl font-semibold">Couldn&apos;t load data from the platform API</h1>
      <p className="text-sm text-muted-foreground">
        Check that the backend is running and that <code className="font-mono">PLATFORM_API_URL</code> points at it, and
        that the backend has Clerk keys configured.
      </p>
      <Button variant="outline" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
