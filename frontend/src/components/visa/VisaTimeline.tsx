import { cn, formatDateTime, titleCase } from "@/lib/utils";
import type { VisaApplication } from "@/types";

const FLOW = ["submitted", "under_review", "processing", "approved"];

/** Progress steps plus full status history for a visa application. */
export function VisaTimeline({ app }: { app: VisaApplication }) {
  const rejected = app.status === "rejected";
  const current = FLOW.indexOf(app.status === "documents_required" ? "under_review" : app.status);
  return (
    <div>
      <ol className="grid grid-cols-4 gap-1" aria-label="Application progress">
        {FLOW.map((s, i) => {
          const done = !rejected && i <= current;
          return (
            <li key={s} className="text-center">
              <span className={cn("mx-auto block h-1.5 rounded-full", done ? "bg-brand-600" : rejected && i === FLOW.length - 1 ? "bg-coral-500" : "bg-ink-100")} />
              <span className={cn("mt-2 block text-[11px] font-semibold sm:text-xs", done ? "text-brand-800" : "text-ink-400")}>{rejected && i === FLOW.length - 1 ? "Rejected" : titleCase(s.replace("_", " "))}</span>
            </li>
          );
        })}
      </ol>
      <ul className="mt-6 space-y-3 border-l-2 border-ink-100 pl-4">
        {[...app.statusHistory].reverse().map((h, i) => (
          <li key={i} className="relative text-sm">
            <span className="absolute top-1.5 -left-[1.4rem] size-2.5 rounded-full bg-brand-600" />
            <p className="font-semibold">{titleCase(h.status.replace(/_/g, " "))}</p>
            {h.note && <p className="text-ink-600">{h.note}</p>}
            <p className="text-xs text-ink-400">{formatDateTime(h.at)}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
