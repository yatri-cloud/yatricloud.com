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

async function fetchSmartRecruiters(slug) {
  // Official public postings API (paged 100 at a time).
  const out = [];
  for (let offset = 0; offset < 2000; offset += 100) {
    const res = await fetch(
      `https://api.smartrecruiters.com/v1/companies/${slug}/postings?limit=100&offset=${offset}`
    );
    if (!res.ok) return offset === 0 ? null : out;
    const data = await res.json();
    const items = data.content || [];
    for (const j of items) {
      out.push({
        external_id: String(j.id),
        title: j.name || "",
        location: [j.location?.city, j.location?.region, j.location?.country]
          .filter(Boolean)
          .join(", "),
        department: j.department?.label || j.function?.label || "",
        apply_url: `https://jobs.smartrecruiters.com/${slug}/${j.id}`,
        description: "",
        posted_at: j.releasedDate || null,
      });
    }
    if (items.length < 100) break;
  }
  return out;
}

const PROVIDERS = {
  greenhouse: fetchGreenhouse,
  lever: fetchLever,
  ashby: fetchAshby,
  smartrecruiters: fetchSmartRecruiters,
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

// ——— Free aggregator feeds (no per-company slug) ————————————————————————
// Each returns { company, title, location, remote, url, description, posted }.
// We group by company, ensure a job_companies row (source='aggregator'),
// then upsert postings — all server side with the service role.

const slugify = (s) =>
  "agg-" +
  String(s || "unknown")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

async function fetchArbeitnow() {
  const res = await fetch("https://www.arbeitnow.com/api/job-board-api");
  if (!res.ok) return [];
  const data = await res.json();
  return (data.data || []).map((j) => ({
    company: j.company_name,
    title: j.title,
    location: j.location || "",
    remote: !!j.remote,
    url: j.url,
    description: stripHtml(j.description),
    posted: j.created_at ? new Date(j.created_at * 1000).toISOString() : null,
    external_id: j.slug || j.url,
  }));
}

async function fetchRemotive() {
  const res = await fetch("https://remotive.com/api/remote-jobs?limit=200");
  if (!res.ok) return [];
  const data = await res.json();
  return (data.jobs || []).map((j) => ({
    company: j.company_name,
    title: j.title,
    location: j.candidate_required_location || "Remote",
    remote: true,
    url: j.url,
    description: stripHtml(j.description),
    posted: j.publication_date || null,
    external_id: String(j.id),
    website: j.company_logo ? null : null,
  }));
}

async function fetchRemoteOK() {
  const res = await fetch("https://remoteok.com/api", {
    headers: { "User-Agent": "YatriCloud-JobBoard/1.0" },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (Array.isArray(data) ? data : [])
    .filter((j) => j.position && j.company && j.url)
    .map((j) => ({
      company: j.company,
      title: j.position,
      location: j.location || "Remote",
      remote: true,
      url: j.url,
      description: stripHtml(j.description),
      posted: j.date || null,
      external_id: String(j.id || j.slug || j.url),
    }));
}

async function fetchAdzuna() {
  const id = env.ADZUNA_APP_ID;
  const key = env.ADZUNA_APP_KEY;
  if (!id || !key) return [];
  const out = [];
  // India first (the priority market), then a couple more; 50/page × 4 pages.
  for (const country of ["in", "us", "gb"]) {
    for (let page = 1; page <= 4; page++) {
      const res = await fetch(
        `https://api.adzuna.com/v1/api/jobs/${country}/search/${page}?app_id=${id}&app_key=${key}&results_per_page=50&content-type=application/json`
      );
      if (!res.ok) break;
      const data = await res.json();
      for (const j of data.results || []) {
        out.push({
          company: j.company?.display_name || "Unknown",
          title: j.title || "",
          location: j.location?.display_name || "",
          remote: /remote/i.test(`${j.location?.display_name} ${j.title}`),
          url: j.redirect_url,
          description: stripHtml(j.description),
          posted: j.created || null,
          external_id: String(j.id),
        });
      }
      if ((data.results || []).length < 50) break;
      await new Promise((r) => setTimeout(r, 300));
    }
  }
  return out;
}

async function runAggregator(name, fn) {
  const runStart = new Date().toISOString();
  let jobs;
  try {
    jobs = await fn();
  } catch (e) {
    console.log(`✖ ${name} aggregator: ${e.message}`);
    return;
  }
  if (!jobs?.length) {
    console.log(`· ${name}: 0 jobs`);
    return;
  }
  // Ensure a company row per distinct employer.
  const byCompany = new Map();
  for (const j of jobs) {
    const slug = slugify(j.company);
    if (!byCompany.has(slug)) byCompany.set(slug, { name: j.company || "Unknown", slug });
  }
  const companyRows = [...byCompany.values()].map((c) => ({
    name: c.name,
    slug: c.slug,
    source: "aggregator",
    active: true,
  }));
  for (let i = 0; i < companyRows.length; i += 100) {
    await fetch(`${SB}/rest/v1/job_companies?on_conflict=slug`, {
      method: "POST",
      headers: { ...H, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(companyRows.slice(i, i + 100)),
    });
  }
  const ids = await fetch(
    `${SB}/rest/v1/job_companies?source=eq.aggregator&select=id,slug`,
    { headers: H }
  ).then((r) => r.json());
  const idBySlug = Object.fromEntries(ids.map((c) => [c.slug, c.id]));

  const rows = jobs
    .filter((j) => j.title && j.url && idBySlug[slugify(j.company)])
    .map((j) => ({
      company_id: idBySlug[slugify(j.company)],
      external_id: `${name}:${j.external_id}`,
      title: j.title,
      location: j.location || "",
      level: deriveLevel(j.title),
      remote: !!j.remote,
      department: "",
      apply_url: j.url,
      description: j.description || "",
      posted_at: j.posted,
      is_active: true,
      synced_at: runStart,
    }));
  for (let i = 0; i < rows.length; i += 50) {
    const res = await fetch(
      `${SB}/rest/v1/job_postings?on_conflict=company_id,external_id`,
      {
        method: "POST",
        headers: { ...H, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify(rows.slice(i, i + 50)),
      }
    );
    if (!res.ok) {
      console.log(`  ${name} upsert failed: ${res.status} ${await res.text()}`);
      return;
    }
  }
  console.log(`✔ ${name}: ${rows.length} jobs across ${byCompany.size} companies`);
}

const companies = await fetch(
  `${SB}/rest/v1/job_companies?active=eq.true&source=neq.manual&source=neq.aggregator&select=id,name,slug,source`,
  { headers: H }
).then((r) => r.json());

console.log(`Syncing ${companies.length} ATS companies…`);
for (const c of companies) {
  await syncCompany(c);
  await new Promise((r) => setTimeout(r, 400)); // be polite to the APIs
}

console.log("Pulling free aggregator feeds…");
await runAggregator("arbeitnow", fetchArbeitnow);
await runAggregator("remotive", fetchRemotive);
await runAggregator("remoteok", fetchRemoteOK);
await runAggregator("adzuna", fetchAdzuna);

// Recompute per-company counters for aggregator rows (counts changed in bulk).
console.log("Done.");
