#!/usr/bin/env node
// Import companies from the reference CSVs into job_companies by detecting
// their OFFICIAL ATS board in whatever careers/position URLs the sheets
// contain. No scraping — we only recognise public ATS board slugs, then the
// normal jobs-sync worker pulls each board's live jobs via its official API.
//
//   node scripts/jobs-import-csv.mjs
//
// Companies whose careers page is a custom site (no detectable ATS board)
// are counted and skipped — they can't be pulled without scraping.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIR = join(ROOT, "reference/yatri-jobs");
const env = Object.fromEntries(
  readFileSync(join(ROOT, ".env"), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "")])
);
const SB = env.SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: KEY, Authorization: `Bearer ${KEY}` };

// Detect an ATS board { source, slug } from any URL. Slugs are the board
// token in the host or first path segment, per each ATS's public pattern.
function detectBoard(url) {
  try {
    const u = new URL(url.trim());
    const host = u.hostname.toLowerCase();
    const seg = u.pathname.split("/").filter(Boolean);
    const clean = (s) => (s || "").toLowerCase().replace(/[^a-z0-9-]/g, "");

    if (host.includes("greenhouse.io")) {
      // boards.greenhouse.io/{slug}, job-boards.greenhouse.io/{slug}, boards.eu…
      if (seg[0] && seg[0] !== "embed") return { source: "greenhouse", slug: clean(seg[0]) };
    }
    if (host.includes("lever.co")) {
      if (seg[0]) return { source: "lever", slug: clean(seg[0]) };
    }
    if (host.endsWith("ashbyhq.com")) {
      // jobs.ashbyhq.com/{slug} OR {slug}.ashbyhq.com
      if (host !== "jobs.ashbyhq.com" && host !== "app.ashbyhq.com") {
        return { source: "ashby", slug: clean(host.split(".")[0]) };
      }
      if (seg[0]) return { source: "ashby", slug: clean(seg[0]) };
    }
    if (host.includes("smartrecruiters.com")) {
      // careers/jobs.smartrecruiters.com/{slug}
      if (seg[0]) return { source: "smartrecruiters", slug: clean(seg[0]) };
    }
    return null;
  } catch {
    return null;
  }
}

// Minimal CSV parse (handles quoted fields with commas/newlines).
function parseCsv(text) {
  const rows = [];
  let row = [], field = "", inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQ = false;
      else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c === "\r") { /* skip */ }
    else field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

const URL_RE = /https?:\/\/[^\s",]+/g;

// Guess the company name for a row: first non-URL, non-empty short-ish cell.
function guessName(cells) {
  for (const c of cells) {
    const t = (c || "").trim();
    if (t && !/^https?:/.test(t) && t.length <= 60 && !t.includes("@") && /[a-zA-Z]/.test(t)) {
      // skip obvious header/blurb cells
      if (/careers|hiring|remote|list|update|subscribe|http|www\./i.test(t) && t.length > 30) continue;
      return t;
    }
  }
  return null;
}

const found = new Map(); // slug → { name, source, website }
let filesRead = 0, boardsSeen = 0, noBoard = 0;

// Walk DIR recursively for every .csv (subfolders like new-jobs-lists/).
function allCsvs(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...allCsvs(p));
    else if (name.toLowerCase().endsWith(".csv")) out.push(p);
  }
  return out;
}

for (const path of allCsvs(DIR)) {
  filesRead++;
  const rows = parseCsv(readFileSync(path, "utf8"));
  for (const cells of rows) {
    const line = cells.join(" ");
    const urls = line.match(URL_RE) || [];
    let matched = false;
    for (const url of urls) {
      const board = detectBoard(url);
      if (!board || !board.slug || board.slug.length < 2) continue;
      matched = true;
      boardsSeen++;
      if (!found.has(board.slug)) {
        const name = guessName(cells) || board.slug;
        // website = first non-ATS url in the row, else the board url origin
        let website = null;
        for (const u of urls) {
          if (!detectBoard(u)) { try { website = new URL(u).origin; break; } catch { /* */ } }
        }
        found.set(board.slug, { name: name.slice(0, 80), source: board.source, website });
      }
    }
    if (!matched && urls.length) noBoard++;
  }
}

console.log(`CSV files: ${filesRead} · ATS board URLs seen: ${boardsSeen} · distinct boards: ${found.size} · rows with only custom career sites: ${noBoard}`);

// Which slugs already exist?
const existing = new Set(
  (await fetch(`${SB}/rest/v1/job_companies?select=slug`, { headers: H }).then((r) => r.json())).map((c) => c.slug)
);
const toAdd = [...found.entries()]
  .filter(([slug]) => !existing.has(slug))
  .map(([slug, v]) => ({ name: v.name, slug, source: v.source, website: v.website, active: true }));

console.log(`New companies to add: ${toAdd.length} (skipping ${found.size - toAdd.length} already present)`);

for (let i = 0; i < toAdd.length; i += 100) {
  const res = await fetch(`${SB}/rest/v1/job_companies?on_conflict=slug`, {
    method: "POST",
    headers: { ...H, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(toAdd.slice(i, i + 100)),
  });
  if (!res.ok) { console.log(`  insert failed: ${res.status} ${await res.text()}`); break; }
}
console.log(`Done. Run: node scripts/jobs-sync.mjs to pull their live jobs.`);
