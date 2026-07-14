#!/usr/bin/env node
/**
 * Generate public/sitemap-courses.xml — one <url> per public, published training
 * course. Mirrors gen-blog-sitemap.mjs: a static file served directly by Vercel
 * (no serverless build to fail). Per-page <SEO> tags already live on the course
 * page (TrainingDetail.tsx); this just enumerates the course URLs for crawlers.
 *   node scripts/gen-courses-sitemap.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync(".env", "utf8").split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()])
);
const db = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const BASE = "https://www.yatricloud.com";
const ENT = { "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" };
const esc = (s) => String(s).replace(/[<>&'"]/g, (c) => ENT[c] || c);

// Only published, publicly-visible courses that have a slug (the /training/:slug
// URL the page resolves). Private/unlisted courses are excluded from crawling.
const { data, error } = await db
  .from("trainings")
  .select("slug,updated_at,created_at,status,visibility")
  .eq("status", "published")
  .order("updated_at", { ascending: false })
  .limit(5000);
if (error) { console.error("query failed:", error.message); process.exit(1); }

const courses = (data || []).filter((c) => c.slug && c.visibility !== "private");

const urls = [{ loc: `${BASE}/training`, changefreq: "daily", priority: "0.9" }];
for (const c of courses) {
  urls.push({
    loc: `${BASE}/training/${esc(c.slug)}`,
    lastmod: (c.updated_at || c.created_at || "").slice(0, 10),
    changefreq: "weekly",
    priority: "0.8",
  });
}

const xml =
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls.map((u) =>
    `  <url>\n    <loc>${u.loc}</loc>\n${u.lastmod ? `    <lastmod>${u.lastmod}</lastmod>\n` : ""}    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`
  ).join("\n") +
  `\n</urlset>\n`;

writeFileSync("public/sitemap-courses.xml", xml);
console.log(`✓ public/sitemap-courses.xml — ${courses.length} courses`);
