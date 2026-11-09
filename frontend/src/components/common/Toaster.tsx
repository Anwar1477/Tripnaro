"use client";

import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToastStore } from "@/store/toast";

const icons = { success: CheckCircle2, error: XCircle, info: Info };
const tones = {
  success: "border-emerald-200 text-emerald-800",
  error: "border-coral-200 text-coral-700",
  info: "border-brand-200 text-brand-800",
};

export function Toaster() {
  const { toasts, dismiss } = useToastStore();
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-4 bottom-4 z-[100] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-5 sm:items-end">
      {toasts.map((t) => {
        const Icon = icons[t.tone];
        return (
          <div key={t.id} className={cn("pointer-events-auto flex w-full max-w-sm animate-fade-up items-start gap-3 rounded-xl border bg-white px-4 py-3 text-sm shadow-(--shadow-lift)", tones[t.tone])}>
            <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
            <p className="min-w-0 flex-1 font-medium text-ink-800">{t.message}</p>
            <button type="button" onClick={() => dismiss(t.id)} aria-label="Dismiss" className="text-ink-400 hover:text-ink-700">
              <X className="size-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
