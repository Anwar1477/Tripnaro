import type { Metadata } from "next";
import { Suspense } from "react";
import { PageLoader } from "@/components/common/Feedback";
import { PaymentResult } from "./PaymentResult";

export const metadata: Metadata = { title: "Payment status", robots: { index: false } };

export default function PaymentResultPage() {
  return (
    <div className="container-page max-w-2xl py-10">
      <Suspense fallback={<PageLoader />}>
        <PaymentResult />
      </Suspense>
    </div>
  );
}
