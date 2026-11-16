"use client";

import { RouteError } from "@/components/common/RouteError";

/** Errors in public pages render inside the site layout, so the header and footer stay usable. */
export default function SiteError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <RouteError error={error} retry={retry} />;
}
