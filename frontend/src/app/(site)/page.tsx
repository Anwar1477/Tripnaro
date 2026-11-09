import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Flame, ShieldCheck, Star, TrendingUp } from "lucide-react";
import { LinkButton } from "@/components/common/Button";
import { JsonLd, SectionHeading } from "@/components/common/Misc";
import { CouponCard, NewsletterForm } from "@/components/home/ClientBits";
import { DestinationCard } from "@/components/home/DestinationCard";
import { SearchPanel } from "@/components/home/SearchPanel";
import { Experiences, FAQ, HOME_FAQ, Testimonials, WhyChoose } from "@/components/home/StaticSections";
import { HotelCard } from "@/components/hotels/HotelCard";
import { TourCard } from "@/components/tours/TourCard";
import { serverGet, serverGetWithMeta } from "@/lib/server-api";
import { buildMetadata } from "@/lib/seo";
import { formatPrice } from "@/lib/utils";
import type { Banner, Coupon, Destination, Hotel, Tour } from "@/types";

export const metadata = buildMetadata({
  title: "Tripnaro · Flights, Hotels, Tours, Bus & Visa",
  description: "Search and book flights, hotels, tour packages, bus tickets and visa services across Bangladesh and the world. Transparent prices, bKash & Nagad payments, 24/7 support.",
  path: "/",
});

const HERO = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2200&q=80";

export default async function HomePage() {
  const [featured, trending, tours, hotels, home] = await Promise.all([
    serverGet<Destination[]>("/destinations?featured=true&scope=domestic&limit=4"),
    serverGet<Destination[]>("/destinations?trending=true&limit=8"),
    serverGetWithMeta<Tour[]>("/tours?featured=true&limit=8"),
    serverGetWithMeta<Hotel[]>("/hotels?sort=recommended&limit=8"),
    serverGet<{ banners: Banner[]; coupons: Coupon[] }>("/content/home"),
  ]);

  const domestic = featured ?? [];
  const promos = (home?.banners ?? []).filter((b) => b.placement === "home-promo");

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: HOME_FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
        }}
      />

      {/* Hero */}
      <section className="relative isolate">
        <div className="absolute inset-0 -z-10 h-[34rem] overflow-hidden sm:h-[38rem]">
          <Image src={HERO} alt="" fill priority sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-brand-950/75 via-brand-950/45 to-brand-950/10" />
        </div>
        <div className="container-page pt-14 pb-10 sm:pt-20">
          <div className="max-w-3xl text-white">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold tracking-wide backdrop-blur">
              <ShieldCheck className="size-4 text-coral-300" /> Verified partners · Secure local payments
            </p>
            <h1 className="font-display text-4xl leading-[1.05] font-semibold tracking-tight text-white sm:text-6xl">
              Travel, beautifully <span className="text-coral-300 italic">planned.</span>
            </h1>
            <p className="mt-4 max-w-xl text-base text-white/85 sm:text-lg">Flights, stays, tours, buses and visas in one place, from Cox&apos;s Bazar sunsets to Maldives lagoons.</p>
          </div>
          <div className="mt-8 sm:mt-10">
            <SearchPanel />
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium text-ink-600">
            <span className="flex items-center gap-1.5">
              <Star className="size-4 fill-amber-400 text-amber-400" /> 4.8 average rating
            </span>
            <span>24/7 support</span>
            <span>Pay with bKash, Nagad or card</span>
          </div>
        </div>
      </section>

      {/* Offers */}
      {home?.coupons?.length ? (
        <section className="container-page pt-10" aria-labelledby="offers-heading">
          <SectionHeading eyebrow="Exclusive deals" title="Offers worth packing for" action={<LinkButton href="/tours" variant="outline" size="sm">All deals <ArrowRight className="size-4" /></LinkButton>} />
          <div className="scrollbar-none -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
            {home.coupons.map((c) => (
              <CouponCard key={c._id} coupon={c} />
            ))}
          </div>
        </section>
      ) : null}

      {/* Featured destinations */}
      {domestic.length > 0 && (
        <section className="container-page pt-16" aria-labelledby="dest-heading">
          <SectionHeading eyebrow="Featured destinations" title="Discover Bangladesh" description="From the world's longest sea beach to cloud-top villages and mangrove forests." action={<LinkButton href="/destinations/bangladesh" variant="outline" size="sm">Explore Bangladesh <ArrowRight className="size-4" /></LinkButton>} />
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {domestic.map((d) => (
              <DestinationCard key={d._id} destination={d} />
            ))}
          </div>
        </section>
      )}

      {/* Popular tours */}
      {tours?.data?.length ? (
        <section className="container-page pt-16" aria-labelledby="tours-heading">
          <SectionHeading eyebrow="Popular tour packages" title="Trips our travellers can't stop talking about" action={<LinkButton href="/tours" variant="outline" size="sm">View all tours <ArrowRight className="size-4" /></LinkButton>} />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {tours.data.slice(0, 8).map((t) => (
              <TourCard key={t._id} tour={t} />
            ))}
          </div>
        </section>
      ) : null}

      {/* Promotional banners */}
      {promos.length > 0 && (
        <section className="container-page pt-16" aria-label="Promotions">
          <div className="grid gap-5 md:grid-cols-3">
            {promos.map((b) => (
              <Link key={b._id} href={b.link} className="group relative flex min-h-56 overflow-hidden rounded-(--radius-card)">
                <Image src={b.image} alt="" fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-r from-brand-950/85 via-brand-950/50 to-transparent" />
                <div className="relative mt-auto p-6 text-white">
                  <h3 className="font-display text-2xl font-semibold text-white">{b.title}</h3>
                  {b.subtitle && <p className="mt-1 text-sm text-white/85">{b.subtitle}</p>}
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-coral-200">
                    {b.ctaLabel} <ArrowRight className="size-4 transition group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Hotels */}
      {hotels?.data?.length ? (
        <section className="container-page pt-16" aria-labelledby="hotels-heading">
          <SectionHeading eyebrow="Popular hotels & resorts" title="Stays with a view worth waking up to" action={<LinkButton href="/hotels" variant="outline" size="sm">Browse hotels <ArrowRight className="size-4" /></LinkButton>} />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {hotels.data.slice(0, 8).map((h) => (
              <HotelCard key={h._id} hotel={h} />
            ))}
          </div>
        </section>
      ) : null}

      {/* Trending */}
      {trending?.length ? (
        <section className="container-page pt-16" aria-labelledby="trending-heading">
          <SectionHeading eyebrow="Trending now" title="Where everyone's heading this season" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {trending.map((d, i) => (
              <Link key={d._id} href={`/destinations/${d.slug}`} className="group card flex items-center gap-4 p-3 transition hover:shadow-(--shadow-lift)">
                <span className="relative size-16 shrink-0 overflow-hidden rounded-xl">
                  <Image src={d.image} alt="" fill sizes="64px" className="object-cover" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-coral-600">
                    {i < 3 ? <Flame className="size-3.5" /> : <TrendingUp className="size-3.5" />} #{i + 1} trending
                  </span>
                  <span className="block truncate font-bold group-hover:text-brand-700">{d.name}</span>
                  <span className="block truncate text-xs text-ink-500">
                    {d.country} · from {formatPrice(d.startingPrice)}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <Experiences />
      <WhyChoose />
      <Testimonials />
      <FAQ />

      {/* Newsletter */}
      <section className="container-page" aria-labelledby="newsletter-heading">
        <div className="relative overflow-hidden rounded-[1.75rem] bg-brand-800 px-6 py-12 sm:px-12">
          <div className="absolute -top-24 -right-24 size-72 rounded-full bg-brand-600/40" aria-hidden />
          <div className="absolute -bottom-28 left-1/3 size-64 rounded-full bg-coral-500/20" aria-hidden />
          <div className="relative grid items-center gap-8 lg:grid-cols-2">
            <div>
              <h2 id="newsletter-heading" className="font-display text-3xl font-semibold text-white">
                Get deals before everyone else
              </h2>
              <p className="mt-2 text-brand-100">One short email a week with fare drops, hotel flash sales and new tour departures. No spam, unsubscribe anytime.</p>
            </div>
            <NewsletterForm className="lg:justify-self-end" />
          </div>
        </div>
      </section>
    </>
  );
}
