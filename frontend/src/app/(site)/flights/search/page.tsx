import type { Metadata } from "next";
import { Suspense } from "react";
import { PageLoader } from "@/components/common/Feedback";
import { FlightResults } from "@/components/flights/FlightResults";
import { FlightSearchForm } from "@/components/flights/FlightSearchForm";
import { parseFlightSearch } from "@/lib/flight-search";

export const metadata: Metadata = { title: "Flight search results", robots: { index: false, follow: true } };

export default async function FlightSearchPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const parsed = parseFlightSearch({ get: (k) => sp[k] ?? null });
  return (
    <>
      <section className="border-b border-ink-100 bg-white">
        <div className="container-page py-5">
          <h1 className="sr-only">Flight search results</h1>
          <FlightSearchForm compact initial={parsed?.initial} key={JSON.stringify(sp)} />
        </div>
      </section>
      <div className="container-page py-6">
        <Suspense fallback={<PageLoader />}>
          <FlightResults />
        </Suspense>
      </div>
    </>
  );
}
