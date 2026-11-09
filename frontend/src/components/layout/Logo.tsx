import Link from "next/link";
import { cn } from "@/lib/utils";

/** Tripnaro mark: a "T" whose stem curves into a route ending at a coral destination point. */
export function LogoMark({
  className,
  animated = false,
}: {
  className?: string;
  animated?: boolean;
}) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8", className)} aria-hidden>
      <rect width="32" height="32" rx="9" className="fill-brand-600" />
      <path d="M8.5 10.5h15" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
      {/* When animated, the route draws itself and the destination dot lands (see .loader-* in globals.css). */}
      <path
        d="M16 10.5v6.5c0 3.2 2.1 5.4 5.4 5.4"
        stroke="#fff"
        strokeWidth="2.6"
        strokeLinecap="round"
        fill="none"
        pathLength={1}
        className={cn(animated && "loader-route")}
      />
      <circle
        cx="23.2"
        cy="22.4"
        r="2.4"
        className={cn("fill-coral-400", animated && "loader-dot")}
      />
    </svg>
  );
}

export function Logo({ className, light = false }: { className?: string; light?: boolean }) {
  return (
    <Link
      href="/"
      className={cn("inline-flex items-center gap-2", className)}
      aria-label="Tripnaro home"
    >
      <LogoMark />
      <span
        className={cn(
          "font-display text-[1.45rem] leading-none font-semibold tracking-tight",
          light ? "text-white" : "text-ink-900",
        )}
      >
        tripnaro
      </span>
    </Link>
  );
}
