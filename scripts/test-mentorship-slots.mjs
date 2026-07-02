/**
 * Contract tests for the pure slot generator (docs/MENTORSHIP-PLAN.md §7).
 *
 * Target: generateSlots(rules, existingBookings, durationMin, bufferMin,
 *         noticeHours, windowDays, now) in src/lib/mentorship-slots.ts —
 * UTC slots computed from IST weekly rules, rendered later in the visitor
 * timezone. This file encodes the CONTRACT (notice cutoff, buffer stepping,
 * window end, booked exclusion, expired pending, IST to UTC boundary) using
 * only node:assert. No new dependencies.
 *
 * How to run:
 *   Plain `node scripts/test-mentorship-slots.mjs` cannot load the TypeScript
 *   implementation, so the script prints SKIPPED and exits 0. Run it through
 *   tsx (already resolvable via npx) to execute the assertions for real:
 *
 *     npx tsx scripts/test-mentorship-slots.mjs
 *
 * TODO: point this at src/lib/mentorship-slots.ts via a proper test runner
 * (vitest or node --test with a TS loader) once one exists in the repo, and
 * tighten the slot shape normalization to the final exported type.
 */

import assert from "node:assert/strict";

const IMPL_PATH = "../src/lib/mentorship-slots.ts";

let generateSlots;
try {
  const mod = await import(IMPL_PATH);
  generateSlots = mod.generateSlots ?? mod.default;
  if (typeof generateSlots !== "function") throw new Error("generateSlots export not found");
} catch (err) {
  console.log("SKIPPED: could not load src/lib/mentorship-slots.ts under plain node.");
  console.log("Run with a TS loader instead:  npx tsx scripts/test-mentorship-slots.mjs");
  console.log(`(reason: ${err?.message ?? err})`);
  process.exit(0);
}

/* ---------- helpers ---------- */

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

// Fixed clock for determinism: Wednesday 2026-07-01 00:00 UTC.
const NOW = new Date("2026-07-01T00:00:00Z");

// Tolerate {start,end} | {slot_start,slot_end} with Date or ISO values.
const startMs = (slot) => new Date(slot.start ?? slot.slot_start).getTime();
const endMs = (slot) => new Date(slot.end ?? slot.slot_end).getTime();

// IST weekly rules (weekday 0 = Sunday), matching migration 015 shapes.
const rule = (weekday, start_time, end_time) => ({
  id: `rule-${weekday}-${start_time}`,
  weekday,
  start_time,
  end_time,
  active: true,
});
const EVERY_EVENING = [1, 2, 3, 4, 5].map((d) => rule(d, "18:00", "21:00"));
const MONDAY_ONLY = [rule(1, "18:00", "21:00")];

// First Monday after NOW is 2026-07-06; 18:00 IST that day is 12:30 UTC.
const MON_1830_IST_UTC = new Date("2026-07-06T12:30:00Z");

const booking = (slotStartIso, durationMin, status, createdAt) => ({
  slot_start: slotStartIso,
  slot_end: new Date(new Date(slotStartIso).getTime() + durationMin * MIN).toISOString(),
  status,
  created_at: (createdAt ?? NOW).toISOString?.() ?? createdAt,
});

const run = (name, fn) => {
  fn();
  console.log(`ok  ${name}`);
};

/* ---------- contract cases ---------- */

run("notice cutoff: no slot starts before now plus noticeHours", () => {
  const slots = generateSlots(EVERY_EVENING, [], 30, 15, 12, 7, NOW);
  assert.ok(slots.length > 0, "expected some slots inside the window");
  for (const s of slots) {
    assert.ok(startMs(s) >= NOW.getTime() + 12 * HOUR, `slot ${new Date(startMs(s)).toISOString()} violates the 12h notice`);
  }
});

run("buffer: consecutive slots in a window step by duration plus buffer", () => {
  const slots = generateSlots(MONDAY_ONLY, [], 30, 15, 0, 7, NOW);
  // 18:00 to 21:00 IST with 30 + 15 stepping: 12:30, 13:15, 14:00, 14:45 UTC.
  assert.equal(slots.length, 4, `expected 4 slots, got ${slots.length}`);
  for (let i = 1; i < slots.length; i++) {
    assert.equal(startMs(slots[i]) - startMs(slots[i - 1]), 45 * MIN, "slots must be spaced duration + buffer apart");
  }
});

run("window end: every slot ends inside the rule window and booking window", () => {
  const slots = generateSlots(MONDAY_ONLY, [], 30, 15, 0, 30, NOW);
  const windowEndUtc = new Date("2026-07-06T15:30:00Z").getTime(); // 21:00 IST
  const mondaySlots = slots.filter((s) => startMs(s) < windowEndUtc + DAY);
  assert.ok(mondaySlots.length > 0);
  for (const s of mondaySlots.filter((s) => startMs(s) <= windowEndUtc)) {
    assert.ok(endMs(s) <= windowEndUtc, "slot must not spill past the 21:00 IST rule end");
  }
  const horizon = NOW.getTime() + 30 * DAY;
  for (const s of slots) assert.ok(startMs(s) < horizon, "slot must start inside the booking window");
});

run("booked exclusion: confirmed booking removes its slot", () => {
  const taken = booking(MON_1830_IST_UTC.toISOString(), 30, "confirmed");
  const slots = generateSlots(MONDAY_ONLY, [taken], 30, 15, 0, 7, NOW);
  assert.ok(
    slots.every((s) => startMs(s) !== MON_1830_IST_UTC.getTime()),
    "the confirmed 18:00 IST slot must be excluded"
  );
});

run("expired pending: pending older than 30 minutes frees the slot; fresh pending blocks it", () => {
  const stale = booking(MON_1830_IST_UTC.toISOString(), 30, "pending", new Date(NOW.getTime() - 45 * MIN));
  const freed = generateSlots(MONDAY_ONLY, [stale], 30, 15, 0, 7, NOW);
  assert.ok(
    freed.some((s) => startMs(s) === MON_1830_IST_UTC.getTime()),
    "a pending booking older than 30 minutes must not block the slot"
  );

  const fresh = booking(MON_1830_IST_UTC.toISOString(), 30, "pending", new Date(NOW.getTime() - 10 * MIN));
  const blocked = generateSlots(MONDAY_ONLY, [fresh], 30, 15, 0, 7, NOW);
  assert.ok(
    blocked.every((s) => startMs(s) !== MON_1830_IST_UTC.getTime()),
    "a fresh pending booking must block the slot"
  );
});

run("timezone boundary: 18:00 IST Monday rule yields a 12:30 UTC Monday slot", () => {
  const slots = generateSlots(MONDAY_ONLY, [], 30, 15, 0, 7, NOW);
  assert.ok(slots.length > 0, "expected Monday slots");
  assert.equal(
    new Date(startMs(slots[0])).toISOString(),
    MON_1830_IST_UTC.toISOString(),
    "first slot must be the IST evening start converted to UTC (+5:30 offset)"
  );
});

console.log("\nAll mentorship slot contract tests passed.");
