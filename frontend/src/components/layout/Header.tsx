"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Bell, ChevronDown, Heart, LayoutDashboard, LogOut, Menu, Phone, Shield, Ticket, User as UserIcon, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { toast } from "@/store/toast";
import { buttonClasses } from "../common/Button";
import { Logo } from "./Logo";
import { PRIMARY_NAV } from "./nav";

export function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Close the mobile menu on navigation (state adjusted during render, not in an effect).
  const [navPath, setNavPath] = useState(pathname);
  if (navPath !== pathname) {
    setNavPath(pathname);
    setMobileOpen(false);
  }
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  if (pathname.startsWith("/admin")) return null;

  return (
    <header className={cn("sticky top-0 z-50 border-b bg-white/95 backdrop-blur transition-shadow", scrolled ? "border-ink-100 shadow-sm" : "border-transparent")}>
      <div className="container-page flex h-16 items-center gap-6">
        <Logo />
        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {PRIMARY_NAV.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-[15px] font-semibold transition",
                  active ? "bg-brand-50 text-brand-700" : "text-ink-600 hover:bg-ink-50 hover:text-ink-900",
                )}
              >
                <Icon className="size-[18px]" aria-hidden />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <a href="tel:+8809612345678" className="hidden items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-ink-600 hover:bg-ink-50 xl:flex">
            <Phone className="size-4 text-brand-600" aria-hidden /> 09612-345678
          </a>
          <AccountMenu />
          <button type="button" onClick={() => setMobileOpen((o) => !o)} className="grid size-10 place-items-center rounded-lg text-ink-700 hover:bg-ink-100 lg:hidden" aria-label={mobileOpen ? "Close menu" : "Open menu"} aria-expanded={mobileOpen}>
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>
      {mobileOpen && <MobileNav pathname={pathname} />}
    </header>
  );
}

function MobileNav({ pathname }: { pathname: string }) {
  const { user } = useAuth();
  return (
    <div className="fixed inset-x-0 top-16 bottom-0 z-40 overflow-y-auto border-t border-ink-100 bg-white lg:hidden">
      <nav aria-label="Mobile" className="container-page grid grid-cols-2 gap-2 py-5">
        {PRIMARY_NAV.map(({ label, href, icon: Icon }) => (
          <Link key={href} href={href} className={cn("flex items-center gap-3 rounded-xl border px-4 py-3.5 font-semibold", pathname.startsWith(href) ? "border-brand-200 bg-brand-50 text-brand-700" : "border-ink-100 text-ink-700")}>
            <span className="grid size-9 place-items-center rounded-lg bg-white text-brand-600 shadow-sm">
              <Icon className="size-[18px]" />
            </span>
            {label}
          </Link>
        ))}
        <Link href="/destinations" className="flex items-center gap-3 rounded-xl border border-ink-100 px-4 py-3.5 font-semibold text-ink-700">
          Destinations
        </Link>
      </nav>
      <div className="container-page border-t border-ink-100 py-5">
        {user ? (
          <div className="grid gap-1">
            {[
              ["/my-account", "My dashboard"],
              ["/my-account/bookings", "My bookings"],
              ["/my-account/wishlist", "Wishlist"],
              ...(user.role === "admin" ? [["/admin", "Admin panel"]] : []),
            ].map(([href, label]) => (
              <Link key={href} href={href} className="rounded-lg px-3 py-2.5 font-medium text-ink-700 hover:bg-ink-50">
                {label}
              </Link>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Link href="/login" className={buttonClasses("outline")}>
              Sign in
            </Link>
            <Link href="/register" className={buttonClasses("primary")}>
              Create account
            </Link>
          </div>
        )}
        <a href="tel:+8809612345678" className="mt-5 flex items-center gap-2 text-sm font-semibold text-ink-600">
          <Phone className="size-4 text-brand-600" /> 24/7 support: 09612-345678
        </a>
      </div>
    </div>
  );
}

function AccountMenu() {
  const { user, ready, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  const [menuPath, setMenuPath] = useState(pathname);
  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setOpen(false);
  }
  useEffect(() => {
    const onClick = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (!ready) return <div className="h-10 w-24 animate-pulse rounded-lg bg-ink-100" aria-hidden />;
  if (!user)
    return (
      <div className="flex items-center gap-2">
        <Link href={`/login?next=${encodeURIComponent(pathname)}`} className={buttonClasses("ghost", "sm", "hidden sm:inline-flex")}>
          Sign in
        </Link>
        <Link href="/register" className={buttonClasses("primary", "sm")}>
          Sign up
        </Link>
      </div>
    );

  const initials = user.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  const items = [
    { href: "/my-account", label: "Dashboard", icon: LayoutDashboard },
    { href: "/my-account/bookings", label: "My bookings", icon: Ticket },
    { href: "/my-account/wishlist", label: "Wishlist", icon: Heart },
    { href: "/my-account/notifications", label: "Notifications", icon: Bell },
    { href: "/my-account/profile", label: "Profile", icon: UserIcon },
    ...(user.role === "admin" ? [{ href: "/admin", label: "Admin panel", icon: Shield }] : []),
  ];

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="menu" className="flex items-center gap-2 rounded-full border border-ink-200 py-1 pr-2.5 pl-1 transition hover:border-ink-300">
        <span className="grid size-8 place-items-center rounded-full bg-brand-600 text-xs font-bold text-white">{initials}</span>
        <span className="hidden max-w-28 truncate text-sm font-semibold sm:block">{user.name.split(" ")[0]}</span>
        <ChevronDown className="size-4 text-ink-500" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 mt-2 w-60 animate-fade-up rounded-xl border border-ink-100 bg-white p-1.5 shadow-(--shadow-lift)">
          <div className="border-b border-ink-100 px-3 pt-2 pb-3">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="truncate text-xs text-ink-500">{user.email}</p>
          </div>
          {items.map(({ href, label, icon: Icon }) => (
            <Link key={href} role="menuitem" href={href} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50">
              <Icon className="size-4 text-ink-500" /> {label}
            </Link>
          ))}
          <button
            role="menuitem"
            type="button"
            onClick={async () => {
              await logout();
              toast.success("You have been signed out");
              router.push("/");
              router.refresh();
            }}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-coral-600 hover:bg-coral-50"
          >
            <LogOut className="size-4" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
