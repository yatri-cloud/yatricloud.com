#!/usr/bin/env node
/**
 * Generate public/sitemap-blog.xml — one <url> per published story (+ author
 * pages). Static file served directly by Vercel (no serverless build to fail).
 * Run after publishing, or on a schedule (wired into monthly-cert-sync.mjs).
 *   node scripts/gen-blog-sitemap.mjs
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

const { data, error } = await db
  .from("blog_feed")
  .select("slug,updated_at,published_at,author_id")
  .order("published_at", { ascending: false })
  .limit(5000);
if (error) { console.error("query failed:", error.message); process.exit(1); }

const urls = [{ loc: `${BASE}/blog`, changefreq: "daily", priority: "0.9" }];
const authors = new Set();
for (const p of data || []) {
  urls.push({ loc: `${BASE}/blog/${esc(p.slug)}`, lastmod: (p.updated_at || p.published_at || "").slice(0, 10), changefreq: "weekly", priority: "0.8" });
  authors.add(p.author_id);
}
for (const id of authors) urls.push({ loc: `${BASE}/blog/author/${id}`, changefreq: "weekly", priority: "0.5" });

const xml =
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls.map((u) =>
    `  <url>\n    <loc>${u.loc}</loc>\n${u.lastmod ? `    <lastmod>${u.lastmod}</lastmod>\n` : ""}    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`
  ).join("\n") +
  `\n</urlset>\n`;

writeFileSync("public/sitemap-blog.xml", xml);
console.log(`✓ public/sitemap-blog.xml — ${data?.length || 0} posts, ${authors.size} authors`);
