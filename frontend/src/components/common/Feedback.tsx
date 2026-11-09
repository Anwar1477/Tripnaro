import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, Loader2, SearchX, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoMark } from "../layout/Logo";
import { Button } from "./Button";

export function Spinner({ className, label = "Loading" }: { className?: string; label?: string }) {
  return (
    <span
      role="status"
      className={cn("text-ink-500 inline-flex items-center gap-2 text-sm", className)}
    >
      <Loader2 className="text-brand-600 size-5 animate-spin" aria-hidden />
      <span className="sr-only">{label}</span>
    </span>
  );
}

/** Branded full-section loader: the Tripnaro mark draws its route while content loads. */
export function PageLoader({
  label = "Loading…",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex min-h-[40vh] flex-col items-center justify-center gap-4 px-4 text-center",
        className,
      )}
    >
      <span className="relative grid place-items-center">
        <span aria-hidden className="loader-halo bg-brand-400 absolute inset-0 rounded-[30%]" />
        <LogoMark
          animated
          className="relative size-14 drop-shadow-[0_8px_18px_rgb(29_108_104/0.28)]"
        />
      </span>
      <p className="text-ink-500 text-sm font-medium">{label}</p>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("bg-ink-100 animate-pulse rounded-lg", className)} />;
}

export function CardSkeleton({ count = 3, className }: { count?: number; className?: string }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={cn("card overflow-hidden", className)}>
          <Skeleton className="h-44 rounded-none" />
          <div className="space-y-3 p-4">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-5 w-1/3" />
          </div>
        </div>
      ))}
    </>
  );
}

export function EmptyState({
  title,
  description,
  icon: Icon = SearchX,
  action,
  className,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("card flex flex-col items-center px-6 py-14 text-center", className)}>
      <span className="bg-brand-50 text-brand-600 mb-4 grid size-14 place-items-center rounded-full">
        <Icon className="size-6" aria-hidden />
      </span>
      <h3 className="text-lg font-bold">{title}</h3>
      {description && <p className="text-ink-500 mt-1.5 max-w-md text-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
  className,
}: {
  message: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn("card flex flex-col items-center px-6 py-12 text-center", className)}
    >
      <span className="bg-coral-50 text-coral-600 mb-4 grid size-14 place-items-center rounded-full">
        <AlertTriangle className="size-6" aria-hidden />
      </span>
      <h3 className="text-lg font-bold">Something went wrong</h3>
      <p className="text-ink-500 mt-1.5 max-w-md text-sm">{message}</p>
      {onRetry && (
        <Button variant="outline" className="mt-5" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

const alertTones = {
  info: { cls: "border-brand-200 bg-brand-50 text-brand-900", Icon: Info },
  success: { cls: "border-emerald-200 bg-emerald-50 text-emerald-900", Icon: CheckCircle2 },
  warning: { cls: "border-amber-200 bg-amber-50 text-amber-900", Icon: AlertTriangle },
  error: { cls: "border-coral-200 bg-coral-50 text-coral-700", Icon: AlertTriangle },
};

export function Alert({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: keyof typeof alertTones;
  title?: string;
  children?: ReactNode;
  className?: string;
}) {
  const { cls, Icon } = alertTones[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn("flex gap-3 rounded-xl border px-4 py-3 text-sm", cls, className)}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="min-w-0">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn(title && "mt-0.5", "opacity-90")}>{children}</div>}
      </div>
    </div>
  );
}
