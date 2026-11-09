"use client";

import Link from "next/link";
import { useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { AccountHeading } from "@/components/account/AccountShell";
import { Button } from "@/components/common/Button";
import { EmptyState, ErrorState, Skeleton } from "@/components/common/Feedback";
import { Pagination } from "@/components/common/Pagination";
import { useAsync } from "@/hooks/useAsync";
import { cn, formatDateTime } from "@/lib/utils";
import { accountService } from "@/services";

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useAsync(() => accountService.notifications(page), [page]);

  async function markAll() {
    await accountService.readAllNotifications();
    reload();
  }
  async function markOne(id: string) {
    await accountService.readNotification(id);
    reload();
  }

  return (
    <>
      <AccountHeading title="Notifications" action={data?.items.some((n) => !n.read) ? <Button size="sm" variant="outline" onClick={markAll}><CheckCheck className="size-4" />Mark all read</Button> : undefined} />
      {error ? <ErrorState message={error} onRetry={reload} /> : loading ? <Skeleton className="h-48" /> : !data?.items.length ? (
        <EmptyState icon={Bell} title="You're all caught up" />
      ) : (
        <>
          <ul className="card divide-y divide-ink-100">
            {data.items.map((n) => (
              <li key={n._id} className={cn("flex gap-3 p-4", !n.read && "bg-brand-50/50")}>
                <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.read ? "bg-transparent" : "bg-coral-500")} aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{n.title}</p>
                  <p className="text-sm text-ink-600">{n.message}</p>
                  <p className="mt-1 text-xs text-ink-400">{formatDateTime(n.createdAt)}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1 text-sm">
                  {n.link && <Link href={n.link} onClick={() => !n.read && markOne(n._id)} className="font-semibold text-brand-700 hover:underline">View</Link>}
                  {!n.read && <button type="button" onClick={() => markOne(n._id)} className="text-xs text-ink-500 hover:text-ink-800">Mark read</button>}
                </div>
              </li>
            ))}
          </ul>
          <Pagination page={page} totalPages={data.meta.totalPages} onChange={setPage} />
        </>
      )}
    </>
  );
}
