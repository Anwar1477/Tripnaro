import type { Metadata } from "next";
import { Suspense } from "react";
import { PageLoader } from "@/components/common/Feedback";
import { FlightReview } from "./FlightReview";

export const metadata: Metadata = { title: "Review flight & passenger details", robots: { index: false } };

export default function FlightReviewPage() {
  return (
    <div className="container-page py-8">
      <h1 className="mb-6 font-display text-3xl font-semibold">Passenger details</h1>
      <Suspense fallback={<PageLoader />}>
        <FlightReview />
      </Suspense>
    </div>
  );
}
