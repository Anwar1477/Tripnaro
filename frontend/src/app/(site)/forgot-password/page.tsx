import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { ForgotPasswordForm } from "@/components/auth/AuthForms";
import { PageLoader } from "@/components/common/Feedback";

export const metadata: Metadata = { title: "Forgot password", robots: { index: false, follow: true } };

export default function Page() {
  return (
    <AuthShell title="Forgot your password?" subtitle="Enter your email and we'll send you a secure reset link.">
      <Suspense fallback={<PageLoader />}>
        <ForgotPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
