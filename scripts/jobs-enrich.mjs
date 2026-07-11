#!/usr/bin/env node
// Enrich companies: ensure a website (so the favicon LOGO renders) and a
// best-effort careers CONTACT EMAIL. No scraping — the website comes from the
// company's own apply URLs, and the email is a conventional careers@domain
// derived from that domain. Emails are UNVERIFIED starting points the user
// reviews before sending (the applications dialog has an editable recipient).
//
//   node scripts/jobs-enrich.mjs

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const env = Object.fromEntries(
  readFileSync(join(ROOT, ".env"), "utf8")
    .split("\n").filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "")])
);
const SB = env.SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: KEY, Authorization: `Bearer ${KEY}` };

// Hosts that are ATS boards / aggregators, NOT a company's own domain — a
// careers@ address there would be meaningless, and the favicon is the ATS's.
const NOT_A_COMPANY = [
  "greenhouse.io", "lever.co", "ashbyhq.com", "smartrecruiters.com",
  "remotive.com", "remoteok.com", "arbeitnow.com", "myworkdayjobs.com",
  "adzuna.com", "google.com", "linkedin.com", "notion.so", "notion.site",
  "angel.co", "wellfound.com", "bamboohr.com", "recruitee.com", "workable.com",
  "jobvite.com", "icims.com", "gh_jid", "eu.greenhouse.io",
];
const isCompanyHost = (host) =>
  host && !NOT_A_COMPANY.some((b) => host.endsWith(b) || host.includes(b));

const registrable = (host) => {
  const parts = host.replace(/^www\./, "").split(".");
  return parts.length > 2 ? parts.slice(-2).join(".") : parts.join(".");
};

const companies = await fetch(
  `${SB}/rest/v1/job_companies?select=id,name,slug,source,website,contact_email`,
  { headers: H }
).then((r) => r.json());

let setWebsite = 0, setEmail = 0;
for (const c of companies) {
  const patch = {};

  // Website (→ logo): keep existing; else derive from a company-domain apply URL.
  let host = null;
  try { if (c.website) host = new URL(c.website).hostname; } catch { /* */ }
  if (!c.website || !isCompanyHost(host)) {
    const posts = await fetch(
      `${SB}/rest/v1/job_postings?company_id=eq.${c.id}&select=apply_url&limit=20`,
      { headers: H }
    ).then((r) => r.json());
    for (const p of posts) {
      try {
        const h = new URL(p.apply_url).hostname;
        if (isCompanyHost(h)) { host = h; patch.website = `https://${h.replace(/^www\./, "")}`; break; }
      } catch { /* */ }
    }
  }

  // ATS companies store an ATS apply URL, so no domain was found above. Their
  // slug is the company handle (stripe, airbnb…) → guess {slug}.com. The
  // favicon falls back to an initial chip when the guess is wrong, so a bad
  // guess never shows a broken logo.
  const atsSource = ["greenhouse", "lever", "ashby", "smartrecruiters"].includes(c.source);
  if (!patch.website && !c.website && atsSource && /^[a-z0-9-]{2,40}$/.test(c.slug)) {
    host = `${c.slug}.com`;
    patch.website = `https://${host}`;
  }

  // Contact email: careers@<domain>, only for a real company domain.
  if (!c.contact_email && host && isCompanyHost(host)) {
    patch.contact_email = `careers@${registrable(host)}`;
  }

  if (Object.keys(patch).length) {
    await fetch(`${SB}/rest/v1/job_companies?id=eq.${c.id}`, {
      method: "PATCH",
      headers: { ...H, "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (patch.website) setWebsite++;
    if (patch.contact_email) setEmail++;
  }
}

const totals = await fetch(
  `${SB}/rest/v1/job_companies?select=website,contact_email`,
  { headers: H }
).then((r) => r.json());
console.log(`Enriched: +${setWebsite} websites, +${setEmail} emails.`);
console.log(`Now have website (logo): ${totals.filter((c) => c.website).length}/${totals.length}, contact email: ${totals.filter((c) => c.contact_email).length}/${totals.length}`);
