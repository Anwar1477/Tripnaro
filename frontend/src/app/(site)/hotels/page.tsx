import { Suspense } from "react";
import { PageLoader } from "@/components/common/Feedback";
import { Breadcrumbs, JsonLd } from "@/components/common/Misc";
import { HotelResults } from "@/components/hotels/HotelResults";
import { HotelSearchForm } from "@/components/hotels/HotelSearchForm";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Hotels & Resorts: Book Stays in Bangladesh and Abroad",
  description: "Compare hotels, resorts, villas and apartments in Cox's Bazar, Sylhet, Sajek, Bali, Maldives and more. Filter by price, stars, rating and amenities.",
  path: "/hotels",
});

export default async function HotelsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Hotels", path: "/hotels" }])} />
      <section className="border-b border-ink-100 bg-white">
        <div className="container-page py-6">
          <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Hotels" }]} className="mb-3" />
          <h1 className="mb-5 font-display text-3xl font-semibold tracking-tight">Find your stay</h1>
          <HotelSearchForm
            compact
            initial={{
              destination: sp.destination ?? "",
              destinationLabel: sp.destination?.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
              checkIn: sp.checkIn,
              checkOut: sp.checkOut,
              rooms: sp.rooms ? Number(sp.rooms) : undefined,
              adults: sp.adults ? Number(sp.adults) : undefined,
              children: sp.children ? Number(sp.children) : undefined,
              purpose: sp.purpose,
            }}
          />
        </div>
      </section>
      <div className="container-page py-8">
        <Suspense fallback={<PageLoader />}>
          <HotelResults />
        </Suspense>
      </div>
    </>
  );
}
