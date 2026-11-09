"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { AccountHeading } from "@/components/account/AccountShell";
import { LinkButton } from "@/components/common/Button";
import { EmptyState, ErrorState, Skeleton } from "@/components/common/Feedback";
import { WishlistButton } from "@/components/common/WishlistButton";
import { useAsync } from "@/hooks/useAsync";
import { formatPrice } from "@/lib/utils";
import { accountService } from "@/services";

export default function WishlistPage() {
  const { data, loading, error, reload } = useAsync(() => accountService.wishlist(), []);
  return (
    <>
      <AccountHeading title="Wishlist" description="Hotels and tours you've saved for later." />
      {error ? <ErrorState message={error} onRetry={reload} /> : loading ? <Skeleton className="h-48" /> : !data?.filter((w) => w.item).length ? (
        <EmptyState icon={Heart} title="Nothing saved yet" description="Tap the heart on any hotel or tour to save it here." action={<LinkButton href="/tours">Explore tours</LinkButton>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.filter((w) => w.item).map((w) => {
            const href = `/${w.itemType === "hotel" ? "hotels" : "tours"}/${w.item.slug}`;
            const name = w.item.name ?? w.item.title;
            const price = w.itemType === "hotel" ? w.item.priceFrom : w.item.priceAdult;
            return (
              <article key={w._id} className="card relative overflow-hidden">
                <Link href={href} className="block">
                  <div className="relative h-36 bg-ink-100">{w.item.images?.[0] && <Image src={w.item.images[0]} alt={name ?? ""} fill sizes="33vw" className="object-cover" />}</div>
                  <div className="p-4">
                    <p className="text-xs font-bold text-brand-700 uppercase">{w.itemType}</p>
                    <p className="font-bold">{name}</p>
                    {price !== undefined && <p className="text-sm text-ink-600">from {formatPrice(price)}</p>}
                  </div>
                </Link>
                <WishlistButton itemType={w.itemType} itemId={w.item._id} className="absolute top-2 right-2" />
              </article>
            );
          })}
        </div>
      )}
      {data && <button type="button" className="sr-only" onClick={reload}>Refresh</button>}
    </>
  );
}
