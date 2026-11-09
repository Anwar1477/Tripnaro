import { Suspense } from "react";
import { PageLoader } from "@/components/common/Feedback";
import { Breadcrumbs } from "@/components/common/Misc";
import { buildMetadata } from "@/lib/seo";
import { VisaTracker } from "./VisaTracker";

export const metadata = buildMetadata({ title: "Track Visa Application", description: "Check the status of your Tripnaro visa application using your reference and passport number.", path: "/visa/track" });

export default function VisaTrackPage() {
  return (
    <div className="container-page max-w-3xl py-8">
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Visa", href: "/visa" }, { name: "Track" }]} className="mb-4" />
      <h1 className="font-display text-3xl font-semibold">Track your visa application</h1>
      <p className="mt-2 text-ink-600">Enter the reference from your confirmation email (e.g. TNV-XXXXXXXX) and your passport number.</p>
      <Suspense fallback={<PageLoader />}>
        <VisaTracker />
      </Suspense>
    </div>
  );
}
