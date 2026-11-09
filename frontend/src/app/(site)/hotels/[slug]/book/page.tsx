import type { Metadata } from "next";
import { Suspense } from "react";
import { PageLoader } from "@/components/common/Feedback";
import { HotelBooking } from "./HotelBooking";

export const metadata: Metadata = { title: "Complete your hotel booking", robots: { index: false } };

export default async function HotelBookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <div className="container-page py-8">
      <h1 className="mb-6 font-display text-3xl font-semibold">Complete your stay booking</h1>
      <Suspense fallback={<PageLoader />}>
        <HotelBooking slug={slug} />
      </Suspense>
    </div>
  );
}
