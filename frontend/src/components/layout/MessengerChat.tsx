"use client";

import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { ExternalLink, Phone, X } from "lucide-react";
import { messengerLink } from "@/lib/messenger";
import { cn } from "@/lib/utils";

/** Messenger glyph (speech bubble with the lightning stroke), drawn inline so no third-party asset loads. */
function MessengerIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M12 2C6.36 2 2 6.13 2 11.7c0 2.91 1.19 5.43 3.14 7.17.16.15.26.35.27.57l.05 1.78a.8.8 0 0 0 1.12.71l1.99-.88c.17-.07.36-.09.53-.04.91.25 1.89.39 2.9.39 5.64 0 10-4.13 10-9.7S17.64 2 12 2zm6 7.46-2.94 4.67a1.5 1.5 0 0 1-2.17.4l-2.34-1.76a.6.6 0 0 0-.72 0l-3.16 2.4c-.42.32-.97-.18-.69-.63l2.94-4.67a1.5 1.5 0 0 1 2.17-.4l2.34 1.76a.6.6 0 0 0 .72 0l3.16-2.4c.42-.32.97.18.69.63z" />
    </svg>
  );
}

const FORM_FIELD = "input:not([type=checkbox]):not([type=radio]):not([type=button]):not([type=submit]), textarea, select";

/**
 * Floating "Chat on Messenger" launcher (bottom-right).
 *
 * A small panel explains where the conversation continues, then hands off to m.me, which opens the
 * Messenger app on phones and messenger.com in a new tab on desktop. Layering: z-30 keeps it under
 * the header (z-50), mobile menu (z-40), filter sheet (z-60), gallery (z-90) and native dialogs, so it
 * never covers navigation or modals. On small screens it hides while a form field has focus so it
 * cannot sit on top of booking inputs or the on-screen keyboard.
 */
export function MessengerChat({ page, greeting, phone }: { page: string; greeting: string; phone?: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [typing, setTyping] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const titleId = useId();

  // Close on navigation (state adjusted during render, matching Header's pattern).
  const [navPath, setNavPath] = useState(pathname);
  if (navPath !== pathname) {
    setNavPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => rootRef.current && !rootRef.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    const small = window.matchMedia("(max-width: 767px)");
    const onFocus = (e: FocusEvent) => setTyping(small.matches && e.target instanceof Element && e.target.matches(FORM_FIELD) && !rootRef.current?.contains(e.target));
    const onBlur = () => setTyping(false);
    document.addEventListener("focusin", onFocus);
    document.addEventListener("focusout", onBlur);
    return () => {
      document.removeEventListener("focusin", onFocus);
      document.removeEventListener("focusout", onBlur);
    };
  }, []);

  // Step aside while a form or booking action area (`[data-chat-avoid]`, e.g. the sticky "Book this
  // tour" card) passes under the launcher. The observer's root is shrunk to the launcher's
  // bottom-right footprint, so only elements actually beneath it count, at every screen size.
  // Re-scans when the DOM changes because booking widgets mount after their data loads.
  const [covering, setCovering] = useState(false);
  useEffect(() => {
    let io: IntersectionObserver | null = null;
    let raf = 0;
    const hits = new Set<Element>();
    const setup = () => {
      io?.disconnect();
      hits.clear();
      const zone = window.innerWidth < 640 ? 88 : 104; // button (56px) + offset + breathing room
      io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) hits.add(e.target);
            else hits.delete(e.target);
          }
          setCovering(hits.size > 0);
        },
        { rootMargin: `-${Math.max(0, window.innerHeight - zone)}px 0px 0px -${Math.max(0, window.innerWidth - zone)}px` },
      );
      document.querySelectorAll(`main form, [data-chat-avoid]`).forEach((el) => io!.observe(el));
    };
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(setup);
    };
    setup();
    const mo = new MutationObserver(schedule);
    mo.observe(document.querySelector("main") ?? document.body, { childList: true, subtree: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(raf);
      io?.disconnect();
      mo.disconnect();
      window.removeEventListener("resize", schedule);
    };
  }, [pathname]);

  const hidden = (typing || covering) && !open;
  const href = messengerLink(page, pathname);

  return (
    <div
      ref={rootRef}
      data-chat-launcher
      className={cn(
        "fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-30 flex flex-col items-end gap-3 transition-[opacity,translate] duration-200 sm:right-6 sm:bottom-6 print:hidden",
        hidden && "pointer-events-none translate-y-4 opacity-0",
      )}
      inert={hidden}
    >
      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-labelledby={titleId}
          className="w-[min(20rem,calc(100vw-2rem))] origin-bottom-right animate-fade-up overflow-hidden rounded-2xl border border-ink-100 bg-surface shadow-(--shadow-lift) motion-reduce:animate-none"
        >
          <div className="flex items-start gap-3 bg-brand-700 px-4 py-4 text-white">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white/15">
              <MessengerIcon className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p id={titleId} className="font-bold text-white">
                Chat with Tripnaro
              </p>
              <p className="text-xs text-brand-100">Travel experts on Messenger · usually reply in minutes</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close chat panel" className="-mt-1 -mr-1 grid size-8 shrink-0 place-items-center rounded-full text-white/80 transition hover:bg-white/15 hover:text-white">
              <X className="size-4" />
            </button>
          </div>
          <div className="space-y-3 p-4">
            <p className="rounded-2xl rounded-tl-sm bg-ink-50 px-3.5 py-2.5 text-sm text-ink-700">{greeting}</p>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-(--radius-field) bg-[#0866ff] text-[15px] font-semibold text-white shadow-sm transition-colors hover:bg-[#0756d9] focus-visible:outline-[#0866ff]"
            >
              <MessengerIcon className="size-[18px]" /> Continue in Messenger
              <span className="sr-only">(opens Messenger in a new tab)</span>
              <ExternalLink className="size-3.5 opacity-80" aria-hidden />
            </a>
            {phone && (
              <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="flex items-center justify-center gap-2 text-sm font-semibold text-ink-600 transition hover:text-brand-700">
                <Phone className="size-4 text-brand-600" aria-hidden /> Or call {phone}
              </a>
            )}
          </div>
        </div>
      )}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={open ? "Close Messenger chat" : "Chat with us on Messenger"}
        className="group grid size-14 place-items-center rounded-full bg-[#0866ff] text-white shadow-(--shadow-lift) transition hover:scale-105 hover:bg-[#0756d9] focus-visible:outline-[#0866ff] active:scale-95 motion-reduce:transition-none motion-reduce:hover:scale-100"
      >
        {open ? <X className="size-6" aria-hidden /> : <MessengerIcon className="size-7" />}
      </button>
    </div>
  );
}
