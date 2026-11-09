"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/** Accessible dialog built on the native <dialog> element (focus trap + Esc handled by the browser). */
export function Modal({ open, onClose, title, children, className }: { open: boolean; onClose: () => void; title: string; children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className={cn("m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl bg-white p-0 shadow-(--shadow-lift) backdrop:bg-ink-900/50 backdrop:backdrop-blur-sm", className)}
    >
      {open && (
        <div className="max-h-[85vh] overflow-y-auto">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-ink-100 bg-white px-5 py-4">
            <h2 className="text-lg font-bold">{title}</h2>
            <button type="button" onClick={onClose} className="grid size-8 place-items-center rounded-full text-ink-500 hover:bg-ink-100" aria-label="Close">
              <X className="size-4" />
            </button>
          </div>
          <div className="p-5">{children}</div>
        </div>
      )}
    </dialog>
  );
}
