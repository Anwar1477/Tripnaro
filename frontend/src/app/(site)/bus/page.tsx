import Link from "next/link";
import { BusFront } from "lucide-react";
import { BusResults } from "@/components/bus/BusResults";
import { BusSearchForm } from "@/components/bus/BusSearchForm";
import { Breadcrumbs, JsonLd, SectionHeading } from "@/components/common/Misc";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { todayInput } from "@/lib/utils";

export const metadata = buildMetadata({
  title: "Bus Tickets: Book Intercity Coaches Online",
  description: "Book AC, non-AC and sleeper bus tickets between Dhaka, Cox's Bazar, Chattogram, Sylhet and more. Pick your seat, pay with bKash or card.",
  path: "/bus",
});

const ROUTES = [
  ["Dhaka", "Cox's Bazar"],
  ["Dhaka", "Chattogram"],
  ["Dhaka", "Sylhet"],
  ["Chattogram", "Cox's Bazar"],
  ["Dhaka", "Rajshahi"],
  ["Dhaka", "Khulna"],
];

export default async function BusPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const searching = !!(sp.from && sp.to && sp.date);
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Bus", path: "/bus" }])} />
      <section className="border-b border-ink-100 bg-white">
        <div className="container-page py-6">
          <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Bus tickets" }]} className="mb-3" />
          <h1 className="mb-5 font-display text-3xl font-semibold tracking-tight">Bus tickets</h1>
          <BusSearchForm compact initial={{ from: sp.from, to: sp.to, date: sp.date }} key={`${sp.from}-${sp.to}-${sp.date}`} />
        </div>
      </section>
      <div className="container-page py-8">
        {searching ? (
          <BusResults from={sp.from!} to={sp.to!} date={sp.date!} />
        ) : (
          <section>
            <SectionHeading eyebrow="Popular routes" title="Where are you heading?" />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {ROUTES.map(([f, t]) => (
                <Link key={f + t} href={`/bus?from=${encodeURIComponent(f)}&to=${encodeURIComponent(t)}&date=${todayInput(1)}`} className="card flex items-center gap-3 p-4 transition hover:shadow-(--shadow-lift)">
                  <BusFront className="size-5 text-brand-600" />
                  <span className="font-semibold">{f} → {t}</span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
