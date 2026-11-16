"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button, LinkButton } from "./Button";

/** Shared body of the route error boundaries (app/error.tsx and app/(site)/error.tsx). */
export function RouteError({ error, retry, as: Tag = "div" }: { error: Error & { digest?: string }; retry: () => void; as?: "main" | "div" }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <Tag {...(Tag === "main" ? { id: "main" } : {})} className="container-page flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <span className="grid size-16 place-items-center rounded-full bg-coral-50 text-coral-500">
        <AlertTriangle className="size-8" aria-hidden />
      </span>
      <h1 className="mt-5 font-display text-3xl font-semibold">Something went wrong</h1>
      <p className="mt-2 max-w-md text-ink-600">
        An unexpected error occurred. Please try again. If it keeps happening, contact support{error.digest ? ` with code ${error.digest}` : ""}.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {/* retry() re-fetches the segment on the server and re-renders it (stable since Next 16.3). */}
        <Button onClick={() => retry()}>Try again</Button>
        <LinkButton href="/" variant="outline">
          Go home
        </LinkButton>
      </div>
    </Tag>
  );
}
