"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  BarChart3, BedDouble, BusFront, ClipboardList, Compass, CreditCard, DoorOpen, ExternalLink, FileText, Image as ImageIcon, LogOut, Mail, MapPin, Menu, MessageSquare, Plane, PlaneLanding, Settings, Sparkles, Stamp, Tag, Ticket, Users, X,
} from "lucide-react";
import { useRequireAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { PageLoader } from "../common/Feedback";
import { LogoMark } from "../layout/Logo";

const NAV: { group: string; items: { href: string; label: string; Icon: typeof Users }[] }[] = [
  { group: "Overview", items: [{ href: "/admin", label: "Dashboard", Icon: BarChart3 }] },
  {
    group: "Operations",
    items: [
      { href: "/admin/bookings", label: "Bookings", Icon: Ticket },
      { href: "/admin/payments", label: "Payments", Icon: CreditCard },
      { href: "/admin/visa-applications", label: "Visa applications", Icon: Stamp },
      { href: "/admin/content/tour-requests", label: "Tour requests", Icon: Sparkles },
      { href: "/admin/users", label: "Users", Icon: Users },
      { href: "/admin/reviews", label: "Reviews", Icon: MessageSquare },
    ],
  },
  {
    group: "Catalogue",
    items: [
      { href: "/admin/content/destinations", label: "Destinations", Icon: MapPin },
      { href: "/admin/content/hotels", label: "Hotels", Icon: BedDouble },
      { href: "/admin/content/rooms", label: "Rooms", Icon: DoorOpen },
      { href: "/admin/content/tours", label: "Tours", Icon: Compass },
      { href: "/admin/content/flights", label: "Flight schedules", Icon: Plane },
      { href: "/admin/content/airports", label: "Airports", Icon: PlaneLanding },
      { href: "/admin/content/buses", label: "Buses", Icon: BusFront },
      { href: "/admin/content/visa-countries", label: "Visa services", Icon: FileText },
    ],
  },
  {
    group: "Marketing",
    items: [
      { href: "/admin/content/coupons", label: "Coupons", Icon: Tag },
      { href: "/admin/content/banners", label: "Banners", Icon: ImageIcon },
      { href: "/admin/newsletter", label: "Newsletter", Icon: Mail },
      { href: "/admin/settings", label: "Site settings", Icon: Settings },
    ],
  },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const { allowed, user, logout } = useRequireAuth("admin");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  if (!allowed || !user) return <PageLoader label="Checking admin access…" />;

  const nav = (
    <nav aria-label="Admin" className="space-y-5 p-4">
      {NAV.map((g) => (
        <div key={g.group}>
          <p className="mb-1 px-3 text-[11px] font-bold tracking-wider text-white/45 uppercase">{g.group}</p>
          <ul className="space-y-0.5">
            {g.items.map(({ href, label, Icon }) => {
              const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
              return (
                <li key={href}>
                  <Link href={href} onClick={() => setOpen(false)} aria-current={active ? "page" : undefined} className={cn("flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition", active ? "bg-white/15 text-white" : "text-white/75 hover:bg-white/10 hover:text-white")}>
                    <Icon className="size-4" />{label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-sand-50 lg:grid lg:grid-cols-[15.5rem_1fr]">
      <aside className={cn("fixed inset-y-0 left-0 z-50 w-64 overflow-y-auto bg-ink-900 transition-transform lg:sticky lg:top-0 lg:h-screen lg:w-auto lg:translate-x-0", open ? "translate-x-0" : "-translate-x-full")}>
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <Link href="/admin" className="flex items-center gap-2 font-display text-lg font-semibold text-white"><LogoMark className="size-7" />tripnaro <span className="rounded bg-coral-500 px-1.5 text-[10px] font-bold tracking-wide uppercase">admin</span></Link>
          <button type="button" className="text-white lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu"><X className="size-5" /></button>
        </div>
        {nav}
      </aside>
      {open && <div className="fixed inset-0 z-40 bg-ink-900/40 lg:hidden" onClick={() => setOpen(false)} aria-hidden />}
      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-ink-100 bg-white/90 px-4 py-3 backdrop-blur sm:px-6">
          <button type="button" className="grid size-9 place-items-center rounded-lg hover:bg-ink-100 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Menu className="size-5" /></button>
          <div className="flex items-center gap-2 text-sm text-ink-500"><ClipboardList className="hidden size-4 sm:block" /><span className="hidden sm:inline">Signed in as</span> <strong className="text-ink-800">{user.name}</strong></div>
          <div className="flex items-center gap-2">
            <Link href="/" target="_blank" className="hidden items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-semibold text-ink-700 hover:bg-ink-100 sm:flex"><ExternalLink className="size-4" />View site</Link>
            <button type="button" onClick={() => void logout()} className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-semibold text-coral-600 hover:bg-coral-50"><LogOut className="size-4" />Sign out</button>
          </div>
        </header>
        <main id="main" className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
