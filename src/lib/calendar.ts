/**
 * Shared add to calendar helpers, dependency free so events, training and
 * mentorship can all build the same Google Calendar links and .ics files.
 */

/** ISO to UTC basic format YYYYMMDDTHHMMSSZ. */
function toCalendarUtc(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

export interface CalendarEvent {
  title: string;
  startISO: string;
  endISO: string;
  details?: string;
  location?: string;
}

/** A Google Calendar add event link. */
export function googleCalendarUrl(e: CalendarEvent): string {
  const dates = `${toCalendarUtc(e.startISO)}/${toCalendarUtc(e.endISO)}`;
  const params = [
    "action=TEMPLATE",
    `text=${encodeURIComponent(e.title)}`,
    `dates=${dates}`,
    `details=${encodeURIComponent(e.details ?? "")}`,
    `location=${encodeURIComponent(e.location ?? "")}`,
  ].join("&");
  return `https://calendar.google.com/calendar/render?${params}`;
}

function icsEscape(s: string): string {
  return String(s ?? "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

/** A valid VCALENDAR string for a single event (Apple Calendar, Outlook, etc). */
export function buildIcs(input: CalendarEvent & { uid: string }): string {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Yatri Cloud//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${input.uid}`,
    `DTSTAMP:${toCalendarUtc(new Date().toISOString())}`,
    `DTSTART:${toCalendarUtc(input.startISO)}`,
    `DTEND:${toCalendarUtc(input.endISO)}`,
    `SUMMARY:${icsEscape(input.title)}`,
    input.details ? `DESCRIPTION:${icsEscape(input.details)}` : "",
    input.location ? `LOCATION:${icsEscape(input.location)}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean).join("\r\n");
}

/** A downloadable data URI for an .ics string. */
export function icsDataUri(ics: string): string {
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
}
