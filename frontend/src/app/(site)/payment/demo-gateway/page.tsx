import type { Metadata } from "next";
import { Suspense } from "react";
import { PageLoader } from "@/components/common/Feedback";
import { DemoGateway } from "./DemoGateway";

export const metadata: Metadata = { title: "Demo payment gateway", robots: { index: false } };

export default function DemoGatewayPage() {
  return (
    <div className="container-page max-w-xl py-10">
      <Suspense fallback={<PageLoader />}>
        <DemoGateway />
      </Suspense>
    </div>
  );
}
