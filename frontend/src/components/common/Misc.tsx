import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight, Minus, Plus, Star } from "lucide-react";
import { cn, formatPrice, ratingLabel } from "@/lib/utils";

export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

export function Breadcrumbs({ items, className }: { items: { name: string; href?: string }[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={cn("min-w-0 text-[13px] text-ink-500", className)}>
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, i) => (
          <li key={`${item.name}-${i}`} className="flex min-w-0 items-center gap-1">
            {i > 0 && <ChevronRight className="size-3.5 shrink-0 text-ink-300" aria-hidden />}
            {item.href && i < items.length - 1 ? (
              <Link href={item.href} className="truncate hover:text-brand-700">
                {item.name}
              </Link>
            ) : (
              <span aria-current={i === items.length - 1 ? "page" : undefined} className="truncate font-medium text-ink-700">
                {item.name}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  className,
  as: Tag = "h2",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3";
}) {
  return (
    <div className={cn("mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="max-w-2xl">
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <Tag className="font-display text-[1.75rem] leading-tight font-semibold tracking-tight sm:text-[2.1rem]">{title}</Tag>
        {description && <p className="mt-2 text-[15px] leading-relaxed text-ink-500">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function RatingPill({ rating, reviews, className }: { rating: number; reviews?: number; className?: string }) {
  if (!rating) return null;
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[13px]", className)}>
      <span className="rounded-md bg-brand-600 px-1.5 py-0.5 text-xs font-bold text-white">{rating.toFixed(1)}</span>
      <span className="font-semibold text-ink-800">{ratingLabel(rating)}</span>
      {reviews !== undefined && <span className="text-ink-500">({reviews.toLocaleString()})</span>}
    </span>
  );
}

export function Stars({ count, className }: { count: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-label={`${count} star`}>
      {Array.from({ length: count }, (_, i) => (
        <Star key={i} className="size-3.5 fill-amber-400 text-amber-400" aria-hidden />
      ))}
    </span>
  );
}

export function Price({ amount, original, suffix, className }: { amount: number; original?: number; suffix?: string; className?: string }) {
  return (
    <div className={cn("leading-tight", className)}>
      {original && original > amount && <span className="mr-1.5 text-[13px] text-ink-400 line-through">{formatPrice(original)}</span>}
      <span className="text-lg font-bold text-ink-900">{formatPrice(amount)}</span>
      {suffix && <span className="ml-1 text-xs text-ink-500">{suffix}</span>}
    </div>
  );
}

export function Counter({
  label,
  hint,
  value,
  min = 0,
  max = 9,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div>
        <p className="text-sm font-semibold text-ink-800">{label}</p>
        {hint && <p className="text-xs text-ink-500">{hint}</p>}
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          disabled={value <= min}
          onClick={() => onChange(value - 1)}
          className="grid size-8 place-items-center rounded-full border border-ink-200 text-ink-700 transition hover:border-brand-400 hover:text-brand-700 disabled:opacity-35"
        >
          <Minus className="size-3.5" />
        </button>
        <span className="w-5 text-center text-sm font-bold tabular-nums" aria-live="polite">
          {value}
        </span>
        <button
          type="button"
          aria-label={`Increase ${label}`}
          disabled={value >= max}
          onClick={() => onChange(value + 1)}
          className="grid size-8 place-items-center rounded-full border border-ink-200 text-ink-700 transition hover:border-brand-400 hover:text-brand-700 disabled:opacity-35"
        >
          <Plus className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
