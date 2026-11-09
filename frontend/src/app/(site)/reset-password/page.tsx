import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { ResetPasswordForm } from "@/components/auth/AuthForms";
import { PageLoader } from "@/components/common/Feedback";

export const metadata: Metadata = { title: "Reset password", robots: { index: false, follow: true } };

export default function Page() {
  return (
    <AuthShell title="Choose a new password" subtitle="Pick a strong password you don't use elsewhere.">
      <Suspense fallback={<PageLoader />}>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
