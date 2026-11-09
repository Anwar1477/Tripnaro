import { PageLoader } from "@/components/common/Feedback";

/** Shown inside the admin shell while an admin page loads. */
export default function Loading() {
  return <PageLoader className="min-h-[60vh]" />;
}
