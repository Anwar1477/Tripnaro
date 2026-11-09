"use client";

import Link from "next/link";
import { Bell, FileText, Heart, Ticket, Wallet } from "lucide-react";
import { AccountHeading } from "@/components/account/AccountShell";
import { BookingRow } from "@/components/account/BookingRow";
import { LinkButton } from "@/components/common/Button";
import { EmptyState, ErrorState, Skeleton } from "@/components/common/Feedback";
import { useAsync } from "@/hooks/useAsync";
import { useAuth } from "@/hooks/useAuth";
import { formatPrice } from "@/lib/utils";
import { accountService } from "@/services";

export default function AccountOverviewPage() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useAsync(() => accountService.overview(), []);

  const stats = data
    ? [
        { label: "Bookings", value: data.totalBookings, Icon: Ticket, href: "/my-account/bookings" },
        { label: "Visa applications", value: data.counts.visa ?? 0, Icon: FileText, href: "/my-account/visa" },
        { label: "Wishlist", value: data.counts.wishlist ?? 0, Icon: Heart, href: "/my-account/wishlist" },
        { label: "Unread alerts", value: data.counts.unreadNotifications ?? 0, Icon: Bell, href: "/my-account/notifications" },
        { label: "Total spent", value: formatPrice(data.totalSpent), Icon: Wallet, href: "/my-account/payments" },
      ]
    : [];

  return (
    <>
      <AccountHeading title={`Hi, ${user?.name.split(" ")[0] ?? "traveller"} 👋`} description="Here's what's happening with your trips." />
      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            {stats.map(({ label, value, Icon, href }) => (
              <Link key={label} href={href} className="card p-4 transition hover:shadow-(--shadow-lift)">
                <Icon className="size-5 text-brand-600" />
                <p className="mt-2 text-xl font-bold">{value}</p>
                <p className="text-xs text-ink-500">{label}</p>
              </Link>
            ))}
          </div>
          <section className="mt-8">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">Upcoming trips</h2>
              <Link href="/my-account/bookings" className="text-sm font-semibold text-brand-700 hover:underline">All bookings</Link>
            </div>
            {data?.upcoming.length ? (
              <div className="space-y-3">{data.upcoming.map((b) => <BookingRow key={b._id} booking={b} />)}</div>
            ) : (
              <EmptyState icon={Ticket} title="No upcoming trips" description="When you book a confirmed trip it will show here." action={<LinkButton href="/tours">Find your next trip</LinkButton>} />
            )}
          </section>
        </>
      )}
    </>
  );
}
