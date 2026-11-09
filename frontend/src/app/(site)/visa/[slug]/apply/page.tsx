import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageLoader } from "@/components/common/Feedback";
import { Breadcrumbs } from "@/components/common/Misc";
import { serverGet } from "@/lib/server-api";
import type { VisaCountry } from "@/types";
import { VisaApplyForm } from "./VisaApplyForm";

export const metadata: Metadata = { title: "Visa application", robots: { index: false } };

export default async function VisaApplyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const country = await serverGet<VisaCountry>(`/visa/countries/${slug}`);
  if (!country) notFound();
  return (
    <div className="container-page py-8">
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Visa", href: "/visa" }, { name: country.country, href: `/visa/${slug}` }, { name: "Apply" }]} className="mb-4" />
      <h1 className="mb-6 font-display text-3xl font-semibold">{country.flag} {country.country} visa application</h1>
      <Suspense fallback={<PageLoader />}>
        <VisaApplyForm country={country} />
      </Suspense>
    </div>
  );
}
