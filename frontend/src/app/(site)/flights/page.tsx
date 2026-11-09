import Link from "next/link";
import { ArrowRight, BadgePercent, Clock, PlaneTakeoff, ShieldCheck } from "lucide-react";
import { FlightSearchForm } from "@/components/flights/FlightSearchForm";
import { flightSearchUrl } from "@/lib/flight-search";
import { Breadcrumbs, JsonLd, SectionHeading } from "@/components/common/Misc";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { todayInput } from "@/lib/utils";

export const metadata = buildMetadata({
  title: "Cheap Flights: Domestic & International Air Tickets",
  description: "Search one-way, round-trip and multi-city flights from Dhaka, Chattogram and Sylhet. Compare fares, filter by airline and stops, and pay with bKash, Nagad or card.",
  path: "/flights",
});

const ROUTES = [
  ["DAC", "CXB", "Dhaka", "Cox's Bazar"],
  ["DAC", "CGP", "Dhaka", "Chattogram"],
  ["DAC", "ZYL", "Dhaka", "Sylhet"],
  ["DAC", "JSR", "Dhaka", "Jashore"],
  ["DAC", "BKK", "Dhaka", "Bangkok"],
  ["DAC", "KUL", "Dhaka", "Kuala Lumpur"],
  ["DAC", "DXB", "Dhaka", "Dubai"],
  ["DAC", "SIN", "Dhaka", "Singapore"],
];

export default function FlightsPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Flights", path: "/flights" }])} />
      <section className="bg-gradient-to-br from-brand-800 via-brand-700 to-brand-600 pb-10 text-white">
        <div className="container-page pt-6">
          <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Flights" }]} className="mb-4 text-white/80 [&_a]:text-white/80" />
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-5xl">Fly anywhere, simply.</h1>
          <p className="mt-2 max-w-xl text-white/85">Domestic hops and international journeys. Compare schedules and fares in one place.</p>
          <div className="mt-6 rounded-(--radius-card) bg-white p-4 text-ink-900 shadow-(--shadow-search) sm:p-6">
            <FlightSearchForm />
          </div>
        </div>
      </section>

      <div className="container-page py-12">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { Icon: BadgePercent, t: "Transparent fares", d: "Taxes and fees shown before you pay. No surprises." },
            { Icon: ShieldCheck, t: "Server-verified payments", d: "Tickets confirm only after the payment provider confirms." },
            { Icon: Clock, t: "24/7 support", d: "Schedule changes and refunds handled by real people." },
          ].map(({ Icon, t, d }) => (
            <div key={t} className="card flex gap-4 p-5">
              <Icon className="size-8 shrink-0 text-brand-600" />
              <div><p className="font-bold">{t}</p><p className="text-sm text-ink-600">{d}</p></div>
            </div>
          ))}
        </div>

        <section className="mt-12">
          <SectionHeading eyebrow="Popular routes" title="Where people are flying" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {ROUTES.map(([from, to, fc, tc]) => (
              <Link
                key={from + to}
                href={flightSearchUrl({ tripType: "one_way", legs: [{ from, to, date: todayInput(7) }], returnDate: todayInput(10), cabinClass: "economy", passengers: { adults: 1, children: 0, infants: 0 } })}
                className="card group flex items-center gap-3 p-4 transition hover:shadow-(--shadow-lift)"
              >
                <PlaneTakeoff className="size-5 shrink-0 text-brand-600" />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{fc} → {tc}</span>
                  <span className="text-xs text-ink-500">{from} – {to}</span>
                </span>
                <ArrowRight className="size-4 text-ink-400 transition group-hover:translate-x-0.5 group-hover:text-brand-600" />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
