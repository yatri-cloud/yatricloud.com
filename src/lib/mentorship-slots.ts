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

/**
 * Date specific availability override (structural: matches
 * mentor_date_overrides rows). The date is a calendar day in the mentor
 * timezone (IST for Yatri Cloud), formatted "YYYY-MM-DD".
 *
 * Semantics:
 *   - kind "blocked" with null times  → the whole day is off.
 *   - kind "blocked" with times       → that window is unavailable that day.
 *   - kind "open" with times          → an extra available window that day,
 *                                        even when no weekly rule covers it.
 */
export interface DateOverride {
  /** "YYYY-MM-DD" calendar day in the mentor timezone (IST). */
  date: string;
  kind: "blocked" | "open";
  /** "HH:MM" / "HH:MM:SS" wall clock in IST, or null for a whole day block. */
  start_time: string | null;
  end_time: string | null;
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

/** Half open minute interval [start, end) within a single IST day. */
type MinuteWindow = [number, number];

/**
 * Subtracts a set of blocked intervals from each day window, returning the
 * remaining open pieces. Both inputs are minutes since IST midnight. A blocked
 * interval that carves the middle of a window splits it into two pieces.
 */
function subtractWindows(
  windows: MinuteWindow[],
  blocked: MinuteWindow[]
): MinuteWindow[] {
  if (blocked.length === 0) return windows.slice();
  const result: MinuteWindow[] = [];
  for (const [ws, we] of windows) {
    let segments: MinuteWindow[] = [[ws, we]];
    for (const [bs, be] of blocked) {
      const next: MinuteWindow[] = [];
      for (const [ss, se] of segments) {
        if (be <= ss || bs >= se) {
          next.push([ss, se]); // no overlap
          continue;
        }
        if (bs > ss) next.push([ss, Math.min(bs, se)]);
        if (be < se) next.push([Math.max(be, ss), se]);
      }
      segments = next;
    }
    for (const seg of segments) if (seg[1] > seg[0]) result.push(seg);
  }
  return result;
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
 * @param overrides        Date specific overrides (blocks / extra openings)
 *                         in the mentor timezone. Optional and backward
 *                         compatible: an empty list behaves exactly as before.
 * @returns Sorted ascending list of open slots as UTC instants.
 */
export function generateSlots(
  rules: SlotRule[],
  existingBookings: SlotBooking[],
  durationMin: number,
  bufferMin: number,
  noticeHours: number,
  windowDays: number,
  now: Date = new Date(),
  overrides: DateOverride[] = []
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

  // Group overrides by their IST calendar day so a single day lookup is O(1).
  interface DayOverride {
    blockedAllDay: boolean;
    open: MinuteWindow[];
    blocked: MinuteWindow[];
  }
  const overridesByDate = new Map<string, DayOverride>();
  let hasOpenOverride = false;
  for (const o of overrides) {
    if (!o || typeof o.date !== "string") continue;
    let entry = overridesByDate.get(o.date);
    if (!entry) {
      entry = { blockedAllDay: false, open: [], blocked: [] };
      overridesByDate.set(o.date, entry);
    }
    const startMin = o.start_time != null ? parseTimeToMinutes(o.start_time) : NaN;
    const endMin = o.end_time != null ? parseTimeToMinutes(o.end_time) : NaN;
    const hasWindow = Number.isFinite(startMin) && Number.isFinite(endMin) && endMin > startMin;
    if (o.kind === "blocked") {
      if (o.start_time == null || o.end_time == null) entry.blockedAllDay = true;
      else if (hasWindow) entry.blocked.push([startMin, endMin]);
    } else if (o.kind === "open" && hasWindow) {
      entry.open.push([startMin, endMin]);
      hasOpenOverride = true;
    }
  }

  // Nothing to offer when there are neither weekly rules nor extra openings.
  if (activeRules.length === 0 && !hasOpenOverride) return [];

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

    // Day key in the SAME IST space, matching the DateOverride "YYYY-MM-DD".
    const dayKey =
      `${istRef.getUTCFullYear()}-` +
      `${String(istRef.getUTCMonth() + 1).padStart(2, "0")}-` +
      `${String(istRef.getUTCDate()).padStart(2, "0")}`;
    const dayOverride = overridesByDate.get(dayKey);

    // Whole day off: skip the day entirely.
    if (dayOverride?.blockedAllDay) continue;

    // Day windows = weekly rules for this weekday PLUS any 'open' overrides.
    const windows: MinuteWindow[] = [];
    for (const rule of activeRules) {
      if (rule.weekday !== weekday) continue;
      const startMin = parseTimeToMinutes(rule.start_time);
      const endMin = parseTimeToMinutes(rule.end_time);
      if (!Number.isFinite(startMin) || !Number.isFinite(endMin)) continue;
      if (endMin <= startMin) continue;
      windows.push([startMin, endMin]);
    }
    if (dayOverride) for (const w of dayOverride.open) windows.push(w);
    if (windows.length === 0) continue;

    // Subtract any blocked windows before slicing the remainder into slots.
    const openPieces = subtractWindows(windows, dayOverride?.blocked ?? []);

    for (const [startMin, endMin] of openPieces) {
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
