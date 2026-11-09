"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Bell, CreditCard, FileText, Heart, LayoutDashboard, LogOut, Settings, Ticket, UserRound, Users } from "lucide-react";
import { useRequireAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { PageLoader } from "../common/Feedback";

export const ACCOUNT_NAV = [
  { href: "/my-account", label: "Overview", Icon: LayoutDashboard },
  { href: "/my-account/bookings", label: "My bookings", Icon: Ticket },
  { href: "/my-account/visa", label: "Visa applications", Icon: FileText },
  { href: "/my-account/wishlist", label: "Wishlist", Icon: Heart },
  { href: "/my-account/travelers", label: "Saved travellers", Icon: Users },
  { href: "/my-account/payments", label: "Payments", Icon: CreditCard },
  { href: "/my-account/notifications", label: "Notifications", Icon: Bell },
  { href: "/my-account/profile", label: "Profile", Icon: UserRound },
  { href: "/my-account/settings", label: "Settings & security", Icon: Settings },
];

export function AccountShell({ children }: { children: ReactNode }) {
  const { allowed, user, logout } = useRequireAuth();
  const pathname = usePathname();
  if (!allowed || !user) return <PageLoader label="Loading your account…" />;

  return (
    <div className="container-page py-6 lg:py-10">
      <div className="grid gap-6 lg:grid-cols-[15rem_1fr]">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="mb-3 hidden items-center gap-3 lg:flex">
            <span className="grid size-11 place-items-center rounded-full bg-brand-600 font-bold text-white">{user.name[0]}</span>
            <div className="min-w-0">
              <p className="truncate font-bold">{user.name}</p>
              <p className="truncate text-xs text-ink-500">{user.email}</p>
            </div>
          </div>
          <nav aria-label="Account" className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:px-0">
            <ul className="flex gap-1 lg:flex-col">
              {ACCOUNT_NAV.map(({ href, label, Icon }) => {
                const active = href === "/my-account" ? pathname === href : pathname.startsWith(href);
                return (
                  <li key={href} className="shrink-0">
                    <Link href={href} aria-current={active ? "page" : undefined} className={cn("flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold whitespace-nowrap transition", active ? "bg-brand-600 text-white" : "text-ink-700 hover:bg-ink-100")}>
                      <Icon className="size-4" /> {label}
                    </Link>
                  </li>
                );
              })}
              <li className="shrink-0">
                <button type="button" onClick={() => void logout()} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold whitespace-nowrap text-coral-600 hover:bg-coral-50">
                  <LogOut className="size-4" /> Sign out
                </button>
              </li>
            </ul>
          </nav>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}

export function AccountHeading({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-semibold sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-ink-600">{description}</p>}
      </div>
      {action}
    </div>
  );
}
