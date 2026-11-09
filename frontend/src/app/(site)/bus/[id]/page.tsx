import type { Metadata } from "next";
import { Suspense } from "react";
import { PageLoader } from "@/components/common/Feedback";
import { BusSeatBooking } from "./BusSeatBooking";

export const metadata: Metadata = { title: "Choose your seats", robots: { index: false } };

export default async function BusSeatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="container-page py-8">
      <h1 className="mb-6 font-display text-3xl font-semibold">Choose your seats</h1>
      <Suspense fallback={<PageLoader />}>
        <BusSeatBooking busId={id} />
      </Suspense>
    </div>
  );
}
