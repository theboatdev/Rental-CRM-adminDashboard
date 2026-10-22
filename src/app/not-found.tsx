import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <div className="space-y-3 text-center">
        <h1 className="text-xl font-semibold">Not found</h1>
        <p className="text-sm text-muted-foreground">That tenant or page doesn&apos;t exist.</p>
        <Button asChild variant="outline">
          <Link href="/tenants">Back to tenants</Link>
        </Button>
      </div>
    </main>
  );
}
