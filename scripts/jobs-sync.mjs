#!/usr/bin/env node
// Job board ingester — official public ATS APIs only (Greenhouse + Lever).
//
//   node scripts/jobs-sync.mjs
//
// For every active job_companies row (source != manual) it probes the
// company's board (both providers, so a wrong source self-corrects), maps
// postings into job_postings (upsert on company+external id), deactivates
// postings that disappeared, and updates the company's counters. Run it
// manually or on a schedule (launchd/cron) from the owner's Mac.

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const env = Object.fromEntries(
  readFileSync(join(ROOT, ".env"), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => [
      l.slice(0, l.indexOf("=")).trim(),
      l.slice(l.indexOf("=") + 1).trim().replace(/^["']|["']$/g, ""),
    ])
);
const SB = env.SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: KEY, Authorization: `Bearer ${KEY}` };

const stripHtml = (html) =>
  (html || "")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<br\s*\/?>(?=.)/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, 15000);

const deriveLevel = (title) => {
  const t = title.toLowerCase();
  if (/intern|graduate|junior|entry|fresher|trainee|associate\b|apprentice/.test(t)) return "entry";
  if (/senior|staff|principal|lead|head|director|manager|architect|vp\b/.test(t)) return "senior";
  return "mid";
};

const isRemote = (location, title = "") => /remote|anywhere|work from home/i.test(`${location} ${title}`);

async function fetchGreenhouse(slug) {
  const res = await fetch(
    `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs?content=true`
  );
  if (!res.ok) return null;
  const data = await res.json();
  if (!Array.isArray(data.jobs)) return null;
  return data.jobs.map((j) => ({
    external_id: String(j.id),
    title: j.title || "",
    location: j.location?.name || "",
    department: j.departments?.[0]?.name || "",
    apply_url: j.absolute_url || "",
    description: stripHtml(j.content),
    posted_at: j.updated_at || null,
  }));
}

async function fetchLever(slug) {
  const res = await fetch(`https://api.lever.co/v0/postings/${slug}?mode=json`);
  if (!res.ok) return null;
  const data = await res.json();
  if (!Array.isArray(data)) return null;
  return data.map((j) => ({
    external_id: String(j.id),
    title: j.text || "",
    location: j.categories?.location || "",
    department: j.categories?.team || "",
    apply_url: j.hostedUrl || "",
    description: stripHtml(j.descriptionPlain || j.description),
    posted_at: j.createdAt ? new Date(j.createdAt).toISOString() : null,
  }));
}

async function fetchAshby(slug) {
  // Official Ashby posting API: https://developers.ashbyhq.com/reference/jobpostingapi
  const res = await fetch(
    `https://api.ashbyhq.com/posting-api/job-board/${slug}?includeCompensation=false`
  );
  if (!res.ok) return null;
  const data = await res.json();
  if (!Array.isArray(data.jobs)) return null;
  return data.jobs.map((j) => ({
    external_id: String(j.id),
    title: j.title || "",
    location: [j.location, ...(j.secondaryLocations || []).map((l) => l.location)]
      .filter(Boolean)
      .join(" · "),
    department: j.department || "",
    apply_url: j.jobUrl || j.applyUrl || "",
    description: stripHtml(j.descriptionHtml || j.descriptionPlain),
    posted_at: j.publishedAt || null,
  }));
}

const PROVIDERS = {
  greenhouse: fetchGreenhouse,
  lever: fetchLever,
  ashby: fetchAshby,
};

async function syncCompany(company) {
  const runStart = new Date().toISOString();
  // Probe the stored source first, then the rest — self-corrects bad guesses.
  const order = [
    [company.source, PROVIDERS[company.source] || fetchGreenhouse],
    ...Object.entries(PROVIDERS).filter(([n]) => n !== company.source),
  ];
  let jobs = null;
  let source = company.source;
  for (const [name, fn] of order) {
    try {
      jobs = await fn(company.slug);
    } catch {
      jobs = null;
    }
    if (jobs) {
      source = name;
      break;
    }
  }
  if (!jobs) {
    console.log(`✖ ${company.name} (${company.slug}) — no board found`);
    return;
  }

  const rows = jobs
    .filter((j) => j.title && j.apply_url)
    .map((j) => ({
      company_id: company.id,
      ...j,
      level: deriveLevel(j.title),
      remote: isRemote(j.location, j.title),
      is_active: true,
      synced_at: runStart,
    }));

  // Upsert in chunks (descriptions are big).
  for (let i = 0; i < rows.length; i += 50) {
    const chunk = rows.slice(i, i + 50);
    const res = await fetch(
      `${SB}/rest/v1/job_postings?on_conflict=company_id,external_id`,
      {
        method: "POST",
        headers: {
          ...H,
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates",
        },
        body: JSON.stringify(chunk),
      }
    );
    if (!res.ok) {
      console.log(`  upsert failed: ${res.status} ${await res.text()}`);
      return;
    }
  }

  // Anything not touched this run has been taken down.
  await fetch(
    `${SB}/rest/v1/job_postings?company_id=eq.${company.id}&synced_at=lt.${runStart}`,
    {
      method: "PATCH",
      headers: { ...H, "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: false }),
    }
  );

  await fetch(`${SB}/rest/v1/job_companies?id=eq.${company.id}`, {
    method: "PATCH",
    headers: { ...H, "Content-Type": "application/json" },
    body: JSON.stringify({
      source,
      last_synced_at: runStart,
      jobs_count: rows.length,
    }),
  });
  console.log(`✔ ${company.name}: ${rows.length} jobs (${source})`);
}

const companies = await fetch(
  `${SB}/rest/v1/job_companies?active=eq.true&source=neq.manual&select=id,name,slug,source`,
  { headers: H }
).then((r) => r.json());

console.log(`Syncing ${companies.length} companies…`);
for (const c of companies) {
  await syncCompany(c);
  await new Promise((r) => setTimeout(r, 400)); // be polite to the APIs
}
console.log("Done.");
