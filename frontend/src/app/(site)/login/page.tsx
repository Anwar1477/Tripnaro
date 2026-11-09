import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/AuthForms";
import { PageLoader } from "@/components/common/Feedback";

export const metadata: Metadata = { title: "Sign in", robots: { index: false, follow: true } };

export default function Page() {
  return (
    <AuthShell title="Welcome back" subtitle="Sign in to manage bookings, tickets and visa applications.">
      <Suspense fallback={<PageLoader />}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
