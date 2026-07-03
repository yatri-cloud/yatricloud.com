import { useMemo, useState } from "react";

/**
 * Minimal booking type the calendar needs. Both the mentee booking rows
 * (MentorshipBookingWithRefs) and the mentor booking rows (MentorshipBooking)
 * satisfy this shape, so one calendar serves both pages.
 */
export interface CalendarBooking {
  id: string;
  slot_start: string | null;
  status: string;
  customer_name?: string;
  amount?: number;
  service?: { title: string | null } | null;
  mentor?: { name: string | null } | null;
}

interface BookingCalendarProps {
  bookings: CalendarBooking[];
  /** IANA timezone the days and times are plotted in. */
  timezone: string;
}

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const pad = (n: number) => String(n).padStart(2, "0");

/** "YYYY-MM-DD" for an instant, read in the given timezone. */
function dayKeyInZone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone,
  }).format(date);
}

const statusTint: Record<string, string> = {
  confirmed: "bg-success/10 text-success",
  pending: "bg-warning/10 text-warning",
  completed: "bg-brand-50 text-brand-700",
  cancelled: "bg-muted text-muted-foreground",
  refunded: "bg-muted text-muted-foreground",
};

const statusLabel: Record<string, string> = {
  confirmed: "Confirmed",
  pending: "Pending",
  completed: "Completed",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

/**
 * A calm month grid that plots bookings by their start day in a timezone.
 * Clicking a day lists the sessions that fall on it. Presentation only.
 */
export const BookingCalendar = ({ bookings, timezone }: BookingCalendarProps) => {
  // Group bookings by their day key in this timezone.
  const byDay = useMemo(() => {
    const map = new Map<string, CalendarBooking[]>();
    for (const booking of bookings) {
      if (!booking.slot_start) continue;
      const date = new Date(booking.slot_start);
      if (Number.isNaN(date.getTime())) continue;
      const key = dayKeyInZone(date, timezone);
      const bucket = map.get(key) ?? [];
      bucket.push(booking);
      map.set(key, bucket);
    }
    // Keep each day's sessions in start order.
    for (const bucket of map.values()) {
      bucket.sort((a, b) =>
        String(a.slot_start).localeCompare(String(b.slot_start))
      );
    }
    return map;
  }, [bookings, timezone]);

  const todayKey = useMemo(() => dayKeyInZone(new Date(), timezone), [timezone]);

  // Start on the month of the earliest booking, else this month.
  const firstMonth = useMemo(() => {
    const keys = Array.from(byDay.keys()).sort();
    const source = keys[0] ?? todayKey;
    const [y, m] = source.split("-").map(Number);
    return { year: y, month: m - 1 };
  }, [byDay, todayKey]);

  const [view, setView] = useState(firstMonth);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const timeFmt = useMemo(
    () =>
      new Intl.DateTimeFormat("en-IN", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: timezone,
      }),
    [timezone]
  );

  const goPrev = () =>
    setView((v) =>
      v.month === 0 ? { year: v.year - 1, month: 11 } : { year: v.year, month: v.month - 1 }
    );
  const goNext = () =>
    setView((v) =>
      v.month === 11 ? { year: v.year + 1, month: 0 } : { year: v.year, month: v.month + 1 }
    );

  // Build the day cells for the current view month.
  const firstWeekday = new Date(Date.UTC(view.year, view.month, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(view.year, view.month + 1, 0)).getUTCDate();
  const cells: (string | null)[] = [];
  for (let i = 0; i < firstWeekday; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) {
    cells.push(`${view.year}-${pad(view.month + 1)}-${pad(d)}`);
  }

  const selectedSessions = selectedDay ? byDay.get(selectedDay) ?? [] : [];

  const readableDay = (key: string) => {
    const [y, m, d] = key.split("-").map(Number);
    return `${WEEKDAY_LABELS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]}, ${d} ${
      MONTH_LABELS[m - 1]
    } ${y}`;
  };

  return (
    <div className="rounded-3xl border border-border bg-card p-5 md:p-6">
      <div className="flex items-center justify-between gap-3 mb-5">
        <h3 className="font-display text-lg font-bold text-foreground">
          {MONTH_LABELS[view.month]} {view.year}
        </h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={goPrev}
            aria-label="Previous month"
            className="min-h-[40px] min-w-[40px] rounded-xl border border-border bg-card text-foreground hover:border-brand-200 hover:bg-brand-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span aria-hidden="true">{"<"}</span>
          </button>
          <button
            type="button"
            onClick={goNext}
            aria-label="Next month"
            className="min-h-[40px] min-w-[40px] rounded-xl border border-border bg-card text-foreground hover:border-brand-200 hover:bg-brand-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span aria-hidden="true">{">"}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="text-center text-xs font-medium text-muted-foreground py-1"
          >
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((key, index) => {
          if (!key) return <div key={`empty-${index}`} />;
          const dayNumber = Number(key.split("-")[2]);
          const sessions = byDay.get(key) ?? [];
          const hasSessions = sessions.length > 0;
          const isToday = key === todayKey;
          const isSelected = key === selectedDay;
          return (
            <button
              key={key}
              type="button"
              disabled={!hasSessions}
              onClick={() => setSelectedDay(isSelected ? null : key)}
              aria-pressed={isSelected}
              className={`relative min-h-[52px] rounded-xl border p-1.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                isSelected
                  ? "border-primary bg-primary text-primary-foreground"
                  : hasSessions
                  ? "border-brand-100 bg-brand-50 text-foreground hover:border-brand-200"
                  : "border-border bg-card text-muted-foreground"
              } ${isToday && !isSelected ? "ring-1 ring-brand-300" : ""} ${
                hasSessions ? "cursor-pointer" : "cursor-default"
              }`}
            >
              <span className="text-xs font-semibold">{dayNumber}</span>
              {hasSessions && (
                <span
                  className={`mt-1 block text-[10px] font-medium ${
                    isSelected ? "text-primary-foreground/80" : "text-brand-700"
                  }`}
                >
                  {sessions.length} {sessions.length === 1 ? "session" : "sessions"}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {selectedDay && (
        <div className="mt-6 pt-5 border-t border-border">
          {selectedSessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No sessions on {readableDay(selectedDay)}.
            </p>
          ) : (
            <>
              <h4 className="text-sm font-semibold text-foreground mb-3">
                {readableDay(selectedDay)}
              </h4>
              <div className="flex flex-col gap-2">
                {selectedSessions.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-background px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {booking.service?.title ||
                          booking.customer_name ||
                          "Mentorship session"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {booking.slot_start
                          ? timeFmt.format(new Date(booking.slot_start))
                          : "Time to be set"}
                        {booking.mentor?.name ? ` with ${booking.mentor.name}` : ""}
                        {!booking.mentor?.name && booking.customer_name
                          ? ` with ${booking.customer_name}`
                          : ""}
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        statusTint[booking.status] || statusTint.cancelled
                      }`}
                    >
                      {statusLabel[booking.status] || booking.status}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <p className="mt-5 text-xs text-muted-foreground">
        Times are shown in {timezone.replace(/_/g, " ")}. Tap a highlighted day to
        see its sessions.
      </p>
    </div>
  );
};

export default BookingCalendar;
