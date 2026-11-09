import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { RegisterForm } from "@/components/auth/AuthForms";
import { PageLoader } from "@/components/common/Feedback";

export const metadata: Metadata = { title: "Create account", robots: { index: false, follow: true } };

export default function Page() {
  return (
    <AuthShell title="Create your account" subtitle="Save travellers, track bookings and get member-only deals.">
      <Suspense fallback={<PageLoader />}>
        <RegisterForm />
      </Suspense>
    </AuthShell>
  );
}
