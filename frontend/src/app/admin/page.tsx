"use client";

import Link from "next/link";
import { AlertTriangle, FileText, Mail, MessageSquare, Ticket, Users, Wallet } from "lucide-react";
import { StatusBadge } from "@/components/common/Badge";
import { ErrorState, Skeleton } from "@/components/common/Feedback";
import { useAsync } from "@/hooks/useAsync";
import { get } from "@/lib/api";
import { formatDateTime, formatPrice } from "@/lib/utils";
import type { Booking } from "@/types";

interface Stats {
  totals: { users: number; bookings: number; revenue: number; liveRevenue: number; demoRevenue: number; pendingVisa: number; pendingReviews: number; subscribers: number; cancellationRequests: number };
  byType: { _id: string; count: number; revenue: number }[];
  byStatus: { _id: string; count: number }[];
  monthly: { month: string; total: number; count: number }[];
  recent: (Booking & { user: { name: string; email: string } })[];
}

export default function AdminDashboard() {
  const { data, loading, error, reload } = useAsync(() => get<Stats>("/admin/stats"), []);
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (loading || !data) return <div className="grid gap-4 sm:grid-cols-4">{Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-28" />)}</div>;

  const t = data.totals;
  const max = Math.max(1, ...data.monthly.map((m) => m.total));
  const cards = [
    { label: "Live revenue", value: formatPrice(t.liveRevenue), Icon: Wallet, href: "/admin/payments", note: "Verified by real gateways" },
    { label: "Demo payments", value: formatPrice(t.demoRevenue), Icon: Wallet, href: "/admin/payments", note: "Simulated, no money moved" },
    { label: "Bookings", value: t.bookings, Icon: Ticket, href: "/admin/bookings" },
    { label: "Customers", value: t.users, Icon: Users, href: "/admin/users" },
    { label: "Open visa files", value: t.pendingVisa, Icon: FileText, href: "/admin/visa-applications" },
    { label: "Reviews to moderate", value: t.pendingReviews, Icon: MessageSquare, href: "/admin/reviews?status=pending" },
    { label: "Cancellation requests", value: t.cancellationRequests, Icon: AlertTriangle, href: "/admin/bookings?cancellation=requested" },
    { label: "Subscribers", value: t.subscribers, Icon: Mail, href: "/admin/newsletter" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-semibold">Dashboard</h1>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map(({ label, value, Icon, href, note }) => (
          <Link key={label} href={href} className="card p-4 transition hover:shadow-(--shadow-lift)">
            <div className="flex items-center justify-between"><p className="text-xs font-semibold text-ink-500">{label}</p><Icon className="size-4 text-brand-600" /></div>
            <p className="mt-2 text-xl font-bold sm:text-2xl">{value}</p>
            {note && <p className="text-[11px] text-ink-400">{note}</p>}
          </Link>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <section className="card p-5" aria-labelledby="rev-h">
          <h2 id="rev-h" className="font-bold">Successful payments, last 6 months</h2>
          <div className="mt-6 flex h-48 items-end gap-3" role="img" aria-label="Monthly payment totals">
            {data.monthly.map((m) => (
              <div key={m.month} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                <span className="text-[10px] font-semibold text-ink-500">{m.total ? `${Math.round(m.total / 1000)}k` : ""}</span>
                <div className="w-full max-w-12 rounded-t-md bg-brand-500" style={{ height: `${Math.max(2, (m.total / max) * 100)}%` }} title={`${m.month}: ${formatPrice(m.total)} (${m.count})`} />
                <span className="text-[11px] text-ink-500">{new Date(`${m.month}-01`).toLocaleDateString("en-GB", { month: "short" })}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="card p-5" aria-labelledby="type-h">
          <h2 id="type-h" className="font-bold">By product</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {data.byType.map((b) => (
              <li key={b._id} className="flex items-center justify-between gap-3">
                <span className="font-semibold capitalize">{b._id}</span>
                <span className="text-ink-500">{b.count} bookings · {formatPrice(b.revenue)}</span>
              </li>
            ))}
          </ul>
          <h3 className="mt-6 text-sm font-bold">By status</h3>
          <div className="mt-2 flex flex-wrap gap-2">{data.byStatus.map((s) => <span key={s._id} className="flex items-center gap-1"><StatusBadge status={s._id} /><span className="text-xs text-ink-500">{s.count}</span></span>)}</div>
        </section>
      </div>

      <section className="card overflow-x-auto">
        <div className="flex items-center justify-between p-5 pb-3"><h2 className="font-bold">Recent bookings</h2><Link href="/admin/bookings" className="text-sm font-semibold text-brand-700 hover:underline">View all</Link></div>
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead className="border-y border-ink-100 bg-sand-50 text-xs text-ink-500 uppercase"><tr><th className="px-5 py-2">Ref</th><th className="px-5 py-2">Customer</th><th className="px-5 py-2">Item</th><th className="px-5 py-2">Total</th><th className="px-5 py-2">Status</th><th className="px-5 py-2">Created</th></tr></thead>
          <tbody className="divide-y divide-ink-100">
            {data.recent.map((b) => (
              <tr key={b._id}>
                <td className="px-5 py-2.5 font-mono text-xs"><Link href={`/admin/bookings?q=${b.reference}`} className="text-brand-700 hover:underline">{b.reference}</Link></td>
                <td className="px-5 py-2.5">{b.user?.name}</td>
                <td className="max-w-56 truncate px-5 py-2.5">{b.title}</td>
                <td className="px-5 py-2.5 font-semibold">{formatPrice(b.pricing.total)}</td>
                <td className="px-5 py-2.5"><StatusBadge status={b.status} /></td>
                <td className="px-5 py-2.5 whitespace-nowrap text-ink-500">{formatDateTime(b.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
