import type { Metadata } from "next";
import { Suspense } from "react";
import { PageLoader } from "@/components/common/Feedback";
import { TourBooking } from "./TourBooking";

export const metadata: Metadata = { title: "Book your tour", robots: { index: false } };

export default async function TourBookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <div className="container-page py-8">
      <h1 className="mb-6 font-display text-3xl font-semibold">Book your tour</h1>
      <Suspense fallback={<PageLoader />}>
        <TourBooking slug={slug} />
      </Suspense>
    </div>
  );
}
