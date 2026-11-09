import { PageLoader } from "@/components/common/Feedback";

/** Shown under the site header while a page's server content streams in. */
export default function Loading() {
  return <PageLoader className="min-h-[60vh]" />;
}
