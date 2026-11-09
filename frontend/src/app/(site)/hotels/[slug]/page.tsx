import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Check, Clock, MapPin, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/common/Badge";
import { LinkButton } from "@/components/common/Button";
import { PageLoader } from "@/components/common/Feedback";
import { Gallery } from "@/components/common/Gallery";
import { MapEmbed } from "@/components/common/MapEmbed";
import { Breadcrumbs, JsonLd, Price, RatingPill, SectionHeading, Stars } from "@/components/common/Misc";
import { ReviewsSection } from "@/components/common/Reviews";
import { WishlistButton } from "@/components/common/WishlistButton";
import { HotelCard } from "@/components/hotels/HotelCard";
import { RoomSelector } from "@/components/hotels/RoomSelector";
import { serverGet, serverGetWithMeta } from "@/lib/server-api";
import { breadcrumbJsonLd, buildMetadata, siteConfig } from "@/lib/seo";
import { titleCase } from "@/lib/utils";
import type { Destination, Hotel, Review, Room } from "@/types";

type HotelDetail = { hotel: Hotel; rooms: Room[]; reviews: Review[]; ratingBreakdown: Record<string, number>; similar: Hotel[] };
type Params = { params: Promise<{ slug: string }> };

async function load(slug: string) {
  const detail = await serverGet<HotelDetail>(`/hotels/${slug}`);
  if (detail) return { kind: "hotel" as const, detail };
  const dest = await serverGet<{ kind: string; destination?: Destination }>(`/destinations/${slug}`);
  if (dest?.kind === "destination" && dest.destination) {
    const hotels = await serverGetWithMeta<Hotel[]>(`/hotels?destination=${slug}&limit=24`);
    return { kind: "destination" as const, destination: dest.destination, hotels: hotels?.data ?? [] };
  }
  return null;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const data = await load(slug);
  if (!data) return { title: "Hotel not found" };
  if (data.kind === "destination") {
    return buildMetadata({ title: `Hotels in ${data.destination.name}: Best Prices & Reviews`, description: `Compare ${data.hotels.length} hotels and resorts in ${data.destination.name}, ${data.destination.country}. Verified reviews, free cancellation on most rooms, pay with bKash or card.`, path: `/hotels/${slug}`, image: data.destination.image });
  }
  const h = data.detail.hotel;
  return buildMetadata({ title: `${h.name}, ${h.city}: Rooms, Rates & Reviews`, description: h.shortDescription ?? h.description.slice(0, 155), path: `/hotels/${slug}`, image: h.images[0] });
}

export default async function HotelSlugPage({ params }: Params) {
  const { slug } = await params;
  const data = await load(slug);
  if (!data) notFound();

  if (data.kind === "destination") {
    const d = data.destination;
    return (
      <div className="container-page py-8">
        <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Hotels", path: "/hotels" }, { name: d.name, path: `/hotels/${slug}` }])} />
        <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Hotels", href: "/hotels" }, { name: d.name }]} className="mb-4" />
        <SectionHeading as="h1" eyebrow={d.country} title={`Hotels & resorts in ${d.name}`} description={d.tagline} action={<LinkButton href={`/hotels?destination=${slug}`}>Search with dates & filters</LinkButton>} />
        {data.hotels.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {data.hotels.map((h) => (
              <HotelCard key={h._id} hotel={h} />
            ))}
          </div>
        ) : (
          <p className="text-ink-500">No hotels listed in {d.name} yet.</p>
        )}
        <p className="mt-8 text-sm text-ink-500">
          Planning more? See <Link href={`/tours/${slug}`} className="font-semibold text-brand-700 hover:underline">tours in {d.name}</Link> or the <Link href={`/destinations/${slug}`} className="font-semibold text-brand-700 hover:underline">{d.name} travel guide</Link>.
        </p>
      </div>
    );
  }

  const { hotel, reviews, ratingBreakdown, similar } = data.detail;
  const hotelLd = {
    "@context": "https://schema.org",
    "@type": "Hotel",
    name: hotel.name,
    description: hotel.description,
    image: hotel.images,
    url: `${siteConfig.url}/hotels/${hotel.slug}`,
    starRating: { "@type": "Rating", ratingValue: hotel.stars },
    address: { "@type": "PostalAddress", streetAddress: hotel.address, addressLocality: hotel.city, addressCountry: hotel.destination?.country },
    ...(hotel.location ? { geo: { "@type": "GeoCoordinates", latitude: hotel.location.lat, longitude: hotel.location.lng } } : {}),
    aggregateRating: hotel.reviewCount ? { "@type": "AggregateRating", ratingValue: hotel.rating, reviewCount: hotel.reviewCount, bestRating: 5 } : undefined,
    priceRange: `From BDT ${hotel.priceFrom}`,
    amenityFeature: hotel.amenities.map((a) => ({ "@type": "LocationFeatureSpecification", name: a, value: true })),
  };

  return (
    <div className="container-page py-6">
      <JsonLd data={hotelLd} />
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Hotels", path: "/hotels" }, { name: hotel.city, path: `/hotels/${hotel.destination.slug}` }, { name: hotel.name, path: `/hotels/${hotel.slug}` }])} />
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Hotels", href: "/hotels" }, { name: hotel.city, href: `/hotels/${hotel.destination.slug}` }, { name: hotel.name }]} className="mb-4" />

      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Stars count={hotel.stars} />
            <Badge tone="brand">{titleCase(hotel.propertyType)}</Badge>
            {hotel.badges.map((b) => (
              <Badge key={b} tone="coral">{b}</Badge>
            ))}
          </div>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{hotel.name}</h1>
          <p className="mt-2 flex items-center gap-1.5 text-sm text-ink-600">
            <MapPin className="size-4 shrink-0 text-brand-600" /> {hotel.address}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <RatingPill rating={hotel.rating} reviews={hotel.reviewCount} />
          <WishlistButton itemType="hotel" itemId={hotel._id} className="border border-ink-200" />
        </div>
      </div>

      <Gallery images={hotel.images} alt={hotel.name} />

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div className="min-w-0 space-y-8">
          <section className="card p-5 sm:p-6" aria-labelledby="about-heading">
            <h2 id="about-heading" className="text-xl font-bold">About this property</h2>
            <p className="mt-3 leading-relaxed text-ink-600">{hotel.description}</p>
            <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
              {hotel.highlights.map((h) => (
                <li key={h} className="flex items-start gap-2"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-brand-600" />{h}</li>
              ))}
            </ul>
          </section>

          <section className="card p-5 sm:p-6" aria-labelledby="amenities-heading">
            <h2 id="amenities-heading" className="text-xl font-bold">Amenities</h2>
            <ul className="mt-4 grid grid-cols-2 gap-2.5 text-sm sm:grid-cols-3">
              {hotel.amenities.map((a) => (
                <li key={a} className="flex items-center gap-2 text-ink-700"><Check className="size-4 shrink-0 text-brand-600" />{a}</li>
              ))}
            </ul>
          </section>

          <Suspense fallback={<PageLoader label="Checking availability…" />}>
            <RoomSelector slug={hotel.slug} />
          </Suspense>

          <section className="card p-5 sm:p-6" aria-labelledby="policies-heading">
            <h2 id="policies-heading" className="text-xl font-bold">Policies</h2>
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
              <div><dt className="flex items-center gap-2 font-semibold"><Clock className="size-4 text-brand-600" />Check-in / out</dt><dd className="mt-1 text-ink-600">From {hotel.policies?.checkIn} · Until {hotel.policies?.checkOut}</dd></div>
              <div><dt className="font-semibold">Cancellation</dt><dd className="mt-1 text-ink-600">{hotel.policies?.cancellation}</dd></div>
              <div><dt className="font-semibold">Children</dt><dd className="mt-1 text-ink-600">{hotel.policies?.children}</dd></div>
              <div><dt className="font-semibold">Payment</dt><dd className="mt-1 text-ink-600">bKash, Nagad, cards via SSLCommerz, international cards.</dd></div>
            </dl>
          </section>

          <ReviewsSection targetType="hotel" targetId={hotel._id} rating={hotel.rating} reviewCount={hotel.reviewCount} reviews={reviews} breakdown={ratingBreakdown} />
        </div>

        <aside className="space-y-5 lg:sticky lg:top-20 lg:self-start">
          <div className="card p-5">
            <p className="text-xs font-semibold tracking-wide text-ink-500 uppercase">Rooms from</p>
            <Price amount={hotel.priceFrom} original={hotel.originalPriceFrom} suffix="/ night" className="[&>span:nth-last-child(2)]:text-2xl" />
            <LinkButton href="#rooms" variant="accent" className="mt-4 w-full">See rooms</LinkButton>
            <p className="mt-3 text-center text-xs text-ink-500">No booking fees · Instant confirmation</p>
          </div>
          {hotel.location && <MapEmbed lat={hotel.location.lat} lng={hotel.location.lng} title={hotel.name} />}
        </aside>
      </div>

      {similar.length > 0 && (
        <section className="mt-14" aria-labelledby="similar-heading">
          <SectionHeading title={`More stays in ${hotel.city}`} />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {similar.map((h) => (
              <HotelCard key={h._id} hotel={h} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
