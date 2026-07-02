import { useMemo, useState, useEffect } from "react";
import type { Slot } from "@/lib/mentorship-slots";

interface SlotPickerProps {
  slots: Slot[];
  selected: Slot | null;
  onSelect: (slot: Slot) => void;
  /** IANA timezone the times are rendered in (visitor timezone). */
  timeZone: string;
}

interface DayGroup {
  key: string;
  weekday: string;
  dayLabel: string;
  monthLabel: string;
  slots: Slot[];
}

function dayKey(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone,
  }).format(date);
}

/**
 * Date strip + time grid, rendered in the visitor timezone. Purely a
 * presentation component: slot math lives in mentorship-slots.ts.
 */
export const SlotPicker = ({ slots, selected, onSelect, timeZone }: SlotPickerProps) => {
  const days = useMemo<DayGroup[]>(() => {
    const groups = new Map<string, DayGroup>();
    const weekdayFmt = new Intl.DateTimeFormat("en-IN", { weekday: "short", timeZone });
    const dayFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", timeZone });
    const monthFmt = new Intl.DateTimeFormat("en-IN", { month: "short", timeZone });
    for (const slot of slots) {
      const key = dayKey(slot.start, timeZone);
      if (!groups.has(key)) {
        groups.set(key, {
          key,
          weekday: weekdayFmt.format(slot.start),
          dayLabel: dayFmt.format(slot.start),
          monthLabel: monthFmt.format(slot.start),
          slots: [],
        });
      }
      groups.get(key)!.slots.push(slot);
    }
    return Array.from(groups.values());
  }, [slots, timeZone]);

  const [activeDay, setActiveDay] = useState<string | null>(null);

  // Keep the active day valid as slots refresh.
  useEffect(() => {
    if (days.length === 0) {
      setActiveDay(null);
    } else if (!activeDay || !days.some((d) => d.key === activeDay)) {
      setActiveDay(days[0].key);
    }
  }, [days, activeDay]);

  const timeFmt = useMemo(
    () =>
      new Intl.DateTimeFormat("en-IN", {
        hour: "numeric",
        minute: "2-digit",
        timeZone,
      }),
    [timeZone]
  );

  if (days.length === 0) {
    return (
      <div className="rounded-2xl border border-border band-tint p-6 text-center">
        <p className="text-sm text-muted-foreground">
          No open slots right now, Yatri. New times open up as the calendar
          moves, so please check back soon.
        </p>
      </div>
    );
  }

  const active = days.find((d) => d.key === activeDay) ?? days[0];

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide" role="tablist" aria-label="Pick a date">
        {days.map((day) => {
          const isActive = day.key === active.key;
          return (
            <button
              key={day.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveDay(day.key)}
              className={`shrink-0 min-h-[44px] min-w-[72px] px-3 py-2 rounded-2xl border text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                isActive
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:border-brand-200 hover:bg-brand-50"
              }`}
            >
              <span className={`block text-xs font-medium ${isActive ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                {day.weekday}
              </span>
              <span className="block text-base font-bold leading-tight">{day.dayLabel}</span>
              <span className={`block text-xs ${isActive ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                {day.monthLabel}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {active.slots.map((slot) => {
          const isSelected =
            selected !== null && selected.start.getTime() === slot.start.getTime();
          return (
            <button
              key={slot.start.toISOString()}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelect(slot)}
              className={`min-h-[44px] px-2 rounded-xl border text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                isSelected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:border-brand-200 hover:bg-brand-50"
              }`}
            >
              {timeFmt.format(slot.start)}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        Times are shown in your timezone: {timeZone.replace(/_/g, " ")}
      </p>
    </div>
  );
};

export default SlotPicker;
