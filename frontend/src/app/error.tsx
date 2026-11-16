"use client";

import { RouteError } from "@/components/common/RouteError";

/** Last-resort boundary (admin area and anything outside the site layout). */
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <RouteError error={error} retry={retry} as="main" />;
}
