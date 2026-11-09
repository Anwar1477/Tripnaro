import { Types } from 'mongoose';
import { Booking } from '../models/Booking';
import { Bus, seatMap } from '../models/Bus';
import { Room } from '../models/Room';

/** Bookings that currently hold inventory: confirmed ones, plus pending ones whose hold has not expired. */
export function activeHoldFilter(): Record<string, unknown> {
  return {
    $or: [{ status: 'confirmed' }, { status: 'pending', holdExpiresAt: { $gt: new Date() } }],
  };
}

/** Number of rooms of each room type still free for the given stay. */
export async function roomAvailability(hotelId: string, checkIn: Date, checkOut: Date): Promise<Map<string, number>> {
  const rooms = await Room.find({ hotel: hotelId, active: true }).select('totalRooms').lean();
  const used = await Booking.aggregate<{ _id: Types.ObjectId; rooms: number }>([
    {
      $match: {
        type: 'hotel',
        item: new Types.ObjectId(hotelId),
        startDate: { $lt: checkOut },
        endDate: { $gt: checkIn },
        ...activeHoldFilter(),
      },
    },
    { $group: { _id: '$room', rooms: { $sum: '$details.rooms' } } },
  ]);
  const usedMap = new Map(used.map((u) => [String(u._id), u.rooms]));
  return new Map(rooms.map((r) => [String(r._id), Math.max(0, r.totalRooms - (usedMap.get(String(r._id)) ?? 0))]));
}

/** Seats already taken on a coach for a journey date. */
export async function takenBusSeats(busId: string, journeyDate: string): Promise<string[]> {
  const filter: Record<string, unknown> = {
    type: 'bus',
    item: busId,
    'details.journeyDate': journeyDate,
    ...activeHoldFilter(),
  };
  const bookings = await Booking.find(filter)
    .select('details.seats')
    .lean();
  return bookings.flatMap((b) => ((b as { details?: { seats?: string[] } }).details?.seats ?? []));
}

export async function busSeatSummary(busId: string, journeyDate: string) {
  const bus = await Bus.findById(busId).lean();
  if (!bus) return null;
  const map = seatMap(bus.seatLayout, bus.rows);
  const taken = await takenBusSeats(busId, journeyDate);
  const total = map.flat().length;
  return { bus, map, taken, total, available: total - taken.length };
}
