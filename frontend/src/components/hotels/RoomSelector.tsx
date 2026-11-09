"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { BedDouble, Check, Coffee, Maximize2, RefreshCcw, Users } from "lucide-react";
import { useAsync } from "@/hooks/useAsync";
import { addDays, cn, formatPrice, nightsBetween, todayInput, toDateInput } from "@/lib/utils";
import { catalogService } from "@/services";
import { Button } from "../common/Button";
import { Counter } from "../common/Misc";
import { ErrorState, Skeleton } from "../common/Feedback";
import { Popover } from "../common/Popover";

/** Date / guest controls plus live room availability for the chosen stay. */
export function RoomSelector({ slug }: { slug: string }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [checkIn, setCheckIn] = useState(sp.get("checkIn") ?? todayInput(7));
  const [checkOut, setCheckOut] = useState(sp.get("checkOut") ?? todayInput(9));
  const [rooms, setRooms] = useState(Number(sp.get("rooms") ?? 1));
  const [adults, setAdults] = useState(Number(sp.get("adults") ?? 2));
  const [children, setChildren] = useState(Number(sp.get("children") ?? 0));
  const nights = nightsBetween(checkIn, checkOut);
  const valid = nights >= 1 && nights <= 30;

  const { data, loading, error, reload } = useAsync(() => catalogService.hotel(slug, valid ? { checkIn, checkOut } : {}), [slug, checkIn, checkOut, valid]);

  function book(roomId: string) {
    const p = new URLSearchParams({ room: roomId, checkIn, checkOut, rooms: String(rooms), adults: String(adults), children: String(children) });
    router.push(`/hotels/${slug}/book?${p}`);
  }

  return (
    <section id="rooms" aria-labelledby="rooms-heading" className="scroll-mt-24">
      <h2 id="rooms-heading" className="mb-4 text-xl font-bold">
        Choose your room
      </h2>
      <div className="card mb-4 grid gap-3 p-4 sm:grid-cols-[1fr_1fr_1.2fr]">
        <label className="block">
          <span className="label">Check-in</span>
          <input type="date" className="field" min={todayInput()} value={checkIn} onChange={(e) => { setCheckIn(e.target.value); if (checkOut <= e.target.value) setCheckOut(toDateInput(addDays(e.target.value, 1))); }} />
        </label>
        <label className="block">
          <span className="label">Check-out {nights > 0 && <span className="font-normal text-ink-500">· {nights} night{nights > 1 ? "s" : ""}</span>}</span>
          <input type="date" className={cn("field", !valid && "field-error")} min={toDateInput(addDays(checkIn, 1))} value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
        </label>
        <div>
          <span className="label">Rooms & guests</span>
          <Popover
            align="right"
            trigger={({ toggle }) => (
              <button type="button" onClick={toggle} className="field flex items-center gap-2 text-left">
                <Users className="size-4 text-ink-500" /> {rooms} room{rooms > 1 ? "s" : ""} · {adults + children} guest{adults + children > 1 ? "s" : ""}
              </button>
            )}
          >
            {(close) => (
              <>
                <Counter label="Rooms" value={rooms} min={1} max={8} onChange={(r) => { setRooms(r); setAdults((a) => Math.max(a, r)); }} />
                <Counter label="Adults" value={adults} min={rooms} max={32} onChange={setAdults} />
                <Counter label="Children" value={children} max={16} onChange={setChildren} />
                <Button size="sm" className="mt-2 w-full" onClick={close}>
                  Done
                </Button>
              </>
            )}
          </Popover>
        </div>
        {!valid && <p className="text-sm text-coral-600 sm:col-span-3">Choose a stay between 1 and 30 nights.</p>}
      </div>

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading || !data ? (
        <div className="space-y-3">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      ) : (
        <div className="space-y-4">
          {data.rooms.map((room) => {
            const fits = adults <= room.maxAdults * rooms;
            const soldOut = room.available < rooms;
            const total = room.price * Math.max(1, nights) * rooms;
            return (
              <article key={room._id} className="card grid overflow-hidden md:grid-cols-[14rem_1fr_13rem]">
                <div className="relative h-44 bg-ink-100 md:h-full">{room.images[0] && <Image src={room.images[0]} alt={room.name} fill sizes="(max-width: 768px) 100vw, 14rem" className="object-cover" />}</div>
                <div className="p-4">
                  <h3 className="text-lg font-bold">{room.name}</h3>
                  <ul className="mt-2 grid gap-1.5 text-sm text-ink-600 sm:grid-cols-2">
                    <li className="flex items-center gap-2"><BedDouble className="size-4 text-ink-400" /> {room.bedType}</li>
                    <li className="flex items-center gap-2"><Users className="size-4 text-ink-400" /> Up to {room.maxAdults} adults{room.maxChildren ? ` + ${room.maxChildren} child` : ""}</li>
                    {room.sizeSqm && <li className="flex items-center gap-2"><Maximize2 className="size-4 text-ink-400" /> {room.sizeSqm} m²{room.view ? ` · ${room.view}` : ""}</li>}
                    <li className={cn("flex items-center gap-2", room.breakfastIncluded ? "text-emerald-700" : "")}><Coffee className="size-4" /> {room.breakfastIncluded ? "Breakfast included" : "Room only"}</li>
                    <li className={cn("flex items-center gap-2", room.refundable ? "text-emerald-700" : "text-ink-500")}><RefreshCcw className="size-4" /> {room.refundable ? "Free cancellation" : "Non-refundable"}</li>
                  </ul>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {room.amenities.map((a) => (
                      <span key={a} className="inline-flex items-center gap-1 rounded-full bg-ink-50 px-2 py-0.5 text-xs text-ink-600"><Check className="size-3 text-brand-600" />{a}</span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col justify-between gap-3 border-t border-ink-100 bg-sand-50 p-4 md:border-t-0 md:border-l">
                  <div>
                    {room.originalPrice && room.originalPrice > room.price && <p className="text-sm text-ink-400 line-through">{formatPrice(room.originalPrice)}</p>}
                    <p className="text-2xl font-bold text-ink-900">{formatPrice(room.price)}</p>
                    <p className="text-xs text-ink-500">per room / night, excl. 10% tax</p>
                    {valid && <p className="mt-1 text-sm font-semibold text-ink-700">{formatPrice(total)} for {nights} night{nights > 1 ? "s" : ""}</p>}
                    <p className={cn("mt-2 text-xs font-semibold", soldOut ? "text-coral-600" : room.available <= 3 ? "text-amber-700" : "text-emerald-700")}>
                      {soldOut ? "Sold out for these dates" : room.available <= 3 ? `Only ${room.available} left!` : `${room.available} rooms available`}
                    </p>
                  </div>
                  <Button variant="accent" disabled={soldOut || !fits || !valid} onClick={() => book(room._id)}>
                    {soldOut ? "Unavailable" : !fits ? "Too many guests" : "Reserve"}
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
