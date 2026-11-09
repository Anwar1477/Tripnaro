import Link from "next/link";
import { Suspense } from "react";
import { Sparkles } from "lucide-react";
import { PageLoader } from "@/components/common/Feedback";
import { Breadcrumbs, JsonLd } from "@/components/common/Misc";
import { TourResults } from "@/components/tours/TourResults";
import { TourSearchForm } from "@/components/tours/TourSearchForm";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Tour Packages: Holidays in Bangladesh & Abroad",
  description: "Handpicked tour packages to Cox's Bazar, Sylhet, Sajek, Sundarbans, Bali, Maldives, Thailand and more. Fixed departures, honeymoon and family trips, and custom itineraries.",
  path: "/tours",
});

export default async function ToursPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Tours", path: "/tours" }])} />
      <section className="border-b border-ink-100 bg-white">
        <div className="container-page py-6">
          <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Tours" }]} className="mb-3" />
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <h1 className="font-display text-3xl font-semibold tracking-tight">Tour packages</h1>
            <Link href="/tours/custom-request" className="inline-flex items-center gap-1.5 text-sm font-semibold text-coral-600 hover:underline">
              <Sparkles className="size-4" /> Want something unique? Request a custom tour
            </Link>
          </div>
          <TourSearchForm compact initial={{ destination: sp.destination ?? "", month: sp.month, category: sp.category }} />
        </div>
      </section>
      <div className="container-page py-8">
        <Suspense fallback={<PageLoader />}>
          <TourResults />
        </Suspense>
      </div>
    </>
  );
}
