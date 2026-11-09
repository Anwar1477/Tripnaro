import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { cn, discountPercent, titleCase } from "@/lib/utils";
import type { Hotel } from "@/types";
import { Badge } from "../common/Badge";
import { Price, RatingPill, Stars } from "../common/Misc";
import { WishlistButton } from "../common/WishlistButton";

export function HotelCard({ hotel, query, className }: { hotel: Hotel; query?: string; className?: string }) {
  const href = `/hotels/${hotel.slug}${query ? `?${query}` : ""}`;
  const off = discountPercent(hotel.priceFrom, hotel.originalPriceFrom);
  return (
    <article className={cn("card group relative flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-(--shadow-lift)", className)}>
      <Link href={href} className="relative block aspect-[4/3] overflow-hidden bg-ink-100">
        {hotel.images[0] && (
          <Image src={hotel.images[0]} alt={hotel.name} fill sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw" className="object-cover transition duration-500 group-hover:scale-105" />
        )}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {hotel.badges.slice(0, 1).map((b) => (
            <Badge key={b} tone="dark">
              {b}
            </Badge>
          ))}
          {off > 0 && <Badge className="bg-coral-500 text-white">{off}% off</Badge>}
        </div>
      </Link>
      <WishlistButton itemType="hotel" itemId={hotel._id} className="absolute top-3 right-3" />
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1 flex items-center gap-2 text-xs text-ink-500">
          <Stars count={hotel.stars} />
          <span>· {titleCase(hotel.propertyType)}</span>
        </div>
        <h3 className="line-clamp-1 text-[17px] font-bold">
          <Link href={href} className="hover:text-brand-700">
            {hotel.name}
          </Link>
        </h3>
        <p className="mt-1 flex items-center gap-1 text-[13px] text-ink-500">
          <MapPin className="size-3.5 shrink-0" />
          <span className="truncate">
            {hotel.area ? `${hotel.area}, ` : ""}
            {hotel.city}
          </span>
        </p>
        <RatingPill rating={hotel.rating} reviews={hotel.reviewCount} className="mt-3" />
        <div className="mt-auto flex items-end justify-between gap-2 pt-4">
          <div>
            <p className="text-[11px] font-semibold tracking-wide text-ink-500 uppercase">From</p>
            <Price amount={hotel.priceFrom} original={hotel.originalPriceFrom} suffix="/ night" />
          </div>
        </div>
      </div>
    </article>
  );
}
