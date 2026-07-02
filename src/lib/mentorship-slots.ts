/**
 * Mentorship slot generation. PURE by design: no imports, no network,
 * no Date.now() side effects. Everything the function needs comes in as
 * arguments, so it is unit testable with a plain node script.
 *
 * Availability rules are weekly windows in the mentor timezone, which
 * for Yatri Cloud is always Asia/Kolkata (IST, fixed UTC+05:30, no
 * daylight saving). Slots are computed as UTC instants and rendered in
 * the visitor timezone by the UI.
 */

/** Fixed IST offset in minutes. IST never observes daylight saving. */
const IST_OFFSET_MIN = 330;
const MIN_MS = 60_000;
const DAY_MS = 86_400_000;

/** How long a pending booking blocks its slot before it is ignored. */
export const PENDING_HOLD_MIN = 30;

/** Weekly availability rule shape (structural: matches mentor_availability). */
export interface SlotRule {
  /** 0 = Sunday .. 6 = Saturday, in the mentor timezone (IST). */
  weekday: number;
  /** "HH:MM" or "HH:MM:SS" wall clock time in IST. */
  start_time: string;
  end_time: string;
  active: boolean;
}

/** Existing booking shape (structural: matches mentorship_bookings rows). */
export interface SlotBooking {
  slot_start: string | null;
  slot_end: string | null;
  status: string;
  created_at: string;
}

/** A bookable slot. Both instants are UTC Dates. */
export interface Slot {
  start: Date;
  end: Date;
}

/** Parses "HH:MM" / "HH:MM:SS" into minutes since midnight. */
function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(":");
  const hours = Number(h);
  const minutes = Number(m ?? 0);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return NaN;
  return hours * 60 + minutes;
}

/** True when a booking should block its slot at the given moment. */
function bookingBlocks(booking: SlotBooking, nowMs: number): boolean {
  if (!booking.slot_start || !booking.slot_end) return false;
  if (booking.status === "confirmed" || booking.status === "completed") return true;
  if (booking.status === "pending") {
    const createdMs = Date.parse(booking.created_at);
    if (!Number.isFinite(createdMs)) return true; // unknown age: stay safe
    return nowMs - createdMs <= PENDING_HOLD_MIN * MIN_MS;
  }
  return false; // cancelled / refunded never block
}

/**
 * Generates bookable slots for a mentor.
 *
 * @param rules            Active weekly windows in IST (weekday 0 = Sunday).
 * @param existingBookings Bookings that may block slots. Pending bookings
 *                         older than PENDING_HOLD_MIN minutes are ignored.
 * @param durationMin      Session length in minutes.
 * @param bufferMin        Gap enforced between consecutive slots.
 * @param noticeHours      Minimum lead time before the first offered slot.
 * @param windowDays       How far ahead slots are offered.
 * @param now              The reference instant (injectable for tests).
 * @returns Sorted ascending list of open slots as UTC instants.
 */
export function generateSlots(
  rules: SlotRule[],
  existingBookings: SlotBooking[],
  durationMin: number,
  bufferMin: number,
  noticeHours: number,
  windowDays: number,
  now: Date = new Date()
): Slot[] {
  if (!Number.isFinite(durationMin) || durationMin <= 0) return [];

  const nowMs = now.getTime();
  const earliestMs = nowMs + noticeHours * 60 * MIN_MS;
  const windowEndMs = nowMs + windowDays * DAY_MS;
  const stepMs = (durationMin + Math.max(0, bufferMin)) * MIN_MS;
  const durationMs = durationMin * MIN_MS;

  const blockers = existingBookings
    .filter((b) => bookingBlocks(b, nowMs))
    .map((b) => ({
      start: Date.parse(b.slot_start as string),
      end: Date.parse(b.slot_end as string),
    }))
    .filter((b) => Number.isFinite(b.start) && Number.isFinite(b.end));

  const activeRules = rules.filter(
    (r) =>
      r.active &&
      Number.isInteger(r.weekday) &&
      r.weekday >= 0 &&
      r.weekday <= 6
  );
  if (activeRules.length === 0) return [];

  const slots: Slot[] = [];

  // Walk each IST calendar day inside the booking window.
  for (let dayOffset = 0; dayOffset <= windowDays; dayOffset++) {
    // Shift into IST space so getUTC* reads the IST calendar date.
    const istRef = new Date(nowMs + IST_OFFSET_MIN * MIN_MS + dayOffset * DAY_MS);
    const weekday = istRef.getUTCDay();
    // UTC instant of IST midnight for this calendar day.
    const istMidnightUtcMs =
      Date.UTC(istRef.getUTCFullYear(), istRef.getUTCMonth(), istRef.getUTCDate()) -
      IST_OFFSET_MIN * MIN_MS;

    for (const rule of activeRules) {
      if (rule.weekday !== weekday) continue;
      const startMin = parseTimeToMinutes(rule.start_time);
      const endMin = parseTimeToMinutes(rule.end_time);
      if (!Number.isFinite(startMin) || !Number.isFinite(endMin)) continue;

      const windowStartMs = istMidnightUtcMs + startMin * MIN_MS;
      const windowCloseMs = istMidnightUtcMs + endMin * MIN_MS;

      for (
        let slotStartMs = windowStartMs;
        slotStartMs + durationMs <= windowCloseMs;
        slotStartMs += stepMs
      ) {
        const slotEndMs = slotStartMs + durationMs;
        if (slotStartMs < earliestMs) continue;
        if (slotEndMs > windowEndMs) continue;
        const overlapsBooking = blockers.some(
          (b) => slotStartMs < b.end && slotEndMs > b.start
        );
        if (overlapsBooking) continue;
        slots.push({ start: new Date(slotStartMs), end: new Date(slotEndMs) });
      }
    }
  }

  slots.sort((a, b) => a.start.getTime() - b.start.getTime());
  return slots;
}
