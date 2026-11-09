"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/common/Button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main id="main" className="container-page flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <AlertTriangle className="size-12 text-coral-500" />
      <h1 className="mt-4 font-display text-3xl font-semibold">Something went wrong</h1>
      <p className="mt-2 max-w-md text-ink-600">An unexpected error occurred. Please try again. If it keeps happening, contact support{error.digest ? ` with code ${error.digest}` : ""}.</p>
      <Button className="mt-6" onClick={reset}>Try again</Button>
    </main>
  );
}
