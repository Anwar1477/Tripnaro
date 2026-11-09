"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Armchair, BusFront, CalendarDays, MapPin } from "lucide-react";
import { BookingForm, type TravelerSlot } from "@/components/booking/BookingForm";
import { LinkButton } from "@/components/common/Button";
import { EmptyState, ErrorState, PageLoader } from "@/components/common/Feedback";
import { Select } from "@/components/common/FormControls";
import { useAsync } from "@/hooks/useAsync";
import { cn, formatDate, formatPrice } from "@/lib/utils";
import { busService } from "@/services";

const MAX_SEATS = 6;

export function BusSeatBooking({ busId }: { busId: string }) {
  const date = useSearchParams().get("date") ?? "";
  const { data, loading, error, reload } = useAsync(() => busService.seats(busId, date), [busId, date]);
  const [seats, setSeats] = useState<string[]>([]);
  const [boarding, setBoarding] = useState("");
  const [dropping, setDropping] = useState("");

  const slots = useMemo<TravelerSlot[]>(() => seats.map((s, i) => ({ type: "adult", label: `Passenger ${i + 1} · Seat ${s}`, seat: s })), [seats]);

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data) return <EmptyState title="Coach not found" action={<LinkButton href="/bus">Search buses</LinkButton>} />;

  const { bus, map } = data;
  const taken = new Set(data.taken);
  const groups = bus.seatLayout.split("+").map(Number);
  const toggle = (s: string) => setSeats((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : cur.length >= MAX_SEATS ? cur : [...cur, s].sort()));

  const seatPicker = (
    <section className="card p-5 sm:p-6" aria-labelledby="seat-h">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="seat-h" className="text-lg font-bold">Select up to {MAX_SEATS} seats</h2>
        <ul className="flex flex-wrap gap-3 text-xs text-ink-600">
          <li className="flex items-center gap-1.5"><span className="size-4 rounded border-2 border-ink-200 bg-white" />Available</li>
          <li className="flex items-center gap-1.5"><span className="size-4 rounded bg-brand-600" />Selected</li>
          <li className="flex items-center gap-1.5"><span className="size-4 rounded bg-ink-200" />Booked</li>
        </ul>
      </div>
      <div className="mt-5 overflow-x-auto">
        <div className="mx-auto w-fit rounded-2xl border-2 border-ink-100 bg-sand-50 p-4">
          <div className="mb-3 flex justify-end border-b border-dashed border-ink-200 pb-3 text-ink-400"><BusFront className="size-6" aria-label="Driver" /></div>
          <div className="space-y-2" role="group" aria-label="Seat map">
            {map.map((row) => {
              let idx = 0;
              return (
                <div key={row[0]} className="flex gap-6">
                  {groups.map((g, gi) => {
                    const cells = row.slice(idx, idx + g);
                    idx += g;
                    return (
                      <div key={gi} className="flex gap-2">
                        {cells.map((s) => {
                          const isTaken = taken.has(s);
                          const isSel = seats.includes(s);
                          return (
                            <button
                              key={s}
                              type="button"
                              disabled={isTaken}
                              aria-pressed={isSel}
                              aria-label={`Seat ${s}${isTaken ? " (booked)" : ""}`}
                              onClick={() => toggle(s)}
                              className={cn("grid size-10 place-items-center rounded-lg text-[11px] font-bold transition", isTaken ? "cursor-not-allowed bg-ink-200 text-ink-400" : isSel ? "bg-brand-600 text-white shadow" : "border-2 border-ink-200 bg-white text-ink-700 hover:border-brand-400")}
                            >
                              {s}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Select label="Boarding point" value={boarding} onChange={(e) => setBoarding(e.target.value)} placeholder="Choose boarding point" options={bus.boardingPoints.map((p) => ({ value: p.name, label: `${p.name}${p.time ? ` (${p.time})` : ""}` }))} />
        <Select label="Dropping point" value={dropping} onChange={(e) => setDropping(e.target.value)} placeholder="Choose dropping point" options={bus.droppingPoints.map((p) => ({ value: p.name, label: `${p.name}${p.time ? ` (${p.time})` : ""}` }))} />
      </div>
    </section>
  );

  const summary = (
    <div className="space-y-2 p-4 text-sm">
      <p className="text-base font-bold">{bus.operator.name}</p>
      <p className="text-ink-600">{bus.busType} · Coach {bus.coachNumber}</p>
      <p className="flex items-center gap-2 text-ink-600"><MapPin className="size-4" />{bus.from} → {bus.to}</p>
      <p className="flex items-center gap-2 text-ink-600"><CalendarDays className="size-4" />{formatDate(date, { weekday: "short" })} · {bus.departureTime}</p>
      <p className="flex items-center gap-2 text-ink-600"><Armchair className="size-4" />{seats.length ? seats.join(", ") : "No seats selected"}</p>
      <p className="text-ink-600">{formatPrice(bus.fare)} per seat · {data.available} of {data.total} available</p>
      {bus.cancellationPolicy && <p className="text-xs text-ink-500">{bus.cancellationPolicy}</p>}
    </div>
  );

  if (!seats.length)
    return (
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        {seatPicker}
        <aside className="card self-start overflow-hidden">{summary}</aside>
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="lg:max-w-[calc(100%-23.5rem)]">{seatPicker}</div>
      <BookingForm
        type="bus"
        payload={{ busId, journeyDate: date, seats, boardingPoint: boarding || undefined, droppingPoint: dropping || undefined }}
        travelerSlots={slots}
        travelerHeading="Passenger details"
        summary={summary}
      />
    </div>
  );
}
